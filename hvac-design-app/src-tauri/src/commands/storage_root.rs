use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use tauri::{AppHandle, Manager};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct StorageRootInfo {
    pub documents_path: String,
    pub appdata_path: String,
    pub recommended_path: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ValidationResult {
    pub exists: bool,
    pub writable: bool,
    pub available_bytes: u64,
    pub total_bytes: u64,
    pub percent_available: f64,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct DiskSpaceInfo {
    pub available_bytes: u64,
    pub total_bytes: u64,
    pub percent_available: f64,
}

fn sanitize_extension(extension: &str) -> String {
    extension.trim_start_matches('.').to_ascii_lowercase()
}

fn choose_recommended_path(documents_path: &str, appdata_path: &str) -> String {
    if !documents_path.is_empty() {
        return documents_path.to_string();
    }
    appdata_path.to_string()
}

fn to_string_path(path: PathBuf) -> String {
    path.to_string_lossy().to_string()
}

fn is_path_writable(path: &Path) -> bool {
    if fs::create_dir_all(path).is_err() {
        return false;
    }
    let test_file = path.join(format!(".write-test-{}", std::process::id()));
    match fs::write(&test_file, b"ok") {
        Ok(()) => {
            let _ = fs::remove_file(test_file);
            true
        }
        Err(_) => false,
    }
}

fn read_disk_space(path: &Path) -> Result<DiskSpaceInfo, String> {
    let available_bytes = fs2::free_space(path).map_err(|e| {
        eprintln!("Failed to read free space for {:?}: {}", path, e);
        e.to_string()
    })?;
    let total_bytes = fs2::total_space(path).map_err(|e| {
        eprintln!("Failed to read total space for {:?}: {}", path, e);
        e.to_string()
    })?;
    let percent_available = if total_bytes > 0 {
        (available_bytes as f64 / total_bytes as f64) * 100.0
    } else {
        0.0
    };
    Ok(DiskSpaceInfo {
        available_bytes,
        total_bytes,
        percent_available,
    })
}

#[tauri::command]
pub fn resolve_storage_root(app: AppHandle) -> Result<StorageRootInfo, String> {
    let documents_path = app
        .path()
        .document_dir()
        .map(to_string_path)
        .unwrap_or_default();
    let appdata_path = app
        .path()
        .app_data_dir()
        .map(to_string_path)
        .unwrap_or_default();

    let recommended_path = choose_recommended_path(&documents_path, &appdata_path);

    Ok(StorageRootInfo {
        documents_path,
        appdata_path,
        recommended_path,
    })
}

#[tauri::command]
pub fn validate_storage_root(path: String) -> Result<ValidationResult, String> {
    let path_obj = Path::new(&path);
    let exists = path_obj.exists();
    let writable = is_path_writable(path_obj);
    let disk = read_disk_space(path_obj).unwrap_or_else(|error| {
        eprintln!(
            "[storage_root] Failed to read disk space for '{}': {}",
            path,
            error
        );
        DiskSpaceInfo {
            available_bytes: 0,
            total_bytes: 0,
            percent_available: 0.0,
        }
    });

    Ok(ValidationResult {
        exists,
        writable,
        available_bytes: disk.available_bytes,
        total_bytes: disk.total_bytes,
        percent_available: disk.percent_available,
    })
}

#[tauri::command]
pub fn get_disk_space(path: String) -> Result<DiskSpaceInfo, String> {
    read_disk_space(Path::new(&path))
}

#[tauri::command]
pub fn create_directory(path: String, recursive: bool) -> Result<(), String> {
    let path_obj = Path::new(&path);
    if recursive {
        fs::create_dir_all(path_obj).map_err(|e| e.to_string())
    } else {
        fs::create_dir(path_obj).map_err(|e| e.to_string())
    }
}

#[tauri::command]
pub fn list_directory_files(path: String, extension: String) -> Result<Vec<String>, String> {
    let path_obj = Path::new(&path);
    if !path_obj.exists() {
        return Ok(Vec::new());
    }
    let ext = sanitize_extension(&extension);
    let entries = fs::read_dir(path_obj).map_err(|e| e.to_string())?;
    let mut files = Vec::new();

    for entry in entries {
        let entry = entry.map_err(|e| e.to_string())?;
        let entry_path = entry.path();
        if !entry_path.is_file() {
            continue;
        }
        let entry_ext = entry_path
            .extension()
            .and_then(|value| value.to_str())
            .unwrap_or_default()
            .to_ascii_lowercase();
        if entry_ext == ext {
            files.push(to_string_path(entry_path));
        }
    }

    Ok(files)
}

#[tauri::command]
pub fn get_app_data_dir(app: AppHandle) -> Result<String, String> {
    app.path()
        .app_data_dir()
        .map(to_string_path)
        .map_err(|err| err.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::{SystemTime, UNIX_EPOCH};

    fn temp_path(suffix: &str) -> PathBuf {
        let ts = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("time")
            .as_nanos();
        std::env::temp_dir().join(format!("sizewise-{}-{}", suffix, ts))
    }

    #[test]
    fn sanitize_extension_removes_dot_and_normalizes_case() {
        assert_eq!(sanitize_extension(".SWS"), "sws");
        assert_eq!(sanitize_extension("png"), "png");
    }

    #[test]
    fn choose_recommended_prefers_documents_when_available() {
        let selected = choose_recommended_path("/docs", "/appdata");
        assert_eq!(selected, "/docs");
    }

    #[test]
    fn choose_recommended_falls_back_to_appdata() {
        let selected = choose_recommended_path("", "/appdata");
        assert_eq!(selected, "/appdata");
    }

    #[test]
    fn create_directory_recursive_creates_nested_path() {
        let root = temp_path("mkdir-recursive");
        let dir = root.join("a").join("b");
        let result = create_directory(dir.to_string_lossy().to_string(), true);
        assert!(result.is_ok());
        assert!(dir.exists());
        let _ = fs::remove_dir_all(root);
    }

    #[test]
    fn list_directory_files_filters_by_extension() {
        let dir = temp_path("list-files");
        fs::create_dir_all(&dir).expect("create dir");
        let sws_file = dir.join("project.sws");
        let txt_file = dir.join("notes.txt");
        fs::write(&sws_file, b"{}").expect("write sws");
        fs::write(&txt_file, b"notes").expect("write txt");

        let result = list_directory_files(dir.to_string_lossy().to_string(), ".sws".to_string())
            .expect("list directory");
        assert_eq!(result.len(), 1);
        assert!(result[0].ends_with("project.sws"));

        let _ = fs::remove_dir_all(dir);
    }

    #[test]
    fn validate_storage_root_reports_writable_directory() {
        let dir = temp_path("validate");
        fs::create_dir_all(&dir).expect("create dir");
        let result = validate_storage_root(dir.to_string_lossy().to_string()).expect("validate");
        assert!(result.exists);
        assert!(result.writable);
        let _ = fs::remove_dir_all(dir);
    }
}
