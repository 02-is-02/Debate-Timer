import React, { useState, useEffect } from "react";
import { Outlet, useLocation, useOutletContext, useNavigate } from "react-router-dom";
import { ToastProvider } from "../utils/toasts";
import { ThemeProvider } from "@emotion/react";
import { CircularProgress, createTheme } from "@mui/material";
import MenuSidebar from "./Sidebar";
import FileDrop from "../components/FileDrop";
import { DebateStages } from "../schema";
import { initAppScope } from "../utils/configManager";

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
		MuiFab: {
			styleOverrides: {
				root: {
				'&.Mui-disabled': {
					backgroundColor: 'rgba(255, 255, 255, 0.12)',
					color: 'rgba(255, 255, 255, 0.3)',
					boxShadow: 'none',
				},
				},
			},
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

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export default function Layout() {
	const [isFolded, setIsFolded] = useState(() => {
		return localStorage.getItem("sidebar_folded") === "true";
	});
	const [allowDndWindow, setAllowDndWindow] = useState(true);
	const [isRunning, setIsRunning] = useState(false);
	const [isReady, setIsReady] = useState(false);

	const currPage = useLocation().pathname;

	useEffect(() => {
		const initialize = async () => {
			try {
				await initAppScope(); 
				await sleep(1000);
			} catch (e) {
				console.error("初始化权限失败", e);
			} finally {
				setIsReady(true);
			}
		};

		initialize();
	}, []);

	useEffect(() => {
		localStorage.setItem("sidebar_folded", isFolded.toString());
	}, [isFolded])

	useEffect(() => {
		const disableBrowserReload = (e: KeyboardEvent) => {
			if (e.key === 'F5') {
				e.preventDefault();
				console.log("Denied f5 refresh");
			}
			if ((e.ctrlKey || e.metaKey) && (e.key === 'r' || e.key === 'R')) {
				e.preventDefault();
				console.log("Denied hotkey refresh");
			}
		};

		window.addEventListener('keydown', disableBrowserReload);
		return () => {
			window.removeEventListener('keydown', disableBrowserReload);
		};
	}, []);

	if (!isReady) {
		return (
			<div 
				style={{
					display: "flex",
					flexDirection: "column",
					gap: "15px",
					height: "100vh",
					width: "100vw",
					backgroundColor: "var(--bg)",
					alignItems: "center",
					justifyContent: "center"
				}}
			>
				<CircularProgress
					sx={{
						color: "#656b6ed2"
					}}
					thickness={2}
					size={80}
				/>
				<label className="mini-label">
					加载中...
				</label>
			</div>
		);
	}

	return (
		<div className="fade-in-wrapper">
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
		</div>
	)
}

export function useLayoutContext() {
	return useOutletContext<LayoutContextType>();
}