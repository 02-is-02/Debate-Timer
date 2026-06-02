import { useState } from "react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Editor from "./pages/Editor";
import Runner from "./pages/Runner";
import Settings from "./pages/Settings";
import { DebateStage } from "./types";
import "./App.css";

const DEFAULT_STAGES: DebateStage[] = [
		{ id: "1", type: "single", title: "正方一辩立论", timeLimit: 180 },
		{ id: "2", type: "single", title: "反方一辩立论", timeLimit: 180 },
		{ id: "3", type: "double", title: "申论", leftTimeLimit: 240, rightTimeLimit: 240},
		{ id: "4", type: "free", title: "自由辩论", leftTimeLimit: 240, rightTimeLimit: 240, start: "left" },
	]

function App() {
	const [stages, setStages] = useState<DebateStage[]>(DEFAULT_STAGES);

	return (
		<MemoryRouter>
			<Routes>
				<Route path="/" element={<Home />} />
				<Route path="/editor" element={
					<Editor stages={stages} setStages={setStages} />
				} />
				<Route path="/runnner" element={
					<Runner stages={stages} />
				} />
				<Route path="/settings" element={<Settings />} />
			</Routes>
		</MemoryRouter>
	)
}

export default App;