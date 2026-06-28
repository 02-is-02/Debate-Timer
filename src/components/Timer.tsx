import { useState, useEffect } from "react";
import useSound from "use-sound";
import bellSfx from '../assets/bell.mp3';
import tickSfx from '../assets/tick.mp3';

interface TimerProps {
	title?: string; //timer title
	initialSeconds: number;
	isRunning: boolean;
	isHost: boolean;
	onStart: () => void;
	onPause: () => void;
}

export default function Timer({
	title,
	initialSeconds,
	isRunning,
	isHost,
	onStart,
	onPause
}: TimerProps) {
	const [timeLeft, setTimeLeft] = useState(initialSeconds);
	const [bell] = useSound(bellSfx, { volume: 0.8 });
	const [tick, { stop: stopTick }] = useSound(tickSfx, { volume: 0.5 });

	useEffect(() => {
		if (!isRunning) stopTick();
	}, [isRunning, stopTick])

	useEffect(() => {
		if (!isRunning) return;

		const timerId = window.setInterval(() => {
			setTimeLeft((prevSeconds) => {
				if (prevSeconds <= 0) return 0;
				const nextTime = prevSeconds - 1;
				if (nextTime === 30) {
					bell();
				} else if (nextTime === 5) {
					tick();
				} else if (nextTime === 0) {
					stopTick();
					bell();
					setTimeout(() => bell(), 500);
				}
				return nextTime;
			});
		}, 1000);

		return () => clearInterval(timerId);

	}, [isRunning]);

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
			width: "100%",
			height: "100%",
			display: "flex",
			flexDirection: "column",
			justifyContent: "center",
			alignItems: "center",
			boxSizing: "border-box",
			padding: "1vh 0" 
		}}>
			{title && (
				<h2 style={{ 
					color: "white", 
					margin: "0 0 1.5vh 0", 
					fontSize: "clamp(2.0rem, 2.5vh, 3.7rem)",
					fontWeight: 600
				}}>
					{title}
				</h2>
			)}

			{/* SVG Timer  */}
			<div style={{
				width: "100%", 
				flex: 1,
				display: "flex",
				justifyContent: "center",
				alignItems: "center",
				maxHeight: "45vh",
			}}>
				<svg viewBox="0 0 100 30" style={{ width: "100%", height: "auto" }}>
					<text 
						x="50%" 
						y="50%" 
						dominantBaseline="middle" 
						textAnchor="middle" 
						fontSize={24} 
						fontWeight="bold" 
						fill={timeLeft <= 30 ? "#ef4444" : "white"}
					>
						{formatTime(timeLeft)}
					</text>
				</svg>
			</div>

			{/* Controls */}
			{isHost && (
				<div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", marginTop: "2vh" }}>
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
			)}
		</div>
	)
}