import {useState} from "react";
import InteractiveTextBackground from "../components/InteractiveTextField";
import Sidebar from "../components/Sidebar";
 
export default function HomePage() {
	const [isFolded, setIsFolded] = useState(false);

	return (
		<div className="main-container">
			
			<InteractiveTextBackground />

			{/* sidebar */}
			<Sidebar isFolded={isFolded} toggleFold={() => setIsFolded(!isFolded)} activeRow={1}/>

			<div style={{ flex: 1, overflow: "hidden", zIndex: 1, alignContent: "center" }}>
				<div style={{
					position: "absolute", 
					left: `calc(50% + ${isFolded ? '40px' : '120px'})`, 
					transform: "translateX(-50%) translateY(-50%)",
					transition: "left 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
					top: "50%",
					display: "flex",
					flexDirection: "column"
				}}>
					<span style={{ 
						fontSize: "clamp(1.5rem, 5vw, 4rem)",
						fontWeight: "bold",
						textAlign: "center"
						}}>
						标题标题标题标
					</span>
					<span style={{ 
						fontSize: "clamp(0.75rem, 2.5vw, 2rem)",
						textAlign: "center",
						color: "#999999"
						}}>
						副标题副标题副标题
					</span>
				</div>
			</div>
		</div>
	)
}