// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use std::path::PathBuf;
use tauri_plugin_fs::FsExt;
use serde::{Deserialize, Serialize};
use reqwest::Client;
use crate::models::{DebateStages};
mod models;

#[derive(Serialize)]
struct GoogleSearch {}

#[derive(Serialize)]
struct GeminiTool {
	#[serde(rename = "googleSearch")]
	google_search: GoogleSearch
}

#[derive(Serialize)]
struct GeminiGenerationConfig {
	#[serde(rename = "responseMimeType")]
	response_mime_type: String
}

#[derive(Serialize)]
struct GeminiInlineData {
	#[serde(rename = "mimeType")]
	mime_type: String,
	data: String
}

#[derive(Serialize)]
struct GeminiPart {
	#[serde(skip_serializing_if = "Option::is_none")]
	text: Option<String>,
	#[serde(rename = "inlineData", skip_serializing_if = "Option::is_none")]
	inline_data: Option<GeminiInlineData>
}

#[derive(Serialize)]
struct GeminiContent {
	parts: Vec<GeminiPart>
}

#[derive(Serialize)]
struct GeminiRequest {
	contents: Vec<GeminiContent>,
	#[serde(skip_serializing_if = "Option::is_none")]
	tools: Option<Vec<GeminiTool>>,
	#[serde(rename = "generationConfig", skip_serializing_if = "Option::is_none")]
    generation_config: Option<GeminiGenerationConfig>
}

#[derive(Deserialize)]
struct GeminiResponsePart {
	text: Option<String>
}

#[derive(Deserialize)]
struct GeminiCandidateContent {
	parts: Vec<GeminiResponsePart>
}

#[derive(Deserialize)]
struct GeminiCandidate {
	content: GeminiCandidateContent
}

#[derive(Deserialize)]
struct GeminiResponse {
	candidates: Option<Vec<GeminiCandidate>>
}

#[derive(Debug, Deserialize)]
pub struct ProcessedFile {
	#[serde(rename = "fileName")]
	pub file_name: String,
	#[serde(rename = "mimeType")]
	pub mime_type: String,
	#[serde(rename = "fileData")]
	pub file_data: String
}

#[derive(Debug, Deserialize)]
pub struct GeneratePayload {
	pub id: String,
	#[serde(rename = "matchName")]
	pub match_name: Option<String>,
	#[serde(rename = "promptText")]
	pub prompt_text: String,
	pub attachments: Vec<ProcessedFile>,
	#[serde(rename = "apiKey")]
	pub api_key: String,
	pub model: String
}

