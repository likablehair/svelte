export function inline(text: string | undefined) {
	if (!text) return '';
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/`([^`]+)`/g, '<code>$1</code>');
}
