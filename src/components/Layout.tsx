import { useState, useEffect } from "react";
import { Outlet, useLocation, useOutletContext } from "react-router-dom";
import MenuSidebar from "./Sidebar";
import { ToastProvider } from "../utils/Context";
import { ThemeProvider } from "@emotion/react";
import { createTheme } from "@mui/material";

const darkTheme = createTheme({
	palette: {
		mode: "dark"
	}
})

export type LayoutContextType = { isFolded: boolean }

export default function Layout() {
	const [isFolded, setIsFolded] = useState(() => {
		return localStorage.getItem("sidebar_folded") === "true";
	});

	useEffect(() => {
		localStorage.setItem("sidebar_folded", isFolded.toString());
	}, [isFolded])

	const currPage = useLocation().pathname;

	return (
		<ThemeProvider theme={darkTheme}>
			<ToastProvider>
				<div className="main-container">
					<MenuSidebar isFolded={isFolded} toggleFold={() => setIsFolded(!isFolded)} activeRow={currPage}/>
					<div style={{ flex: 1, minWidth: 0, position: "relative" }}>
						<Outlet context={{isFolded}}/>
					</div>
				</div>
			</ToastProvider>
		</ThemeProvider>
	)
}

export function useLayoutContext() {
	return useOutletContext<LayoutContextType>();
}