#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use tauri::{Manager, Window};
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
struct ProxyResponse {
    success: bool,
    data: Option<String>,
    error: Option<String>,
}

// Fetch any URL without CORS restrictions
#[tauri::command]
async fn fetch_without_cors(url: String) -> ProxyResponse {
    match reqwest::get(&url).await {
        Ok(response) => match response.text().await {
            Ok(text) => ProxyResponse {
                success: true,
                data: Some(text),
                error: None,
            },
            Err(e) => ProxyResponse {
                success: false,
                data: None,
                error: Some(e.to_string()),
            },
        },
        Err(e) => ProxyResponse {
            success: false,
            data: None,
            error: Some(e.to_string()),
        },
    }
}

// Execute JavaScript in the webview
#[tauri::command]
fn execute_javascript(window: Window, script: String) -> Result<(), String> {
    window.eval(&script).map_err(|e| e.to_string())
}

// Navigate to a URL
#[tauri::command]
async fn navigate_to(window: Window, url: String) -> Result<(), String> {
    window.eval(&format!("window.location.href = '{}'", url))
        .map_err(|e| e.to_string())
}

// Clear browser data
#[tauri::command]
fn clear_browser_data() -> Result<(), String> {
    // Implementation for clearing cookies, cache, etc.
    Ok(())
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            fetch_without_cors,
            execute_javascript,
            navigate_to,
            clear_browser_data
        ])
        .setup(|app| {
            let window = app.get_window("main").unwrap();
            
            // Remove CORS restrictions
            window.eval(r#"
                // Override fetch to remove CORS
                const originalFetch = window.fetch;
                window.fetch = function(...args) {
                    // Intercept and modify as needed
                    return originalFetch.apply(this, args);
                };
            "#).unwrap();
            
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}