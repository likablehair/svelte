import type { Component } from 'svelte';

const modules = import.meta.glob<Component>('/src/docs/examples/*/*.svelte', { import: 'default' });

export async function load({ data, params }) {
	const examples = await Promise.all(
		data.examples.map(async (example) => ({
			...example,
			component: await modules[`/src/docs/examples/${params.slug}/${example.id}.svelte`]?.()
		}))
	);
	return { ...data, examples };
}
