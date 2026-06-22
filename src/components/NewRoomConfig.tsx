import { LoadingButton } from "@mui/lab";
import { TextField, Box, Stack, Chip, Button } from "@mui/material";
import { invoke } from "@tauri-apps/api/core";
import { useToast } from "../utils/Context";
import { useState } from "react";

interface RemoteRoom {
	match_id: string;
	ticket: any;
	config: {
		title: string;
		stages: any[];
	};
}

interface NewRoomConfigProps {
	isActive: boolean,
	toggleActive: () => void,
	handleJoin: () => void
} 

export default function ({ isActive, toggleActive }: NewRoomConfigProps) {
	const [id, setId] = useState("");
	const [isConnecting, setIsConnecting] = useState(false);

	const [remoteRooms, setRemoteRooms] = useState<RemoteRoom[]>([]);
	const [isLoadingRooms, setIsLoadingRooms] = useState(false);
	const [showRoomList, setShowRoomList] = useState(false);

	const { showToast } = useToast();

	const fetchActiveRooms = async () => {
		setIsLoadingRooms(true);
		try {
			const list: RemoteRoom[] = await invoke("list_remote_rooms");
			setRemoteRooms(list);
		} catch (e) {
			showToast(`拉取房间大厅失败: ${e}`, "error");
		} finally {
			setIsLoadingRooms(false);
		}
	};

	const handleSelectAndJoinRoom = async (room: RemoteRoom) => {
		try {
			showToast(`已成功顺着 Iroh 管道直连房间: ${room.match_id}`, "success");
		} catch (e) {
			showToast(`连线失败: ${e}`, "error");
		}
	};

	const handleClose = () => {
		toggleActive();
	}

	return (
		<div className={`overlay config ${isActive ? "active" : ""}`}>
			<div className={`config-window ${isActive ? "active" : ""}`} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
				<h2 style={{ fontSize: "2rem", margin: "0", color: "white", flexShrink: 0 }}>新建赛制</h2>
				
				

				<div
					style={{
						display: "flex",
						flexDirection: "row",
						gap: "12px",
						justifyContent: "right",
						marginTop: "auto",
						paddingTop: "8px"
					}}
				>
					<Button 
						onClick={() => handleClose()} 
						sx={{ color: '#94a3b8', border: "1px solid rgba(255,255,255,0.2)" }}
					>
						取消
					</Button>
					<LoadingButton
						onClick={() => handleConnect()}
						loading={isConnecting}
						variant="contained" 
						sx={{ 
							backgroundColor: 'var(--std-blue, #3b82f6)', 
							'&:hover': { backgroundColor: 'var(--sky-blue, #60a5fa)'}, 
							color: 'white', 
							fontWeight: 'bold',
							boxShadow: "none",
							gap: "5px"
						}}
					>
						加入房间
					</LoadingButton>
				</div>
			</div>
		</div>
	);
}