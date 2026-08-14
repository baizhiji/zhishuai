//! 智枢AI 桌面版 — 自动更新检查
//!
//! 调用后端版本服务 `GET /api/version/desktop/latest.json` 获取最新版本信息，
//! 与当前版本比较，如有新版本则触发 tauri-plugin-updater 下载并安装。

use tauri::{AppHandle, Emitter};

const VERSION_API: &str = "https://baizhiji.net/api/version/desktop/latest.json";

/// 检查更新入口（应用启动后异步调用）
pub async fn check_update(app: AppHandle) {
    // 请求最新版本信息
    let client = reqwest::Client::new();
    let version_info = match client.get(VERSION_API).send().await {
        Ok(resp) if resp.status().is_success() => match resp.text().await {
            Ok(text) => text,
            Err(_) => {
                log_warn(app.clone(), "读取版本信息失败");
                return;
            }
        },
        _ => {
            // 非致命：网络不可达时不打扰用户
            return;
        }
    };

    // 解析版本号
    let latest_version = match parse_latest_version(&version_info) {
        Some(v) => v,
        None => {
            log_warn(app.clone(), "版本信息格式无效");
            return;
        }
    };

    let current = app.package_info().version.clone();
    if compare_versions(&current.to_string(), &latest_version) {
        log_info(app.clone(), format!("发现新版本 {latest_version}，开始更新"));
        match tauri_plugin_updater::UpdaterExt::updater(&app)
            .and_then(|updater| updater.check().await)
        {
            Ok(Some(update)) => {
                let result = update
                    .download_and_install(
                        |_chunk_length, _content_length| {},
                        || {},
                    )
                    .await;
                if let Err(e) = result {
                    log_warn(app.clone(), format!("更新失败: {e}"));
                }
            }
            Ok(None) => log_warn(app.clone(), "版本服务已返回最新版，无需更新".into()),
            Err(e) => log_warn(app.clone(), format!("检查更新失败: {e}")),
        }
    }
}

/// 从版本服务 JSON 中解析最新版本号
/// 支持字段：version / tag_name / latest.version
fn parse_latest_version(json: &str) -> Option<String> {
    let value: serde_json::Value = serde_json::from_str(json).ok()?;
    value
        .get("version")
        .and_then(|v| v.as_str())
        .or_else(|| value.get("tag_name").and_then(|v| v.as_str()))
        .or_else(|| {
            value
                .get("latest")
                .and_then(|l| l.get("version"))
                .and_then(|v| v.as_str())
        })
        .map(|v| v.trim_start_matches('v').to_string())
}

/// 版本号比较：latest > current 返回 true
fn compare_versions(current: &str, latest: &str) -> bool {
    let parse = |s: &str| -> Vec<u64> {
        s.split('.')
            .filter_map(|p| p.chars().take_while(|c| c.is_ascii_digit()).collect::<String>().parse::<u64>().ok())
            .collect()
    };
    let c = parse(current);
    let l = parse(latest);
    for i in 0..l.len() {
        let cv = c.get(i).copied().unwrap_or(0);
        let lv = l[i];
        if lv > cv {
            return true;
        }
        if lv < cv {
            return false;
        }
    }
    false
}

fn log_info(app: AppHandle, message: String) {
    let _ = app.emit("desktop:update-log", format!("[INFO] {message}"));
}

fn log_warn(app: AppHandle, message: String) {
    let _ = app.emit("desktop:update-log", format!("[WARN] {message}"));
}
