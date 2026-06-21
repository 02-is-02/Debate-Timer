import { useState } from 'react';
import { TextField, MenuItem, Select, Fab } from '@mui/material';
import { useToast } from '../utils/Context';
import { RouteOff, Save } from 'lucide-react';

const PATH_STORAGE_KEY = 'debate_timer_save_dir';

export default function Settings() {
	const { showToast } = useToast();
	
	const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || '');
	const [model, setModel] = useState(localStorage.getItem('gemini_model') || 'Gemini 2.5 Flash');

	const handleSave = () => {
		localStorage.setItem('gemini_api_key', apiKey);
		localStorage.setItem('gemini_model', model);
		showToast("设置已保存", "success");
	};

	const handleResetPath = () => {
		localStorage.setItem(PATH_STORAGE_KEY, "")
	}

	const renderDivider = ( title: string) => {
		return (
			<div >
				<div className="stage-divider">
					<div className="stage-divider-line"/>
				</div>
				<h3 style={{ color: "white", margin: "0 0 0 1vw" }}>
					{title}
				</h3>
			</div>
		)
	}

	return (
		<div style={{ flex: 1 }} className="settings-container">
			<h1 style={{ color: "white" }}>
				设置
			</h1>
			{renderDivider("AI生成相关")}
			<div className="settings-group">
				<label className="mini-label">
					Gemini API Key （可从 Google AI Studio 获取）：
				</label>
				<TextField
					size="small"
					type="password"
					value={apiKey}
					variant="standard"
					onChange={(e) => setApiKey(e.target.value)}
					placeholder="AIzaSy..."
				/>
			</div>
			
			<div className="settings-group">
				<label className="mini-label">
					生成赛制使用的模型：
				</label>
				<Select 
					size="small"
					value={model}
					variant="standard"
					onChange={(e) => setModel(e.target.value)}
				>
					<MenuItem value="gemini-2.5-flash">Gemini 2.5 Flash</MenuItem>
					<MenuItem value="gemini-2.5-pro">Gemini 2.5 Pro</MenuItem>
					<MenuItem value="gemini-2.0-flash">Gemini 2.0 Flash</MenuItem>
					<MenuItem value="gemini-flash-latest">Gemini Flash</MenuItem>
				</Select>
			</div>
			{renderDivider("存储相关")}
			<div className="settings-group">
				<label className="mini-label">
					点击重置默认存储路径：
				</label>
				<Fab sx={{ margin: "0 auto 0 0", padding: "15px", gap: "10px" }}size="small" color="error" variant="extended" aria-label="reset" onClick={handleResetPath}>
					<RouteOff/>重置
				</Fab>
			</div>

			<Fab sx={{ right: "5%", bottom: "5%", position: "fixed" }} color="primary" aria-label="save" onClick={handleSave}>
				<Save/>
			</Fab>
		</div>
	);
}