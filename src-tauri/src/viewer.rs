use iroh::{SecretKey, RelayMode, Endpoint, EndpointAddr};
use iroh::endpoint::presets::N0;
use std::sync::Mutex;
use tauri::{Emitter, State};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use tokio;
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio_util::sync::CancellationToken;
use reqwest::Client;
use crate::ViewerState;

#[derive(Default)]
pub struct TaskState {
	pub cancel_token: Mutex<Option<CancellationToken>>
}

#[derive(Serialize, Deserialize, Clone)]
pub struct RemoteRoomInfo {
	pub match_id: String,
	pub ticket: EndpointAddr,
	pub config: Value,
}

#[tauri::command]
pub fn cancel_viewer_client(task_state: tauri::State<'_, TaskState>) {
	if let Some(token) = task_state.cancel_token.lock().unwrap().take() {
		token.cancel();
	}
}

#[tauri::command]
pub async fn list_remote_rooms() -> Result<Vec<RemoteRoomInfo>, String> {
	let rest_url = std::env!("UPSTASH_REDIS_REST_URL");
	let rest_token = std::env!("UPSTASH_REDIS_REST_TOKEN");
	let client = Client::new();

	println!("Pulling URL: {}", rest_url);

	let keys_url = format!("{}/keys/debate:room:R-*", rest_url);
	let keys_res = client.get(&keys_url)
		.bearer_auth(rest_token)
		.send()
		.await
		.map_err(|e| format!("网络请求失败: {}", e))?
		.json::<Value>()
		.await
		.map_err(|e| format!("解析 JSON 失败: {}", e))?;

	let keys = keys_res["result"].as_array();
	if keys.is_none() || keys.unwrap().is_empty() {
		return Ok(vec![]);
	}

	let mut mget_command = vec!["MGET".to_string()];
	for k in keys.unwrap() {
		if let Some(key_str) = k.as_str() {
			mget_command.push(key_str.to_string());
		}
	}

	let mget_url = rest_url.trim_end_matches('/');
	let mget_res: Value = client.post(mget_url)
		.bearer_auth(rest_token)
		.json(&mget_command)
		.send().await.map_err(|e| format!("MGET请求失败：{}", e))?
		.json().await.map_err(|e| format!("解析 JSON 失败: {}", e))?;

	let mut room_list = Vec::new();

	if let Some(values) = mget_res["result"].as_array() {
		for val in values {
			if let Some(raw_string) = val.as_str() {
				if let Ok(room_info) = serde_json::from_str::<RemoteRoomInfo>(raw_string) {
					room_list.push(room_info);
				}
			}
		}
	}

	Ok(room_list)
}

#[tauri::command]
pub async fn start_viewer_client(
	match_id: String,
	app: tauri::AppHandle,
	state: tauri::State<'_, ViewerState>,
	task_state: State<'_, TaskState>
) -> Result<(), String> {
	let token = CancellationToken::new();
	{
		let mut lock = task_state.cancel_token.lock().unwrap();
		*lock = Some(token.clone());
	}

	let connection_setup = async {
		let rest_url = std::env!("UPSTASH_REDIS_REST_URL");
		let rest_token = std::env!("UPSTASH_REDIS_REST_TOKEN");

		let client = Client::new();
		let get_url = format!("{}/get/debate:room:{}", rest_url, match_id);
		let res = client.get(&get_url)
			.bearer_auth(rest_token)
			.send()
			.await
			.map_err(|e| format!("内容获取失败: {}", e))?;

		let json_resp: serde_json::Value = res.json().await.map_err(|e| format!("JSON解析失败: {}", e))?;
		let raw_str = json_resp["result"].as_str().ok_or("房间不存在或已过期")?;
		let room_data: serde_json::Value = serde_json::from_str(raw_str).map_err(|e| format!("JSON解析失败: {}", e))?;

		let host_addr: EndpointAddr = serde_json::from_value(room_data["ticket"].clone()).map_err(|e| format!("JSON解析失败: {}", e))?;

		let secret_key = SecretKey::generate();
		let endpoint = Endpoint::builder(N0)
			.secret_key(secret_key)
			.relay_mode(RelayMode::Default)
			.bind()
			.await
			.map_err(|e| format!("连接房主节点失败: {}", e))?;
		{
			let mut endpoint_lock = state.endpoint.lock().unwrap();
			*endpoint_lock = Some(endpoint.clone());
		}

		let alpn = b"apu-debate-v1";
		let connection = endpoint
			.connect(host_addr, alpn)
			.await
			.map_err(|e| format!("连接房主节点失败: {}", e))?;
		{
			let mut conn_lock = state.connection.lock().unwrap();
			*conn_lock = Some(connection.clone());
		}

		Ok::<_, String>(connection)
	};

	let connection = tokio::select! {
		_ = token.cancelled() => {
			return Err("连接已被用户取消".to_string());
		}
		res = connection_setup => {
			res?
		}
	};

	{
		let mut lock = task_state.cancel_token.lock().unwrap();
		*lock = None;
	}

	tokio::spawn(async move {
		println!("Waiting for data stream");
		if let Ok(recv_stream) = connection.accept_uni().await {
			println!("Connected, listening");
			let mut reader = BufReader::new(recv_stream);
			let mut line = String::new();

			while let Ok(bytes_read) = reader.read_line(&mut line).await {
				if bytes_read == 0 {
					println!("Connection lost");
					break;
				}
				println!("Raw data: {}", line.trim().to_string());

				if let Err(e) = app.emit("room-event", line.trim().to_string()) {
					println!("Emit Event failed: {}", e);
				}

				line.clear();
			}
		}
	});

	Ok(())
}