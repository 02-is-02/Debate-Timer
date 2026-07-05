import { useRef } from "react";
import { useTauriDropZone } from "../hooks/useTauriDropZone";
import { DebateStagesSchema, DebateStages } from "../schema";
import { Download } from "lucide-react";
import { readTextFile } from "@tauri-apps/plugin-fs";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useToast } from "../utils/toasts";

interface FileDropProps {
	isActive: boolean;
	onDrop: (match: DebateStages | DebateStages[]) => void;
}

const forcewindowToFront = async () => {
	const appWindow = getCurrentWindow();
	await appWindow.unminimize();
	await appWindow.show();
	await appWindow.setFocus();
}

const processFileFromPath = async (filePath: string): Promise<DebateStages | DebateStages[]> => {
	try {
		const fileContent = await readTextFile(filePath);
		const rawJson = JSON.parse(fileContent);
		if (Array.isArray(rawJson)) {
			return rawJson.map(item => DebateStagesSchema.parse(item));
		} else {
			return DebateStagesSchema.parse(rawJson);
		}
	} catch (err: any) {
		console.error("Tauri decode file failed: : ", err);
		throw new Error(err.message || "文件读取或校验失败，请检查格式。");
	}
};

export default function FileDropZone({ isActive, onDrop }: FileDropProps) {
	const dropRef = useRef<HTMLDivElement>(null!);
	const { showToast } = useToast();
	
	const { isDragging, isHovering } = useTauriDropZone(dropRef, async (paths) => {
		forcewindowToFront();
		if (!isActive) return;
		const targetPath = paths.filter(path => path.endsWith('.json'));
		if (targetPath.length === 0) {
			showToast("请勿导入JSON格式以外的文件！", "error")
			return;
		};

		try {
			const parsePromises = targetPath.map(path => processFileFromPath(path));
			const results = await Promise.all(parsePromises);
			const data = results.flat();
			onDrop(data);
		} catch (err: any) {
			showToast("导入发生错误", "error");
		}
	});

	if (!isActive) return null;

	return (
		<div className={`overlay ${isDragging ? "is-dragging" : ""}`}>
			<div className={`drop-window ${isDragging ? "active" : ""}`}>
				<h3 style={{ color: "white" }}>导入赛制</h3>
				<div 
					ref={dropRef} 
					className={`drop-area ${isHovering ? "active" : ""}`}
				>
					<Download size={32} strokeWidth={1.5} color="white" />
					<h4 style={{ margin: 0, color: "#f8fafc" }}>{isHovering ? "松开鼠标导入赛制" : "拖拽到此处导入赛制"}</h4>
				</div>
			</div>
		</div>
	);
}