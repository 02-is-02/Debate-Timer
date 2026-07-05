import { useState, useEffect, forwardRef, useImperativeHandle, useRef } from "react";
import useSound from "use-sound";
import { appDataDir, join } from "@tauri-apps/api/path";
import { convertFileSrc } from "@tauri-apps/api/core";
import defaultBellSfx from '../assets/bell.mp3';
import defaultTickSfx from '../assets/tick.mp3';
import { AppSettings } from "../schema";

interface TimerProps {
	title?: string;
	initialSeconds: number;
	isRunning: boolean;
	isHost: boolean;
	onStart: () => void;
	onPause: () => void;
}

export interface TimerRef {
	setTime: (seconds: number) => void;
	getTime: () => number;
	stopT: () => void;
}

const Timer = forwardRef<TimerRef, TimerProps>((props, ref) => {
	const [timeLeft, setTimeLeft] = useState(props.initialSeconds);
	const [reseting, setReseting] = useState(false);
	const [sec, setSec] = useState(props.initialSeconds);

	const [singleRingSrc, setSingleRingSrc] = useState<string>(defaultBellSfx);
	const [doubleRingSrc, setDoubleRingSrc] = useState<string>(defaultBellSfx);
	const [tickSrc, setTickSrc] = useState<string>(defaultTickSfx);
	const [timeColor, setTimeColor] = useState("#ffffffff");
	const [timeEndingColor, setTimeEndingColor] = useState("#ff0000ff");
	const [timeFont, setTimeFont] = useState("")

	const [playSingleRing] = useSound(singleRingSrc, { volume: 0.8 });
	const [playDoubleRing] = useSound(doubleRingSrc, { volume: 0.8 });
	const [playTick, { stop: stopTick }] = useSound(tickSrc, { volume: 0.5 });

	const clickTimeoutRef = useRef<number | null>(null);
	const lastActionTimeRef = useRef<number>(0);

	const handleResetClick = () => {
		if (clickTimeoutRef.current) {
			clearTimeout(clickTimeoutRef.current);
		}
		clickTimeoutRef.current = window.setTimeout(() => {
			props.onPause();
			setReseting(true);
		}, 200);
	};

	const handleResetDoubleClick = () => {
		if (Date.now() - lastActionTimeRef.current < 400) {
			handleResetClick();
			return;
		}

		if (clickTimeoutRef.current) {
			clearTimeout(clickTimeoutRef.current);
			clickTimeoutRef.current = null;
		}
		handleReset();
	};

		const formatTime = (secs: number) => {
		const m = Math.floor(secs / 60);
		const s = secs % 60;
		return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
	};

	const handleReset = () => {
		props.onPause();
		setTimeLeft(props.initialSeconds);
	};

	const handleCustomReset = (seconds: number) => {
		props.onPause();
		setTimeLeft(seconds <= 0 ? props.initialSeconds : seconds);
		setReseting(false);
	};

	useEffect(() => {
		const loadCustoms = async () => {
			try {
				const settingsStr = localStorage.getItem("app_settings");
				if (!settingsStr) return;

				const settings: AppSettings = JSON.parse(settingsStr);
				const appData = await appDataDir();

				setTimeColor(settings.Timer.fontColor);
				setTimeEndingColor(settings.Timer.timerEndingColor);
				setTimeFont(settings.Timer.timerFont ? `"${settings.Timer.timerFont}", sans-serif` : 'inherit')

				const getAssetUrl = async (fileName?: string) => {
					if (!fileName) return null;
					const fullPath = await join(appData, "imported_assets", fileName);
					return convertFileSrc(fullPath);
				};

				const customSingle = await getAssetUrl(settings.Timer.singleRing);
				const customDouble = await getAssetUrl(settings.Timer.doubleRing);
				const customTick = await getAssetUrl(settings.Timer.ticking);

				if (customSingle) setSingleRingSrc(customSingle);
				if (customDouble) setDoubleRingSrc(customDouble);
				if (customTick) setTickSrc(customTick);
			} catch (error) {
				console.error("Load custom sound failed:", error);
			}
		};

		loadCustoms();
	}, []);

	useImperativeHandle(ref, () => ({
		setTime(seconds: number) { setTimeLeft(seconds); },
		getTime() { return timeLeft; },
		stopT() {stopTick()}
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
					playSingleRing();
				} else if (nextTime === 5) {
					playTick();
				} else if (nextTime === 0) {
					stopTick();
					if (doubleRingSrc !== singleRingSrc) {
						playDoubleRing();
					} else {
						playSingleRing();
						setTimeout(() => playSingleRing(), 500);
					}
				}
				return nextTime;
			});
		}, 1000);

		return () => clearInterval(timerId);
	}, [props.isRunning, playSingleRing, playDoubleRing, playTick, stopTick, doubleRingSrc, singleRingSrc]);

	return (
		<div style={{
			width: "100%",
			height: "100%",
			display: "flex",
			flexDirection: "column",
			justifyContent: "center",
			alignItems: "center",
			boxSizing: "border-box",
			gap: "20px",
			padding: "1vh 0" 
		}}>
			{props.title && (
				<h2 style={{
					margin: "0 0 1.5vh 0", 
					fontSize: "clamp(2.0rem, 2.5vh, 3.7rem)",
					fontWeight: 600
				}}>
					{props.title}
				</h2>
			)}

			{/* SVG Timer */}
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
						fontFamily={timeFont}
						fill={timeLeft <= 30 ? timeEndingColor : timeColor}
					>
						{formatTime(timeLeft)}
					</text>
				</svg>
			</div>

			{/* Controls */}
			{props.isHost && (
				<div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", marginTop: "2vh" }}>
					{!reseting ? (
						<>
							<button className="btn" onClick={props.onStart} disabled={props.isRunning || timeLeft === 0}>
								开始
							</button>
							<button className="btn" onClick={props.onPause} disabled={!props.isRunning}>
								暂停
							</button>
							<button 
								className="btn"
								onClick={handleResetClick} 
								onDoubleClick={handleResetDoubleClick}
							>
								重置
							</button>
						</>
					) : (
						<>
							<input 
								type="number"
								min="0"
								className="glass-input"
								style={{ flex: 1 }}
								placeholder={props.initialSeconds.toString()}
								onChange={(e) => setSec(Math.min(parseInt(e.target.value, 10), 36000) || props.initialSeconds)}
							/>
							<button className="btn" onClick={() => {lastActionTimeRef.current = Date.now(); setReseting(false);}}>
								取消
							</button>
							<button className="btn" onClick={() => handleCustomReset(sec)}>
								重置
							</button>
						</>
					)}
				</div>
			)}
		</div>
	);
});

export default Timer;