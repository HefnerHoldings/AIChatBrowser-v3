// MadEasy Browser - Tauri Main Application
// Rust-based desktop application with web frontend

#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use tauri::{
    CustomMenuItem, Manager, Menu, MenuItem, Submenu, Window, WindowBuilder, WindowUrl,
    SystemTray, SystemTrayEvent, SystemTrayMenu, SystemTrayMenuItem
};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize)]
struct AppConfig {
    server_url: String,
    window_width: f64,
    window_height: f64,
    auto_start: bool,
    theme: String,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            server_url: "http://localhost:5000".to_string(),
            window_width: 1400.0,
            window_height: 900.0,
            auto_start: false,
            theme: "system".to_string(),
        }
    }
}

// Tauri commands (callable from frontend)
#[tauri::command]
async fn get_app_config() -> Result<AppConfig, String> {
    // Load config from file or return default
    Ok(AppConfig::default())
}

#[tauri::command]
async fn save_app_config(config: AppConfig) -> Result<(), String> {
    // Save config to file
    println!("Saving config: {:?}", config);
    Ok(())
}

#[tauri::command]
async fn open_external_url(url: String) -> Result<(), String> {
    tauri::api::shell::open(&tauri::api::shell::Scope::default(), url, None)
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_system_info() -> Result<HashMap<String, String>, String> {
    let mut info = HashMap::new();
    
    info.insert("platform".to_string(), std::env::consts::OS.to_string());
    info.insert("arch".to_string(), std::env::consts::ARCH.to_string());
    info.insert("family".to_string(), std::env::consts::FAMILY.to_string());
    
    Ok(info)
}

#[tauri::command]
async fn create_new_window(app_handle: tauri::AppHandle, url: Option<String>) -> Result<(), String> {
    let window_url = match url {
        Some(u) => WindowUrl::External(u.parse().map_err(|e| format!("Invalid URL: {}", e))?),
        None => WindowUrl::App("index.html".into()),
    };
    
    WindowBuilder::new(
        &app_handle,
        format!("window_{}", chrono::Utc::now().timestamp()),
        window_url,
    )
    .title("MadEasy Browser")
    .inner_size(1200.0, 800.0)
    .min_inner_size(800.0, 600.0)
    .build()
    .map_err(|e| e.to_string())?;
    
    Ok(())
}

#[tauri::command]
async fn minimize_to_tray(window: Window) -> Result<(), String> {
    window.hide().map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
async fn show_notification(title: String, body: String) -> Result<(), String> {
    tauri::api::notification::Notification::new("com.madeasy.browser")
        .title(&title)
        .body(&body)
        .show()
        .map_err(|e| e.to_string())?;
    
    Ok(())
}

// Create application menu
fn create_menu() -> Menu {
    let quit = CustomMenuItem::new("quit".to_string(), "Quit");
    let close = CustomMenuItem::new("close".to_string(), "Close");
    let new_window = CustomMenuItem::new("new_window".to_string(), "New Window");
    let about = CustomMenuItem::new("about".to_string(), "About");
    let settings = CustomMenuItem::new("settings".to_string(), "Settings");
    
    let submenu = Submenu::new(
        "File",
        Menu::new()
            .add_item(new_window)
            .add_native_item(MenuItem::Separator)
            .add_item(settings)
            .add_native_item(MenuItem::Separator)
            .add_item(close)
            .add_item(quit),
    );
    
    let help_submenu = Submenu::new("Help", Menu::new().add_item(about));
    
    Menu::new()
        .add_submenu(submenu)
        .add_submenu(help_submenu)
}

// Create system tray
fn create_system_tray() -> SystemTray {
    let quit = CustomMenuItem::new("quit".to_string(), "Quit");
    let hide = CustomMenuItem::new("hide".to_string(), "Hide");
    let show = CustomMenuItem::new("show".to_string(), "Show");
    let new_window = CustomMenuItem::new("new_window".to_string(), "New Window");
    
    let tray_menu = SystemTrayMenu::new()
        .add_item(show)
        .add_item(hide)
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_item(new_window)
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_item(quit);
    
    SystemTray::new().with_menu(tray_menu)
}

// Handle system tray events
fn handle_system_tray_event(app: &tauri::AppHandle, event: SystemTrayEvent) {
    match event {
        SystemTrayEvent::LeftClick {
            position: _,
            size: _,
            ..
        } => {
            let window = app.get_window("main").unwrap();
            window.show().unwrap();
            window.set_focus().unwrap();
        }
        SystemTrayEvent::MenuItemClick { id, .. } => match id.as_str() {
            "quit" => {
                std::process::exit(0);
            }
            "hide" => {
                let window = app.get_window("main").unwrap();
                window.hide().unwrap();
            }
            "show" => {
                let window = app.get_window("main").unwrap();
                window.show().unwrap();
                window.set_focus().unwrap();
            }
            "new_window" => {
                let _ = create_new_window(app.clone(), None);
            }
            _ => {}
        },
        _ => {}
    }
}

// Handle menu events
fn handle_menu_event(event: tauri::WindowMenuEvent) {
    match event.menu_item_id() {
        "quit" => {
            std::process::exit(0);
        }
        "close" => {
            event.window().close().unwrap();
        }
        "new_window" => {
            let _ = create_new_window(event.window().app_handle(), None);
        }
        "about" => {
            let _ = show_notification(
                "About MadEasy Browser".to_string(),
                "MadEasy Browser v3.0.0\nBuilt with Tauri and Rust".to_string(),
            );
        }
        "settings" => {
            // Open settings window or navigate to settings page
            println!("Settings clicked");
        }
        _ => {}
    }
}

// Application setup
fn setup_app(app: &mut tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    // Get the main window
    let main_window = app.get_window("main").unwrap();
    
    // Set window properties
    main_window.set_title("MadEasy Browser")?;
    
    // Setup window event handlers
    let window = main_window.clone();
    main_window.on_window_event(move |event| match event {
        tauri::WindowEvent::CloseRequested { api, .. } => {
            // Hide to tray instead of closing
            window.hide().unwrap();
            api.prevent_close();
        }
        _ => {}
    });
    
    Ok(())
}

fn main() {
    let context = tauri::generate_context!();
    
    tauri::Builder::default()
        .menu(create_menu())
        .system_tray(create_system_tray())
        .on_system_tray_event(handle_system_tray_event)
        .on_menu_event(handle_menu_event)
        .setup(setup_app)
        .invoke_handler(tauri::generate_handler![
            get_app_config,
            save_app_config,
            open_external_url,
            get_system_info,
            create_new_window,
            minimize_to_tray,
            show_notification
        ])
        .run(context)
        .expect("error while running tauri application");
}