use iroh::{key::SecretKey, relay::RelayMode, Endpoint, NodeAddr};
use iroh::endpoint::presets::N0;
use reqwest::Client;

#[derive(Serialize, Deserialize, Clone)]
pub struct RemoteRoomInfo {
	pub match_id: String,
	pub ticket: EndpointAddr,
	pub config: Value,
}

#[tauri::command]
async fn list_remote_rooms() -> Result<Vec<RemoteRoomInfo>, String> {
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

	let mut room_list = Vec::new();

	for key_val in keys.unwrap() {
		let key_str = key_val.as_str().unwrap_or("");
		if key_str.is_empty() { continue; }

		let get_url = format!("{}/get/{}", rest_url, key_str);
		if let Ok(res) = client.get(&get_url).bearer_auth(rest_token).send().await {
			if let Ok(data_json) = res.json::<Value>().await {
				if let Some(raw_string) = data_json["result"].as_str() {
					if let Ok(room_info) = serde_json::from_str::<RemoteRoomInfo>(raw_string) {
						room_list.push(room_info);
					}
				}
			}
		}
	}

	Ok(room_list)
}

pub async fn start_viewer_client(match_id: &str) -> Result<(), Box<dyn std::error::Error>> {

	let rest_url = std::env!("UPSTASH_REDIS_REST_URL");
	let rest_token = std::env!("UPSTASH_REDIS_REST_TOKEN");

	let client = Client::new();
	let get_url = format!("{}/get/{}", rest_url, match_id);
	let res = client.get(&get_url)
		.bearer_auth(rest_token)
		.send()
		.await?;

	let json_resp: serde_json::Value = res.json().await?;
	let raw_str = json_resp["result"].as_str().ok_or("房间不存在或已过期")?;
	let room_data: serde_json::Value = serde_json::from_str(raw_str)?;

	let host_addr: NodeAddr = serde_json::from_value(room_data["ticket"].clone())?;

	let secret_key = SecretKey::generate();
	let endpoint = Endpoint::builder()
		.secret_key(secret_key)
		.relay_mode(RelayMode::Default)
		.bind()
		.await?;

	let alpn = b"apu-debate-v1";
	let connection = endpoint.connect(host_addr, alpn).await?;

	let mut recv_stream = connection.accept_uni().await?;

	let mut buffer = [0u8; 1024];
	while let Ok(Some(bytes_read)) = recv_stream.read(&mut buffer).await {
		let command_str = String::from_utf8_lossy(&buffer[..bytes_read]);

	}

	Ok(())
}