import { useState, useEffect, useRef } from "react";
import Timer from "../components/Timer";
import { DebateStage } from "../types";
import * as configManager from "../utils/configManager";
import { ChevronLeft, ChevronRight } from "lucide-react";
import MatchCard from "../components/MatchCard";
import { Maximize, Minimize } from "lucide-react";

function Runner() {
	const [isFullScreen, setIsFullscreen] = useState(false);
	const [isPlaying, setIsPlaying] = useState(false);
	const [currIndex, setCurrIndex] = useState(0);
	const [activeSide, setActiveSide] = useState<"left" | "right" | "none">("none");
	const [resetKey, setResetKey] = useState(0);
	const [matches, setMatches] = useState<any[]>([]);
	const [selectedId, setSelectedId] = useState("");

	const fullScreenContainer = useRef<HTMLDivElement>(null);

	const selectedMatch = matches.find((m) => m.id === selectedId);
	const stages: DebateStage[] = selectedMatch?.stages || [];

	const currStage = stages[currIndex]; 
	const isFirstPage = currIndex === 0;
	const isLastPage = stages.length > 0 && currIndex === stages.length - 1;
	const bText = activeSide === 'none' ? "开始环节" : "切换发言";

	const handleSelectMatch = (id: string) => {
		setSelectedId(id === selectedId ? "" : id);
		setCurrIndex(0); 
		setActiveSide("none");
	};

	const handleNext = () => {
		if (!isLastPage) setCurrIndex((prev) => prev + 1);
		setActiveSide("none");
		setResetKey((prev) => prev + 1);
	}

	const handlePrev = () => {
		if (!isFirstPage) setCurrIndex((prev) => prev - 1);
		setActiveSide("none");
		setResetKey((prev) => prev + 1);
	}

	const handleExit = () => {
		setIsPlaying(false);
		setCurrIndex(0);
		if (document.fullscreenElement) {
			document.exitFullscreen();
		}
	}

	const toggleFullScreen = async () => {
		if (!document.fullscreenElement) {
			if (fullScreenContainer.current) {
				await fullScreenContainer.current.requestFullscreen().catch(err => {
					console.log("Failed to request fullscreen", err);
					alert(`请求全屏失败，请将此弹窗截图发送给维护人员: \n${err}`)
				})
			}
		} else {
			if (document.exitFullscreen) {
				await document.exitFullscreen();
			}
		}
	}

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
			alert(`赛制加载发生错误，请将此弹窗截图发送给维护人员:\n${error}`);
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
		}

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
				toggleFullScreen;
		}
	};
	window.addEventListener('keydown', handleKeyDown);

	return () => {
		window.removeEventListener('keydown', handleKeyDown);
	};
	}, [handlePrev, handleNext, handleExit, setActiveSide, isFirstPage, isLastPage, currStage, activeSide]);

	const renderCurrStage = () => {
	if (!currStage) return null;
	switch (currStage.type) {
		case "single":
			return (
				<div style={{width: "400px"}}>
					<Timer
						key={`single-${resetKey}`}
						title={currStage.title}
						initialSeconds={currStage.timeLimit}
						isRunning={activeSide === "left"}
						onStart={() => setActiveSide("left")}
						onPause={() => setActiveSide("none")}
					/>
				</div>
			);
		case "double":
			return (
				<div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
					<div style={{ display: "flex", gap: "2rem", width: "800px" }}>
					<Timer 
						key={`left-${resetKey}`}
						title="正方" 
						initialSeconds={currStage.leftTimeLimit} 
						isRunning={activeSide === "left"}
						onStart={() => setActiveSide("left")}
						onPause={() => setActiveSide("none")}
					/>
					<Timer 
						key={`right-${resetKey}`}
						title="反方" 
						initialSeconds={currStage.rightTimeLimit} 
						isRunning={activeSide === "right"}
						onStart={() => setActiveSide("right")}
						onPause={() => setActiveSide("none")}
					/>
					</div>
				</div>
			);
		case "free":
			return (
				<div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
					<div style={{ display: "flex", gap: "2rem", width: "800px" }}>
					<Timer 
						key={`left-${resetKey}`}
						title="正方" 
						initialSeconds={currStage.leftTimeLimit} 
						isRunning={activeSide === "left"}
						onStart={() => setActiveSide("left")}
						onPause={() => setActiveSide("none")}
					/>
					<Timer 
						key={`right-${resetKey}`}
						title="反方" 
						initialSeconds={currStage.rightTimeLimit} 
						isRunning={activeSide === "right"}
						onStart={() => setActiveSide("right")}
						onPause={() => setActiveSide("none")}
					/>
					</div>
				</div>
			);
		case "none":
			return (
				<h2>{currStage.title}</h2>
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
					style={{ 
						width: "100%", 
						height: "100%", 
						overflowY: "auto",
						overflowX: "hidden",
						padding: "10px 4vw", 
						boxSizing: "border-box",
						background: "var(--bg)"
					}}
				>
					<h1 style={{
						color: "white"
					}}>
						赛制选择
					</h1>
					<div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "1200px", margin: "0 auto" }}>
						{matches.map((m) => (
							<MatchCard 
								key={m.id}
								m={m}
								isExpanded={selectedId === m.id}
								onToggle={() => handleSelectMatch(m.id)}
								onStartMatch={() => setIsPlaying(true)}
							/>
						))}
					</div>
				</div>
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
			className="btn-fullscreen"
			onClick={toggleFullScreen}
			title={isFullScreen ? "退出全屏" : "全屏模式"}
		>
			{isFullScreen ? <Minimize size={20} /> : <Maximize size={20} />}
		</button>
		<div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", width: "100%", padding: "1rem", boxSizing: "border-box" }}>
			{/* stage indicator */}
			<h3 style={{ 
				textAlign: "center", 
				color: "var(--alt-blue)", 
				userSelect: "none" }}
			>
				当前环节 {stages.length > 0 ? currIndex + 1 : 0} / {stages.length} : {currStage?.title || "暂无环节"}
			</h3>

			{/* render current stage */}
			<div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center"}}>
				{renderCurrStage()}
			</div>

			{/* bottom nav bar */}
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
							全局重置
						</button>
					)}
				</div>
				<div style={{flex: 1, display: "flex", justifyContent: "right", gap: "1rem"}}>
					<button className="btn" onClick={handleNext} disabled={isLastPage}>
						下一环节 <ChevronRight size={20} />
					</button>
				</div>
			</div>
		</div>
	</div>
	);
}

export default Runner;