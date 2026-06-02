import React from "react";

interface GlobalControlProps {
	activeSide: "left" | "right" | "none";
	onSwitch: () => void;
	onGlobalReset: () => void;
}

export default function GlobalControls({ activeSide, onSwitch, onGlobalReset}: GlobalControlProps) {
	const isNone = activeSide === "none";
	const bText = isNone ? "开始环节" : "切换发言";

	return (
		<div style={{display: "flex", gap: "1rem", justifyContent: "center", marginTop: "2rem"}}>
			<button
				className="btn btn-large"
				onClick={onSwitch}>
				{bText}
			</button>
			<button
				className="btn btn-large"
				onClick={onGlobalReset}>
				全局重置
			</button>
		</div>
	)
}