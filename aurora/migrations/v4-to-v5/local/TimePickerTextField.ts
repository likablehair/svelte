import type { LocalMigration } from '../../types.js';

export default {
	from: 'TimePickerTextField',
	to: 'TimePickerTextField',
	files: ['TimePickerTextField.svelte'],
	contains: ['MenuOrDrawer'],
	summary: 'The local `TimePickerTextField` copy becomes `TimePickerTextField` of the library (value `"HH:mm"`).',
	props: {
		removed: [
			{
				name: 'error',
				note: 'Use `state={error ? "error" : undefined}`: the border, the icon and the hint turn red.'
			}
		]
	},
	manual: [
		{
			id: 'time-picker-text-field-local-list',
			summary: 'The library field has hour and minute columns (`minuteStep`) instead of a list of times every 15 minutes, and a mask for typing.',
			action: 'Pass `minuteStep={15}` to keep the steps of the copy.'
		}
	]
} satisfies LocalMigration;
