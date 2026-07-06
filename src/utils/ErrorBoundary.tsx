import React from 'react';

export class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: any}> {
	constructor(props: any) {
		super(props);
		this.state = { hasError: false, error: null };
	}
	static getDerivedStateFromError(error: any) {
		return { hasError: true, error };
	}
	render() {
		if (this.state.hasError) {
		return (
			<div style={{ padding: 30, background: '#fff', color: '#d32f2f', zIndex: 999999, position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh' }}>
			<h2>Crash log:</h2>
			<h3 style={{ color: '#000' }}>{this.state.error?.message || this.state.error?.toString()}</h3>
			<pre style={{ overflow: 'auto', background: '#f5f5f5', padding: 15 }}>{this.state.error?.stack}</pre>
			</div>
		);
		}
		return this.props.children;
	}
}