import { useEffect, useState } from 'react';
import { Fab, TextField } from '@mui/material';
import { PenLine, Square } from 'lucide-react';
import { formatShortCut } from '../utils/formatShortCuts';

interface HotkeyRecorderProps {
	isRecording: boolean;
	label: string;
	value: string;
	onClick: () => void;
	onChange: (newShortcut: string) => void;
	onStop: () => void;
	renderFriendlyName?: (keyStr: string) => string;
}

export default function HotkeyRecorder({
	isRecording,
	label,
	value,
	onClick,
	onChange,
	onStop,
	renderFriendlyName = (v) => v.replace("Key", "").replace("Digit", "")
}: HotkeyRecorderProps) {
	useEffect(() => {
		if (!isRecording) return;

		const handleGlobalKeyDown = (e: KeyboardEvent) => {
			e.preventDefault();
			e.stopPropagation();

			if (e.code === 'Escape' && !e.ctrlKey && !e.shiftKey && !e.altKey) {
				onStop();
				return;
			}

			if (e.code === 'Backspace' || e.code === 'Delete') {
				onChange('');
				onStop();
				return;
			}

			const val = formatShortCut(e);
			if (val) {
				onChange(val);
				onStop();
			}
		};

		window.addEventListener('keydown', handleGlobalKeyDown);
		return () => window.removeEventListener('keydown', handleGlobalKeyDown);
	}, [isRecording, onChange]);

	return (
		<div className="settings-group complex">
			<label className="mini-label">
				{label}：
			</label>
			<div className="settings-group long" style={{ padding: 0 }}>
				<TextField
					size="small"
					variant="standard"
					aria-readonly
					sx={{ pointerEvents: "none", width: "50%" }}
					value={isRecording ? "请直接按下快捷键... (按 Esc 取消)" : (value ? renderFriendlyName(value) : "未设置")}
					placeholder="AIzaSy..."
				/>
				<Fab 
					sx={{ margin: "0", padding: "15px", gap: "10px" }}
					size="small"
					color={isRecording ? "error" : "primary"}
					variant="extended"
					onClick={onClick}
				>
					{isRecording ? (
						<>
							<Square />停止录制
						</>
					) : (
						<>
							<PenLine />录制快捷键
						</>
					)}
				</Fab>
			</div>
		</div>
	);
}