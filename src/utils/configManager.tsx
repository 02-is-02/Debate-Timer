import { writeTextFile, readTextFile, exists } from "@tauri-apps/plugin-fs";
import { save, open as openDialog } from "@tauri-apps/plugin-dialog";
import { join } from "@tauri-apps/api/path";
import { invoke } from "@tauri-apps/api/core";

const CONFIG_FILE_NAME = 'user-match-config.json';
const PATH_STORAGE_KEY = 'debate_timer_save_dir';

async function askRustToAllowPath(path: string) {
	try {
		await invoke("allow_custom_path", { path });
		console.log("React: Rust dynamic scope done")
	} catch (error) {
		console.error("React: dynnamic scope assignmennt failed: ", error);
		alert(`动态授权发生错误，请将此弹窗截图发送给维护人员:\n${error}`)
	}
}

export async function loadConfigFromDisk() {
	try {
		const saveDirPath = localStorage.getItem(PATH_STORAGE_KEY);

		if (!saveDirPath) return [];

		const fullFilePath = await join(saveDirPath, CONFIG_FILE_NAME);
		const fileExists = await exists(fullFilePath);

		if (!fileExists) return [];

		const jsonStr = await readTextFile(fullFilePath);
		return JSON.parse(jsonStr);
	} catch (error) {
		console.log("Failed to load config: ", error);
		alert(`加载发生错误，请将此弹窗截图发送给维护人员: \n${error}`);
	}
}

export async function saveConfigToDisk(newConfig: any) {
	try {
		let saveDirPath = localStorage.getItem(PATH_STORAGE_KEY);

		if (!saveDirPath) {
			const selectedPath = await openDialog({
				directory: true,
				multiple: false,
				title: '第一次保存：请选择赛制库的存储文件夹'
			});

			if (!selectedPath) {
				// cancelled
				return;
			}

			saveDirPath = selectedPath as string;

			await askRustToAllowPath(saveDirPath)

			localStorage.setItem(PATH_STORAGE_KEY, saveDirPath);
		}

		const fullFilePath = await join(saveDirPath, CONFIG_FILE_NAME);

		let currList = [];
		const hasOldFile = await exists(fullFilePath);

		if (hasOldFile) {
			const oldJsonStr = await readTextFile(fullFilePath);
			currList = JSON.parse(oldJsonStr);
			if (!Array.isArray(currList)) currList = [];
		}

		const existingIndex = currList.findIndex((item: any) => item.id === newConfig.id);
		if (existingIndex >= 0) {
			currList[existingIndex] = newConfig;
		} else {
			currList.push(newConfig);
		}

		const finalJsonStr = JSON.stringify(currList, null, 2);
		await writeTextFile(fullFilePath, finalJsonStr);
	} catch (error) {
		console.log("Failed to save config: ", error);
		alert(`保存发生错误，请将此弹窗截图发送给维护人员: \n${error}`);
	}
}

export async function deleteConfigFromDisk(targetId: string) {
	try {
		let saveDirPath = localStorage.getItem(PATH_STORAGE_KEY);
		if (!saveDirPath) return;

		let currList = await loadConfigFromDisk();
		if (!Array.isArray(currList)) currList = [];
		currList = currList.filter((item: any) => item.id !== targetId);

		const jsonStr = JSON.stringify(currList, null, 2);
		const fullFilePath = await join(saveDirPath, CONFIG_FILE_NAME);
		await writeTextFile(fullFilePath, jsonStr);
	} catch (error) {
		console.log("Failed to delete config: ", error);
		alert(`删除发生错误，请将此弹窗截图发送给维护人员: \n${error}`);
	}
}

export async function exportConfig(configData: any) {
	try {
		const filePath = await save({
			title: '导出赛制配置',
			defaultPath: '自定义赛制.json',
			filters: [{
				name: 'JSON 配置文件',
				extensions: ['json']
			}]
		});

		if (!filePath) {
			// cancelled
			return;
		}

		const jsonStr = JSON.stringify(configData, null, 2);
		await writeTextFile(filePath, jsonStr);
	} catch (error) {
		console.log("Failed to export config: ", error);
		alert(`导出发生错误，请将此弹窗截图发送给维护人员: \n${error}`);
	}
}

export async function resetSaveLocation() {
	localStorage.removeItem(PATH_STORAGE_KEY);
	alert("已清除默认存储位置。下次保存将重新询问！");
}

export async function initAppScope() {
    const savedDirPath = localStorage.getItem(PATH_STORAGE_KEY);
    if (savedDirPath) {
        console.log("检测到历史存储路径，正在自动重新向 Rust 申请 Scope 授权...");
        await askRustToAllowPath(savedDirPath);
    }
}