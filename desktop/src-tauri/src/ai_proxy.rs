//! 智枢AI 桌面版 — AI 代理（Rust 主进程）
//!
//! 职责：
//! 1. 前端 AI 请求经 IPC 到达本模块，由 Rust 主进程转发到三服务商（腾讯云 TokenHub /
//!    阿里云百炼 / 火山方舟），统一 OpenAI 兼容 `chat/completions` 协议
//! 2. API Key 从系统凭据管理器（keyring）读取，不出主进程、不落前端
//! 3. 密钥解析优先级：请求显式 key > keyring 存储 > 环境变量兜底（AI_API_KEY）

use serde::{Deserialize, Serialize};
use tauri::State;

use crate::AiProxyState;

/// 三服务商基础 URL（与 server/src/services/ai-client.ts 保持一致）
const PROVIDER_BASE_URLS: &[(&str, &str)] = &[
    ("tencent", "https://tokenhub.tencentmaas.com/v1"),
    ("alibaba", "https://dashscope.aliyuncs.com/compatible-mode/v1"),
    ("volcano", "https://ark.cn-beijing.volces.com/api/v3"),
];

/// keyring 服务名（Windows 凭据管理器）
const KEYRING_SERVICE: &str = "com.zhishuai.desktop";
/// keyring 用户名前缀（区分服务商，如 `provider:alibaba`）
const KEYRING_USER_PREFIX: &str = "provider";

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GenerateScriptPayload {
    pub scene: String,
    pub scene_name: String,
    pub scene_prompt: String,
    pub style: String,
    pub context: String,
    pub max_tokens: Option<i64>,
    pub api_key: Option<String>,
    pub provider: Option<String>,
    pub model: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct ChatPayload {
    pub messages: Vec<ChatMessage>,
    pub api_key: Option<String>,
    pub provider: Option<String>,
    pub model: Option<String>,
    pub temperature: Option<f64>,
    pub max_tokens: Option<i64>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct ChatMessage {
    pub role: String,
    pub content: String,
}

#[derive(Debug, Serialize)]
pub struct AiResult {
    pub script: Option<String>,
    pub content: Option<String>,
    pub text: Option<String>,
    pub model: Option<String>,
    pub provider: Option<String>,
    pub error: Option<String>,
}

impl AiResult {
    fn ok(content: String, model: &str, provider: &str) -> Self {
        Self {
            script: Some(content.clone()),
            text: Some(content),
            content: None,
            model: Some(model.to_string()),
            provider: Some(provider.to_string()),
            error: None,
        }
    }

    fn err(message: impl Into<String>) -> Self {
        Self {
            script: None,
            text: None,
            content: None,
            model: None,
            provider: None,
            error: Some(message.into()),
        }
    }
}

/// 解析服务商基础 URL
fn provider_base_url(provider: &str) -> String {
    PROVIDER_BASE_URLS
        .iter()
        .find(|(key, _)| key == &provider)
        .map(|(_, url)| url.to_string())
        .unwrap_or_else(|| PROVIDER_BASE_URLS[0].1.to_string())
}

/// 从系统凭据管理器读取 API Key
fn read_key_from_keyring(provider: &str) -> Option<String> {
    let username = format!("{KEYRING_USER_PREFIX}:{provider}");
    let entry = keyring::Entry::new(KEYRING_SERVICE, &username).ok()?;
    entry.get_password().ok()
}

/// 保存 API Key 到系统凭据管理器
fn write_key_to_keyring(provider: &str, api_key: &str) -> Result<(), String> {
    let username = format!("{KEYRING_USER_PREFIX}:{provider}");
    let entry =
        keyring::Entry::new(KEYRING_SERVICE, &username).map_err(|e| e.to_string())?;
    entry
        .set_password(api_key)
        .map_err(|e| format!("保存密钥失败: {e}"))
}

/// 解析最终使用的 API Key（请求显式 > keyring > 环境变量兜底）
fn resolve_api_key(
    state: &AiProxyState,
    provider: &str,
    explicit: Option<String>,
) -> Option<String> {
    if let Some(key) = explicit.filter(|k| !k.trim().is_empty()) {
        return Some(key);
    }
    if let Some(key) = read_key_from_keyring(provider) {
        return Some(key);
    }
    state.fallback_key.clone()
}

/// 构建话术生成的系统提示词（与 web/app/api/ai/generate-script/route.ts 对齐）
fn build_script_prompt(payload: &GenerateScriptPayload) -> String {
    let style_tone = match payload.style.as_str() {
        "professional" => "专业严谨、条理清晰、术语准确",
        "concise" => "简洁直接、言简意赅、直奔主题",
        "warm" => "温暖贴心、真诚自然、有亲和力",
        _ => "自然友好、真诚有温度",
    };
    let context = if payload.context.trim().is_empty() {
        String::new()
    } else {
        format!("\n附加背景：{}", payload.context)
    };
    format!(
        "请根据以下要求生成沟通话术：\n\n场景：{}\n要求：{}{}\n\n风格要求：{}\n\
         生成一段自然、人性化、有温度的沟通话术。\n\
         不要使用\"作为AI\"或\"我是一个AI\"这类表述，要像真人一样表达。\n\
         话术长度控制在{}字以内。",
        payload.scene_name,
        payload.scene_prompt,
        context,
        style_tone,
        payload.max_tokens.unwrap_or(500).min(4000)
    )
}

/// AI 话术生成（IPC command，与前端 web/services/ai.ts 双通道协议对齐）
#[tauri::command]
pub async fn ai_generate_script(
    state: State<'_, AiProxyState>,
    payload: GenerateScriptPayload,
) -> Result<AiResult, String> {
    // 解析服务商与模型（默认 aliyun / qwen-plus，与系统默认一致）
    let provider = payload
        .provider
        .clone()
        .unwrap_or_else(|| state.provider.clone());
    let provider = if provider.is_empty() { "aliyun" } else { provider };
    let model = payload
        .model
        .clone()
        .unwrap_or_else(|| state.model.clone());
    let model = if model.is_empty() { "qwen-plus" } else { model };

    let api_key = resolve_api_key(&state, &provider, payload.api_key.clone());
    let Some(api_key) = api_key else {
        return Ok(AiResult::err(
            "未配置 AI API Key：请在桌面版设置中填写服务商密钥，或设置环境变量 AI_API_KEY",
        ));
    };

    // 保存密钥到系统凭据管理器（下次自动读取）
    let _ = write_key_to_keyring(&provider, &api_key);

    let prompt = build_script_prompt(&payload);
    let base_url = provider_base_url(&provider);
    let endpoint = format!("{base_url}/chat/completions");

    let body = serde_json::json!({
        "model": model,
        "messages": [{ "role": "user", "content": prompt }],
        "max_tokens": payload.max_tokens.unwrap_or(500).min(4000),
        "temperature": 0.7,
    });

    let resp = state
        .client
        .post(&endpoint)
        .header("Content-Type", "application/json")
        .bearer_auth(&api_key)
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("AI 服务请求失败: {e}"))?;

    if !resp.status().is_success() {
        let status = resp.status();
        let text = resp.text().await.unwrap_or_default();
        return Ok(AiResult::err(format!(
            "AI 服务返回错误 {status}: {text}"
        )));
    }

    let data: serde_json::Value = resp.json().await.map_err(|e| e.to_string())?;
    let content = data
        .get("choices")
        .and_then(|c| c.get(0))
        .and_then(|c| c.get("message"))
        .and_then(|m| m.get("content"))
        .and_then(|c| c.as_str())
        .unwrap_or("")
        .trim()
        .to_string();

    if content.is_empty() {
        return Ok(AiResult::err("AI 未返回有效内容，请稍后重试"));
    }

    Ok(AiResult::ok(
        format!("{content}\n\n— — — — —\n本内容由【智枢AI生成】，请注意甄别。"),
        &model,
        &provider,
    ))
}

/// 通用 AI 对话（IPC command，供后续 AI 助手/业务助手接入）
#[tauri::command]
pub async fn ai_chat(
    state: State<'_, AiProxyState>,
    payload: ChatPayload,
) -> Result<AiResult, String> {
    if payload.messages.is_empty() {
        return Ok(AiResult::err("对话消息不能为空"));
    }

    let provider = payload
        .provider
        .unwrap_or_else(|| state.provider.clone());
    let provider = if provider.is_empty() { "aliyun" } else { provider };
    let model = payload.model.unwrap_or_else(|| state.model.clone());
    let model = if model.is_empty() { "qwen-plus" } else { model };

    let api_key = resolve_api_key(&state, &provider, payload.api_key);
    let Some(api_key) = api_key else {
        return Ok(AiResult::err(
            "未配置 AI API Key：请在桌面版设置中填写服务商密钥，或设置环境变量 AI_API_KEY",
        ));
    };

    let _ = write_key_to_keyring(&provider, &api_key);

    let base_url = provider_base_url(&provider);
    let endpoint = format!("{base_url}/chat/completions");

    let body = serde_json::json!({
        "model": model,
        "messages": payload.messages,
        "max_tokens": payload.max_tokens.unwrap_or(2000).min(8000),
        "temperature": payload.temperature.unwrap_or(0.7),
    });

    let resp = state
        .client
        .post(&endpoint)
        .header("Content-Type", "application/json")
        .bearer_auth(&api_key)
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("AI 服务请求失败: {e}"))?;

    if !resp.status().is_success() {
        let status = resp.status();
        let text = resp.text().await.unwrap_or_default();
        return Ok(AiResult::err(format!(
            "AI 服务返回错误 {status}: {text}"
        )));
    }

    let data: serde_json::Value = resp.json().await.map_err(|e| e.to_string())?;
    let content = data
        .get("choices")
        .and_then(|c| c.get(0))
        .and_then(|c| c.get("message"))
        .and_then(|m| m.get("content"))
        .and_then(|c| c.as_str())
        .unwrap_or("")
        .trim()
        .to_string();

    if content.is_empty() {
        return Ok(AiResult::err("AI 未返回有效内容，请稍后重试"));
    }

    Ok(AiResult::ok(content, &model, &provider))
}
