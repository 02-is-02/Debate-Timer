import { DebateStages } from "../types";
import * as configManager from "../utils/configManager";
import { useState, useEffect, useRef } from "react";
import EditPanel from "../components/EditPanel";
import { Plus, Trash2, FileText } from "lucide-react";

export default function Editor() {
	const [matches, setMatches] = useState<any[]>([]);
	const [selectedId, setSelectedId] = useState<string>("");
	const [isSaving, setIsSaving] = useState(false);
	const [deletingId, setDeletingId] = useState<string | null>(null);

	const typingTimeRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const selectedMatch = matches.find(m => m.id === selectedId);

	const handleUpdateStage = (stages: DebateStages) => {
		setIsSaving(true);
		const updatedMatches = matches.map((m) => m.id === stages.id ? stages : m);
		setMatches(updatedMatches);

		if (typingTimeRef.current) clearTimeout(typingTimeRef.current);

		typingTimeRef.current = setTimeout(async () => {
			try {
				await configManager.saveConfigToDisk(stages);
			} catch (error) {
				console.log("Failed to save config: ", error);
				alert(`赛制保存发生错误:\n${error}`);
			} finally {
				setIsSaving(false);
			}
		}, 1500);
	};

	const handleAddMatch = () => {
		const newId = `M-${crypto.randomUUID()}`;
		const newMatch: DebateStages = { id: newId, name: "未命名新赛制", stages: []};

		const updatedMatches = [newMatch, ...matches];
		setMatches(updatedMatches);
		setSelectedId(newId);
		
		try {
			configManager.saveConfigToDisk(newMatch);
		} catch (error) {
			console.error("Failed to save matches:", error);
		}
	};

	const handleDeleteConfirm = async () => {
		if (!deletingId) return;
		
		const updatedMatches = matches.filter((m) => m.id !== deletingId);
		setMatches(updatedMatches);
		
		if (selectedId === deletingId) {
			setSelectedId("");
		}
		setDeletingId(null);

		try {
			await configManager.deleteConfigFromDisk(deletingId);
		} catch (error) {
			console.error("Failed to delete matches:", error);
		}
	};

	useEffect(() => {
		return () => {
			if (typingTimeRef.current) clearTimeout(typingTimeRef.current);
		};
	}, []);

	useEffect(() => {
		async function loadData() {
			try {
				await configManager.initAppScope();
				const loadedFile = await configManager.loadConfigFromDisk();
				if (Array.isArray(loadedFile)) setMatches(loadedFile);
			} catch (error) {
				console.error("Failed to load matches:", error);
			}
		}
		loadData();
	}, []);

	return (
		<div className="container" style={{ position: "relative", overflow: "hidden", display: "flex", width: "100%", height: "100vh" }}>
			
			<div 
				className="hide-scrollbar" 
				style={{ 
					flex: 1,
					height: "100%", 
					overflowY: "auto", 
					padding: "30px 4vw", 
					boxSizing: "border-box",
					background: "var(--bg)"
				}}
			>
				<div style={{ maxWidth: "1000px", margin: "0 auto 24px auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
					<h1 style={{ color: "white", margin: 0, fontSize: "2rem" }}>赛制库</h1>
					<button 
						className="btn-start-match" 
						onClick={handleAddMatch}
						style={{ padding: "10px 20px", display: "flex", alignItems: "center", gap: "8px", fontSize: "1rem" }}
					>
						<Plus size={20} strokeWidth={2.5} /> 新建赛制
					</button>
				</div>

				<div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "1000px", margin: "0 auto" }}>
					{matches.length === 0 && (
						<div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>还没有任何赛制，点击右上角新建一个吧！</div>
					)}

					{matches.map((m) => {
						const isSelected = selectedId === m.id;
						return (
							<div
								key={m.id}
								onClick={() => setSelectedId(m.id)}
								style={{
									
									padding: "20px 24px",
									margin: "0",
									cursor: "pointer",
									display: "flex",
									alignItems: "center",
									justifyContent: "space-between",
									transition: "all 0.2s ease"
								}}
								className={`stage-card ${isSelected ? "active" : ""}`} 
							>
								<div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
									<FileText size={20} color={isSelected ? "#60a5fa" : "#94a3b8"} />
									<span style={{ color: isSelected ? "#fff" : "#e2e8f0", fontSize: "1.15rem", fontWeight: "500" }}>
										{m.name || "未命名赛制"}
									</span>
								</div>
								<button
									onClick={(e) => { e.stopPropagation(); setDeletingId(m.id); }}
									style={{ background: "transparent", border: "none", color: "#f43f5e", cursor: "pointer", padding: "8px" }}
								>
									<Trash2 size={20} />
								</button>
							</div>
						);
					})}
				</div>
			</div>

			<div 
				style={{
					position: "absolute",
					top: 0,
					right: 0,
					height: "100%",
					width: "100%", 
					
					background: "var(--bg)", 
					borderLeft: "4px solid var(--std-blue)", 
					transform: selectedId ? "translateX(0)" : "translateX(100%)",
					transition: "transform 1.0s cubic-bezier(0.16, 1, 0.3, 1)", 
					zIndex: 50,
					display: "flex",
					flexDirection: "column",
				}}
			>
				{selectedMatch && (
					<div className="hide-scrollbar" style={{ flex: 1, overflowY: "auto", height: "100%" }}>
						<EditPanel
							isSaving={isSaving}
							match={selectedMatch}
							onBack={() => setSelectedId("")}
							onSave={handleUpdateStage}
						/> 
					</div>
				)}
			</div>

			{deletingId !== null && (
				<div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
					<div style={{ background: "#1e293b", border: "1px solid #334155", padding: "24px", borderRadius: "12px", width: "320px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.5)" }}>
						<h3 style={{ margin: "0 0 12px 0", color: "#f8fafc" }}>确认删除此赛制？</h3>
						<p style={{ color: "#94a3b8", fontSize: "0.9rem", margin: "0 0 20px 0" }}>该操作无法撤销，与其相关的所有环节配置都将被永久移除。</p>
						<div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
							<button onClick={() => setDeletingId(null)} style={{ padding: "8px 16px", borderRadius: "6px", border: "1px solid #475569", background: "transparent", color: "#94a3b8", cursor: "pointer" }}>取消</button>
							<button onClick={handleDeleteConfirm} style={{ padding: "8px 16px", borderRadius: "6px", border: "none", background: "#f43f5e", color: "white", cursor: "pointer" }}>确认删除</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}