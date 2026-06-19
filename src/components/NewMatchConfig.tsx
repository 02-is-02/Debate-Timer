import { Button, TextField, Box, Chip, Stack, isEmpty } from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { DebateStage, DebateStages, DebateStagesSchema } from "../schema";
import React, { useState, useRef } from "react";
import { Image, File as FileIcon } from "lucide-react";
import { useTauriDropZone } from "../hooks/useTauriDropZone";
import { readFile } from "@tauri-apps/plugin-fs";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useToast } from "../utils/Context";
import { fileToBase64 } from "../utils/configManager";
import { invoke } from "@tauri-apps/api/core";

interface newMatchConfigProps {
	isActive: boolean;
	toggleActive: () => void;
	onCreate?: (matchData: DebateStages) => void;
}

const DEFAULT_STAGES: DebateStage[] = [
	{ id: 1, type: "single", title: "正方一辩立论", timeLimit: 180 },
	{ id: 2, type: "single", title: "反方一辩立论", timeLimit: 180 },
	{ id: 3, type: "double", title: "申论", leftTimeLimit: 240, rightTimeLimit: 240},
	{ id: 4, type: "free", title: "自由辩论", leftTimeLimit: 240, rightTimeLimit: 240, start: "left" },
]

const forcewindowToFront = async () => {
	const appWindow = getCurrentWindow();
	await appWindow.unminimize();
	await appWindow.show();
	await appWindow.setFocus();
};

