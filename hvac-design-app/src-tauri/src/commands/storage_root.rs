use std::path::Path;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};

#[derive(Serialize, Deserialize)]
pub struct DiskSpaceInfo {
    pub free_bytes: u64,
    pub total_bytes: u64,
    pub available_percent: f64,
}

#[tauri::command]
pub fn get_disk_space(path: String) -> Result<DiskSpaceInfo, String> {
    let path_obj = Path::new(&path);
    let free = fs2::free_space(path_obj).map_err(|e| e.to_string())?;
    let total = fs2::total_space(path_obj).map_err(|e| e.to_string())?;
    let available_percent = if total > 0 {
        (free as f64 / total as f64) * 100.0
    } else {
        0.0
    };

    Ok(DiskSpaceInfo {
        free_bytes: free,
        total_bytes: total,
        available_percent,
    })
}

#[tauri::command]
pub fn get_app_data_dir(app: AppHandle) -> Result<String, String> {
    app.path()
        .app_data_dir()
        .map(|path| path.to_string_lossy().to_string())
        .map_err(|err| err.to_string())
}
