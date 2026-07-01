use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub enum StartSide {
	Left,
	Right,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(tag = "type")]
#[serde(rename_all = "camelCase")]
pub enum DebateStage {
	Single {
		id: u32,
		title: String,
		#[serde(rename = "timeLimit")]
		time_limit: u32,
	},
	Double {
		id: u32,
		title: String,
		#[serde(rename = "leftTimeLimit")]
		left_time_limit: u32,
		#[serde(rename = "rightTimeLimit")]
		right_time_limit: u32,
	},
	Free {
		id: u32,
		title: String,
		#[serde(rename = "leftTimeLimit")]
		left_time_limit: u32,
		#[serde(rename = "rightTimeLimit")]
		right_time_limit: u32,
		start: StartSide,
	},
	None {
		id: u32,
		title: String,
	},
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct DebateStages {
	pub id: String,
	pub name: String,
	pub stages: Vec<DebateStage>,
}
