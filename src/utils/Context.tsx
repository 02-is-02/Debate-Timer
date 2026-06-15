import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Snackbar, Alert } from '@mui/material';

interface ToastContextType {
	showToast: (message: string, severity?: 'success' | 'error' | 'warning' | 'info') => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
	const [toast, setToast] = useState({ 
		open: false, 
		message: '', 
		severity: 'success' as 'success' | 'error' | 'warning' | 'info' 
	});

	const showToast = (message: string, severity: 'success' | 'error' | 'warning' | 'info' = 'success') => {
		setToast({ open: true, message, severity });
	};

	useEffect(() => {
		const handleGlobalToast = (event: Event) => {
			const customEvent = event as CustomEvent<{ message: string, severity: 'success' | 'error' | 'warning' | 'info' }>;
			if (customEvent.detail) {
				showToast(customEvent.detail.message, customEvent.detail.severity);
			}
		}
		window.addEventListener('trigger-global-toast', handleGlobalToast);

		return () => {
			window.removeEventListener('trigger-global-toast', handleGlobalToast);
		}
	}, [])

	const handleClose = () => {
		setToast((prev) => ({ ...prev, open: false }));
	};

	return (
		<ToastContext.Provider value={{ showToast }}>
			{children}
			
			<Snackbar 
				open={toast.open} 
				autoHideDuration={3000} 
				onClose={handleClose}
				anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
				sx={{ zIndex: 9999 }}
			>
				<Alert 
					onClose={handleClose} 
					severity={toast.severity} 
					variant="outlined"
					sx={{ width: '100%', boxShadow: "0 4px 12px rgba(0,0,0,0.5)" }}
				>
					{toast.message}
				</Alert>
			</Snackbar>
		</ToastContext.Provider>
	);
}

export const useToast = () => {
	const context = useContext(ToastContext);
	if (!context) {
		throw new Error("useToast 必须在 ToastProvider 内部使用！");
	}
	return context;
};