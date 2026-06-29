// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use std::{path::PathBuf, sync::Mutex};
use iroh::EndpointAddr;
use tauri_plugin_fs::FsExt;
use tokio::sync::broadcast;
use crate::{host::start_host_server, viewer::start_viewer_client, viewer::list_remote_rooms, gemini_api::generate_stage};
mod host;
mod viewer;
mod gemini_api;
mod models;

pub struct HostState {
	pub sender: Mutex<Option<broadcast::Sender<String>>>
}

#[tauri::command]
async fn allow_custom_path(app: tauri::AppHandle, path: String) -> Result<(), String> {
	let path_buf = PathBuf::from(&path);

	app.fs_scope().allow_directory(&path_buf, true).map_err(|e| format!("Rust dynamic permission granting failed:{}", e))?;
	println!("Added path to whitelist: {}", path);
	Ok(())
}

#[tauri::command]
async fn create_host_room(
	match_id: String,
	match_json_str: String,
	host_state: tauri::State<'_, HostState>,
) -> Result<EndpointAddr, String> {
	{
		let lock = host_state.sender.lock().unwrap();
		if lock.is_some() {
			return Err("当前已经存在一个运行中的房间，请勿重复点击".to_string());
		}
	}
	let manager = start_host_server(&match_id, &match_json_str)
		.await
		.map_err(|e| format!("启动节点失败: {}", e))?;

	let mut lock = host_state.sender.lock().unwrap();
	*lock = Some(manager.tx);

	Ok(manager.ticket)
}

#[tauri::command]
async fn close_host_room(
	match_id: String,
	host_state: tauri::State<'_, HostState>
) -> Result<(), String> {
	let rest_url = std::env!("UPSTASH_REDIS_REST_URL");
	let rest_token = std::env!("UPSTASH_REDIS_REST_TOKEN");
	
	let client = reqwest::Client::new();

	let del_url = format!("{}/del/debate:room{}", rest_url, match_id);
	if let Err(e) = client.get(&del_url).bearer_auth(rest_token).send().await {
		eprintln!("警告: 无法在云端删除房间记录: {}", e);
	}

	let mut lock = host_state.sender.lock().unwrap();
	*lock = None;

	Ok(())
}

#[tauri::command]
fn broadcast_packet(
	raw_json_str: String,
	host_state: tauri::State<'_, HostState>,
) -> Result<(), String> {
	let lock = host_state.sender.lock().unwrap();

	if let Some(tx) = &*lock {
		let mut packet = raw_json_str;
		
		if !packet.ends_with('\n') {
			packet.push('\n');
		}

		let _ = tx.send(packet);
		Ok(())
	} else {
		Err("房间主机未启动".to_string())
	}
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
	tauri::Builder::default()
		.plugin(tauri_plugin_dialog::init())
		.plugin(tauri_plugin_fs::init())
		.plugin(tauri_plugin_opener::init())
		.manage(HostState {
			sender: Mutex::new(None)
		})
		.invoke_handler(tauri::generate_handler![
			generate_stage, 
			allow_custom_path,
			create_host_room,
			close_host_room,
			broadcast_packet,
			start_viewer_client,
			list_remote_rooms
		])
		.run(tauri::generate_context!())
		.expect("error while running tauri application");
}
