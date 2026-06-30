import { useState, useEffect, useRef } from "react";
import Timer from "../components/Timer";
import { DebateStage } from "../schema";
import * as configManager from "../utils/configManager";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import MatchCard from "../components/MatchCard";
import { Maximize, Minimize } from "lucide-react";
import { useToast } from "../utils/Context";
import { useLayoutContext } from "../components/Layout";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { UnlistenFn } from "@tauri-apps/api/event";
import JoinRoomConfig from "../components/JoinRoomConfig";

function Runner() {
	const [isFullScreen, setIsFullscreen] = useState(false);
	const [currIndex, setCurrIndex] = useState(0);
	const [activeSide, setActiveSide] = useState<"left" | "right" | "none">("none");
	const [resetKey, setResetKey] = useState(0);
	const [matches, setMatches] = useState<any[]>([]);
	const [selectedId, setSelectedId] = useState("");
	const [activeRoomId, setActiveRoomId] = useState("");
	const [showJoin, setShowJoin] = useState(false)
	const [title, setTitle] = useState("");
	const [leftName, setLeftName] = useState("");
	const [rightName, setRightName] = useState("");
	const [stageZoom, setStageZoom] = useState(1);
	const [isHost, setIsHost] = useState(false);

	const { showToast } = useToast();
	const { setAllowDndWindow, isRunning: isPlaying, setIsRunning: setIsPlaying } = useLayoutContext()

	const fullScreenContainer = useRef<HTMLDivElement>(null);
	const scrollContainer = useRef<HTMLDivElement>(null);
	const focusRef = useRef<{ [key: string]: HTMLDivElement | null}>({});

	const selectedMatch = matches.find((m) => m.id === selectedId);
	const stages: DebateStage[] = selectedMatch?.stages || [];
	const currStage = stages[currIndex]; 
	const isFirstPage = currIndex === 0;
	const isLastPage = stages.length > 0 && currIndex === stages.length - 1;
	const bText = activeSide === 'none' ? "开始环节" : "切换发言";

	const handleSelectMatch = (id: string, index: number) => {
		const isClosing = id === selectedId; 

		if (isClosing) {
			setSelectedId("");
			setCurrIndex(0); 
			setActiveSide("none");
			return;
		}

		const target = focusRef.current[id];
		let targetScrollTop = target ? target.offsetTop : 0;

		const currOpenIndex = matches.findIndex(m => m.id === selectedId);

		if (currOpenIndex !== -1 && currOpenIndex < index) {
			targetScrollTop -= 430;
		}

		setSelectedId(id);
		setCurrIndex(0); 
		setActiveSide("none");

		setTimeout(() => {
			if (scrollContainer.current) {
				scrollContainer.current.scrollTo({
					behavior: "smooth",
					top: Math.max(0, targetScrollTop - 20)
				});
			}
		}, 10);
	};

	const handleJoin = (roomConfig: any) => {
		setTitle(roomConfig.title);
		setLeftName(roomConfig.leftName);
		setRightName(roomConfig.rightName);

		setMatches([roomConfig.match]); 
		setSelectedId(roomConfig.match.id);

		setIsHost(false);
		setIsPlaying(true);
	}

	const handleStart = async (title: string, leftN: string, rightN: string, isCreatingRoom: boolean) => {
		let currRoomId = selectedId;
		if (isCreatingRoom) {
			const handleCreateRoom = async () => {
				try {
					const matchConfig = {
						title: title,
						leftName: leftN,
						rightName: rightN,
						match: selectedMatch
					}
					currRoomId = `R-${crypto.randomUUID()}`;
					const matchJson = JSON.stringify(matchConfig);

					await invoke('create_host_room', { matchId: currRoomId, matchJsonStr: matchJson })
				} catch (e) {
					showToast("房间创建失败", 'error');
					return;
				}
			}

			await handleCreateRoom();
		}

		setActiveRoomId(currRoomId);
		setTitle(title);
		setLeftName(leftN);
		setRightName(rightN);
		setIsHost(true);
		setIsPlaying(true);
	}

	const handleNext = () => {
		if (!isLastPage) setCurrIndex((prev) => prev + 1);
		setActiveSide("none");
		setResetKey((prev) => prev + 1);
	};

	const handlePrev = () => {
		if (!isFirstPage) setCurrIndex((prev) => prev - 1);
		setActiveSide("none");
		setResetKey((prev) => prev + 1);
	};

	const handleExit = async () => {
		setIsPlaying(false);
		setCurrIndex(0);
		if (document.fullscreenElement) {
			document.exitFullscreen();
		}
		try {
			await invoke('close_host_room', { matchId: activeRoomId });
			console.log("room closed");
		}	catch (e) {
			console.error("解散房间出错:", e);
		}
		setIsHost(false);
	};

	const toggleFullScreen = async () => {
		if (!document.fullscreenElement) {
			if (fullScreenContainer.current) {
				await fullScreenContainer.current.requestFullscreen().catch(err => {
					console.log("Failed to request fullscreen", err);
					showToast('请求全屏失败', 'error')
				})
			}
		} else {
			if (document.exitFullscreen) {
				await document.exitFullscreen();
			}
		}
	};

	useEffect(() => {
		setAllowDndWindow(!isPlaying);

		return () => {
			setAllowDndWindow(true);
		};
	}, [isPlaying, setAllowDndWindow]);

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
			showToast("赛制加载发生错误", 'error');
		}
	}
	loadData();
	}, []);

	useEffect(() => {
		const handleFullScreenChange = () => {
			setIsFullscreen(!!document.fullscreenElement);
		};
		document.addEventListener('fullscreenchange', handleFullScreenChange);
		return () => document.removeEventListener('fullscreenchange', handleFullScreenChange);
	}, []);

	useEffect(() => {
	const handleKeyDown  = (e: KeyboardEvent) => {
		if (e.key === 'Escape') handleExit();
		if (!isHost) return;
		if (e.repeat) return;
		if (e.ctrlKey || e.altKey || e.metaKey) return;

		const target = e.target as HTMLElement;
		if (
			target.tagName === "INPUT" || 
			target.tagName === "TEXTAREA" ||
			target.tagName === "SELECT" ||
			target.isContentEditable
		) {
			return;
		};

		switch (e.key) {
			case 'ArrowLeft':
				if (!isFirstPage) handlePrev();
				break;
			case 'ArrowRight':
				if (!isLastPage) handleNext();
				break;
			case 'Escape':
				handleExit();
				break;
			case ' ':
				e.preventDefault();
				if (!currStage) return; 
				switch (currStage.type) {
					case 'free':
						setActiveSide(activeSide === "none" ? (currStage.start || "left") : (activeSide === "left" ? "right" : "left"));
						break;
					case 'double':
						setActiveSide(activeSide === "none" ?  "left" : (activeSide === "left" ? "right" : "left"));
						break;
					case 'single':
						setActiveSide(activeSide === 'none' ? 'left' : 'none');
						break;
					case 'none':
						break;
				}
				break;
			case ',':
			case '<':
				if (currStage) setActiveSide('left');
				break;
			case '.':
			case '>':
				if (currStage) setActiveSide('right');
				break;
			case 'F11':
				toggleFullScreen();
		}
	};
	window.addEventListener('keydown', handleKeyDown);

	return () => {
		window.removeEventListener('keydown', handleKeyDown);
	};
	}, [handlePrev, handleNext, handleExit, setActiveSide, isFirstPage, isLastPage, currStage, activeSide]);

	useEffect(() => {
		if (!isPlaying) return;
		const handleProjectorZoom = () => {
			const DESIGN_WIDTH = 1280;
			const DESIGN_HEIGHT = 720;

			const clientW = window.innerWidth;
			const clientH = window.innerHeight;

			const scaleW = clientW / DESIGN_WIDTH;
			const scaleH = clientH / DESIGN_HEIGHT;

			let ratio = Math.min(scaleH, scaleW);

			ratio = Math.max(ratio, 0.5);

			setStageZoom(ratio);
		};

		handleProjectorZoom()
		window.addEventListener('resize', handleProjectorZoom);
		return () => window.removeEventListener('resize', handleProjectorZoom);
	}, [isPlaying]);

	useEffect(() => {
		let unlisten: UnlistenFn | undefined;

		const setupWindowCloseInterceptor = async () => {
		const appWindow = getCurrentWindow();
		
		unlisten = await appWindow.onCloseRequested(async (event) => {
			if (isHost && selectedId) {
			event.preventDefault();
			try {
				await invoke('close_host_room', { matchId: activeRoomId });
			} catch (e) {
				console.error(e);
			}
			await appWindow.destroy();
			}
		});
		};

		setupWindowCloseInterceptor();
		return () => {
			if (unlisten) {
				unlisten();
			}
			if (isHost && selectedId) {
				invoke('close_host_room', { matchId: activeRoomId }).catch(console.error);
			}
		};
	}, [selectedId, isHost]);

	const renderCurrStage = () => {
		if (!currStage) return null;
		switch (currStage.type) {
			case "single":
				return (
					<div style={{width: "600px"}}>
						<Timer
							key={`single-${resetKey}`}
							title={currStage.title}
							initialSeconds={currStage.timeLimit}
							isRunning={activeSide === "left"}
							isHost={isHost}
							onStart={() => setActiveSide("left")}
							onPause={() => setActiveSide("none")}
						/>
					</div>
				);
			case "double":
			case "free":
				return (
					<div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
						<div style={{ display: "flex", gap: "2rem", width: "1000px" }}>
						<Timer 
							key={`left-${resetKey}`}
							title="正方" 
							initialSeconds={currStage.leftTimeLimit} 
							isRunning={activeSide === "left"}
							isHost={isHost}
							onStart={() => setActiveSide("left")}
							onPause={() => setActiveSide("none")}
						/>
						<Timer 
							key={`right-${resetKey}`}
							title="反方" 
							initialSeconds={currStage.rightTimeLimit} 
							isRunning={activeSide === "right"}
							isHost={isHost}
							onStart={() => setActiveSide("right")}
							onPause={() => setActiveSide("none")}
						/>
						</div>
					</div>
				);
			case "none":
				return (
					<h2 style={{ 
						color: "white", 
						margin: "0 0 1.5vh 0", 
						fontSize: "clamp(4.0rem, 2.5vh, 5.7rem)",
						fontWeight: 600
						}}
					>
						{currStage.title}
					</h2>
				);
			default:
				return (
					<div>Unknown</div>
				);
		}
	};

	if (!isPlaying) {
		return (
			<div className="container" style={{ overflow: "hidden" }}>
				<div 
					className="hide-scrollbar"
					ref={scrollContainer}
					style={{ 
						position: "relative",
						width: "100%", 
						height: "100%", 
						overflowY: "auto",
						overflowX: "hidden",
						padding: "25px 4vw 700px 4vw", 
						boxSizing: "border-box",
						background: "var(--bg)",
						scrollPaddingTop: "20px"
					}}
				>
					<div style={{ margin: "0 auto 24px auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
						<h1 style={{
							color: "white",
							margin: 0, 
							fontSize: "2rem"
						}}>
							赛制选择
						</h1>
						<button 
							className="btn-secondary" 
							onClick={() => setShowJoin(true)}
							style={{ padding: "10px 20px", display: "flex", alignItems: "center", gap: "8px", fontSize: "1rem" }}
						>
							<Plus size={20} strokeWidth={2.5} /> 加入房间
						</button>
					</div>
					
					<div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "1200px", margin: "0 auto" }}>
						{matches.map((m, index) => (
							<MatchCard 
								key={m.id}
								ref={(elm) => {focusRef.current[m.id] = elm}}
								m={m}
								isExpanded={selectedId === m.id}
								onToggle={() => handleSelectMatch(m.id, index)}
								onStartMatch={handleStart}
								onError={(msg: string) => showToast(msg, 'error')}
							/>
						))}
					</div>
				</div>
				<JoinRoomConfig 
					isActive={showJoin} 
					toggleActive={() => setShowJoin(false)}
					onJoinSuccess={handleJoin}
				/>
			</div>
		);
	}

	return (
		<div 
			className="container" 
			ref={fullScreenContainer}
			style={{ position: "relative" }}
		>
			<button
				className="btn-icon"
				style={{
					position: "absolute",
					top: "24px",
					right: "30px",
					zIndex: 9999,
					"--btn-theme": "var(--alt-blue)"
				} as React.CSSProperties }
				onClick={toggleFullScreen}
				title={isFullScreen ? "退出全屏" : "全屏模式"}
			>
				{isFullScreen ? <Minimize size={20} /> : <Maximize size={20} />}
			</button>
			<div style={{
				zoom: stageZoom,
				width: "1280px", 
				height: "720px", 
				display: "flex", 
				flexDirection: "column", 
				padding: "32px 40px", 
				boxSizing: "border-box"
				}}
			>
				{/* stage indicator */}
				<h3 style={{ 
					textAlign: "center", 
					color: "var(--alt-blue)", 
					userSelect: "none" }}
				>
					当前环节 {stages.length > 0 ? currIndex + 1 : 0} / {stages.length} : {currStage?.title || "暂无环节"}
				</h3>

				<div style={{ display: "flex", flexDirection: "row", width: "100%", justifyContent: "space-between"}}>
					<h2 style={{ margin: 0, color: "white" }}>{leftName}</h2>
					<h2 style={{ margin: 0, color: "white" }}>{rightName}</h2>
				</div>

				{/* render current stage */}
				<div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center"}}>
					<h1 style={{ fontSize: "clamp(3rem, 10vh, 3.8rem)", margin: "0 0 8vh 0", color: "white" }}>{title}</h1>
					{renderCurrStage()}
				</div>

				{isHost && 
					// bottom nav bar
					<div style={{
						display: "flex", 
						justifyContent: "space-between", 
						alignItems: "center",
						marginTop: "2rem", 
						paddingTop: "1rem"}}>
						<div style={{flex: 1, display: "flex", justifyContent: "left", gap: "1rem"}}>
							<button className="btn" onClick={handlePrev} disabled={isFirstPage}>
								<ChevronLeft size={20} /> 上一环节
							</button>
						</div>
						<div style={{flex: 3, display: "flex", justifyContent: "center", gap: "1rem"}}>
							{currStage?.type === 'free' && (
								<button className="btn" onClick={() => setActiveSide(activeSide === "none" ? (currStage.start || "left") : (activeSide === "left" ? "right" : "left"))}>
									{bText}
								</button>
							)}
							
							<button className="btn" onClick={handleExit}>
								退出比赛
							</button>

							{currStage?.type === 'free' && (
								<button className="btn" onClick={() => { setActiveSide("none"); setResetKey((prev) => prev + 1); }}>
									环节重置
								</button>
							)}
						</div>
						<div style={{flex: 1, display: "flex", justifyContent: "right", gap: "1rem"}}>
							<button className="btn" onClick={handleNext} disabled={isLastPage}>
								下一环节 <ChevronRight size={20} />
							</button>
						</div>
					</div>
				}
			</div>
		</div>
	);
}

export default Runner;