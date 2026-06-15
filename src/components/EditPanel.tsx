import { useState, useEffect } from "react";
import { DebateStages, DebateStage, StageType } from "../schema";
import { ChevronLeft, Plus } from "lucide-react";
import { DndContext, closestCenter, DragEndEvent, useSensor, useSensors, PointerSensor } from "@dnd-kit/core";
import { arrayMove, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import SortableStageCard from "./SortableStageCard";
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from "@mui/material";

interface EditPanelProps {
	isSaving: boolean
	match: DebateStages;
	onBack: () => void;
	onSave?: (updatedMatch: DebateStages) => void;
}

export default function( { isSaving, match, onBack, onSave }: EditPanelProps ) {
	const [editingPage, setEditingPage] = useState<DebateStages>(match);
	const [expandedIds, setExpandedIds] = useState<number[]>([]);
	const [deletingId, setDeletingId] = useState<number | null>(null);

	useEffect(() => {
		setEditingPage(match);
	}, [match])

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 5,
			},
		})
	);

	const toggleExpand = (id: number) => {
		setExpandedIds((prev) => 
			prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
		);
	};

	const handleUpdateTitle = (newName: string) => {
		const updatedPage = {...editingPage, name: newName};
		setEditingPage(updatedPage);
		onSave?.(updatedPage);
	}

	const handleDeleteConfirm = () => {
		if (deletingId === null) return;
		const updatedStages = editingPage.stages.filter((s) => s.id !== deletingId);
		const updatedPage = {...editingPage, stages: updatedStages};
		setEditingPage(updatedPage);
		onSave?.(updatedPage);
		setDeletingId(null);
	}

	const handleInsertStage = ( match: DebateStages, index: number) => {
		const newId = match.stages.length;
		const newStage: DebateStage = {
			id: newId,
			title: `新环节 ${editingPage.stages.length + 1}`,
			type: "single",
			timeLimit: 180,
		};

		const updatedStages = [...editingPage.stages]
		updatedStages.splice(index, 0, newStage);

		const updatedPage = {...editingPage, stages: updatedStages};
		setEditingPage(updatedPage);
		onSave?.(updatedPage);
		setExpandedIds((prev) => [...prev, newId]);
	}

	const handleUpdateStage = (id: number, fields: Partial<DebateStage>) => {
		const updatedStages = editingPage.stages.map((stage) => {
			if (stage.id !== id) return stage;
			if (fields.type) {
				const base = {id: stage.id, title: fields.title ?? stage.title};
				switch (fields.type as StageType) {
					case "single": return {...base, type: "single", timeLimit: 180} as DebateStage;
					case "double": return { ...base, type: "double", leftTimeLimit: 180, rightTimeLimit: 180 } as DebateStage;
					case "free": return { ...base, type: "free", leftTimeLimit: 240, rightTimeLimit: 240, start: "left" } as DebateStage;
					case "none": return { ...base, type: "none" } as DebateStage;
				}
			}
			return {...stage, ...fields} as DebateStage;
		});

		const updatedPage = {...editingPage, stages: updatedStages};
		setEditingPage(updatedPage);
		onSave?.(updatedPage);
	};

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;
		if (over && active.id !== over.id) {
			const oldIndex = editingPage.stages.findIndex((s) => s.id === active.id);
			const newIndex = editingPage.stages.findIndex((s) => s.id === over.id);

			const updatedStages = arrayMove(editingPage.stages, oldIndex, newIndex);
			const updatedPage = {...editingPage, stages: updatedStages};

			setEditingPage(updatedPage);
			onSave?.(updatedPage);
		}
	}

	const renderDivider = (index: number) => (
		<div className="stage-divider" onClick={() => handleInsertStage(editingPage, index)} title="在此插入新环节">
			<div className="stage-divider-line"></div>
			<button className="stage-divider-btn">
				<Plus size={14} strokeWidth={3} />
			</button>
			<div className="stage-divider-line"></div>
		</div>
	)

	return (
		<div style={{ display: "flex", flexDirection: "column", height: "100%", width: "100%", position: "relative" }}>
			<div style={{ padding: "16px 4vw 0 4vw", display: "flex",flexDirection: "row", justifyContent: "space-between" }}>
				<button 
					className="btn" 
					style={{ padding: "6px 12px", border: "none", display: "flex", alignItems: "center", gap: "4px", background: "transparent", color: "var(--alt-blue)", cursor: "pointer" }} 
					onClick={onBack}
				>
					<ChevronLeft size={20} strokeWidth={2} />返回
				</button>
				<label
					style={{ padding: "6px 12px", border: "none", background: "transparent", color: "var(--alt-blue)", fontSize: "0.8rem" }}>
					{isSaving ? "正在保存，请勿关闭页面" : "已保存"}
				</label>
			</div>
			<div className="stage-container hide-scrollbar">
				<input name="title" className="edit-title-input" value={ editingPage != null ? editingPage.name : "" } onChange={(e) => handleUpdateTitle(e.target.value)}></input>
				<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
					<SortableContext items={editingPage.stages.map((s) => s.id)} strategy={verticalListSortingStrategy}>
						{renderDivider(0)}
						{editingPage.stages.map((stage, index) => (
							<div key={stage.id} style={{ display: "flex", flexDirection: "column" }}>
								<SortableStageCard
									stage={stage}
									index={index}
									isExpanded={expandedIds.includes(stage.id)}
									onToggleExpand={() => toggleExpand(stage.id)}
									onDelete={() => setDeletingId(stage.id)}
									onUpdate={(fields) => handleUpdateStage(stage.id, fields)}
								/>
								{renderDivider(index + 1)}
							</div>
						))}
					</SortableContext>
				</DndContext>
			</div>
			<Dialog 
				open={deletingId !== null} 
				onClose={() => setDeletingId(null)}
				sx={{
					"& .MuiDialog-paper": {
						backgroundColor: '#1e293b', 
						color: '#f8fafc', 
						border: "1px solid #334155",
						borderRadius: '12px'
					}
				}}
			>
				<DialogTitle style={{ margin: "0 0 12px 0", color: "#f8fafc" }}>确认删除此环节？</DialogTitle>
				<DialogContent>
					<DialogContentText style={{ color: '#94a3b8' }}>
						该操作无法撤销，确定要将该环节从流程中移除吗？
					</DialogContentText>
				</DialogContent>
				<DialogActions style={{ display: "flex", justifyContent: "flex-end", gap: "12px", padding: "16px 24px" }}>
					<Button onClick={() => setDeletingId(null)} sx={{ color: '#94a3b8', border: "1px solid #475569" }}>
						取消
					</Button>
					<Button onClick={handleDeleteConfirm} variant="contained" sx={{ backgroundColor: '#f43f5e', '&:hover': { backgroundColor: '#e11d48' } }}>
						确认删除
					</Button>
				</DialogActions>
			</Dialog>
		</div>
	)
}