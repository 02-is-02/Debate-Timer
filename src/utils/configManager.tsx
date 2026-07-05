import { writeTextFile, readTextFile, exists } from "@tauri-apps/plugin-fs";
import { save, open as openDialog } from "@tauri-apps/plugin-dialog";
import { join } from "@tauri-apps/api/path";
import { invoke } from "@tauri-apps/api/core";
import { AppSettings } from "../schema";

const CONFIG_FILE_NAME = 'user-match-config.json';
let LOAD_PROMISE: Promise<string> | null = null;

async function getSaveDir() {
	LOAD_PROMISE = (async () => {
		try {
			if (LOAD_PROMISE) {
				return LOAD_PROMISE;
			}

			let saveDirPath = JSON.parse(localStorage.getItem('app_settings') || "{}")?.Other?.saveDir ?? '';

			if (!saveDirPath) {
				const selectedPath = await openDialog({
					directory: true,
					multiple: false,
					title: '未选择默认路径：请选择赛制库的存储文件夹'
				});

				if (!selectedPath) {
					// cancelled
					return null;
				}

				saveDirPath = selectedPath as string;

				await askRustToAllowPath(saveDirPath)

				updateSaveDir(saveDirPath);

				return saveDirPath;
			}

			await askRustToAllowPath(saveDirPath);

			return saveDirPath;
		} catch {
			return null;
		} finally {
			setTimeout(() => {
				LOAD_PROMISE = null;
			}, 100);
		}
	})();

	return LOAD_PROMISE;
};

function updateSaveDir(value: string) {
	try {
		const settings: AppSettings = JSON.parse(localStorage.getItem('app_settings') || "{}");
		const updatedSettings = {...settings, Other: {...settings.Other, saveDir: value}};
		localStorage.setItem('app_settings', JSON.stringify(updatedSettings));
	} catch (e) {
		emitToast("更新存储路径失败", 'error');
		console.log("Update save directory failed: ", e)
	}
};

function emitToast( message: string, severity: 'success' | 'error' | 'warning' | 'info' ) {
	window.dispatchEvent(new CustomEvent('trigger-global-toast', {
		detail: {message, severity}
	}));
}

async function askRustToAllowPath(path: string) {
	try {
		await invoke("allow_custom_path", { path });
		console.log("React: Rust dynamic scope done")
	} catch (error) {
		console.error("React: dynnamic scope assignmennt failed: ", error);
		emitToast("动态授权发生错误", 'error')
	}
}

export async function checkDefaultPath() {
	try {
		let saveDirPath = await getSaveDir();

		if (!saveDirPath) {
			console.warn("saveDirPath is invalid.");
			return false;
		}

		return true;
	} catch (error) {
		console.log("Failed to load config: ", error);
		emitToast("未知错误", 'error');
	}
}

export async function loadConfigFromDisk() {
	try {
		let saveDirPath = await getSaveDir();

		if (!saveDirPath) {
			emitToast("未选择存储路径，无法读取赛制数据！", 'warning');
			return [];
		}

		const fullFilePath = await join(saveDirPath, CONFIG_FILE_NAME);
		const fileExists = await exists(fullFilePath);

		if (!fileExists) return [];

		const jsonStr = await readTextFile(fullFilePath);
		return JSON.parse(jsonStr);
	} catch (error) {
		console.log("Failed to load config: ", error);
		emitToast("加载发生错误", 'error');
	}
}

export async function saveConfigToDisk(newConfig: any[]) {
	try {
		let saveDirPath = await getSaveDir();

		if (!saveDirPath) {
			emitToast("保存失败：未找到有效的存储路径", 'error');
			console.warn("Save cancelled or failed: saveDirPath is invalid.");
			return false;
		}

		const fullFilePath = await join(saveDirPath, CONFIG_FILE_NAME);

		const finalJsonStr = JSON.stringify(newConfig, null, 2);
		await writeTextFile(fullFilePath, finalJsonStr);
	} catch (error) {
		console.log("Failed to save config: ", error);
		emitToast("保存发生错误", 'error');
	}
}

export async function exportConfig(configData: any[]) {
	if (configData.length <= 0 ) return;
	try {
		const defaultFilename = configData.length === 1 
			? `${configData[0].name}.json` 
			: `辩论赛制合集.json`;
		const filePath = await save({
			title: '导出赛制配置',
			defaultPath: defaultFilename,
			filters: [{
				name: 'JSON 配置文件',
				extensions: ['json']
			}]
		});

		if (!filePath) {
			emitToast("导出赛制取消", 'info');
			return;
		}

		const jsonStr = JSON.stringify(configData, null, 2);
		await writeTextFile(filePath, jsonStr);
		emitToast("导出赛制成功", 'success');
	} catch (error) {
		console.log("Failed to export config: ", error);
		emitToast("导出发生错误", 'error');
	}
}

export async function initAppScope() {
	const settings = JSON.parse(localStorage.getItem('app_settings') || '{}');
	
	if (settings.saveDir) {
		await invoke('allow_custom_path', { path: settings.saveDir });
	}
	if (settings.background) {
		await invoke('allow_custom_path', { path: settings.background });
	}
	if (settings.singleRing) {
		await invoke('allow_custom_path', { path: settings.singleRing });
	}
	if (settings.doubleRing) {
		await invoke('allow_custom_path', { path: settings.doubleRing });
	}
}

export function fileToBase64(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.readAsDataURL(file);
		reader.onload = () => resolve(reader.result as string);
		reader.onerror = error => reject(error);
	});
}