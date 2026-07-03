import { useEffect, useRef, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { TextField, MenuItem, Select, Fab, Switch, CircularProgress, Button, Divider } from '@mui/material';
import { useToast } from '../utils/Context';
import { RouteOff, Trash2, Upload } from 'lucide-react';

const DEFAULT_SETTINGS = {
	apiKey: '',
	model: 'gemini-2.5-flash',
	autoCreateRoom: false,
	saveDir: '',
	background: '',
	singleRing: '',
	doubleRing: '',
	ticking: '',
	font: ''
}

export default function Settings() {
	const { showToast } = useToast();

	const [isSaving, setIsSaving] = useState(false);
	const [fontList, setFontList] = useState<string[]>([]);
	
	const typingTimeRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const [settings, setSettings] = useState(() => {
		try {
			const saved = localStorage.getItem('app_settings');
			return saved ? {...DEFAULT_SETTINGS, ...JSON.parse(saved)} : DEFAULT_SETTINGS;
		} catch {
			showToast("读取自定义设置失败，应用默认设置", "error");
			return DEFAULT_SETTINGS;
		}
	});

	const updateSetting = (key: keyof typeof DEFAULT_SETTINGS, value: any) => {
		setIsSaving(true);
		setSettings((prev: typeof DEFAULT_SETTINGS) => ({ ...prev, [key]: value }));
	};

	const saveImported = async (mimeType: string, settingKey: keyof typeof DEFAULT_SETTINGS) => {
		try {
			const selectedPath = await open({
				multiple: false,
				filters: [{ name: "自定义导入", extensions: mimeType.split(',') }]
			});

			if (!selectedPath) return;

			const savedNewPath = await invoke<string>('save_imported_file', {
				sourcePath: selectedPath
			});

			if (savedNewPath) {
				await invoke('allow_custom_path', { path: savedNewPath });
				updateSetting(settingKey, savedNewPath);
				
				showToast("导入成功", "success");
				console.log("File saved to: ", savedNewPath);
			}
		} catch (e) {
			showToast("文件导入失败", "error")
			console.error("File import Failed: ", e);
		}
	};

	useEffect(() => {
		const fetchFonts = async () => {
			try {
				const fonts = await invoke<string[]>('get_system_fonts');
				setFontList(fonts);
			} catch (e) {
				console.log("Get font failed: ", e)
			}
		};
		fetchFonts();
	}, [])

	useEffect(() => {
		const performSave = () => {
			localStorage.setItem('app_settings', JSON.stringify(settings));
			setIsSaving(false);
			console.log("Settings saved");
			window.dispatchEvent(new Event('app_settings_updated'));
		};

		if (typingTimeRef.current) clearTimeout(typingTimeRef.current);
		
		typingTimeRef.current = setTimeout(performSave, 1500);
		window.addEventListener('beforeunload', performSave);

		return () => {
			if (typingTimeRef.current) clearTimeout(typingTimeRef.current);
			window.removeEventListener('beforeunload', performSave);
			performSave();
		};
	}, [settings]);

	const handleResetPath = () => {
		setSettings((prev: typeof DEFAULT_SETTINGS) => ({ ...prev, 'saveDir': '' }));
		showToast("存储路径已重置", "success");
	};

	const renderDivider = ( title: string) => {
		return (
			<Divider
				sx={{ margin: "20px 0 0 0" }}
			>
				<h3 style={{ color: "white", margin: "0 0 0 1vw" }}>
					{title}
				</h3>
			</Divider>
		)
	};

	return (
		<div style={{ flex: 1 }} className="settings-container hide-scrollbar">
			<div style={{ alignItems: "baseline" }} className="settings-group long">
				<h1 style={{ margin: 0, color: "white" }}>
					设置
				</h1>
				<label className="mini-label">
					{isSaving && (
						<CircularProgress size={10}/>
					)}
					{isSaving ? "正在保存，请勿关闭页面" : "已保存"}
				</label>
			</div>
			<div className="hide-scrollbar" style={{ overflowY: "auto" }}>
				{renderDivider("计时显示相关")}
				<div className="settings-group complex">
					<label className="mini-label">
						背景图片
					</label>
					<div className="settings-group long" style={{ padding: 0 }}>
						<TextField
							size="small"
							aria-readonly
							sx={{ pointerEvents: "none", width: "50%" }}
							value={settings.background ? settings.background : "默认"}
							variant="standard"
						/>
						<div style={{ display: "flex", gap: "15px" }}>
							<Fab sx={{ margin: "0", padding: "15px", gap: "10px" }} size="small" color="primary" variant="extended" aria-label="reset" onClick={() => saveImported('png,jpg,jpeg', 'background')}>
								<Upload />导入
							</Fab>
							<Fab sx={{ margin: "0", padding: "15px", gap: "10px" }} disabled={!settings.background} size="small" color="error" variant="extended" aria-label="reset" onClick={() => updateSetting('background', '')}>
								<Trash2 />清除
							</Fab>
						</div>
					</div>
				</div>
				<div className="settings-group complex">
					<label className="mini-label">
						五秒倒计时提示音：
					</label>
					<div className="settings-group long" style={{ padding: 0 }}>
						<TextField
							size="small"
							aria-readonly
							sx={{ pointerEvents: "none", width: "50%" }}
							value={settings.ticking ? settings.ticking : "默认"}
							variant="standard"
						/>
						<div style={{ display: "flex", gap: "15px" }}>
							<Fab sx={{ margin: "0", padding: "15px", gap: "10px" }} size="small" color="primary" variant="extended" aria-label="reset" onClick={() => saveImported('mp3,wav,m4a', 'ticking')}>
								<Upload />导入
							</Fab>
							<Fab sx={{ margin: "0", padding: "15px", gap: "10px" }} disabled={!settings.ticking} size="small" color="error" variant="extended" aria-label="reset" onClick={() => updateSetting('ticking', '')}>
								<Trash2 />清除
							</Fab>
						</div>
					</div>
				</div>
				<div className="settings-group complex">
					<label className="mini-label">
						第一声铃响提示音：
					</label>
					<div className="settings-group long" style={{ padding: 0 }}>
						<TextField
							size="small"
							aria-readonly
							sx={{ pointerEvents: "none", width: "50%" }}
							value={settings.singleRing ? settings.singleRing : "默认"}
							variant="standard"
						/>
						<div style={{ display: "flex", gap: "15px" }}>
							<Fab sx={{ margin: "0", padding: "15px", gap: "10px" }} size="small" color="primary" variant="extended" aria-label="reset" onClick={() => saveImported('mp3,wav,m4a', 'singleRing')}>
								<Upload />导入
							</Fab>
							<Fab sx={{ margin: "0", padding: "15px", gap: "10px" }} disabled={!settings.singleRing} size="small" color="error" variant="extended" aria-label="reset" onClick={() => updateSetting('singleRing', '')}>
								<Trash2 />清除
							</Fab>
						</div>
					</div>
				</div>
				<div className="settings-group complex">
					<label className="mini-label">
						第二声铃响提示音：
					</label>
					<div className="settings-group long" style={{ padding: 0 }}>
						<TextField
							size="small"
							aria-readonly
							sx={{ pointerEvents: "none", width: "50%" }}
							value={settings.doubleRing ? settings.doubleRing : "默认"}
							variant="standard"
						/>
						<div style={{ display: "flex", gap: "15px" }}>
							<Fab sx={{ margin: "0", padding: "15px", gap: "10px" }} size="small" color="primary" variant="extended" aria-label="reset" onClick={() => saveImported('mp3,wav,m4a', 'doubleRing')}>
								<Upload />导入
							</Fab>
							<Fab sx={{ margin: "0", padding: "15px", gap: "10px" }} disabled={!settings.doubleRing} size="small" color="error" variant="extended" aria-label="reset" onClick={() => updateSetting('doubleRing', '')}>
								<Trash2 />清除
							</Fab>
						</div>
					</div>
				</div>
				<div className="settings-group">
					<label className="mini-label">
						计时器辩题，标题及队名字体(空则使用默认字体)：
					</label>
					<Select 
						size="small"
						value={settings.font}
						variant="standard"
						displayEmpty
						style={{ fontFamily: settings.font, minWidth: '200px' }}
						onChange={(e) => updateSetting('font', e.target.value)}
					>
						<MenuItem value="">
							默认
						</MenuItem>
						{fontList.map(font => (
							<MenuItem
								key={font}
								value={font}
								style={{ fontFamily: font }}
							>
								{font}
							</MenuItem>
						))}
					</Select>
				</div>

				{renderDivider("AI生成相关")}
				<div className="settings-group">
					<label className="mini-label">
						Gemini API Key （可从 Google AI Studio 获取）：
					</label>
					<TextField
						size="small"
						type="password"
						value={settings.apiKey}
						variant="standard"
						onChange={(e) => updateSetting('apiKey', e.target.value)}
						placeholder="AIzaSy..."
					/>
				</div>
				
				<div className="settings-group">
					<label className="mini-label">
						生成赛制使用的模型：
					</label>
					<Select 
						size="small"
						value={settings.model}
						variant="standard"
						onChange={(e) => updateSetting('model', e.target.value)}
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
					<Fab sx={{ margin: "0", padding: "15px", gap: "10px" }} size="small" color="error" variant="extended" aria-label="reset" onClick={handleResetPath}>
						<RouteOff />重置
					</Fab>
				</div>

				{renderDivider("房间设置")}
				<div className="settings-group long">
					<label className="mini-label">
						开启比赛默认创建房间：
					</label>
					<Switch
						size="small"
						checked={settings.autoCreateRoom}
						onChange={(e) => updateSetting('autoCreateRoom', e.target.checked)}
					/>
				</div>
			</div>
		</div>
	);
}