import { Routes, Route, BrowserRouter } from "react-router-dom";
import HomePage from "./pages/Home";
import Editor from "./pages/Editor";
import Runner from "./pages/Runner";
import Settings from "./pages/Settings";
import "./App.css";
import Layout from "./components/Layout";

function App() {

	return (
		<BrowserRouter>
			<Routes>
				<Route element={<Layout />}>
					<Route path="/" element={<HomePage />} />
					<Route path="/editor" element={<Editor />} />
					<Route path="/runner" element={<Runner />} />
					<Route path="/settings" element={<Settings />} />
				</Route>
			</Routes>
		</BrowserRouter>
	)
}

export default App;