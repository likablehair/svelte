import type { LocalMigration } from '../../types.js';

export default {
	from: 'PasswordTextfield',
	to: 'SimpleTextField',
	files: ['PasswordTextfield.svelte'],
	summary: 'The local `PasswordTextfield` copy becomes a password `SimpleTextField` of the library with its eye button.',
	props: {
		defaults: [
			{ name: 'type', v4: "'password'", v5: "'text'", keepV4: 'type="password"', behaviour: true },
			{ name: 'revealable', v4: 'an eye button', v5: 'false', keepV4: 'revealable', behaviour: true }
		]
	},
	events: {
		changed: [
			{ name: 'on:input', to: 'oninput', argument: {}, type: 'Event', note: 'Svelte 4 event directive of older app code.' },
			{ name: 'on:keydown', to: 'onkeydown', argument: {}, type: 'KeyboardEvent', note: 'Svelte 4 event directive of older app code.' }
		]
	}
} satisfies LocalMigration;
