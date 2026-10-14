import { error } from '@sveltejs/kit';
import type { Component } from 'svelte';

const modules = import.meta.glob<Component>('/src/docs/examples/*/*.svelte', { import: 'default' });
const layouts = Object.keys(import.meta.glob('/src/lib/components/layouts/*.svelte')).map((path) =>
	path
		.replace(/^.*\/(\w+)\.svelte$/, '$1')
		.replace(/([a-z0-9])([A-Z])/g, '$1-$2')
		.toLowerCase()
);

export async function load({ params }) {
	const module = modules[`/src/docs/examples/${params.slug}/${params.id}.svelte`];
	if (!module) error(404, 'Example not found');
	return { component: await module(), page: layouts.includes(params.slug) };
}
