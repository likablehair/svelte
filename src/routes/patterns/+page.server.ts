import { getPatterns, PATTERNS_INTRO, PATTERNS_TITLE } from '../../docs/patterns.server.js';

export function load() {
	return { title: PATTERNS_TITLE, intro: PATTERNS_INTRO, patterns: getPatterns() };
}
