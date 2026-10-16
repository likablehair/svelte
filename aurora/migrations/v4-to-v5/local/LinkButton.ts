import type { LocalMigration } from '../../types.js';

export default {
	from: 'LinkButton',
	to: 'Button',
	files: ['LinkButton.svelte'],
	contains: ['fit-content'],
	summary: 'The local `LinkButton` copy (clickable text) becomes a text `Button` of the library.',
	props: {
		removed: [
			{ name: 'marginTop', note: 'Space comes from the layout.', drop: true },
			{ name: 'fontSize', note: 'Use `--button-font-size`.' }
		],
		defaults: [{ name: 'buttonType', v4: 'clickable text', v5: "'default'", keepV4: 'buttonType="text"', behaviour: true }]
	},
	events: {
		changed: [{ name: 'on:click', to: 'onclick', argument: {}, type: 'MouseEvent', note: 'Svelte 4 event directive of older app code.' }]
	},
	manual: [
		{
			id: 'link-button-navigation',
			summary: 'A text button that only navigates (`() => goto("/")`) is better as a link.',
			action: 'Replace `onclick={() => goto("/x")}` with `href="/x"` on the Button: it becomes a real link that opens in a new tab and is preloaded.'
		}
	]
} satisfies LocalMigration;
