import { getThemes, getTokens } from '../../docs/api.server.js';
import { tokensMarkdown } from '../../docs/markdown.js';

export function GET() {
	return new Response(tokensMarkdown(getTokens(), getThemes()), {
		headers: { 'content-type': 'text/markdown; charset=utf-8' }
	});
}
