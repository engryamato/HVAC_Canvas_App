mod oauth;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            greet,
            oauth::start_google_oauth,
            oauth::decode_id_token,
            oauth::refresh_access_token,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
