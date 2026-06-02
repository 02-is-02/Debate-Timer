import { useState, useEffect } from "react";

interface TimerProps {
	title?: string; //timer title
	initialSeconds: number;
	isRunning: boolean;
	onStart: () => void;
	onPause: () => void;
}

export default function Timer({
	title,
	initialSeconds,
	isRunning,
	onStart,
	onPause
}: TimerProps) {
	const [timeLeft, setTimeLeft] = useState(initialSeconds);


	useEffect(() => {
		let timerId: number;

		if (isRunning && timeLeft > 0) {
			timerId = window.setInterval(() => {
				setTimeLeft((prev) => (prev <= 1 ? 0 : prev - 1));
			}, 1000)
		}
		return () => clearInterval(timerId) 
	}, [isRunning, timeLeft]);

	const formatTime = (secs: number) => {
		const m = Math.floor(secs/60);
		const s = secs % 60;
		return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
	};

	const handleReset = () => {
		onPause();
		setTimeLeft(initialSeconds);
	}

	return (
		<div style={{
			padding: "1.5rem", 
			textAlign: "center",
			margin: "1rem"
		}}>
			{/* title */}
			{title && <h2 style={{ margin: "0 0 1rem 0"}}>{title}</h2>}

			{/* timer */}
			<div style={{width: "100%", maxWidth: "300px", margin: "0 auto"}}>
				<svg viewBox="0 0 100 30" style={{width: "100%", height: "auto"}}>
					<text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontSize={24} fontWeight="bold" fill={timeLeft <= 30 ? "red" : "currentColor"}>
						{formatTime(timeLeft)}
					</text>
				</svg>
			</div>

			{/* controls */}
			<div style={{ display: "flex", gap: "0.5rem", justifyContent: "center", marginTop: "1.5rem" }}>
				<button className="btn" onClick={onStart} disabled={isRunning || timeLeft === 0}>
					开始
				</button>
				<button className="btn" onClick={onPause} disabled={!isRunning}>
					暂停
				</button>
				<button className="btn" onClick={handleReset}>
					重置
				</button>
			</div>
		</div>
	)
}