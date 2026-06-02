import { useNavigate } from "react-router-dom";

export default function Home() {
	const navigate = useNavigate();

	return (
		<div style={{ textAlign: "center", marginTop: "20vh" }}>
			<h1>🎯 辩论赛主控系统</h1>
			<div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", width: "300px", margin: "2rem auto" }}>
			<button className="btn btn-large" onClick={() => navigate("/runner")}>
				▶️ 开始比赛
			</button>
			<button className="btn" onClick={() => navigate("/editor")}>
				🛠️ 赛制编辑器
			</button>
			<button className="btn" onClick={() => navigate("/settings")}>
				⚙️ 系统设置
			</button>
			</div>
		</div>
	);
}