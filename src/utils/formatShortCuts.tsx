
export function formatShortCut(e: KeyboardEvent): string | null {
	e.preventDefault();
	e.stopPropagation();

	const modifierKeys = ['Control', 'Shift', 'Alt', 'Meta'];
	if (modifierKeys.includes(e.key)) {
		return null;
	}

	const parts: string[] = [];

	if (e.ctrlKey || e.metaKey) {
		parts.push('Ctrl');
	}
	if (e.altKey) {
		parts.push('Alt');
	}
	if (e.shiftKey) {
		parts.push('Shift');
	}

	parts.push(e.code);

	return parts.join('+');
}

export function renderFriendlyShortcuts(str: string) {
	if (!str) return "未绑定";

	return str
		.replace("Key", "")
		.replace("Digit", "");
}