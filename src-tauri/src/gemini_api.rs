use serde::{Deserialize, Serialize};
use base64::prelude::*;
use crate::{models::DebateStages};

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
pub async fn generate_stage(payload: GeneratePayload) -> Result<DebateStages, String> {
	if payload.api_key.trim().is_empty() {
		eprintln!("[Backend Log] API Key is empty");
		return Err("未知错误".to_string());
	}

	let url = format!(
		"https://generativelanguage.googleapis.com/v1beta/models/{}:generateContent?key={}",
		payload.model.trim(), 
		payload.api_key.trim()
	);

	let client = reqwest::Client::new();
	let mut final_context_text = String::new();
	let mut virtual_attachments = Vec::new(); 

	let input_text = payload.prompt_text.trim();

	if !payload.attachments.is_empty() {
		final_context_text = input_text.to_string();

	} else if input_text.starts_with("http://") || input_text.starts_with("https://") {
		let scraped_resp = match client.get(input_text).send().await {
			Ok(resp) => resp,
			Err(e) => {
				eprintln!("[Backend Log] Channel 1 Internet Error: {}", e);
				return Err("网络波动".to_string());
			}
		};
		
		if !scraped_resp.status().is_success() {
			eprintln!("[Backend Log] Channel 1 HTTP Status Abnormal: {}", scraped_resp.status());
			return Err("网络波动".to_string());
		}

		let scraped_content = scraped_resp.text().await.unwrap_or_default();
		final_context_text = format!(
			"User provided URL: {}\n\n[Scraped Web Content]:\n{}", 
			input_text, 
			scraped_content
		);

	} else {
		let pass1_prompt = format!(
			"Please act as a debate researcher. The user input is: \"{}\"\n\
			Analyze if this input already contains sufficient debate format rules (stages, time limits).\n\
			- If it DOES contain details, just summarize and output them directly.\n\
			- If it DOES NOT, use the Google Search tool to find the exact debate format rules.\n\
			[STRICT NAME MATCHING]: The rules you extract MUST explicitly belong to the exact tournament name provided in the user input. Do NOT substitute with generic debate rules or rules from other tournaments. If the search results do not explicitly link the time limits and stages to this specific tournament name, consider it a failed search.\n\
			[CRITICAL]: If after searching, you still CANNOT find the specific stages and time limits for this exact debate format (following the strict name matching rule), you MUST output exactly and ONLY the word: [NOT_FOUND]. Do not explain, do not apologize, just output [NOT_FOUND].", 
			input_text
		);

		let pass1_request = GeminiRequest {
			contents: vec![GeminiContent {
				parts: vec![GeminiPart { text: Some(pass1_prompt), inline_data: None }]
			}],
			tools: Some(vec![GeminiTool { google_search: GoogleSearch {} }]),
			generation_config: None,
		};

		let response = match client.post(&url).json(&pass1_request).send().await {
			Ok(resp) => resp,
			Err(e) => {
				eprintln!("[Backend Log] Channel 2 Post Request Failed: {}", e);
				return Err("网络波动".to_string());
			}
		};

		if !response.status().is_success() {
			let status = response.status();
			let err_text = response.text().await.unwrap_or_default();
			eprintln!("[Backend Log] Channer 2 API Returned Error Code: {} - {}", status, err_text);
			
			if status.as_u16() == 429 || status.as_u16() >= 500 {
				return Err("模型处在高峰期".to_string());
			} else {
				return Err("网络波动".to_string());
			}
		}

		let pass1_raw_text = match response.text().await {
			Ok(text) => text,
			Err(e) => {
				eprintln!("[Backend Log] 通道2 读取返回文本失败: {}", e);
				return Err("未知错误".to_string());
			}
		};

		let parsed: GeminiResponse = match serde_json::from_str(&pass1_raw_text) {
			Ok(p) => p,
			Err(e) => {
				eprintln!("========== PASS 1 Analyse Error ==========");
				eprintln!("{}", pass1_raw_text);
				eprintln!("========================================");
				eprintln!("[Backend Log] Channer 2 JSON Deserialize Failed: {}", e);
				return Err("未知错误".to_string());
			}
		};

		let mut extracted_text = String::new();
		if let Some(candidates) = parsed.candidates {
			if let Some(first) = candidates.first() {
				if let Some(part) = first.content.parts.first() {
					if let Some(text) = &part.text {
						extracted_text = text.clone();
					}
				}
			}
		}

		if extracted_text.contains("[NOT_FOUND]") {
			eprintln!("[Backend Log] Triggered [NOT_FOUND]");
			return Err("无法搜索到具体赛制".to_string());
		}

		let b64_encoded = BASE64_STANDARD.encode(extracted_text.as_bytes());
		
		virtual_attachments.push(GeminiPart {
			text: None,
			inline_data: Some(GeminiInlineData {
				mime_type: "text/plain".to_string(),
				data: b64_encoded,
			})
		});

		final_context_text = format!(
			"Original user request: {}. \n\
			Please strictly refer to the attached base64 document (text/plain) which contains the detailed debate rules gathered by the previous layer.", 
			input_text
		);
	}

	let base_instructions = format!(
		"You are an expert debate tournament rule designer.\n\
		Based on the provided context data and attachments (if any), design or parse a perfect debate format configuration.\n\n\
		[CORE MANDATORY CONSTRAINTS]:\n\
		1. The \"id\" field in the returned JSON MUST exactly match this unique identifier: \"{}\"\n\
		2. The user-specified tournament name is: \"{}\". If this value is not empty, use it directly in the \"name\" field. If it is empty, strictly search for tournament name in attachments or user input before automatically generate a professional, academic, and highly competitive tournament name (under 20 characters).\n\
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
		7. ALL generated values for \"title\" and \"name\" fields MUST be strictly in Chinese.\n\n\
		[OUTPUT FORMAT]:\n\
		You MUST output ONLY a valid JSON string adhering strictly to the structure above. Use camelCase naming strictly. DO NOT wrap the output in Markdown code blocks (DO NOT output ```json). DO NOT include any explanatory text.\n\n\
		[CONTEXT DATA TO PROCESS]:\n\
		{}\n",
		payload.id,
		payload.match_name.as_deref().unwrap_or(""),
		final_context_text
	);

	let mut pass2_parts = vec![GeminiPart { text: Some(base_instructions), inline_data: None }];

	for file in payload.attachments {
		pass2_parts.push(GeminiPart { 
			text: None, 
			inline_data: Some(GeminiInlineData { mime_type: file.mime_type, data: file.file_data }) 
		});
	}
	for virtual_part in virtual_attachments {
		pass2_parts.push(virtual_part);
	}

	let pass2_request = GeminiRequest {
		contents: vec![GeminiContent { parts: pass2_parts }],
		tools: None,
		generation_config: Some(GeminiGenerationConfig { response_mime_type: "application/json".to_string() })
	};

	let pass2_response = match client.post(&url).json(&pass2_request).send().await {
		Ok(resp) => resp,
		Err(e) => {
			eprintln!("[Backend Log] Pass 2 Post Request Failed: {}", e);
			return Err("网络波动".to_string());
		}
	};

	if !pass2_response.status().is_success() {
		let status = pass2_response.status();
		let err_text = pass2_response.text().await.unwrap_or_default();
		eprintln!("[Backend Log] Pass 2 API Returned Error Code: {} - {}", status, err_text);
		
		if status.as_u16() == 429 || status.as_u16() >= 500 {
			return Err("模型处在高峰期".to_string());
		} else {
			return Err("网络波动".to_string());
		}
	}

	let pass2_raw_text = match pass2_response.text().await {
		Ok(text) => text,
		Err(e) => {
			eprintln!("[Backend Log] Pass 2 Read Response Failed: {}", e);
			return Err("未知错误".to_string());
		}
	};

	
	println!("========== PASS 2 RAW RESPONSE ==========\n{}\n=========================================", pass2_raw_text);


	let parsed_pass2: GeminiResponse = match serde_json::from_str(&pass2_raw_text) {
		Ok(p) => p,
		Err(e) => {
			eprintln!("[Backend Log] Pass 2 JSON Deserialize Failed: {}", e);
			return Err("未知错误".to_string());
		}
	};

	if let Some(candidates) = parsed_pass2.candidates {
		if let Some(first_candidate) = candidates.first() {
			if let Some(first_part) = first_candidate.content.parts.first() {
				if let Some(json_text) = &first_part.text {
					
					let final_debate_stages: DebateStages = match serde_json::from_str(json_text) {
						Ok(stages) => stages,
						Err(e) => {
							eprintln!("========== 🚨 PASS 2 AI generated JSON Format Error ==========");
							eprintln!("{}", json_text);
							eprintln!("====================================================");
							eprintln!("[Backend Log] Struct Match Failed Factor: {}", e);
							
							return Err("未知错误".to_string());
						}
					};

					return Ok(final_debate_stages);
				} 
			}
		}
	}

	eprintln!("[Backend Log] Pass 2 Not Responding Candidates");
	Err("未知错误".to_string())
}
