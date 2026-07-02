import { JSX, useEffect, useRef, useState } from 'react';
import { Button } from '@mui/material';
import { Maximize } from 'lucide-react';
import { getCurrentWindow } from '@tauri-apps/api/window';

interface MiniTimerProps {
	onClose: () => void;
	renderStage: () => JSX.Element | null;
}

export default function MiniTimerPage({
	onClose,
	renderStage
}: MiniTimerProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const contentRef = useRef<HTMLDivElement>(null);
	const [stageZoom, setStageZoom] = useState(1);

	useEffect(() => {
		const calcZoom = () => {
			if (!containerRef.current || !contentRef.current) return;

			const containerW = containerRef.current.clientWidth;
			const containerH = containerRef.current.clientHeight;
			const contentW = contentRef.current.clientWidth;
			const contentH = contentRef.current.clientHeight;

			if (contentW === 0 || contentH === 0) return;

			const zoomX = containerW / contentW;
			const zoomY = containerH / contentH;

			setStageZoom(Math.min(zoomX, zoomY) * 1.1);
		}

		calcZoom();

		const observer = new ResizeObserver(calcZoom);
		if (containerRef.current) {
			observer.observe(containerRef.current);
		}

		window.addEventListener('resize', calcZoom);

		return () => {
			observer.disconnect();
			window.removeEventListener('resize', calcZoom);
		}
	}, [renderStage])

	return (
		<div
			className="container"
			style={{
				position: "relative",
				width: "100vw",
				height: "100vh",
				overflow: "hidden",
				display: "flex",
				flexDirection: "column"
			}}
		>
			<div
				data-tauri-drag-region
				style={{
					position: "absolute",
					top: 0,
					left: 0,
					width: "100%",
					height: "40px",
					background: "linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)",
					display: "flex",
					justifyContent: "flex-end",
					alignItems: "flex-start",
					cursor: "grab",
					flexShrink: 0,
					zIndex: 50
				}}
			>
				<div style={{ cursor: "pointer", zIndex: 50, margin: "10px 10px 0 0" }}>
					<Button 
						onClick={onClose} 
						style={{ minWidth: 0, padding: "4px", color: "white" }}
					>
						<Maximize size={18} />
					</Button>
				</div>
			</div>
=
			<div 
				ref={containerRef}
				style={{ 
					flex: 1, 
					display: "flex", 
					justifyContent: "center", 
					alignItems: "center",
					width: "100%",
					overflow: "hidden"
				}}
			>
				<div 
					ref={contentRef}
					style={{
						transform: `scale(${stageZoom})`,
						transformOrigin: "center center",
						display: "flex",
						justifyContent: "center",
						alignItems: "center",
						whiteSpace: "nowrap" 
					}}
				>
					{renderStage()}
				</div>
			</div>
		</div>
	)
}