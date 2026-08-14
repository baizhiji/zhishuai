//! 智枢AI 桌面安装版 — Rust 主进程
//!
//! 职责：
//! 1. 承载 WebView 前端（复用 web/ 静态产物）
//! 2. 系统托盘（显示/隐藏/退出）
//! 3. 单实例守护
//! 4. AI 代理（密钥在系统凭据管理器，不出主进程）
//! 5. 自动更新（tauri-plugin-updater + minisign 校验）

mod ai_proxy;
mod tray;
mod updater;

use tauri::Manager;

/// 全局状态：AI 代理配置
pub struct AiProxyState {
    pub client: reqwest::Client,
    pub provider: String,
    pub model: String,
    pub fallback_key: Option<String>,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    env_logger::init();

    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            // 已有实例运行时：聚焦主窗口
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
            }
        }))
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .setup(|app| {
            // 初始化 AI 代理状态
            let provider = std::env::var("AI_PROVIDER").unwrap_or_else(|_| "aliyun".into());
            let model = std::env::var("AI_MODEL").unwrap_or_else(|_| "qwen-plus".into());
            let fallback_key = std::env::var("AI_API_KEY").ok().filter(|s| !s.is_empty());

            let state = AiProxyState {
                client: reqwest::Client::builder()
                    .timeout(std::time::Duration::from_secs(120))
                    .build()
                    .expect("创建 HTTP 客户端失败"),
                provider,
                model,
                fallback_key,
            };
            app.manage(state);

            // 退出标记（托盘拦截关闭事件时需要）
            app.manage(tray::AppExitFlag::default());

            // 托盘
            tray::setup_tray(app)?;

            // 首次启动后检查更新（异步，不阻塞启动）
            let handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                updater::check_update(handle).await;
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            ai_proxy::ai_generate_script,
            ai_proxy::ai_chat,
        ])
        .run(tauri::generate_context!())
        .expect("智枢AI 桌面版启动失败");
}
