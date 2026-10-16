import type { LocalMigration } from '../../types.js';

export default {
	from: 'ToolTipTextField',
	to: 'SimpleTextField',
	files: ['ToolTipTextField.svelte'],
	summary: 'The local `ToolTipTextField` copy becomes `SimpleTextField` of the library: the message moves from a tooltip on an icon to the text under the field.',
	props: {
		renamed: [
			{
				from: 'message',
				to: 'hint',
				note: 'The hint is always visible: write `hint={valid ? undefined : message}` where the message was only for an invalid value.'
			}
		],
		removed: [
			{
				name: 'valid',
				note: 'Use `state={valid ? undefined : "error"}`: the border, the icon and the hint turn red.'
			},
			{ name: 'icon', note: 'The error state shows its own icon; for another icon use `appendInnerIcon` (an `@mdi/js` path).' },
			{ name: 'iconColor', note: 'The icon of the error state takes the error color.', drop: true }
		]
	}
} satisfies LocalMigration;
