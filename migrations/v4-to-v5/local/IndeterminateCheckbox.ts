import type { LocalMigration } from '../../types.js';

export default {
	from: 'IndeterminateCheckbox',
	to: 'Checkbox',
	files: ['IndeterminateCheckbox.svelte'],
	summary: 'The local `IndeterminateCheckbox` copy becomes `Checkbox` of the library, which has `indeterminate`.',
	props: {
		renamed: [
			{
				from: 'onCheckedChange',
				to: 'onchange',
				native: true,
				note: 'The native change event: read `event.currentTarget.checked` instead of `e.checked`; a click on an indeterminate checkbox checks it and clears `indeterminate`, as before.'
			}
		]
	}
} satisfies LocalMigration;