const getMimeType = (path: string) => {
	const ext = path.split('.').pop()?.toLowerCase();
	if (['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext || '')) return `image/${ext === 'jpg' ? 'jpeg' : ext}`;
	if (ext === 'json') return 'application/json';
	if (ext === 'pdf') return 'application/pdf';
	if (ext === 'txt') return 'text/plain';
	return 'application/octet-stream';
};

export default function NewMatchConfig({ isActive, toggleActive, onCreate }: newMatchConfigProps) {
	const [attachments, setAttachments] = useState<File[]>([]);
	const [name, setName] = useState("");
	const [text, setText] = useState("");
	const [isRequesting, setIsRequesting] = useState(false);
	
	const { showToast } = useToast();
	const dropRef = useRef<HTMLDivElement>(null!);

	const handleGenerate = async () => {
		const newId = `M-${crypto.randomUUID()}`;
		const savedApiKey = localStorage.getItem('gemini_api_key') || '';
		const savedModel = localStorage.getItem('gemini_model') || 'gemini-1.5-flash';
		const apiNeeded = !isEmpty(text.trim()) || attachments.length > 0;
		console.log("API needed:", apiNeeded, "Saved API Key:", !!savedApiKey, "Prompt text:", text.trim(), "Attachments:", attachments);

		if (!savedApiKey && apiNeeded) {
			showToast("请先在设置中填写 Gemini API Key！", "error");
			return;
		}

		if (!apiNeeded) {
			const defaultMatchData: DebateStages = {
				id: newId,
				name: name.trim() || "未命名赛制",
				stages: DEFAULT_STAGES
			}

			if (onCreate) onCreate(defaultMatchData);
			toggleActive();
			showToast("已生成默认赛制", 'success');

			return;
		}

		setIsRequesting(true);

		try {
			const processedFiles = await Promise.all(
				attachments.map(async (file) => ({
					fileName: file.name,
					mimeType: file.type || 'application/octet-stream',
					fileData: (await fileToBase64(file)).split(',')[1]
				}))
			);

			const payload = {
				id: newId,
				matchName: name.trim() ? name.trim() : null,
				promptText: text.trim(),
				attachments: processedFiles,
				apiKey: savedApiKey,
				model: savedModel
			};

			const data = await invoke("generate_stage", { payload });
			const newStage = DebateStagesSchema.parse(data);

			if (onCreate) onCreate(newStage);
			handleClose();
			showToast("赛制生成成功！", "success");
		} catch (error: any) {
			console.error("Generate failed:", error);
			showToast(`${error}`, "error");
		} finally {
			setIsRequesting(false);
		}
	} 

	const { isHovering } = useTauriDropZone(dropRef, async (paths) => {
		if (!isActive) return;
		forcewindowToFront();
		try {
			const newFiles: File[] = [];
			for (const path of paths) {
				const uint8Array = await readFile(path);
				const fileName = path.split(/[/\\]/).pop() || 'unknown';
				const mimeType = getMimeType(path);
				const file = new File([uint8Array], fileName, { type: mimeType });
				newFiles.push(file);
			}
			setAttachments((prev) => [...prev, ...newFiles]);
		} catch (err: any) {
			console.error("读取文件失败", err);
			showToast("导入发生错误", "error");
		}
	});

	const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
		const items = e.clipboardData.items;
		for (let i = 0; i < items.length; i++) {
			if (items[i].kind === "file") {
				const file = items[i].getAsFile();
				if (file) {
					e.preventDefault();
					setAttachments((prev) => [...prev, file]);
				}
			}
		}
	};

	const handleDelete = (deletingIndex: number) => {
		setAttachments((prev) => prev.filter((_, index) => index !== deletingIndex));
		console.log(attachments);
	};

	const truncateFileName = (fileName: string, maxLen = 15) => {
		if (fileName.length <= maxLen) return fileName;
		const dotIndex = fileName.lastIndexOf(".");
		if (dotIndex !== -1 && fileName.length - dotIndex <= 5) {
			const ext = fileName.substring(dotIndex);
			return fileName.substring(0, maxLen - ext.length) + "..." + ext;
		}
		return fileName.substring(0, maxLen) + "...";
	};

	const handleClose = () => {
		setName("");
		setText("");
		setAttachments([]);
		toggleActive();
	}

	return (
		<div className={`overlay config ${isActive ? "active" : ""}`}>
			<div className={`config-window ${isActive ? "active" : ""}`} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
				<h2 style={{ fontSize: "2rem", margin: "0", color: "white", flexShrink: 0 }}>新建赛制</h2>
				
				<TextField 
					label="赛制名称"
					placeholder="填写赛事名称"
					value={name}
					onChange={(e) => setName(e.target.value)}
					variant="filled"
					fullWidth
				/>

				<Box 
					ref={dropRef}
					onPaste={handlePaste}
					className="hide-scrollbar"
					sx={{
						backgroundColor: isHovering ? "rgba(59, 130, 246, 0.12)" : "rgba(255, 255, 255, 0.09)",
						borderRadius: "4px 4px 0 0",
						transition: "background-color 200ms cubic-bezier(0.0, 0, 0.2, 1) 0ms",
						
						"&:hover": {
							backgroundColor: isHovering ? "rgba(59, 130, 246, 0.16)" : "rgba(255, 255, 255, 0.13)",
							"& .MuiFilledInput-root::before": {
								borderBottomColor: "rgba(255, 255, 255, 0.87) !important", 
							}
						},
						"&:focus-within": {
							backgroundColor: "rgba(255, 255, 255, 0.09)",
						},
						
						display: "flex",
						flexDirection: "column",
						flexGrow: 1,
						position: "relative",
						overflow: "hidden"
					}}
				>
					{attachments.length > 0 && (
						<Stack 
							direction="row" 
							spacing={1} 
							useFlexGap 
							className="hide-scrollbar" 
							sx={{ 
								flexWrap: "nowrap",
								overflowX: "auto",
								
								pt: "12px",
								px: "12px",
								pb: "4px",

								"& .MuiChip-root": { flexShrink: 0 } 
							}}
						>
							{attachments.map((file, index) => {
								const isImage = file.type.startsWith("image/");
								return (
									<Chip
										key={`${file.name}-${index}`}
										icon={isImage ? <Image size={16} /> : <FileIcon size={16} />}
										label={truncateFileName(file.name)}
										onDelete={() => handleDelete(index)}
										size="small" 
										variant="outlined"
										onClick={(e) => e.stopPropagation()}
										sx={{ borderColor: "rgba(255,255,255,0.3)", color: "white" }}
									/>
								);
							})}
						</Stack>
					)}

					<TextField 
						label="提示词"
						placeholder="在此输入AI提示词，若为空则以基础模板生成新赛制&#10;可粘贴/拖入赛事名称、赛制文件、赛制照片、文件链接等&#10;注：大语言模型可能出现幻觉，请注意检查，输入赛制文件或照片为佳"
						value={text}
						onChange={(e) => setText(e.target.value)}
						variant="filled"
						multiline
						fullWidth
						sx={{
							flexGrow: 1, 
							display: "flex",
							flexDirection: "column",

							"& .MuiFilledInput-root": {
								backgroundColor: "transparent",
								
								flexGrow: 1, 
								alignItems: "flex-start", 

								"&:hover": { backgroundColor: "transparent" },
								"&.Mui-focused": { backgroundColor: "transparent" }
							}
						}}
					/>
				</Box>

				<div
					style={{
						display: "flex",
						flexDirection: "row",
						gap: "12px",
						justifyContent: "right",
						marginTop: "auto",
						paddingTop: "8px"
					}}
				>
					<Button 
						onClick={() => handleClose()} 
						sx={{ color: '#94a3b8', border: "1px solid rgba(255,255,255,0.2)" }}
					>
						取消
					</Button>
					<LoadingButton
						onClick={() => handleGenerate()}
						loading={isRequesting}
						variant="contained" 
						sx={{ 
							backgroundColor: 'var(--std-blue, #3b82f6)', 
							'&:hover': { backgroundColor: 'var(--sky-blue, #60a5fa)'}, 
							color: 'white', 
							fontWeight: 'bold',
							boxShadow: "none",
							gap: "5px"
						}}
					>
						开始生成
					</LoadingButton>
				</div>
			</div>
		</div>
	);
}