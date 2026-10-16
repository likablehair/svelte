import { error } from '@sveltejs/kit';
import { getComponentDoc, getExamples } from '../../../docs/api.server.js';

export function load({ params }) {
	const doc = getComponentDoc(params.slug);
	if (!doc) error(404, `Component "${params.slug}" not found`);
	return { doc, examples: getExamples(params.slug) };
}
