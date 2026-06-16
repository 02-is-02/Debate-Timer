import React, { useState, useEffect } from "react";
import { Outlet, useLocation, useOutletContext, useNavigate } from "react-router-dom";
import { ToastProvider } from "../utils/Context";
import { ThemeProvider } from "@emotion/react";
import { createTheme } from "@mui/material";
import MenuSidebar from "./Sidebar";
import FileDrop from "../components/FileDrop";
import { DebateStages } from "../schema";

const darkTheme = createTheme({
	palette: {
		mode: "dark"
	},
	components: {
		MuiDialog: {
			styleOverrides: {
				paper: {
					backgroundColor: "#1e293b",
					color: "#f8fafc",
					border: "1px solid #334155",
					borderRadius: "12px",
					boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
				}
			}
		},
		MuiButton: {
			styleOverrides: {
				root: {
					textTransform: 'none',
					fontWeight: 'bold',
					borderRadius: '8px'
				}
			}
		},
		MuiCircularProgress: {
			styleOverrides: {
				root: {
					color: 'var(--alt-blue)'
				}
			}
		}
	}
})

export type LayoutContextType = { setIsMatchPlaying: React.Dispatch<React.SetStateAction<boolean>> }

function GlobalDropCatcher({ isPlaying }: { isPlaying: boolean }) {
	const navigate = useNavigate();
	if (isPlaying) return;

	const handleGlobalDrop = (matches: DebateStages | DebateStages[]) => {

		navigate('/editor');

		setTimeout(() => {
			window.dispatchEvent(new CustomEvent('trigger-global-import', { 
				detail: matches 
			}));
		}, 150);
	};

	return <FileDrop onDrop={handleGlobalDrop} />
}

export default function Layout() {
	const [isFolded, setIsFolded] = useState(() => {
		return localStorage.getItem("sidebar_folded") === "true";
	});
	const [isMatchPlaying, setIsMatchPlaying] = useState(false);

	const currPage = useLocation().pathname;

	useEffect(() => {
		localStorage.setItem("sidebar_folded", isFolded.toString());
	}, [isFolded])

	return (
		<ThemeProvider theme={darkTheme}>
			<ToastProvider>
				<GlobalDropCatcher isPlaying={isMatchPlaying} />

				<div className="main-container">
					<MenuSidebar isFolded={isFolded} toggleFold={() => setIsFolded(!isFolded)} activeRow={currPage}/>
					<div style={{ flex: 1, minWidth: 0, position: "relative" }}>
						<Outlet context={{setIsMatchPlaying}}/>
					</div>
				</div>
			</ToastProvider>
		</ThemeProvider>
	)
}

export function useLayoutContext() {
	return useOutletContext<LayoutContextType>();
}