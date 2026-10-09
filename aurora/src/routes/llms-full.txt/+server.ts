import { getComponentDoc, getExamples, getThemes, getTokens, listComponents } from '../../docs/api.server.js';
import { componentMarkdown, tokensMarkdown } from '../../docs/markdown.js';
import { stylingMarkdown } from '../../docs/styling.js';

export function GET() {
	const parts = [tokensMarkdown(getTokens(), getThemes()), stylingMarkdown()];
	for (const c of listComponents()) {
		const doc = getComponentDoc(c.slug);
		if (doc) parts.push(componentMarkdown(doc, getExamples(c.slug)));
	}
	return new Response(parts.join('\n---\n\n'), { headers: { 'content-type': 'text/plain; charset=utf-8' } });
}