#[tauri::command]
async fn generate_stage(payload: GeneratePayload) -> Result<DebateStages, String> {
	if payload.api_key.trim().is_empty() {
		return Err("None API Key added".to_string());
	}

	let url = format!(
		"https://generativelanguage.googleapis.com/v1beta/models/{}:generateContent?key={}",
		payload.model.trim(), 
		payload.api_key.trim()
	);

	let client = Client::new();

	let mut final_context_text = payload.prompt_text.clone();

	if payload.attachments.is_empty() {
		let pass1_prompt = format!(
			"Please act as a debate researcher. Based on the user's prompt, use the Google Search tool to find the latest and most accurate debate format rules if none format is specified. Specify the stages, time limits, and rules clearly in text.\n\nUser Prompt: {}", 
			payload.prompt_text
		);

		let pass1_request = GeminiRequest {
			contents: vec![GeminiContent {
				parts: vec![GeminiPart { text: Some(pass1_prompt), inline_data: None }]
			}],
			tools: Some(vec![GeminiTool { google_search: GoogleSearch {} }]),
			generation_config: None,
		};

		let response = client.post(&url).json(&pass1_request).send().await
			.map_err(|e| format!("Pass 1 (Search) Network Error: {}", e))?;

		if !response.status().is_success() {
			let err_text = response.text().await.unwrap_or_default();
			return Err(format!("Pass 1 Search failed: {}", err_text));
		}

		let parsed: GeminiResponse = response.json().await
			.map_err(|e| format!("Pass 1 JSON parse failed: {}", e))?;

		if let Some(candidates) = parsed.candidates {
			if let Some(first) = candidates.first() {
				if let Some(part) = first.content.parts.first() {
					if let Some(text) = &part.text {
						final_context_text = format!(
							"User's Original Request: {}\n\n[LATEST SEARCH DATA TO USE]:\n{}", 
							payload.prompt_text, 
							text
						);
					}
				}
			}
		}
	}

	let base_instructions = format!(
		"You are an expert debate tournament rule designer.\n\
		Based on the provided context data and attachments (if any), design or parse a perfect debate format configuration.\n\n\
		[CORE MANDATORY CONSTRAINTS]:\n\
		1. The \"id\" field in the returned JSON MUST exactly match this unique identifier: \"{}\"\n\
		2. The user-specified tournament name is: \"{}\". If this value is not empty, use it directly in the \"name\" field. If it is empty, automatically generate a professional, academic, and highly competitive tournament name (under 20 characters).\n\
		3. In the \"stages\" array, EVERY stage MUST include an integer \"id\" field (e.g., 0, 1, 2, 3) starting from 0 in sequential order.\n\
		4. In the \"stages\" array, each stage's \"type\" MUST be exactly one of: \"single\", \"double\", \"free\", or \"none\". You MUST strictly follow these camelCase naming conventions:\n\
			- Specifically map 'Cross-Examination' (对辩) stages to the \"free\" type.\n\
			- Map stages with flexible or conditional speaking orders (such as 'the side that exhausts its time first gives the summary' / 先耗时方先小结) to the \"double\" type.\n\
		You MUST strictly follow these camelCase naming conventions:\n\
			- If type is \"single\": MUST include an integer field \"timeLimit\" (time in seconds).\n\
			- If type is \"double\": MUST include integer fields \"leftTimeLimit\" and \"rightTimeLimit\".\n\
			- If type is \"free\": MUST include integer fields \"leftTimeLimit\" and \"rightTimeLimit\", AND a string field \"start\" (value MUST be exactly \"left\" or \"right\").\n\
			- If type is \"none\": Represents an untimed transition stage. MUST include \"title\".\n\
		5. Strictly verify the time limit for EVERY stage. DO NOT default non-debate stages (e.g., preparation time, breaks, or transitions) to the \"none\" type if an explicit time duration is provided. If any stage has a time limit, it MUST be categorized as a timed type (e.g., \"single\") with its corresponding \"timeLimit\".\n\
		6. ALL generated values for \"title\" and \"name\" fields MUST be strictly in Chinese.\n\n\
		[OUTPUT FORMAT]:\n\
		You MUST output ONLY a valid JSON string adhering strictly to the structure above. Use camelCase naming strictly. DO NOT wrap the output in Markdown code blocks (DO NOT output ```json). DO NOT include any explanatory text.\n\n\
		[CONTEXT DATA TO PROCESS]:\n\
		{}\n",
		payload.id,
		payload.match_name.as_deref().unwrap_or(""),
		final_context_text
	);

	let mut parts = vec![
		GeminiPart {
			text: Some(base_instructions),
			inline_data: None
		}
	];

	for file in payload.attachments {
		parts.push(GeminiPart { 
			text: None, 
			inline_data: Some(GeminiInlineData { 
				mime_type: file.mime_type,
				data: file.file_data
			}) 
		})
	}

	let pass2_request = GeminiRequest {
		contents: vec![GeminiContent { parts }],
		tools: None,
		generation_config: Some(GeminiGenerationConfig { 
			response_mime_type: "application/json".to_string()
		})
	};

	let response = client
		.post(&url)
		.json(&pass2_request)
		.send()
		.await
		.map_err(|e| format!("Pass 2 Network Error: {}", e))?;

	if !response.status().is_success() {
		let status_code = response.status();
		let err_text = response.text().await.unwrap_or_default();
		return Err(format!("Pass 2 API Error ({}): {}", status_code, err_text));
	}

	let parsed: GeminiResponse = response.json().await
		.map_err(|e| format!("Pass 2 JSON Parse Error: {}", e))?;

	if let Some(candidates) = parsed.candidates {
		if let Some(first_candidate) = candidates.first() {
			if let Some(first_part) = first_candidate.content.parts.first() {
				if let Some(json_text) = &first_part.text {
					let final_debate_stages: DebateStages = serde_json::from_str(json_text)
						.map_err(|e| format!("AI generated JSON does not fulfill the data type: {}", e))?;

					return Ok(final_debate_stages);
				} 
			}
		}
	}

	Err("Gemini failed to generate valid JSON content in Pass 2".to_string())
}


#[tauri::command]
async fn allow_custom_path(app: tauri::AppHandle, path: String) -> Result<(), String> {
	let path_buf = PathBuf::from(&path);

	app.fs_scope().allow_directory(&path_buf, true).map_err(|e| format!("Rust dynamic permission granting failed:{}", e))?;
	println!("Added path to whitelist: {}", path);
	Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
	tauri::Builder::default()
		.plugin(tauri_plugin_dialog::init())
		.plugin(tauri_plugin_fs::init())
		.plugin(tauri_plugin_opener::init())
		.invoke_handler(tauri::generate_handler![generate_stage, allow_custom_path])
		.run(tauri::generate_context!())
		.expect("error while running tauri application");
}
