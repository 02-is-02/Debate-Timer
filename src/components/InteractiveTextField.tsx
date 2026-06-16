import { useRef, useEffect, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import rawWordsData from '../assets/words.json'
import * as THREE from 'three';

const WORDS_DB: Record<number, string[]> = rawWordsData;

const OrganicMatrixField = () => {
	const { camera, viewport } = useThree();
	const mouse3D = useRef(new THREE.Vector3(-1000, -1000, 0)); 
	const lastSpawnTime = useRef(0);

	const gridCells = useMemo(() => {
		const cells = [];
		const ROWS = 18;
		const rowH = viewport.height / ROWS;
		const charW = 0.65;

		let cellId = 0;
		for (let r = 0; r < ROWS; r++) {
			let currentX = -viewport.width / 2 - 1.0; 
			const y = (r - ROWS / 2 + 0.5) * rowH;

			while (currentX < viewport.width / 2 + 1.0) {

				const len = Math.floor(Math.random() * 6) + 2; 
				const wordW = len * charW;
				
				const gap = 0.9 + Math.random() * 0.8; 

				cells.push({
					id: cellId++,
					x: currentX + wordW / 2,
					y: y,
					len: len
				});

				currentX += wordW + gap;
			}
		}
		return cells;
	}, [viewport.width, viewport.height]);

	const POOL_SIZE = 120; 
	const occupiedCells = useRef(new Set<number>()); 

	const pool = useRef(
		Array.from({ length: POOL_SIZE }).map((_, i) => ({
			id: i,
			active: false,
			word: " ",
			cellIndex: -1, 
			birthTime: 0,
			maxLife: 0,
			basePos: new THREE.Vector3(),
			ref: null as any
		}))
	);

	useEffect(() => {
		occupiedCells.current.clear();
		pool.current.forEach(p => { 
			p.active = false; 
			if(p.ref) p.ref.fillOpacity = 0; 
		});
	}, [gridCells]);

	useEffect(() => {
		const raycaster = new THREE.Raycaster();
		const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
		const mouseNdc = new THREE.Vector2();

		const handleMouseMove = (e: MouseEvent) => {
			mouseNdc.x = (e.clientX / window.innerWidth) * 2 - 1;
			mouseNdc.y = -(e.clientY / window.innerHeight) * 2 + 1;
			raycaster.setFromCamera(mouseNdc, camera);
			raycaster.ray.intersectPlane(plane, mouse3D.current);
		};
		
		window.addEventListener('mousemove', handleMouseMove);
		return () => window.removeEventListener('mousemove', handleMouseMove);
	}, [camera]);

	useFrame((state) => {
		const time = state.clock.elapsedTime;

		if (time - lastSpawnTime.current > 0.12) { 
			lastSpawnTime.current = time;
			
			const p = pool.current.find(p => !p.active);
			if (p) {

				const freeCells = gridCells.filter(c => !occupiedCells.current.has(c.id));

				if (freeCells.length > 0) {
					const pickCell = freeCells[Math.floor(Math.random() * freeCells.length)];
					occupiedCells.current.add(pickCell.id);

					p.active = true;
					p.cellIndex = pickCell.id;
					p.birthTime = time;
					p.maxLife = 2.0 + Math.random() * 2.0; 

					const wordsArray = WORDS_DB[pickCell.len];
					p.word = wordsArray[Math.floor(Math.random() * wordsArray.length)];

					p.basePos.set(pickCell.x, pickCell.y, 0);

					if (p.ref) {
						p.ref.text = p.word;
						p.ref.position.copy(p.basePos);
						p.ref.sync();
					}
				}
			}
		}

		pool.current.forEach(p => {
			if (p.active && p.ref) {
				const age = time - p.birthTime;
				
				if (age >= p.maxLife) {
					p.active = false;
					occupiedCells.current.delete(p.cellIndex);
					p.ref.fillOpacity = 0;
					return;
				}

				const lifeFade = Math.sin((age / p.maxLife) * Math.PI);

				const breath = Math.sin(time * 1.0) * 0.6; 
				
				const ripple = Math.cos(time * 2.5 + p.basePos.x * 0.15 + p.basePos.y * 0.15) * 1.2; 
				
				const tremor = Math.sin(time * 4.0 + p.id) * 0.2; 

				const totalWaveZ = breath + ripple + tremor;
				const totalWaveY = (ripple + tremor) * 0.15; 

				p.ref.position.set(
					p.basePos.x, 
					p.basePos.y + totalWaveY, 
					totalWaveZ
				);

				const dist = p.basePos.distanceTo(mouse3D.current);
				const LIGHT_RADIUS = 9.0; 
				const lightEffect = Math.exp(-(dist * dist) / (LIGHT_RADIUS * LIGHT_RADIUS));

				const targetScale = 1.0 + lightEffect * 1.2; 
				p.ref.scale.set(targetScale, targetScale, targetScale);
				p.ref.fillOpacity = lifeFade * (0.35 + lightEffect * 0.6);
			}
		});
	});

	return (
		<group>
			{pool.current.map((p) => (
				<Text
					key={p.id}
					ref={(r) => (p.ref = r)} 
					color="#4d4f52"
					fontSize={0.65}
					anchorX="center"
					anchorY="middle"
				>
					{p.word}
				</Text>
			))}
		</group>
	);
};

export default function InteractiveTextBackground() {
	return (
		<div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 0, pointerEvents: 'none' }}>
			<Canvas camera={{ position: [0, 0, 45], fov: 35 }}>
				<color attach="background" args={['#1f1f1f']} />
				<OrganicMatrixField />
			</Canvas>
		</div>
	);
}