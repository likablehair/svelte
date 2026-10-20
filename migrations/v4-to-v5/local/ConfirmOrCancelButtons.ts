import type { LocalMigration } from '../../types.js';
import base from '../ConfirmOrCancelButtons.js';

export default {
	from: 'ConfirmOrCancelButtons',
	to: 'ConfirmOrCancelButtons',
	files: ['ConfirmOrCancelButtons.svelte'],
	summary: 'The local `ConfirmOrCancelButtons` copy becomes the library component with the same name.',
	props: {
		renamed: [
			{ from: 'onConfirmClick', to: 'onconfirmClick' },
			{ from: 'onCancelClick', to: 'oncancelClick' },
			{ from: 'confirm', to: 'onconfirmClick', note: 'It receives the native `MouseEvent` (the copies passed `{ nativeEvent }`).' },
			{
				from: 'cancel',
				to: 'oncancelClick',
				note: 'It receives the native event (the copies passed `{ nativeEvent }`).'
			},
			{
				from: 'columnDirection',
				to: 'direction',
				note: '`column` keeps the buttons stacked at full width, confirm on top; `auto` stacks them only when their space is narrower than 480px.'
			}
		],
		values: [{ name: 'direction', values: { true: 'column', false: 'auto' } }],
		toCssVar: base.props.toCssVar
	},
	events: {
		changed: [
			...base.events.changed
		]
	},
	snippets: base.snippets,
	manual: base.manual
} satisfies LocalMigration;
