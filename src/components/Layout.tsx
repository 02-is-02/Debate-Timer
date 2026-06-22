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
		mode: "dark",
		primary: {
			main: '#3b82f6',
		},
		secondary: {
			main: '#ffffff',
		},
		error: {
			main: '#ef4444',
		},
		success: {
			main: '#22c55e',
		}

	},
	components: {
		MuiDialog: {
			styleOverrides: {
				paper: {
					backgroundColor: "var(--dark-blue)",
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
		MuiTextField: {
			styleOverrides: {
				root: {
					"& .MuiInputBase-input::placeholder": {
						fontSize: "12px",
					},
					"& .MuiFilledInput-root": { color: "white" },
					"& .MuiInputLabel-root": { color: "white" }
				}
			}
		}
	}
})

export type LayoutContextType = { 
	setAllowDndWindow: React.Dispatch<React.SetStateAction<boolean>>;
	isRunning: boolean;
	setIsRunning: React.Dispatch<React.SetStateAction<boolean>>;
}

function GlobalDropCatcher({ allowDndWindow }: { allowDndWindow: boolean }) {
	const navigate = useNavigate();

	const handleGlobalDrop = (matches: DebateStages | DebateStages[]) => {

		navigate('/editor');

		setTimeout(() => {
			window.dispatchEvent(new CustomEvent('trigger-global-import', { 
				detail: matches 
			}));
		}, 150);
	};

	return <FileDrop isActive={allowDndWindow} onDrop={handleGlobalDrop} />
}

export default function Layout() {
	const [isFolded, setIsFolded] = useState(() => {
		return localStorage.getItem("sidebar_folded") === "true";
	});
	const [allowDndWindow, setAllowDndWindow] = useState(true);
	const [isRunning, setIsRunning] = useState(false);

	const currPage = useLocation().pathname;

	useEffect(() => {
		localStorage.setItem("sidebar_folded", isFolded.toString());
	}, [isFolded])

	return (
		<ThemeProvider theme={darkTheme}>
			<ToastProvider>
				<GlobalDropCatcher allowDndWindow={allowDndWindow} />

				<div className="main-container">
					{!isRunning && <MenuSidebar isFolded={isFolded} toggleFold={() => setIsFolded(!isFolded)} activeRow={currPage}/>}
					<div style={{ flex: 1, minWidth: 0, position: "relative" }}>
						<Outlet context={{setAllowDndWindow, isRunning, setIsRunning}}/>
					</div>
				</div>
			</ToastProvider>
		</ThemeProvider>
	)
}

export function useLayoutContext() {
	return useOutletContext<LayoutContextType>();
}