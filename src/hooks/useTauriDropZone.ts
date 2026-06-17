import { useState, useEffect, RefObject, useRef } from "react";
import { listen } from "@tauri-apps/api/event";

export function useTauriDropZone(
	zoneRef: RefObject<HTMLElement>,
	onFilesDrop: (paths: string[]) => void
) {
	const [isDragging, setIsDragging] = useState(false);
	const [isHovering, setIsHovering] = useState(false);

	// 🛡️ 黑科技 1：回调保鲜（Callback Ref Pattern）
	// 将传入的函数存入 Ref 中，这样在每次渲染时更新引用，
	// 但绝对不会触发 useEffect 的重新执行。
	const savedCallback = useRef(onFilesDrop);
	useEffect(() => {
		savedCallback.current = onFilesDrop;
	}, [onFilesDrop]);

	useEffect(() => {
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

		// 🛡️ 黑科技 2：接住 Promise，而不是等待执行完毕
		// 我们不使用 async setup，而是直接把 listen 返回的 Promise 存起来
		const unlistenEnterPromise = listen("tauri://drag-enter", () => {
			setIsDragging(true);
		});

		const unlistenOverPromise = listen<{ position: { x: number; y: number } }>(
			"tauri://drag-over", (e) => {
				setIsDragging(true);
				setIsHovering(isInside(e.payload.position.x, e.payload.position.y));
			}
		);

		const unlistenDropPromise = listen<{ paths: string[]; position: { x: number; y: number } }>(
			"tauri://drag-drop", (e) => {
				setIsDragging(false);
				setIsHovering(false);
				if (isInside(e.payload.position.x, e.payload.position.y) && e.payload.paths.length > 0) {
					// 调用永远保持最新的那个回调函数
					savedCallback.current(e.payload.paths);
				}
			}
		);

		const unlistenLeavePromise = listen("tauri://drag-leave", () => {
			setIsDragging(false);
			setIsHovering(false);
		});

		// 🛡️ 黑科技 3：Promise 链式终结
		// 无论 React 什么时候触发清理（哪怕是监听器还没注册完的一瞬间），
		// 只要 Promise 结算完成，立马顺手把生成的 unlisten 函数给执行掉，绝不留幽灵！
		return () => {
			unlistenEnterPromise.then(unlisten => unlisten());
			unlistenOverPromise.then(unlisten => unlisten());
			unlistenDropPromise.then(unlisten => unlisten());
			unlistenLeavePromise.then(unlisten => unlisten());
		};
		
	// ⚠️ 极其关键：依赖数组里只留 zoneRef，彻底斩断因为 onFilesDrop 变化导致的循环噩梦
	}, [zoneRef]); 

	return { isDragging, isHovering };
}