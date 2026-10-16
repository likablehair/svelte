import { stylingMarkdown } from '../../docs/styling.js';

export function GET() {
	return new Response(stylingMarkdown(), {
		headers: { 'content-type': 'text/markdown; charset=utf-8' }
	});
}
