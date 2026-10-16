import { agentsMarkdown } from '../../docs/agents.js';

export function GET() {
	return new Response(agentsMarkdown(), {
		headers: { 'content-type': 'text/markdown; charset=utf-8' }
	});
}
