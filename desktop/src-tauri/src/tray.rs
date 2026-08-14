//! 智枢AI 桌面版 — 系统托盘与生命周期管理
//!
//! 功能：
//! 1. 托盘图标（显示/隐藏主窗口、退出应用）
//! 2. 关闭主窗口时最小化到托盘（不退出进程）
//! 3. 托盘菜单：显示主界面 / 退出

use tauri::{
    menu::{Menu, MenuItem},
    tray::{TrayIconBuilder, TrayIconEvent},
    Manager, Runtime,
};

/// 初始化托盘
pub fn setup_tray<R: Runtime>(app: &tauri::App<R>) -> tauri::Result<()> {
    // 菜单项
    let show_item = MenuItem::with_id(app, "show", "显示主界面", true, None::<&str>)?;
    let quit_item = MenuItem::with_id(app, "quit", "退出", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&show_item, &quit_item])?;

    // 托盘图标构建
    let mut builder = TrayIconBuilder::with_id("zhishuai-tray").tooltip("智枢AI");
    if let Some(icon) = app.default_window_icon() {
        builder = builder.icon(icon.clone());
    }
    let _tray = builder
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "show" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
            "quit" => {
                // 先置退出标记，避免被 CloseRequested 拦截
                app.state::<AppExitFlag>()
                    .0
                    .store(true, std::sync::atomic::Ordering::SeqCst);
                app.exit(0);
            }
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: tauri::tray::MouseButton::Left,
                button_state: tauri::tray::MouseButtonState::Up,
                ..
            } = event
            {
                let app = tray.app_handle();
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
        })
        .build(app)?;

    // 关闭主窗口时最小化到托盘，而不是退出
    app.on_window_event(|window, event| {
        if let tauri::WindowEvent::CloseRequested { api, .. } = event {
            // 非退出流程时拦截关闭事件，隐藏窗口到托盘
            if !window.app_handle().state::<AppExitFlag>().0.load(std::sync::atomic::Ordering::SeqCst) {
                api.prevent_close();
                let _ = window.hide();
            }
        }
    });

    Ok(())
}

/// 退出标记（退出时置 true，避免被托盘拦截）
pub struct AppExitFlag(pub std::sync::atomic::AtomicBool);

impl Default for AppExitFlag {
    fn default() -> Self {
        Self(std::sync::atomic::AtomicBool::new(false))
    }
}
