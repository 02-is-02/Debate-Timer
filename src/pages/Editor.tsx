import { useNavigate } from "react-router-dom";
import { DebateStage, StageType } from "../types";
import StageBlock from "../components/StageBlock";
import Sidebar from "../components/Sidebar";
import { DndContext, closestCenter, DragEndEvent, useSensor, useSensors, PointerSensor } from "@dnd-kit/core";
import { arrayMove, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useState } from "react";

interface EditorProps {
	stages: DebateStage[];
	setStages: (stages: DebateStage[]) => void;
}

export default function Editor({ stages, setStages}: EditorProps) {
	const navigate = useNavigate();
	const [isFolded, setIsFolded] = useState(false);

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 5,
			},
		})
	);

	const handleAddStage = (type: StageType) => {
		const newId = Date.now().toString(36) + Math.random().toString(36).substring(2);
		let newStage: DebateStage;
		if (type === "single") newStage = { id: newId, type: "single", title: "新单计时", timeLimit: 180 };
		else if (type === "double") newStage = { id: newId, type: type, title: "新双计时", leftTimeLimit: 240, rightTimeLimit: 240 };
		else if (type === "free" ) newStage = { id: newId, type:type, title: "新自由辩", leftTimeLimit: 240, rightTimeLimit: 240, start: "left" }
		else newStage = { id: newId, type: "none", title: "新无计时" };
		setStages([...stages, newStage]);
	};

	const handleUpdateStage = (id: string, updates: Partial<DebateStage>) => {
		setStages(stages.map(stage => stage.id === id ? { ...stage, ...updates } as DebateStage : stage));
	};

	const handleDelete = (id: string) => {
	setStages(stages.filter(stage => stage.id !== id));
	};

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;
		if (over && active.id !== over.id) {
			const oldIndex = stages.findIndex((stage) => stage.id === active.id);
			const newIndex = stages.findIndex((stage) => stage.id === over.id);
			setStages(arrayMove(stages, oldIndex, newIndex));
		}
	};

	const handleSave = () => {
		console.log("保存的赛制：", stages);
		alert("保存成功！");
		navigate("/");
	};

	const itemIds = stages.map(stage => stage.id);

	return (
		<div className="main-container">
			<Sidebar isFolded={isFolded} toggleFold={() => setIsFolded(!isFolded)} activeRow={2}/>
			<div style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
				<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
				<h2>🛠️ 赛制编辑器</h2>
				<div>
					<button className="btn" onClick={() => navigate("/")} style={{ marginRight: "1rem" }}>返回</button>
					<button className="btn" onClick={handleSave} style={{ backgroundColor: "#2ecc71", color: "white", borderColor: "#27ae60" }}>保存配置</button>
				</div>
				</div>

				<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
					<SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
						<div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
						{stages.map((stage, index) => (
							<StageBlock
							key={stage.id}
							stage={stage}
							index={index}
							onUpdate={handleUpdateStage}
							onDelete={handleDelete}
							/>
						))}
						</div>
					</SortableContext>
				</DndContext>

				<div style={{ marginTop: "2rem", padding: "1.5rem", border: "2px dashed #ccc", borderRadius: "8px", textAlign: "center" }}>
					<h4 style={{ margin: "0 0 1rem 0", color: "#666" }}>➕ 添加新环节</h4>
					<div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
						<button className="btn" onClick={() => handleAddStage("single")}>+ 单计时</button>
						<button className="btn" onClick={() => handleAddStage("double")}>+ 双计时</button>
						<button className="btn" onClick={() => handleAddStage("free")}>+ 自由辩</button>
						<button className="btn" onClick={() => handleAddStage("none")}>+ 无计时</button>
					</div>
				</div>
			</div>
		</div>
	);
}