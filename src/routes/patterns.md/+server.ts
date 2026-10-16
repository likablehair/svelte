import { patternsMarkdown } from '../../docs/patterns.server.js';

export function GET() {
	return new Response(patternsMarkdown(), { headers: { 'content-type': 'text/markdown; charset=utf-8' } });
}
