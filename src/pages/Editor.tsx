import { useState, useEffect, useRef } from "react";
import { Plus, Trash2, FileText, Share, CheckSquare, Square, CheckSquare2, ArrowLeft } from "lucide-react";
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from "@mui/material";
import EditPanel from "../components/EditPanel";
import NewMatchConfig from "../components/NewMatchConfig";
import { useToast } from "../utils/Context";
import * as configManager from "../utils/configManager";
import { DebateStages } from "../schema";
import { useLayoutContext } from "../components/Layout";

export default function Editor() {
	const [matches, setMatches] = useState<any[]>([]);
	const [selectedIds, setSelectedIds] = useState<string[]>([]);
	const [isBulkSelecting, setIsBulkSelecting] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [isCreating, setIsCreating] = useState(false);
	const [deletingIds, setDeletingIds] = useState<string[]>([]);
	
	const [pendingImport, setPendingImport] = useState<DebateStages[] | null>(null);
	const processingIds = useRef<Set<string>>(new Set());
	const matchesRef = useRef<any[]>([]);

	const { showToast } = useToast();
	const { setAllowDndWindow } = useLayoutContext();
	const typingTimeRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const pendingData = useRef<any[] | null>(null);

	const selectedMatch = (!isBulkSelecting && selectedIds.length === 1) 
	? matches.find(m => m.id === selectedIds[0]) 
	: null;

	const handleUpdateStage = (stages: DebateStages) => {
		setIsSaving(true);
		const updatedMatches = matches.map((m) => m.id === stages.id ? stages : m);
		setMatches(updatedMatches);

		pendingData.current = updatedMatches;

		if (typingTimeRef.current) clearTimeout(typingTimeRef.current);

		typingTimeRef.current = setTimeout(async () => {
			try {
				await configManager.saveConfigToDisk(updatedMatches);
				pendingData.current = null;
			} catch (error) {
				console.log("Failed to save config: ", error);
				showToast(`赛制保存发生错误:\n${error}`, 'error');
			} finally {
				setIsSaving(false);
			}
		}, 1500);
	};

	const handleCardClick = (id: string) => {
		if (isBulkSelecting) {
			setSelectedIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
		} else {
			setSelectedIds([id]);
		}
	};

	const handleSelectAll = () => {
		if (selectedIds.length === matches.length) {
			setSelectedIds([]);
		} else {
			setSelectedIds(matches.map(m => m.id));
		}
	};

	const handleToggleConfig = async () => {
		if (!await configManager.checkDefaultPath()) {
			await configManager.initAppScope();
			const loadedFile = await configManager.loadConfigFromDisk();
			if (Array.isArray(loadedFile)) setMatches(loadedFile);
		}
		const nextState = !isCreating;
		setIsCreating(nextState);
		setAllowDndWindow(!nextState);
	};

	const handleAddMatch = (matchData: DebateStages) => {
		const updatedMatches = [matchData, ...matches];
		setMatches(updatedMatches);
		setSelectedIds([matchData.id]);

		try {
			configManager.saveConfigToDisk(updatedMatches);
		} catch (error) {
			console.error("Failed to save matches:", error);
			showToast("保存失败", "error");
		}
	};

	const handleDeleteConfirm = async () => {
		if (!deletingIds || deletingIds.length === 0) return;

		const updatedMatches = matches.filter(m => !deletingIds.includes(m.id));
		setMatches(updatedMatches);
		setSelectedIds(prev => prev.filter(id => !deletingIds.includes(id)));
		setDeletingIds([]);

		if (updatedMatches.length === 0) setIsBulkSelecting(false);

		try {
			await configManager.saveConfigToDisk(updatedMatches);
			showToast("删除成功", "success");
		} catch (error) {
			console.error("Failed to delete matches:", error);
			showToast("保存失败", "error");
		}
	};

	const handleExportMatch = ( ids?: string[] ) => {
		if (ids && ids.length > 0) {
			configManager.exportConfig(matches.filter(items => ids.includes(items.id)));
			return;
		}
		configManager.exportConfig(matches.filter(items => selectedIds.includes(items.id)));
	};

	const handleImportMatch = (incomingData: any) => {
		const importedMatches: DebateStages[] = Array.isArray(incomingData) ? incomingData : [incomingData];
		
		const validMatches = importedMatches.filter(m => !processingIds.current.has(m.id));
		if (validMatches.length === 0) return;

		validMatches.forEach(m => processingIds.current.add(m.id));

		const hasConflict = validMatches.some(newMatch => 
			matchesRef.current.some(existing => existing.id === newMatch.id)
		);

		if (hasConflict) {
			setPendingImport(validMatches);
		} else {
			executeImport(validMatches);
		}
	};

	const executeImport = (incomingMatches: DebateStages[]) => {
		const finalMatches = [...matchesRef.current];

		incomingMatches.forEach(newMatch => {
			const existingIndex = finalMatches.findIndex(m => m.id === newMatch.id);
			if (existingIndex >= 0) {
				finalMatches[existingIndex] = newMatch;
			} else {
				finalMatches.unshift(newMatch);
			}
		});

		setMatches(finalMatches);

		configManager.saveConfigToDisk(finalMatches)
			.then(() => {
				console.log("Import success"); 
				showToast(`成功导入 ${incomingMatches.length} 个赛制`, 'success');
			})
			.catch((err) => {
				console.error("Failed to save imported config", err);
				showToast("导入赛制存储失败", 'error');
			})
			.finally(() => {
				incomingMatches.forEach(m => processingIds.current.delete(m.id));
				setPendingImport(null);
			});
	};

	const handleCancelImport = () => {
		if (pendingImport) {
			pendingImport.forEach(m => processingIds.current.delete(m.id));
			setPendingImport(null);
		}
	};

	useEffect(() => {
		matchesRef.current = matches;
	}, [matches]);

	useEffect(() => {
		const handleGlobalImportEvent = (e: Event) => {
			const customEvent = e as CustomEvent;
			handleImportMatch(customEvent.detail);
		};

		window.addEventListener('trigger-global-import', handleGlobalImportEvent);
		return () => {
			window.removeEventListener('trigger-global-import', handleGlobalImportEvent);
		};
	}, []);

	useEffect(() => {
		return () => {
			if (typingTimeRef.current) clearTimeout(typingTimeRef.current);

			if (pendingData.current) {
				window.dispatchEvent(new CustomEvent('trigger-global-toast', {
					detail: {
						message: "检测到未保存赛制数据，正在保存...", 
						severity: "info"}
				}));
				configManager.saveConfigToDisk(pendingData.current);
			}
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
				<NewMatchConfig isActive={isCreating} toggleActive={handleToggleConfig} onCreate={(matchData) => handleAddMatch(matchData)} />
				
				<div style={{ margin: "0 auto 24px auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
					<div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
						<h1 style={{ color: "white", margin: 0, fontSize: "2rem" }}>赛制库</h1>
					</div>

					<div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
						{isBulkSelecting ? (
							<>
								<button
									className="btn-secondary" 
									onClick={() => {
										setIsBulkSelecting(false);
										setSelectedIds([]);
									}}
									style={{
										padding: "10px 20px", display: "flex", alignItems: "center", gap: "8px", fontSize: "1rem",
										alignContent: "center"
									}}
								>
									取消
								</button>
								<button
									className="btn-secondary" 
									onClick={handleSelectAll}
									style={{
										backgroundColor: `${selectedIds.length === matches.length && matches.length > 0 ? "var(--std-blue)" : "transparent"}`,
										padding: "10px 20px", display: "flex", alignItems: "center", gap: "8px", fontSize: "1rem",
										opacity: selectedIds.length === 0 ? 0.5 : 1,
										cursor: selectedIds.length === 0 ? "not-allowed" : "pointer",
										alignContent: "center"
									}}
								>
									{selectedIds.length === matches.length && matches.length > 0 ? (
										<CheckSquare2 size={18} color="white" />
									) : (
										<Square size={18} />
									)}
									全选
								</button>
								<button 
									className="btn-secondary" 
									onClick={() => setDeletingIds(selectedIds)}
									disabled={selectedIds.length === 0}
									style={{ 
										padding: "10px 20px", display: "flex", alignItems: "center", gap: "8px", fontSize: "1rem", 
										color: selectedIds.length === 0 ? "#718096" : "#c22f48", 
										borderColor: selectedIds.length === 0 ? "#4a5568" : "#c22f48",
										cursor: selectedIds.length === 0 ? "not-allowed" : "pointer"
									}}
								>
									<Trash2 size={18} /> 删除 ({selectedIds.length})
								</button>
								<button 
									className="btn-start-match" 
									onClick={() => handleExportMatch(selectedIds)}
									disabled={selectedIds.length === 0}
									style={{ 
										padding: "10px 20px", display: "flex", alignItems: "center", gap: "8px", fontSize: "1rem",
										opacity: selectedIds.length === 0 ? 0.5 : 1,
										cursor: selectedIds.length === 0 ? "not-allowed" : "pointer"
									}}
								>
									<Share size={18} /> 导出 ({selectedIds.length})
								</button>
							</>
						) : (
							<div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "20px"}}>
								<button 
									className="btn-secondary" 
									onClick={() => {
										setIsBulkSelecting(true);
										if (isBulkSelecting) setSelectedIds([]);
									}}
									style={{ padding: "10px 20px", display: "flex", alignItems: "center", gap: "8px", fontSize: "1rem" }}
								>
									批量管理
								</button>
								<button 
									className="btn-start-match" 
									onClick={handleToggleConfig}
									style={{ padding: "10px 20px", display: "flex", alignItems: "center", gap: "8px", fontSize: "1rem" }}
								>
									<Plus size={20} strokeWidth={2.5} /> 新建赛制
								</button>
							</div>
						)}
					</div>
				</div>

				<div style={{ display: "flex", flexDirection: "column", gap: "16px", margin: "0 auto" }}>
					{matches.length === 0 && (
						<div style={{ textAlign: "center", padding: "40px", color: "var(--alt-blue)" }}>还没有任何赛制，点击右上角新建一个吧！</div>
					)}

					{matches.map((m) => {
						const isSelected = selectedIds.includes(m.id);
						return (
							<div
								key={m.id}
								onClick={() => handleCardClick(m.id)}
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
									{isBulkSelecting ? (
										<div style={{ display: "flex", alignItems: "center" }}>
											{isSelected ? (
												<CheckSquare size={20} color="var(--sky-blue)" />
											) : (
												<Square size={20} color="var(--diag-light)" />
											)}
										</div>
									) : (
										<FileText size={20} color={isSelected ? "var(--sky-blue)" : "var(--diag-light)"} />
									)}
									<span style={{ color: isSelected ? "#fff" : "#e2e8f0", fontSize: "1.15rem", fontWeight: "500" }}>
										{m.name || "未命名赛制"}
									</span>
								</div>
								
								{!isBulkSelecting && (
									<div style={{ display: "flex", flexDirection: "row", gap: "10px" }}>
										<button
											onClick={(e) => { e.stopPropagation(); handleExportMatch([m.id])}}
											className="btn-icon"
											style={{ "--btn-theme": "var(--alt-blue)" } as React.CSSProperties}
										>
											<Share size={20} />
										</button>
										<button
											onClick={(e) => { e.stopPropagation(); setDeletingIds([m.id]); }}
											className="btn-icon"
											style={{ "--btn-theme": "#c22f48" } as React.CSSProperties}
										>
											<Trash2 size={20} style={{ transform: "translateY(1px)" }} />
										</button>
									</div>
								)}
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
					transform: !isBulkSelecting && selectedIds.length === 1 ? "translateX(0)" : "translateX(100%)",
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
							onBack={() => setSelectedIds([])}
							onSave={handleUpdateStage}
						/> 
					</div>
				)}
			</div>

			<Dialog 
				open={deletingIds.length > 0} 
				onClose={() => setDeletingIds([])}
			>
				<DialogTitle style={{ margin: "0 0 12px 0", color: "#f8fafc" }}>确认删除 {deletingIds.length} 个赛制？</DialogTitle>
				<DialogContent>
					<DialogContentText style={{ color: 'var(--diag-light)' }}>
						该操作无法撤销，与其相关的所有环节配置都将被永久移除。
					</DialogContentText>
				</DialogContent>
				<DialogActions style={{ display: "flex", justifyContent: "flex-end", gap: "12px", padding: "16px 24px" }}>
					<Button onClick={() => setDeletingIds([])} sx={{ color: 'var(--diag-light)', border: "1px solid var(--diag-alt)" }}>
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
			>
				<DialogTitle sx={{ margin: "0 0 12px 0", color: "var(--lgt-blue)" }}>
					发现同名赛制
				</DialogTitle>
				<DialogContent>
					<DialogContentText sx={{ color: 'var(--diag-light)' }}>
						导入的文件中，包含已经存在于库中的赛制。
						<br/><br/>
						继续导入将<strong>覆盖</strong>原有的配置，是否继续？
					</DialogContentText>
				</DialogContent>
				<DialogActions sx={{ padding: "16px 24px" }}>
					<Button onClick={handleCancelImport} sx={{ color: 'var(--diag-light)', border: "1px solid var(--diag-alt)" }}>
						取消
					</Button>
					<Button 
						onClick={() => pendingImport && executeImport(pendingImport)} 
						variant="contained" 
						sx={{ backgroundColor: 'var(--std-blue)', '&:hover': { backgroundColor: '#3956fa'}, color: 'white', fontWeight: 'bold' }}
					>
						确认覆盖
					</Button>
				</DialogActions>
			</Dialog>
		</div>
	);
}