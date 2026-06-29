use iroh::{SecretKey, RelayMode, Endpoint, EndpointAddr};
use iroh::endpoint::presets::N0;
use tauri::Emitter;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use tokio;
use tokio::io::{AsyncBufReadExt, BufReader};
use reqwest::Client;

#[derive(Serialize, Deserialize, Clone)]
pub struct RemoteRoomInfo {
	pub match_id: String,
	pub ticket: EndpointAddr,
	pub config: Value,
}

#[tauri::command]
pub async fn list_remote_rooms() -> Result<Vec<RemoteRoomInfo>, String> {
	let rest_url = std::env!("UPSTASH_REDIS_REST_URL");
	let rest_token = std::env!("UPSTASH_REDIS_REST_TOKEN");
	let client = Client::new();

	let keys_url = format!("{}/keys/debate:room:M-*", rest_url);
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

	let mget_url = format!("{}/mget", rest_url);
	let mget_res: Value = client.post(&mget_url)
		.bearer_auth(rest_token)
		.json(keys.unwrap())
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
pub async fn start_viewer_client(match_id: String, app: tauri::AppHandle) -> Result<(), String> {

	let rest_url = std::env!("UPSTASH_REDIS_REST_URL");
	let rest_token = std::env!("UPSTASH_REDIS_REST_TOKEN");

	let client = Client::new();
	let get_url = format!("{}/get/{}", rest_url, match_id);
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

	let alpn = b"apu-debate-v1";
	let connection = endpoint
		.connect(host_addr, alpn)
		.await
		.map_err(|e| format!("连接房主节点失败: {}", e))?;

	tokio::spawn(async move {
		if let Ok(recv_stream) = connection.accept_uni().await {
			let mut reader = BufReader::new(recv_stream);
			let mut line = String::new();

			while let Ok(bytes_read) = reader.read_line(&mut line).await {
				if bytes_read == 0 {
					break;
				}

				let _ = app.emit("room-event", line.trim().to_string());

				line.clear();
			}
		}

	});

	Ok(())
}