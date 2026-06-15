import { DebateStage, DebateStages } from "../schema";
import * as configManager from "../utils/configManager";
import { useState, useEffect, useRef } from "react";
import EditPanel from "../components/EditPanel";
import { Plus, Trash2, FileText, Share } from "lucide-react";
import FileDrop from "../components/FileDrop";
import { useToast } from "../utils/Context";
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from "@mui/material";

const DEFAULT_STAGES: DebateStage[] = [
		{ id: 1, type: "single", title: "正方一辩立论", timeLimit: 180 },
		{ id: 2, type: "single", title: "反方一辩立论", timeLimit: 180 },
		{ id: 3, type: "double", title: "申论", leftTimeLimit: 240, rightTimeLimit: 240},
		{ id: 4, type: "free", title: "自由辩论", leftTimeLimit: 240, rightTimeLimit: 240, start: "left" },
	]

export default function Editor() {
	const [matches, setMatches] = useState<any[]>([]);
	const [selectedId, setSelectedId] = useState<string>("");
	const [isSaving, setIsSaving] = useState(false);
	const [deletingId, setDeletingId] = useState<string | null>(null);
	const [pendingImport, setPendingImport] = useState<DebateStages | null>(null);
	const processingIds = useRef<Set<string>>(new Set());
	const matchesRef = useRef<any[]>([]);

	const { showToast } = useToast();

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
				showToast(`赛制保存发生错误:\n${error}`, 'error');
			} finally {
				setIsSaving(false);
			}
		}, 1500);
	};

	const handleAddMatch = () => {
		const newId = `M-${crypto.randomUUID()}`;
		const newMatch: DebateStages = { id: newId, name: "未命名新赛制", stages: DEFAULT_STAGES};

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

	const handleExportMatch = ( match: DebateStages ) => {
		configManager.exportConfig(match);
	}

	const handleImportMatch = (match: DebateStages) => {
		if (processingIds.current.has(match.id)) return; 
		
		processingIds.current.add(match.id);

		const exists = matchesRef.current.some((item) => item.id === match.id);

		if (exists) {
			setPendingImport(match);
		} else {
			executeImport(match);
		}
	};

	const executeImport = (match: DebateStages) => {
		setMatches((prev) => {
			const isExistInPrev = prev.some((m) => m.id === match.id);
			return isExistInPrev 
				? prev.map((m) => (m.id === match.id ? match : m)) 
				: [match, ...prev];
		});

		configManager.saveConfigToDisk(match)
			.then(() => {
				console.log("Import success"); 
				showToast("导入赛制存储成功", 'success');
			})
			.catch((err) => {
				console.error("Failed to save imported config", err);
				showToast(`导入赛制存储失败:\n${err}`, 'error');
			})
			.finally(() => {
				processingIds.current.delete(match.id);
				setPendingImport(null);
			});
	};

	const handleCancelImport = () => {
		if (pendingImport) {
			processingIds.current.delete(pendingImport.id);
			setPendingImport(null);
		}
	};

	useEffect(() => {
		matchesRef.current = matches;
	}, [matches]);

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
									padding: "0 20px",
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
								<div style={{ display: "flex", flexDirection: "row", gap: "10px" }}>
									<button
										onClick={(e) => { e.stopPropagation(); handleExportMatch(m)}}
										className="btn-icon"
										style={{
											"--btn-theme": "var(--alt-blue)"
										} as React.CSSProperties}
									>
										<Share size={20} />
									</button>
									<button
										onClick={(e) => { e.stopPropagation(); setDeletingId(m.id); }}
										className="btn-icon"
										style={{
											"--btn-theme": "#c22f48"
										} as React.CSSProperties}
									>
										<Trash2 size={20} style={{ transform: "translateY(1px)" }} />
									</button>
								</div>
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
				<DialogTitle style={{ margin: "0 0 12px 0", color: "#f8fafc" }}>确认删除此赛制？</DialogTitle>
				<DialogContent>
					<DialogContentText style={{ color: '#94a3b8' }}>
						该操作无法撤销，与其相关的所有环节配置都将被永久移除。
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
			<Dialog 
				open={pendingImport !== null} 
				onClose={handleCancelImport}
				sx={{
					"& .MuiDialog-paper": {
						backgroundColor: "#1e293b",
						color: "#f8fafc",
						border: "1px solid #334155",
						borderRadius: "12px",
						boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
					}
				}}
			>
				<DialogTitle sx={{ margin: 0, paddingBottom: 1, color: "var(--lgt-blue)" }}>
					已有同名赛制存在
				</DialogTitle>
				<DialogContent>
					<DialogContentText sx={{ color: '#94a3b8' }}>
						赛制库中已经存在 ID 为 {pendingImport?.id} 的赛制。
						<br/><br/>
						继续导入将<strong>覆盖</strong>原有配置，是否继续？
					</DialogContentText>
				</DialogContent>
				<DialogActions sx={{ padding: "16px 24px" }}>
					<Button onClick={handleCancelImport} sx={{ color: '#94a3b8', border: "1px solid #475569" }}>
						取消
					</Button>
					<Button 
						onClick={() => pendingImport && executeImport(pendingImport)} 
						variant="contained" 
						sx={{ backgroundColor: 'var(std-blue)', color: 'black', fontWeight: 'bold', '&:hover': { backgroundColor: 'var(--lgt-blue)' } }}
					>
						确认覆盖
					</Button>
				</DialogActions>
			</Dialog>
			<FileDrop onDrop={(m) => handleImportMatch(m)}></FileDrop>
		</div>
	);
}