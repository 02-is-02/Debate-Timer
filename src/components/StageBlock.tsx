import React, {useState} from "react";
import { DebateStage } from "../types";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface StageBlockProps {
	stage: DebateStage;
	index: number;
	onUpdate: (id: number, updates: Partial<DebateStage>) => void;
	onDelete: (id: number) => void;
}

export default function StageBlock({
	stage,
	index,
	onUpdate,
	onDelete,
}: StageBlockProps) {
	const [isExpanded, setIsExpanded] = useState(true);
	const [isEditing, setIsEditing] = useState(false);

	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: stage.id });

	const style = {
		transform: CSS.Translate.toString(transform),
		transition,
	};

	return (
		<div 
			ref={setNodeRef}
			{...attributes}
			{...listeners}
			className={`stage-card ${isDragging? 'is-dragging' : ''}`}
			style={style}>

			<div
				className="stage-header"
				onClick={() => setIsExpanded(!isExpanded)}>
				<div className="stage-header-title">
					<span className="stage-header-prefix">环节 {index + 1}</span>
					<span>{stage.title || "未命名环节"}</span>
				</div>
			</div>

			<div className={`stage-content-grid ${isExpanded ? 'is-expanded' : ''}`}>
				<div
					className="stage-content-inner"
					onPointerDown={(e) => e.stopPropagation()}
					onMouseDown={(e) => e.stopPropagation()}
					onClick={(e) => e.stopPropagation}>
					<div className="stage-content-body">
						{/* view mode */}
						{!isEditing && (
							<div className="fade-enter">
								<div className="summary-bar">
									<span style={{ color: "#94a3b8" }}>时长与规则配置</span>
									<span>
										{stage.type === "single" && `${stage.timeLimit} 秒`}
										{stage.type !== "single" && stage.type !== "none" && `${stage.leftTimeLimit}s / ${stage.rightTimeLimit}s`}
										{stage.type === "none" && `无计时`}
									</span>
								</div>
								<div className="action-row">
									<button className="btn-danger-text"onClick={() => onDelete(stage.id)}>
										删除
									</button>
									<button className="btn-dark" onClick={() => setIsEditing(true)}>
										编辑
									</button>
								</div>
							</div>
						)}
						{/* edit mode */}
						{isEditing && (
							<div className="fade-enter">
								<div style={{ display: 'flex', flexDirection: 'column', gap: "8px" }}>
									<label style={{ fontSize: "0.9rem", color: "#94a3b8" }}>环节名称</label>
									<input
										className="dark-input"
										value={stage.title}
										onChange={(e) => onUpdate(stage.id, {title: e.target.value})}
										placeholder="请输入环节名"/>
								</div>

								{stage.type === "single" && (
									<div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
										<span style={{ color: "#94a3b8" }}>时长:</span>
										<input
											type="number"
											className="dark-input"
											style={{ width: "100px" }}
											value={stage.timeLimit}
											onChange={(e) => onUpdate(stage.id, {timeLimit: Number(e.target.value)})}/>
									</div>
								)}
								{(stage.type === "double" || stage.type === "free") && (
									<div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
										<div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
											<span style={{ color: "#94a3b8" }}>正方时长:</span>
											<input
												type="number"
												className="dark-input"
												style={{ width: "100px" }}
												value={stage.leftTimeLimit}
												onChange={(e) => onUpdate(stage.id, { leftTimeLimit: Number(e.target.value) })}
											/>
											<span>秒</span>
										</div>
										<div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
											<span style={{ color: "#94a3b8" }}>反方时长:</span>
											<input
												type="number"
												className="dark-input"
												style={{ width: "100px" }}
												value={stage.rightTimeLimit}
												onChange={(e) => onUpdate(stage.id, { rightTimeLimit: Number(e.target.value) })}
											/>
											<span>秒</span>
										</div>
									</div>
								)}

								{stage.type === "free" && (
									<div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
										<span style={{ color: "#94a3b8" }}>优先发言方:</span>
										<select
											className="dark-input"
											style={{ width: "150px" }}
											value={stage.start || "left"}
											onChange={(e) => onUpdate(stage.id, { start: (e.target.value as "left" | "right") })}
										>
											<option value="left">正方</option>
											<option value="right">反方</option>
										</select>
									</div>
								)}

								<div className="action-row" style={{ marginTop: "16px" }}>
									<button className="btn-danger-text" onClick={() => onDelete(stage.id)}>
										删除
									</button>
									<button className="btn-primary" onClick={() => setIsEditing(false)}>
										保存
                                    </button>
                                </div>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	)
}