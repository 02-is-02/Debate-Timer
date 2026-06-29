import { LoadingButton } from "@mui/lab";
import { Button, CircularProgress } from "@mui/material";
import { invoke } from "@tauri-apps/api/core";
import { useToast } from "../utils/Context";
import { useState, useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { DebateStages } from "../schema";

interface RemoteRoom {
	match_id: string;
	ticket: any;
	config: {
		title: string;
		leftName: string;
		rightName: string;
		stages: DebateStages;
	};
}

interface JoinRoomProps {
	isActive: boolean;
	toggleActive: () => void;
	onJoinSuccess: (matchId: string, roomConfig: any) => void; 
}

export default function JoinRoomConfig({ isActive, toggleActive, onJoinSuccess }: JoinRoomProps) {
	const [id, setId] = useState("");
	const [isConnecting, setIsConnecting] = useState(false);
	
	const [remoteRooms, setRemoteRooms] = useState<RemoteRoom[]>([]);
	const [isLoadingRooms, setIsLoadingRooms] = useState(false);

	const { showToast } = useToast();

	useEffect(() => {
		if (isActive) {
			fetchActiveRooms();
			setId(""); 
		}
	}, [isActive]);

	const fetchActiveRooms = async () => {
		setIsLoadingRooms(true);
		try {
			const list: RemoteRoom[] = await invoke('list_remote_rooms', {});
			setRemoteRooms(list);
		} catch (e) {
			showToast(`拉取大厅失败: ${e}`, "error");
		} finally {
			setIsLoadingRooms(false);
		}
	};

	const handleJoinSubmit = async () => {
		if (!id.trim()) {
			showToast("请先选择一个房间", "warning");
			return;
		}

		setIsConnecting(true);
		try {
			await invoke("start_viewer_client", { matchId: id.trim() });
			
			showToast(`成功连接到房间: ${id}`, "success");
			
			const roomData = remoteRooms.find(r => r.match_id === id);
			onJoinSuccess(id, roomData?.config); 
			
			toggleActive();
		} catch (e) {
			showToast(`连线失败: ${e}`, "error");
		} finally {
			setIsConnecting(false);
		}
	};

	return (
		<div className={`overlay config ${isActive ? "active" : ""}`}>
			<div className={`config-window ${isActive ? "active" : ""}`} style={{ display: "flex", flexDirection: "column", gap: "20px", width: "500px" }}>
				
				<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
					<h2 style={{ fontSize: "1.8rem", margin: "0", color: "white" }}>加入比赛房间</h2>
					<button className="btn-icon" onClick={fetchActiveRooms} disabled={isLoadingRooms}>
						<RefreshCw size={20} className={isLoadingRooms ? "spin" : ""} style={{ color: "var(--alt-blue)" }} />
					</button>
				</div>

				<div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "10px" }}>
					
					{isLoadingRooms ? (
						<div style={{ display: "flex", justifyContent: "center", padding: "20px" }}>
							<CircularProgress size={30} sx={{ color: "var(--std-blue)" }} />
						</div>
					) : remoteRooms.length === 0 ? (
						<p className="mini-label" style={{ textAlign: "center", padding: "20px" }}>
							暂无公开的活跃房间
						</p>
					) : (
						<div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "250px", overflowY: "auto" }} className="hide-scrollbar">
							{remoteRooms.map((room) => {
								const isSelected = id === room.match_id;
								return (
									<div 
										key={room.match_id}
										onClick={() => setId(room.match_id)}
										className="stage-card"
										style={{ 
											cursor: "pointer",
											padding: "10px 20px",
											border: isSelected ? "1px solid var(--std-blue)" : "1px solid transparent",
											background: isSelected ? "rgba(59, 130, 246, 0.1)" : undefined
										}}
									>
										<div style={{ width: "100%" }}>
											<div style={{ color: "white", fontWeight: "bold", display: "flex", justifyContent: "space-between" }}>
												<span>{room.config.title || "未命名赛制"}</span>
												<span style={{ fontSize: "0.8rem", color: "var(--std-blue)" }}>{room.config.stages?.stages.length || 0} 环节</span>
											</div>
											<div className="mini-label" style={{ marginTop: "4px" }}>
												房间号: {room.match_id} | {room.config.leftName} VS {room.config.rightName}
											</div>
										</div>
									</div>
								)
							})}
						</div>
					)}
				</div>

				<div
					style={{
						display: "flex", flexDirection: "row", gap: "12px",
						justifyContent: "right", marginTop: "auto", paddingTop: "8px"
					}}
				>
					<Button 
						onClick={toggleActive} 
						sx={{ color: '#94a3b8', border: "1px solid rgba(255,255,255,0.2)" }}
					>
						取消
					</Button>
					<LoadingButton
						loading={isConnecting}
						onClick={handleJoinSubmit}
						variant="contained" 
						sx={{ 
							backgroundColor: 'var(--std-blue, #3b82f6)', 
							'&:hover': { backgroundColor: 'var(--sky-blue, #60a5fa)'}, 
							color: 'white', fontWeight: 'bold', boxShadow: "none"
						}}
					>
						连线并加入
					</LoadingButton>
				</div>
			</div>
		</div>
	);
}