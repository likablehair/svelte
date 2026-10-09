import { createRawSnippet } from 'svelte';

export function snippet(markup: string) {
	return createRawSnippet(() => ({ render: () => markup }));
}

export function text(value: string) {
	return snippet(`<span>${value}</span>`);
}
