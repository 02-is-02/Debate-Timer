use iroh::{
	endpoint::presets::N0,
	RelayMode, Endpoint, EndpointAddr, SecretKey
};
use reqwest::Client;
use serde_json::json;
use tokio::sync::broadcast;
use tokio::io::AsyncWriteExt;

pub struct HostManager {
	pub tx: broadcast::Sender<String>,
	pub ticket: EndpointAddr
}

pub async fn start_host_server(match_id: &str, match_json_str: &str) -> Result<HostManager, Box<dyn std::error::Error>> {

	let rest_url = std::env!("UPSTASH_REDIS_REST_URL");
	let rest_token = std::env!("UPSTASH_REDIS_REST_TOKEN");

	let secret_key = SecretKey::generate();
	let endpoint = Endpoint::builder(N0)
		.secret_key(secret_key)
		.alpns(vec![b"apu-debate-v1".to_vec()])
		.relay_mode(RelayMode::Default)
		.bind()
		.await?;

	let my_addr = endpoint.addr();

	let payload = json!({
		"match_id": match_id,
		"ticket": my_addr.clone(),
		"config": serde_json::from_str::<serde_json::Value>(match_json_str)?
	});

	let client = Client::new();
	let set_url = format!("{}/set/debate:room:{}?EX=36000", rest_url, match_id);
	client.post(&set_url)
		.bearer_auth(rest_token)
		.json(&payload)
		.send()
		.await?;

	let (tx, _) = broadcast::channel::<String>(100);
	let tx_clone = tx.clone();
	let endpoint_clone = endpoint.clone();

	tokio::spawn(async move {
		let _alpn = b"apu-debate-v1";

		while let Some(incoming) = endpoint_clone.accept().await {
			let connecting = match incoming.accept() {
				Ok(conn) => conn,
				Err(_) => continue,
			};

			let mut rx = tx_clone.subscribe();

			tokio::spawn(async move {
				let connection = match connecting.await {
					Ok(c) => c,
					Err(_) => return,
				};

				let mut send_stream = match connection.open_uni().await {
					Ok(s) => s,
					Err(_) => return,
				};

				while let Ok(msg) = rx.recv().await {
					if send_stream.write_all(msg.as_bytes()).await.is_err() {
						break;
					}
					let _ = send_stream.flush().await;
				}
			});
		}
	});

	Ok(HostManager { tx, ticket: my_addr })
}

