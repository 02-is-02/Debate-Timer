import { useState, useEffect, RefObject } from "react";
import { listen } from "@tauri-apps/api/event";

export function useTauriDropZone(
	zoneRef: RefObject<HTMLElement>,
	onFilesDrop: (paths: string[]) => void
	) {
	const [isDragging, setIsDragging] = useState(false); 
	const [isHovering, setIsHovering] = useState(false);

	useEffect(() => {
		let unlistenEnter: () => void;
		let unlistenOver: () => void;
		let unlistenDrop: () => void;
		let unlistenLeave: () => void;

		const isInside = (x: number, y: number) => {
			if (!zoneRef.current) return false;
				const rect = zoneRef.current.getBoundingClientRect();
				const logicX = x / window.devicePixelRatio;
				const logicY = y / window.devicePixelRatio;
				return (
					logicX >= rect.left && logicX <= rect.right &&
					logicY >= rect.top && logicY <= rect.bottom
				);
		};

		const setup = async () => {
			unlistenEnter = await listen("tauri://drag-enter", () => {
				setIsDragging(true);
			});

			unlistenOver = await listen<{ position: { x: number; y: number } }>(
				"tauri://drag-over", (e) => {
				setIsDragging(true);
				setIsHovering(isInside(e.payload.position.x, e.payload.position.y));
				}
			);

			unlistenDrop = await listen<{ paths: string[]; position: { x: number; y: number } }>(
				"tauri://drag-drop", (e) => {
					setIsDragging(false);
					setIsHovering(false);
					if (isInside(e.payload.position.x, e.payload.position.y) && e.payload.paths.length > 0) {
						onFilesDrop(e.payload.paths);
					}
				}
			);

			unlistenLeave = await listen("tauri://drag-leave", () => {
				setIsDragging(false);
				setIsHovering(false);
			});
		};

		setup();

		return () => {
			if (unlistenEnter) unlistenEnter();
			if (unlistenOver) unlistenOver();
			if (unlistenDrop) unlistenDrop();
			if (unlistenLeave) unlistenLeave();
		};
	}, [zoneRef, onFilesDrop]); 

	
	return { isDragging, isHovering }; 
}