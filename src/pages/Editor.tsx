import { DebateStages, DebateStage, StageType } from "../types";
import * as configManager from "../utils/configManager";
import StageBlock from "../components/StageBlock";
import { MatchSidebar } from "../components/Sidebar";
import { DndContext, closestCenter, DragEndEvent, useSensor, useSensors, PointerSensor } from "@dnd-kit/core";
import { arrayMove, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useState, useEffect } from "react";

interface EditorProps {
	stages: DebateStage[];
	setStages: (stages: DebateStage[]) => void;
}

export default function Editor({ stages, setStages }: EditorProps) {
	const [isMatchesFolded, setIsMatchesFolded] = useState(false);
	const [editingItem, setEditingItem] = useState<DebateStages | null>(null);
	const [id, setId] = useState("");
	const [matches, setMatches] = useState<any[]>([]);

	useEffect(() => {
		async function loadData() {
			try {
				await configManager.initAppScope();
				const loadedFile = await configManager.loadConfigFromDisk();
				if (Array.isArray(loadedFile)) {
					setMatches(loadedFile);
				}
			} catch (error) {
				console.error("Failed to load matches:", error);
				alert(alert(`赛制加载发生错误，请将此弹窗截图发送给维护人员:\n${error}`))
			}
		}

		loadData();
	}, [])

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 5,
			},
		})
	);

	const handleAddStage = (type: StageType) => {
		const newId = stages.length;
		let newStage: DebateStage;
		if (type === "single") newStage = { id: newId, type: "single", title: "新单计时", timeLimit: 180 };
		else if (type === "double") newStage = { id: newId, type: type, title: "新双计时", leftTimeLimit: 240, rightTimeLimit: 240 };
		else if (type === "free" ) newStage = { id: newId, type:type, title: "新自由辩", leftTimeLimit: 240, rightTimeLimit: 240, start: "left" }
		else newStage = { id: newId, type: "none", title: "新无计时" };
		setStages([...stages, newStage]);
	};

	const handleUpdateStage = (id: number, updates: Partial<DebateStage>) => {
		setStages(stages.map(stage => stage.id === id ? { ...stage, ...updates } as DebateStage : stage));
	};

	const handleDelete = (id: number) => {
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

	const handleNewMatch = () => {
		setId(Date.now().toString(36) + Math.random().toString(36).substring(2));
	}

	const handleSave = () => {
		let newMatch: DebateStages
		newMatch = { id: id, name: "TEMP", stages: stages }
		configManager.saveConfigToDisk(newMatch);
	};

	const itemIds = stages.map(stage => stage.id);

	return (
		<div className="container">
			<MatchSidebar isFolded={isMatchesFolded} matches={matches} toggleFold={() => setIsMatchesFolded(!isMatchesFolded)} onSelect={(item) => setEditingItem(item)} />

		</div>
	);
}