mod commands;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            commands::storage_root::resolve_storage_root,
            commands::storage_root::validate_storage_root,
            commands::storage_root::get_disk_space,
            commands::storage_root::create_directory,
            commands::storage_root::list_directory_files
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
