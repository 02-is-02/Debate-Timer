// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use std::path::PathBuf;
use tauri_plugin_fs::FsExt;

#[tauri::command]
async fn allow_custom_path(app: tauri::AppHandle, path: String) -> Result<(), String> {
	let path_buf = PathBuf::from(&path);

	app.fs_scope().allow_directory(&path_buf, true).map_err(|e| format!("Rust 动态授权失败：{}", e))?;
	println!("成功将路径加入动态白名单: {}", path);
	Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![allow_custom_path])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
