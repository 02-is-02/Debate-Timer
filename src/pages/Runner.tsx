import { useState, useEffect } from "react";
import Timer from "../components/Timer";
import Sidebar from "../components/Sidebar";
import { DebateStage } from "../types";

interface RunnerProps {
	stages: DebateStage[];
}

function Runner({stages}: RunnerProps) {
	const [isFolded, setIsFolded] = useState(false);
	const [isPlaying, setIsPlaying] = useState(false);
	const [currIndex, setCurrIndex] = useState(0);
	const [activeSide, setActiveSide] = useState<"left" | "right" | "none">("none");
	const [resetKey, setResetKey] = useState(0);

	const currStage = stages[currIndex];
	const isFirstPage = currIndex === 0;
	const isLastPage = currIndex === stages.length - 1;
	const bText = activeSide === 'none' ? "开始环节" : "切换发言";

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
	}

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
					setActiveSide('left');
					break;
				case '.':
				case '>':
					setActiveSide('right');
					break;
			}

			
		};
		window.addEventListener('keydown', handleKeyDown);

		return () => {
			window.removeEventListener('keydown', handleKeyDown);
		};
	}, [handlePrev, 
		handleNext, 
		handleExit, 
		setActiveSide, 
		isFirstPage, 
		isLastPage,
		currStage,
		activeSide]);

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
			<div className="main-container">
				{/* Config Page Or EDITOR */}
				{/* sidebar */}
				<Sidebar isFolded={isFolded} toggleFold={() => setIsFolded(!isFolded)} activeRow={3}/>

				<div className="runner-wrapper">
					<div className="runner-config-container">
						{/* left */}
						<div className="runner-config-left">
							<h3 style={{ margin: "0 0 1.5rem 0", fontSize: "1.2rem", fontWeight: "600", letterSpacing: "1px" }}>
								赛制选择
							</h3>
							<div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
								{stages.map((stage, idx) => (
									<div key={stage.id} style={{
										padding: "12px 16px",
										background: "rgba(255,255,255,0.05)", 
										borderRadius: "8px",
										borderLeft: "4px solid #60a5fa"
									}}>
										<div style={{ fontSize: "1.1rem", fontWeight: "500" }}>
											{idx + 1}. {stage.title}
										</div>
										<div style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.7)", marginTop: "4px" }}>
											{stage.type === 'single' && `${stage.timeLimit}秒`}
											{stage.type === 'double' && `正方 ${stage.leftTimeLimit}s  |  反方 ${stage.rightTimeLimit}s`}
											{stage.type === 'free' && (
												<>
													自由辩论 <br />
													正方 {stage.leftTimeLimit}s  |  反方 {stage.rightTimeLimit}s
												</>
											)}
										</div>
									</div>
								))}
							</div>
						</div>

						{/* right */}
						<div className="runner-config-right">
							<h2 style={{ fontSize: "2rem", margin: "0 0 1rem 0" }}>控制台</h2>
							
							<div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
								<label style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.8)" }}>辩题</label>
								<input className="glass-input" placeholder="例如：人工智能是否会取代人类" />
							</div>

							<div style={{ display: "flex", gap: "20px", marginTop: "1rem" }}>
								<div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px", minWidth: "0" }}>
									<label style={{ fontSize: "0.9rem", color: "#60a5fa" }}>正方队伍</label>
									<input className="glass-input" placeholder="输入正方队名" />
								</div>
								<div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px", minWidth: "0" }}>
									<label style={{ fontSize: "0.9rem", color: "#f87171" }}>反方队伍</label>
									<input className="glass-input" placeholder="输入反方队名" />
								</div>
							</div>

							<button 
								className="btn-start-match" 
								onClick={() => setIsPlaying(true)}
							>
								启动比赛
							</button>
						</div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="main-container">
			<div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", width: "100%", padding: "1rem", boxSizing: "border-box" }}>
				{/* stage indicator */}
				<h3 style={{ textAlign: "center", color: "#666"}}>
					当前环节 {currIndex + 1} / {stages.length} : {currStage.title}
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
							⏮ 上一环节
						</button>
					</div>
					<div style={{flex: 3, display: "flex", justifyContent: "center", gap: "1rem"}}>
						{currStage.type === 'free' && (
							<button className="btn" onClick={() => setActiveSide(activeSide === "none" ? (currStage.start || "left") : (activeSide === "left" ? "right" : "left"))}>
								{bText}
							</button>
						)}
						
						<button className="btn" onClick={handleExit}>
							退出比赛
						</button>

						{currStage.type === 'free' && (
							<button className="btn" onClick={() => { setActiveSide("none"); setResetKey((prev) => prev + 1); }}>
								全局重置
							</button>
						)}
					</div>
					<div style={{flex: 1, display: "flex", justifyContent: "right", gap: "1rem"}}>
						<button className="btn" onClick={handleNext} disabled={isLastPage}>
							下一环节 ⏭
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}

export default Runner;