import { useRef } from "react";
import { useTauriDropZone } from "../hooks/useTauriDropZone";
import { DebateStagesSchema, DebateStages } from "../schema";
import { Download } from "lucide-react";
import { readTextFile } from "@tauri-apps/plugin-fs";

interface FileDropProps {
	onDrop: (match: DebateStages) => void;
}

const processFileFromPath = async (filePath: string): Promise<DebateStages> => {
	try {
		const fileContent = await readTextFile(filePath);
		const rawJson = JSON.parse(fileContent);
		return DebateStagesSchema.parse(rawJson);
	} catch (err: any) {
		console.error("Tauri decode file failed: : ", err);
		throw new Error(err.message || "文件读取或校验失败，请检查格式。");
	}
};

export default function FileDropZone({ onDrop }: FileDropProps) {
	const dropRef = useRef<HTMLDivElement>(null!);
	
	const { isDragging, isHovering } = useTauriDropZone(dropRef, async (paths) => {
		const targetPath = paths[0];
		if (!targetPath.endsWith('.json')) {
			alert("请上传 .json 格式的赛制文件！");
			return;
		}
		try {
			const data = await processFileFromPath(targetPath);
			onDrop(data);
		} catch (err: any) {
			alert(`导入失败: ${err.message}`);
		}
	});

	return (
		<div className={`drop-overlay ${isDragging ? "is-dragging" : ""}`}>
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