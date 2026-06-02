import { DebateStage } from "../types";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface StageBlockProps {
	stage: DebateStage;
	index: number;
	onUpdate: (id: string, updates: Partial<DebateStage>) => void;
	onDelete: (id: string) => void;
}

export default function StageBlock({
	stage,
	onUpdate,
	onDelete,
}: StageBlockProps) {

	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: stage.id });

	const style = {
		transform: CSS.Translate.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : 1,
		zIndex: isDragging ? 999 : "auto", 
	};

	return (
		<div 
			ref={setNodeRef}
			style={{
				...style,
				display: "flex",
				alignItems: "center",
				gap: "1rem",
				padding: "15px",
				border: "1px solid #ddd",
				borderRadius: "8px",
				backgroundColor: "#fff",
				boxShadow: isDragging ? "0 10px 20px rgba(0,0,0,0.15)" : "0 2px 4px rgba(0,0,0,0.05)",
			}}>
				<div 
					{...attributes}
					{...listeners}
					className="drag-handle"
					style={{
						color: "#999", 
						textAlign: "left", 
						fontSize: "1.5rem", 
						userSelect: "none",
						padding: "0 0.5rem",
						outline: "none"
					}}>
					☰
				</div>

				<input
					value={stage.title}
					onChange={(e) => onUpdate(stage.id, { title: e.target.value })}
					style={{ flex: 1, padding: "0.5rem", fontSize: "1rem", border: "1px solid #eee", borderRadius: "4px" }}
					placeholder="环节名称"
				/>

				{stage.type === "single" && (
					<div>
						时间:{" "}
						<input
							type="number"
							value={stage.timeLimit}
							onChange={(e) => onUpdate(stage.id, { timeLimit: Number(e.target.value) })}
							style={{ width: "60px", padding: "0.3rem" }}
						/>{" "}
						秒
					</div>
				)}

				{(stage.type === "double") && (
					<div style={{ display: "flex", gap: "1rem" }}>
						<div>
							正方:{" "}
							<input
								type="number"
								value={stage.leftTimeLimit}
								onChange={(e) => onUpdate(stage.id, { leftTimeLimit: Number(e.target.value) })}
								style={{ width: "60px", padding: "0.3rem" }}
							/>{" "}
							秒
						</div>
						<div>
							反方:{" "}
							<input
								type="number"
								value={stage.rightTimeLimit}
								onChange={(e) => onUpdate(stage.id, { rightTimeLimit: Number(e.target.value) })}
								style={{ width: "60px", padding: "0.3rem" }}
							/>{" "}
							秒
						</div>
					</div>
				)}

				{(stage.type === "free") && (
					<div style={{ display: "flex", gap: "1rem" }}>
						<div>
							正方:{" "}
							<input
								type="number"
								value={stage.leftTimeLimit}
								onChange={(e) => onUpdate(stage.id, { leftTimeLimit: Number(e.target.value) })}
								style={{ width: "60px", padding: "0.3rem" }}
							/>{" "}
							秒
						</div>
						<div>
							反方:{" "}
							<input
								type="number"
								value={stage.rightTimeLimit}
								onChange={(e) => onUpdate(stage.id, { rightTimeLimit: Number(e.target.value) })}
								style={{ width: "60px", padding: "0.3rem" }}
							/>{" "}
							秒
						</div>
						<div>
							优先发言方:{" "}
							<select
								value={stage.start || "left"}
								onChange={(e) => onUpdate(stage.id, { start: (e.target.value as "left" | "right") })}
								style={{ padding: "0.3rem", borderRadius: "4px", border: "1px solid #ccc" }}
								>
								<option value="left">正方</option>
								<option value="right">反方</option>
							</select>
						</div>
					</div>
				)}

				{stage.type === "none" && (
					<div style={{ color: "#888", fontStyle: "italic", minWidth: "120px", textAlign: "center" }}>
						无计时环节
					</div>
				)}

				<button
					className="btn"
					onClick={() => onDelete(stage.id)}
					style={{ padding: "0.5rem", color: "red", borderColor: "#ffbaba", backgroundColor: "#fff0f0" }}
				>
					🗑️
				</button>
		</div>
	)
}