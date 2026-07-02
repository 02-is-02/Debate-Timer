use tauri::{AppHandle, Manager};
use font_kit::source::SystemSource;
use std::fs;
use std::path::PathBuf;

#[tauri::command]
pub fn save_imported_file(app: AppHandle, source_path: String) -> Result<String, String> {
	let mut target_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;

	target_dir.push("imported_assets"); 
	if !target_dir.exists() {
		fs::create_dir_all(&target_dir).map_err(|e| e.to_string())?;
	}

	let source_path_buf = PathBuf::from(&source_path);
	let file_name = source_path_buf.file_name().ok_or("无法提取文件名")?;
	let target_path = target_dir.join(file_name);

	fs::copy(&source_path_buf, &target_path).map_err(|e| format!("复制失败: {}", e))?;
	Ok(file_name.to_string_lossy().into_owned())
}

#[tauri::command]
pub fn get_system_fonts() -> Vec<String> {
	let source = SystemSource::new();
	let mut font_names = Vec::new();

	if let Ok(families) = source.all_families() {
		for family in families {
			font_names.push(family);
		}
	}

	font_names.sort();
	font_names.dedup(); 
	
	font_names
}