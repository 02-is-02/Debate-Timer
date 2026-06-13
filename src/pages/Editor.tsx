import { DebateStages } from "../types";
import * as configManager from "../utils/configManager";
import { MatchSidebar } from "../components/Sidebar";
import { useState, useEffect, useRef } from "react";
import EditPanel from "../components/EditPanel";

export default function Editor() {
	const [isMatchesFolded, setIsMatchesFolded] = useState(false);
	const [editingItem, setEditingItem] = useState<DebateStages | null>(null);
	const [matches, setMatches] = useState<any[]>([]);
	const [isSaving, setIsSaving] = useState(false);

	const typingTimeRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const handleUpdateStage = (stages: DebateStages) => {
		setIsSaving(true);
		setEditingItem(stages);
		matches.find((m) => m.id === editingItem?.id).name = stages.name
		// setMatches()

		if (typingTimeRef.current) {
			clearTimeout(typingTimeRef.current);
		}

		typingTimeRef.current = setTimeout(async () => {
			await configManager.saveConfigToDisk(stages);
			setIsSaving(false)
		}, 1500);
	};

	// const handleAddMatch = () => {
	// 	const newMatch = DebateStages
	// }

	useEffect(() => {
		return () => {
			if (typingTimeRef.current) {
				clearTimeout(typingTimeRef.current);
			}
		};
	}, []);

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

	return (
		<div className="container">
			<div style={{ flexShrink: 0, height: "100%" }}>
				<MatchSidebar 
					isFolded={isMatchesFolded} 
					matches={matches} 
					toggleFold={() => setIsMatchesFolded(!isMatchesFolded)} 
					onSelect={(item) => setEditingItem(item)} 
				/>
			</div>

			{editingItem ? (
				<div 
					style={{ 
						flex: 1,
						minWidth: 0,
						height: "100%",
						overflowY: "auto"
					}}
				>
					<EditPanel
						isSaving={isSaving}
						match={editingItem}
						onBack={() => {
							setIsMatchesFolded(false); 
							
						}}
						onSave={handleUpdateStage}
					/> 
				</div>
			) : (
				<div style={{ flex: 1, minWidth: 0, height: "100%" }} />
			)}
		</div>
	);
}