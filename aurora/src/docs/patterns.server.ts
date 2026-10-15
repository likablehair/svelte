import { getExamples } from './api.server.js';

export const PATTERNS_TITLE = 'Page patterns';

export const PATTERNS_INTRO =
	'Whole pages built only with the library and the tokens: start from the closest one when you design a page. The app shell around them (sidebar, bar, user menu) is `SidebarLayout`.';

export const getPatterns = () => getExamples('patterns');

export function patternsMarkdown() {
	const lines = [`# ${PATTERNS_TITLE}`, '', PATTERNS_INTRO, ''];
	for (const pattern of getPatterns()) {
		lines.push(`## ${pattern.title}`, '');
		if (pattern.description) lines.push(pattern.description, '');
		lines.push('```svelte', pattern.code, '```', '');
	}
	return lines.join('\n');
}
