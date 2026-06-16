import InteractiveTextBackground from "../components/InteractiveTextField";
 
export default function HomePage() {
	return (
		<div className="container">
			<InteractiveTextBackground />
			<div style={{ flex: 1, overflow: "hidden", zIndex: 1, alignContent: "center" }}>
				<div style={{
					position: "absolute", 
					left: "calc(50%)", 
					top: "calc(50%)",
					transform: "translateX(-50%) translateY(-50%)",
					transition: "left 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
					display: "flex",
					flexDirection: "column"
				}}>
					<span style={{ 
						fontSize: "clamp(1.5rem, 5vw, 4rem)",
						fontWeight: "bold",
						textAlign: "center",
						color: "white"
						}}
					>
						辩论赛计时器
					</span>
					<span style={{ 
						fontSize: "clamp(0.55rem, 1.8vw, 1.6rem)",
						textAlign: "center",
						color: "#999999"
						}}
					>
						由亚太科技大学辩论队开发
					</span>
				</div>
			</div>
		</div>
	)
}