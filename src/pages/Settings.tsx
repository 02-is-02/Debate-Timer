import { useEffect, useRef, useState } from 'react';
import { TextField, MenuItem, Select, Fab, Switch, CircularProgress } from '@mui/material';
import { useToast } from '../utils/Context';
import { RouteOff } from 'lucide-react';

const PATH_STORAGE_KEY = 'debate_timer_save_dir';

export default function Settings() {
	const { showToast } = useToast();
	
	const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || '');
	const [model, setModel] = useState(localStorage.getItem('gemini_model') || 'Gemini 2.5 Flash');
	const [autoCreateRoom, setAutoCreateRoom] = useState(localStorage.getItem('auto_create_room') === "true" || false)

	const [isSaving, setIsSaving] = useState(false);

	const typingTimeRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		const savedKey = localStorage.getItem('gemini_api_key') || '';
		const savedModel = localStorage.getItem('gemini_model') || 'Gemini 2.5 Flash';
		const savedAuto = localStorage.getItem('auto_create_room') === "true";

		if (apiKey === savedKey && model === savedModel && autoCreateRoom === savedAuto) {
			return;
		}

		setIsSaving(true);
		if (typingTimeRef.current) clearTimeout(typingTimeRef.current);

		typingTimeRef.current = setTimeout(() => {
			try {
				localStorage.setItem('gemini_api_key', apiKey);
				localStorage.setItem('gemini_model', model);
				localStorage.setItem('auto_create_room', autoCreateRoom.toString());

				showToast("设置已保存", "success");
			} catch (error) {
				console.log("Failed to save settings: ", error);
				showToast(`设置保存发生错误:\n${error}`, 'error');
			} finally {
				setIsSaving(false);
			}
		}, 1500);

		return () => {
			if (typingTimeRef.current) clearTimeout(typingTimeRef.current);
		};
	}, [apiKey, model, autoCreateRoom]);

	const handleResetPath = () => {
		localStorage.setItem(PATH_STORAGE_KEY, "")
	};

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
	};

	useEffect(() => {
		return () => {
			if (typingTimeRef.current) clearTimeout(typingTimeRef.current);

			if (isSaving) {
				localStorage.setItem('gemini_api_key', apiKey);
				localStorage.setItem('gemini_model', model);
				localStorage.setItem('auto_create_room', autoCreateRoom.toString());
			}
		};
	}, []);

	return (
		<div style={{ flex: 1 }} className="settings-container hide-scrollbar">
			<div style={{ alignItems: "baseline" }} className="settings-group long">
				<h1 style={{ color: "white" }}>
					设置
				</h1>
				<label className="mini-label">
					{isSaving && (
						<CircularProgress size={10}/>
					)}
					{isSaving ? "正在保存，请勿关闭页面" : "已保存"}
				</label>
			</div>
			{renderDivider("计时显示相关")}
			<div className="settings-group long">
				<label className="mini-label">
					开启比赛默认创建房间：
				</label>
				<Switch
					size="small"
					checked={autoCreateRoom}
					onChange={(e) => setAutoCreateRoom(e.target.checked)}
				/>
			</div>

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
			<div className="settings-group long">
				<label className="mini-label">
					点击重置默认存储路径：
				</label>
				<Fab sx={{ margin: "0", padding: "15px", gap: "10px" }}size="small" color="error" variant="extended" aria-label="reset" onClick={handleResetPath}>
					<RouteOff/>重置
				</Fab>
			</div>

			{renderDivider("房间设置")}
			<div className="settings-group long">
				<label className="mini-label">
					开启比赛默认创建房间：
				</label>
				<Switch
					size="small"
					checked={autoCreateRoom}
					onChange={(e) => setAutoCreateRoom(e.target.checked)}
				/>
			</div>
		</div>
	);
}