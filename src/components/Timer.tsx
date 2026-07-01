import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
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

export interface TimerRef {
	setTime: (seconds: number) => void;
	getTime: () => number;
}

const Timer = forwardRef<TimerRef, TimerProps>((props, ref) => {
	const [timeLeft, setTimeLeft] = useState(props.initialSeconds);
	const [reseting, setReseting] = useState(false);
	const [bell] = useSound(bellSfx, { volume: 0.8 });
	const [tick, { stop: stopTick }] = useSound(tickSfx, { volume: 0.5 });

	useImperativeHandle(ref, () => ({
		setTime(seconds: number) {setTimeLeft(seconds);},
		getTime() {return timeLeft;}
	}));

	useEffect(() => {
		if (!props.isRunning) stopTick();
	}, [props.isRunning, stopTick]);

	useEffect(() => {
		if (!props.isRunning) return;

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

	}, [props.isRunning]);

	const formatTime = (secs: number) => {
		const m = Math.floor(secs/60);
		const s = secs % 60;
		return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
	};

	const handleReset = () => {
		props.onPause();
		setTimeLeft(props.initialSeconds);
	};

	const handleCustomReset = () => {

	};

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
			{props.title && (
				<h2 style={{ 
					color: "white", 
					margin: "0 0 1.5vh 0", 
					fontSize: "clamp(2.0rem, 2.5vh, 3.7rem)",
					fontWeight: 600
				}}>
					{props.title}
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
			{props.isHost && (
				<div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", marginTop: "2vh" }}>
					<button className="btn" onClick={props.onStart} disabled={props.isRunning || timeLeft === 0}>
						开始
					</button>
					<button className="btn" onClick={props.onPause} disabled={!props.isRunning}>
						暂停
					</button>
					<button className="btn" onClick={() => setReseting(true)} onDoubleClick={handleReset}>
						重置
					</button>
				</div>
			)}
		</div>
	)
})

export default Timer;