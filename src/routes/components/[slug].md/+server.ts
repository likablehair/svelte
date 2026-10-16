import { error } from '@sveltejs/kit';
import { getComponentDoc, getExamples } from '../../../docs/api.server.js';
import { componentMarkdown } from '../../../docs/markdown.js';

export function GET({ params }) {
	const doc = getComponentDoc(params.slug);
	if (!doc) error(404, `Component "${params.slug}" not found`);
	return new Response(componentMarkdown(doc, getExamples(params.slug)), {
		headers: { 'content-type': 'text/markdown; charset=utf-8' }
	});
}
