import { DebateStage, StageType } from "../schema";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2 } from "lucide-react";

interface SortableStageCardProps {
	stage: DebateStage;
	index: number;
	isExpanded: boolean;
	onToggleExpand: () => void;
	onUpdate: (fields: Partial<DebateStage>) => void;
	onDelete: () => void;
}

export default function SortableStageCard({
	stage,
	index,
	isExpanded,
	onToggleExpand,
	onDelete,
	onUpdate
}: SortableStageCardProps) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: stage.id });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition
	};

	return (
		<div
			ref={setNodeRef}
			style={style}
			{...attributes}
			{...listeners}
			className={`stage-card ${isDragging ? "is-dragging" : ""}`}
		>
			<div className="stage-header" onClick={onToggleExpand}>
				<div className="stage-header-title">
					<GripVertical size={16} style={{ color: "#475569" }} />
					<span className="stage-header-prefix">环节 {index + 1}:</span>
					<span>{stage.title || "未命名环节"}</span>
					<span style={{ fontSize: "0.8rem", padding: "2px 6px", borderRadius: "4px", background: "#38bdf815", color: "#38bdf8" }}>
						{stage.type}
					</span>
				</div>

				<button
					onPointerDown={(e) => e.stopPropagation()} 
					onClick={(e) => {
						e.stopPropagation();
						onDelete();
					}}
					style={{ background: "transparent", border: "none", color: "#f43f5e", cursor: "pointer", display: "flex", alignItems: "center", padding: "4px" }}
				>
					<Trash2 size={18} />
				</button>
			</div>

			<div className={`stage-content-grid ${isExpanded ? "is-expanded" : ""}`}>
				<div className="stage-content-inner">
					<div className="stage-content-body" onPointerDown={(e) => e.stopPropagation()}>
						<div style={{ display: "flex", gap: "16px" }}>
							<div style={{ flex: 1 }}>
								<label style={{ display: "block", fontSize: "0.85rem", color: "#94a3b8", marginBottom: "6px" }}>环节名称</label>
								<input
									type="text"
									value={stage.title}
									className="edit-input"
									onChange={(e) => onUpdate({ title: e.target.value })}
								/>
							</div>
							<div style={{ width: "150px" }}>
								<label style={{ display: "block", fontSize: "0.85rem", color: "#94a3b8", marginBottom: "6px" }}>环节类型</label>
								<select
									value={stage.type}
									className="edit-select"
									onChange={(e) => onUpdate({ type: e.target.value as StageType })}
								>
									<option value="single">单人发言</option>
									<option value="double">双人对辩</option>
									<option value="free">自由辩论</option>
									<option value="none">纯展示/无计时</option>
								</select>
							</div>
						</div>

						{stage.type === "single" && (
							<div>
								<label style={{ display: "block", fontSize: "0.85rem", color: "#94a3b8", marginBottom: "6px" }}>发言时限 (秒)</label>
								<input
									type="number"
									value={stage.timeLimit}
									className="edit-input"
									onChange={(e) => onUpdate({ timeLimit: Number(e.target.value) })}
								/>
							</div>
						)}

						{stage.type === "double" && (
							<div style={{ display: "flex", gap: "16px" }}>
								<div style={{ flex: 1 }}>
									<label style={{ display: "block", fontSize: "0.85rem", color: "#94a3b8", marginBottom: "6px" }}>正方时限 (秒)</label>
									<input
										type="number"
										value={stage.leftTimeLimit}
										className="edit-input"
										onChange={(e) => onUpdate({ leftTimeLimit: Number(e.target.value) })}
									/>
								</div>
								<div style={{ flex: 1 }}>
									<label style={{ display: "block", fontSize: "0.85rem", color: "#94a3b8", marginBottom: "6px" }}>反方时限 (秒)</label>
									<input
										type="number"
										value={stage.rightTimeLimit}
										className="edit-input"
										onChange={(e) => onUpdate({ rightTimeLimit: Number(e.target.value) })}
									/>
								</div>
							</div>
						)}

						{stage.type === "free" && (
							<div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
								<div style={{ display: "flex", gap: "16px" }}>
									<div style={{ flex: 1 }}>
										<label style={{ display: "block", fontSize: "0.85rem", color: "#94a3b8", marginBottom: "6px" }}>正方总时限 (秒)</label>
										<input
											type="number"
											value={stage.leftTimeLimit}
											className="edit-input"
											onChange={(e) => onUpdate({ leftTimeLimit: Number(e.target.value) })}
										/>
									</div>
									<div style={{ flex: 1 }}>
										<label style={{ display: "block", fontSize: "0.85rem", color: "#94a3b8", marginBottom: "6px" }}>反方总时限 (秒)</label>
										<input
											type="number"
											value={stage.rightTimeLimit}
											className="edit-input"
											onChange={(e) => onUpdate({ rightTimeLimit: Number(e.target.value) })}
										/>
									</div>
								</div>
								<div>
									<label style={{ display: "block", fontSize: "0.85rem", color: "#94a3b8", marginBottom: "6px" }}>先手发言方</label>
									<select
										value={stage.start}
										className="edit-select"
										onChange={(e) => onUpdate({ start: e.target.value as "left" | "right" })}
									>
										<option value="left">正方先手</option>
										<option value="right">反方先手</option>
									</select>
								</div>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
