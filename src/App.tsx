import { Routes, Route, BrowserRouter } from "react-router-dom";
import HomePage from "./pages/Home";
import Editor from "./pages/Editor";
import Runner from "./pages/Runner";
import Settings from "./pages/Settings";
import "./App.css";
import Layout from "./components/Layout";
import { ErrorBoundary } from "./utils/ErrorBoundary";

function App() {

	return (
		<ErrorBoundary>
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
		</ErrorBoundary>
	)
}

export default App;