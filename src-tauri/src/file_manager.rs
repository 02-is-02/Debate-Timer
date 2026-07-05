use tauri::{AppHandle, Manager};
use font_kit::source::SystemSource;
use std::fs;
use std::path::PathBuf;

#[tauri::command]
pub fn save_settings(app: AppHandle, content: String, file_name: String) -> Result<(), String> {
	let mut target_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;

	target_dir.push("settings"); 
	if !target_dir.exists() {
		fs::create_dir_all(&target_dir).map_err(|e| e.to_string())?;
	}

	let target_path = target_dir.join(file_name);

	fs::write(target_path, content).map_err(|e| format!("保存 JSON 失败：{}", e))?;
	Ok(())
}

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
pub fn get_imported_assets(app: AppHandle) -> Result<Vec<String>, String> {
	let mut target_dir = app.path().app_data_dir().map_err(|e| format!("读取文件失败: {}", e))?;
	target_dir.push("imported_assets");

	if !target_dir.exists() {
		return Ok(Vec::new());
	}

	let mut files = Vec::new();
	for entry in fs::read_dir(target_dir).map_err(|e| format!("读取文件失败：{}", e))? {
		if let Ok(entry) = entry {
			if let Ok(file_name) = entry.file_name().into_string() {
				files.push(file_name);
			}
		}
	}

	files.sort();
	Ok(files)
}

#[tauri::command]
pub fn del_imported_asset(app: AppHandle, file_name: String) -> Result<(), String> {
	let mut target_path = app.path().app_data_dir().map_err(|e| format!("读取文件失败: {}", e))?;
	target_path.push("imported_assets");
	target_path.push(&file_name);

	if target_path.exists() {
		fs::remove_file(target_path).map_err(|e| format!("物理文件删除失败：{}", e))?;
	}
	
	Ok(())
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