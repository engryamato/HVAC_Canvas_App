use std::fs;
use std::path::Path;
use tauri::{AppHandle, Manager};
use serde::{Serialize, Deserialize};
use fs2::free_space;

#[derive(Serialize, Deserialize)]
pub struct StorageRootInfo {
    pub documents_path: Option<String>,
    pub app_data_path: Option<String>,
    pub recommended_path: Option<String>,
}

#[derive(Serialize, Deserialize)]
pub struct ValidationResult {
    pub is_valid: bool,
    pub is_writable: bool,
    pub free_space_bytes: u64,
    pub errors: Vec<String>,
}

#[derive(Serialize, Deserialize)]
pub struct DiskSpaceInfo {
    pub free_bytes: u64,
    pub total_bytes: u64,
    pub available_percent: f64,
}

#[tauri::command]
pub fn resolve_storage_root(app: AppHandle) -> StorageRootInfo {
    let docs = app.path().document_dir().ok();
    let app_data = app.path().app_data_dir().ok();

    StorageRootInfo {
        documents_path: docs.clone().map(|p| p.to_string_lossy().to_string()),
        app_data_path: app_data.clone().map(|p| p.to_string_lossy().to_string()),
        recommended_path: docs.or(app_data).map(|p| p.to_string_lossy().to_string()),
    }
}

#[tauri::command]
pub fn validate_storage_root(path: String) -> ValidationResult {
    let path_obj = Path::new(&path);
    let mut errors = Vec::new();

    // Check directory exists
    if !path_obj.exists() {
        errors.push("Directory does not exist".to_string());
        return ValidationResult {
            is_valid: false,
            is_writable: false,
            free_space_bytes: 0,
            errors,
        };
    }

    // Check directory is actually a directory
    if !path_obj.is_dir() {
        errors.push("Path is not a directory".to_string());
        return ValidationResult {
            is_valid: false,
            is_writable: false,
            free_space_bytes: 0,
            errors,
        };
    }

    // Check write permissions
    let test_file = path_obj.join(".write_test");
    let is_writable = fs::write(&test_file, "test").is_ok() && fs::remove_file(&test_file).is_ok();
    
    if !is_writable {
        errors.push("Directory is not writable".to_string());
    }

    // Check disk space
    // Note: fs2::free_space might fail on some platforms/mounts, handle gracefully
    let free_space_bytes = match free_space(path_obj) {
        Ok(space) => space,
        Err(_) => 0,
    };

    ValidationResult {
        is_valid: errors.is_empty(),
        is_writable,
        free_space_bytes,
        errors,
    }
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
pub fn create_directory(path: String, recursive: bool) -> Result<(), String> {
    if recursive {
        fs::create_dir_all(&path).map_err(|e| e.to_string())
    } else {
        fs::create_dir(&path).map_err(|e| e.to_string())
    }
}

#[tauri::command]
pub fn list_directory_files(path: String, extension: String) -> Result<Vec<String>, String> {
    let mut files = Vec::new();
    let entries = fs::read_dir(path).map_err(|e| e.to_string())?;

    for entry in entries {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();
        
        if path.is_file() {
            if let Some(ext) = path.extension() {
                if ext.to_string_lossy() == extension {
                    files.push(path.to_string_lossy().to_string());
                }
            }
        }
    }

    Ok(files)
}
