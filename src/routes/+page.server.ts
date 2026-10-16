import { getThemes, getTokens } from '../docs/api.server.js';

export function load() {
	return { groups: getTokens(), themes: getThemes() };
}
