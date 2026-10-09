import { getThemeSources } from '../../docs/api.server.js';

export function load() {
	return { themes: getThemeSources() };
}
