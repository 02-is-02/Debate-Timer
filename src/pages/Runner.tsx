import { useState } from "react";
import Timer from "../components/Timer";
import GlobalControls from "../components/GlobalControls";
import { DebateStage } from "../types";

interface RunnerProps {
	stages: DebateStage[];
}

function Runner({stages}: RunnerProps) {
	const [isPlaying, setIsPlaying] = useState(false);
	const [currIndex, setCurrIndex] = useState(0);
	const [activeSide, setActiveSide] = useState<"left" | "right" | "none">("none");
	const [resetKey, setResetKey] = useState(0);

	const currStage = stages[currIndex];
	const isFirstPage = currIndex === 0;
	const isLastPage = currIndex === stages.length - 1;

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
						<GlobalControls 
						activeSide={activeSide} 
						onSwitch={() => setActiveSide(activeSide === "none" ? (currStage.start || "left") : (activeSide === "left" ? "right" : "left"))} 
						onGlobalReset={() => { setActiveSide("none"); setResetKey((prev) => prev + 1); }}
						/>
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
			// Config Page Or EDITOR
			<div></div>
		);
	}

	return (
		<div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", padding: "2rem"}}>
			{/* stage indicator */}
			<h3 style={{ textAlign: "center", color: "#666"}}>
				当前环节 {currIndex + 1} / {stages.length} : {currStage.title}
			</h3>

			{/* render current stage */}
			<div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center"}}>
				{renderCurrStage()}
			</div>

			{/* bottom nav bar */}
			<div style={{display: "flex", justifyContent: "space-between", marginTop: "2rem", borderTop: "1px solid #eee", paddingTop: "1rem"}}>
				<button className="btn" onClick={handlePrev} disabled={isFirstPage}>
					⏮ 上一环节
				</button>
				<button className="btn" onClick={handleExit}>
					退出比赛
				</button>
				<button className="btn" onClick={handleNext} disabled={isLastPage}>
					下一环节 ⏭
				</button>
			</div>
		</div>
	);
}

export default Runner;