import type { LocalMigration } from '../../types.js';

export default {
	from: 'ButtonGroup',
	to: 'RadioGroup',
	files: ['ButtonGroup.svelte'],
	contains: ['selectedButton'],
	summary: 'The local `ButtonGroup` copy (a selector of cards) becomes `RadioGroup` of the library with `card`.',
	props: {
		renamed: [
			{ from: 'buttons', to: 'items', note: 'Each item is a `RadioItem`: `value`, `label`, `description`, `icon` (an `@mdi/js` path), `disabled`.' },
			{ from: 'selectedButton', to: 'value' }
		],
		defaults: [{ name: 'card', v4: 'cards', v5: 'false', keepV4: 'card', behaviour: true }]
	},
	snippets: {
		renamed: [
			{
				from: 'children',
				to: 'itemSnippet',
				note: 'It receives `{ item, index, checked }` instead of `{ button, selected }`. With `card` RadioGroup already shows the icon, the label and the description of each item: remove the snippet if it only did that.'
			}
		]
	}
} satisfies LocalMigration;
