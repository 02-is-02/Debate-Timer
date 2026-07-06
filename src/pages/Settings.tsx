import { useEffect, useRef, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { TextField, MenuItem, Select, Fab, Switch, CircularProgress, Divider, IconButton } from '@mui/material';
import { useToast } from '../utils/toasts';
import { RouteOff, Trash2, Upload } from 'lucide-react';
import { HexAlphaColorPicker } from 'react-colorful';
import { AppSettings, AppSettingsSchema } from '../schema';
import HotkeyRecorder from '../components/HotkeyRecorder';

const DEFAULT_SETTINGS: AppSettings = AppSettingsSchema.parse({})
type SettingsCategory = keyof typeof DEFAULT_SETTINGS;

export default function Settings() {
	const { showToast } = useToast();

	const [isSaving, setIsSaving] = useState(false);
	const [fontList, setFontList] = useState<string[]>([]);
	const [assetList, setAssetList] = useState<string[]>([]);
	const [activeRecorderKey, setActiveRecorderKey] = useState<string | null>(null);

	const [settings, setSettings] = useState<AppSettings>(() => {
		try {
			const rawStr = localStorage.getItem("app_settings");
			if (!rawStr) return DEFAULT_SETTINGS;
			
			const parseResult = AppSettingsSchema.safeParse(JSON.parse(rawStr));
			
			if (parseResult.success) {
				return parseResult.data;
			} else {
				console.warn("读取的设置字段有误，已自动用默认值覆盖错误字段:", parseResult.error);
				return DEFAULT_SETTINGS;
			}
		} catch {
			return DEFAULT_SETTINGS;
		}
	});

	const typingTimeRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const latestSettingsRef = useRef(settings);
	const isSavingRef = useRef(isSaving);

	const updateSetting = <C extends SettingsCategory, K extends keyof (typeof DEFAULT_SETTINGS)[C]>(
		category: C,
		key: K,
		value: typeof DEFAULT_SETTINGS[C][K]
	) => {
		setIsSaving(true);
		setSettings((prev) => {
			const currCategoryState = prev?.[category] ?? DEFAULT_SETTINGS[category];
			return {
				...prev,
				[category]: {
					...currCategoryState,
					[key]: value
				}
			};
		});
	};

	const updateShortcutKey = (key: keyof AppSettings['HotKeys'], value: string) => {
		if (!value || value.trim() === "") {
			updateSetting('HotKeys', key, "");
			setActiveRecorderKey(null);
			return;
		}
		
		const config: { key: keyof AppSettings["HotKeys"] }[] = [
			{ key: "startSwapPause" },
			{ key: "startLeft" },
			{ key: "startRight" },
			{ key: "prev" },
			{ key: "next" },
			{ key: "fullscreen" },
			{ key: "miniWindow" },
			{ key: "exit" }
		];

		const repeats = config.find(item => {
			if (item.key === key) return false;
			return value === settings.HotKeys[item.key];
		});

		console.log(value)

		if (repeats) {
			showToast("快捷键重叠，请尝试其他按键", "error");
			updateSetting('HotKeys', key, '');
			return;
		}
		updateSetting('HotKeys', key, value);
		setActiveRecorderKey(null);
	}

	const saveImported = async (mimeType: string, settingKey: keyof (typeof DEFAULT_SETTINGS)['Timer']) => {
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
				setAssetList(prev => prev.includes(savedNewPath) ? prev : [...prev, savedNewPath]);
				updateSetting('Timer', settingKey, savedNewPath);

				showToast("导入成功", "success");
				console.log("File saved to: ", savedNewPath);
			}
		} catch (e) {
			showToast("文件导入失败", "error")
			console.error("File import Failed: ", e);
		}
	};

	const handleDeleteAsset = async (fileName: string) => {
		try {
			await invoke('del_imported_asset', { fileName });
			setAssetList(prev => prev.filter(item => item !== fileName));
			
			const currTimer = settings?.Timer || DEFAULT_SETTINGS.Timer;
			let hasChange = false;

			const updatedTimer = {...currTimer}
			if (currTimer.background === fileName) { updatedTimer.background = ''; hasChange = true; }
			if (currTimer.ticking === fileName) { updatedTimer.ticking = ''; hasChange = true; }
			if (currTimer.singleRing === fileName) { updatedTimer.singleRing = ''; hasChange = true; }
			if (currTimer.doubleRing === fileName) { updatedTimer.doubleRing = ''; hasChange = true; }

			if (hasChange) {
				setIsSaving(true);
				setSettings(prev => ({ 
					...prev,
					Timer: {
						...prev.Timer,
						...updatedTimer
					}
				}));
			}

			showToast("本地物理副本已删除", "success");
		} catch (err) {
			showToast("删除物理文件失败", "error");
			console.error(err);
		}
	}

	const handleResetPath = () => {
		const nextSettings = { ...settings, 'saveDir': '' };
		
		setSettings(nextSettings);
		setIsSaving(false);

		if (typingTimeRef.current) {
			clearTimeout(typingTimeRef.current);
		}

		localStorage.setItem('app_settings', JSON.stringify(nextSettings));
		window.dispatchEvent(new Event('app_settings_updated'));
		console.log("Settings immediately reset and saved");
		
		showToast("存储路径已重置", "success");
	};

	useEffect(() => {
		const fetchInitData = async () => {
			try {
				const fonts = await invoke<string[]>('get_system_fonts');
				setFontList(fonts);
			} catch (e) {
				console.log("Get font failed: ", e)
			}

			try {
				const assets = await invoke<string[]>('get_imported_assets');
				setAssetList(assets);
			} catch (e) {
				console.log("Get assets failed: ", e)
			}
		}

		fetchInitData();
	}, [])

	useEffect(() => {
		const handleForceSave = () => {
			if (isSavingRef.current) {
				localStorage.setItem('app_settings', JSON.stringify(latestSettingsRef.current));
				window.dispatchEvent(new Event('app_settings_updated'));
			}
		};

		window.addEventListener('beforeunload', handleForceSave);

		return () => {
			window.removeEventListener('beforeunload', handleForceSave);
			handleForceSave(); 
		};
	}, []);

	useEffect(() => {
		latestSettingsRef.current = settings;
		isSavingRef.current = isSaving;
	}, [settings, isSaving]);

	useEffect(() => {
		const performSave = () => {
			localStorage.setItem('app_settings', JSON.stringify(settings));
			setIsSaving(false);
			console.log("Settings saved");
			window.dispatchEvent(new Event('app_settings_updated'));
		};

		if (typingTimeRef.current) clearTimeout(typingTimeRef.current);
		
		typingTimeRef.current = setTimeout(performSave, 1500);

		return () => {
			if (typingTimeRef.current) clearTimeout(typingTimeRef.current);
		};
	}, [settings]);

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

	const renderAssetSelector = (
		label: string,
		settingKey: 'background' | 'ticking' | 'singleRing' | 'doubleRing',
		fileTypes: string
	) => {
		const exts = fileTypes.split(',');
		const filteredList = assetList.filter(item => {
			const ext = item.split('.').pop()?.toLowerCase() || '';
			return exts.includes(ext);
		});

		return (
			<div className="settings-group complex">
				<label className="mini-label">{label}</label>
				<div className="settings-group long" style={{ padding: 0 }}>
					<Select
						size="small"
						value={settings?.Timer?.[settingKey] || ''}
						variant="standard"
						displayEmpty
						onChange={(e) => updateSetting('Timer', settingKey, e.target.value)}
						sx={{ width: "50%" }}
						renderValue={(selected) => selected ? selected : "默认 (内置)"}
					>
						<MenuItem value="">
							<em>默认 (内置)</em>
						</MenuItem>
						{filteredList.map((fileName) => (
							<MenuItem
								key={fileName}
								value={fileName}
								sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
							>
								<span style={{ overflow: 'hidden', textOverflow: 'ellipsis', marginRight: '10px' }}>
									{fileName}
								</span>
								<IconButton
									size="small"
									color="error"
									onMouseDown={(e) => e.stopPropagation()}
									onClick={(e) => {e.stopPropagation(); handleDeleteAsset(fileName);}}
								>
									<Trash2 size={16} />
								</IconButton>
							</MenuItem>
						))}
					</Select>
					<Fab 
						sx={{ margin: "0", padding: "15px", gap: "10px" }} 
						size="small" 
						color="primary" 
						variant="extended" 
						onClick={() => saveImported(fileTypes, settingKey)}
					>
						<Upload />导入新文件
					</Fab>
				</div>
			</div>
		);
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
				
				{renderAssetSelector("背景图片", "background", "png,jpg,jpeg")}
				{renderAssetSelector("五秒倒计时提示音", "ticking", "mp3,wav,m4a")}
				{renderAssetSelector("第一声铃响提示音", "singleRing", "mp3,wav,m4a")}
				{renderAssetSelector("第二声铃响提示音", "doubleRing", "mp3,wav,m4a")}

				<div className="settings-group">
					<label className="mini-label">
						计时器辩题，标题及队名字体：
					</label>
					<Select 
						size="small"
						value={settings.Timer.font}
						variant="standard"
						displayEmpty
						style={{ fontFamily: settings.Timer.font, minWidth: '200px' }}
						onChange={(e) => updateSetting('Timer', 'font', e.target.value)}
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
				<div className="settings-group">
					<label className="mini-label">
						计时器时间字体（默认根据标题字体）：
					</label>
					<Select 
						size="small"
						value={settings.Timer.timerFont}
						variant="standard"
						displayEmpty
						style={{ fontFamily: settings.Timer.timerFont, minWidth: '200px' }}
						onChange={(e) => updateSetting('Timer', 'timerFont', e.target.value)}
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
				<div className="settings-group">
					<label className="mini-label">
						计时页面字体颜色：
					</label>
					<HexAlphaColorPicker
						style={{ padding: "10px" }}
						color={typeof settings.Timer.fontColor === "string" ? settings.Timer.fontColor : "#ffffffff"}
						onChangeEnd={(c) => updateSetting('Timer', 'fontColor', c)}
					/>
				</div>
				<div className="settings-group">
					<label className="mini-label">
						计时页面时间字体五秒倒计时颜色：
					</label>
					<HexAlphaColorPicker
						style={{ padding: "10px" }}
						color={typeof settings.Timer.timerEndingColor === "string" ? settings.Timer.timerEndingColor : "#ff0000ff"}
						onChangeEnd={(c) => updateSetting('Timer', 'timerEndingColor', c)}
					/>
				</div>

				{renderDivider("计时器快捷键")}
				<div className="settings-group long">
					<label className="mini-label">
						局内显示快捷键列表：
					</label>
					<Switch
						size="small"
						checked={settings.HotKeys.isDisplaying}
						onChange={(e) => updateSetting('HotKeys', 'isDisplaying', e.target.checked)}
					/>
				</div>

				<HotkeyRecorder
					isRecording={activeRecorderKey === "startPauseSwap"}
					label='开始/暂停（单计时器时），开始/切换（多计时器时）'
					value={settings.HotKeys.startSwapPause}
					onClick={() => setActiveRecorderKey("startPauseSwap")}
					onChange={(newShortcut) => updateShortcutKey('startSwapPause', newShortcut)}
					onStop={() => setActiveRecorderKey(null)}
				/>
				<HotkeyRecorder
					isRecording={activeRecorderKey === "startLeft"}
					label='开始（单计时器时），开始左边计时器（双计时器时）'
					value={settings.HotKeys.startLeft}
					onClick={() => setActiveRecorderKey("startLeft")}
					onChange={(newShortcut) => updateShortcutKey('startLeft', newShortcut)}
					onStop={() => setActiveRecorderKey(null)}
				/>
				<HotkeyRecorder
					isRecording={activeRecorderKey === "startRight"}
					label='开始右边计时器（双计时器时）'
					value={settings.HotKeys.startRight}
					onClick={() => setActiveRecorderKey("startRight")}
					onChange={(newShortcut) => updateShortcutKey('startRight', newShortcut)}
					onStop={() => setActiveRecorderKey(null)}
				/>
				<HotkeyRecorder
					isRecording={activeRecorderKey === "prev"}
					label='上一页'
					value={settings.HotKeys.prev}
					onClick={() => setActiveRecorderKey("prev")}
					onChange={(newShortcut) => updateShortcutKey('prev', newShortcut)}
					onStop={() => setActiveRecorderKey(null)}
				/>
				<HotkeyRecorder
					isRecording={activeRecorderKey === "next"}
					label='下一页'
					value={settings.HotKeys.next}
					onClick={() => setActiveRecorderKey("next")}
					onChange={(newShortcut) => updateShortcutKey('next', newShortcut)}
					onStop={() => setActiveRecorderKey(null)}
				/>
				<HotkeyRecorder
					isRecording={activeRecorderKey === "fullscreen"}
					label='切换全屏'
					value={settings.HotKeys.fullscreen}
					onClick={() => setActiveRecorderKey("fullscreen")}
					onChange={(newShortcut) => updateShortcutKey('fullscreen', newShortcut)}
					onStop={() => setActiveRecorderKey(null)}
				/>
				<HotkeyRecorder
					isRecording={activeRecorderKey === "miniWindow"}
					label='切换小窗'
					value={settings.HotKeys.miniWindow}
					onClick={() => setActiveRecorderKey("miniWindow")}
					onChange={(newShortcut) => updateShortcutKey('miniWindow', newShortcut)}
					onStop={() => setActiveRecorderKey(null)}
				/>
				<HotkeyRecorder
					isRecording={activeRecorderKey === "exit"}
					label='退出'
					value={settings.HotKeys.exit}
					onClick={() => setActiveRecorderKey("exit")}
					onChange={(newShortcut) => updateShortcutKey('exit', newShortcut)}
					onStop={() => setActiveRecorderKey(null)}
				/>

				{renderDivider("AI生成相关")}
				<div className="settings-group">
					<label className="mini-label">
						Gemini API Key （可从 Google AI Studio 获取）：
					</label>
					<TextField
						size="small"
						type="password"
						value={settings.Other.apiKey}
						variant="standard"
						onChange={(e) => updateSetting('Other', 'apiKey', e.target.value)}
						placeholder="AIzaSy..."
					/>
				</div>
				
				<div className="settings-group">
					<label className="mini-label">
						生成赛制使用的模型：
					</label>
					<Select 
						size="small"
						value={settings.Other.model}
						variant="standard"
						onChange={(e) => updateSetting('Other', 'model', e.target.value)}
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
						checked={settings.Other.autoCreateRoom}
						onChange={(e) => updateSetting('Other', 'autoCreateRoom', e.target.checked)}
					/>
				</div>
			</div>
		</div>
	);
}