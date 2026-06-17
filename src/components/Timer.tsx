import { useState, useEffect } from "react";
import useSound from "use-sound";
import bellSfx from '../assets/bell.mp3';
import tickSfx from '../assets/tick.mp3';

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
	const [bell] = useSound(bellSfx, { volume: 0.8 });
	const [tick, { stop: stopTick }] = useSound(tickSfx, { volume: 0.5 });

	useEffect(() => {
		if (!isRunning) {
			stopTick();
		}
	}, [isRunning, stopTick])

	useEffect(() => {
		let timerId: number;

		if (isRunning && timeLeft > 0) {
			timerId = window.setInterval(() => {
				const nextTime = timeLeft - 1;
				if (nextTime === 30) {
					bell();
				} else if ( nextTime === 5 ) {
					tick();
				} else if ( nextTime === 0 ) {
					stopTick()
					bell();
					setTimeout(() => bell(), 500);
				}
				setTimeLeft(nextTime);
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
			{title && <h2 style={{ color: "white", margin: "0 0 1rem 0"}}>{title}</h2>}

			{/* timer */}
			<div style={{
					width: "100%", 
					maxWidth: "300px", 
					margin: "0 auto"
				}}
			>
				<svg viewBox="0 0 100 30" style={{width: "100%", height: "auto"}}>
					<text 
						x="50%" 
						y="50%" 
						dominantBaseline="middle" 
						textAnchor="middle" 
						fontSize={24} 
						fontWeight="bold" 
						fill={timeLeft <= 30 ? "red" : "white"}
					>
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