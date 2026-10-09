import { error } from '@sveltejs/kit';
import type { Component } from 'svelte';

const modules = import.meta.glob<Component>('/src/docs/examples/*/*.svelte', { import: 'default' });

export async function load({ params }) {
	const module = modules[`/src/docs/examples/${params.slug}/${params.id}.svelte`];
	if (!module) error(404, 'Example not found');
	return { component: await module() };
}
