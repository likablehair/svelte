import type { LocalMigration } from '../../types.js';

export default {
	from: 'WidgetError',
	to: 'AlertBanner',
	files: ['WidgetError.svelte'],
	summary: 'The local `WidgetError` copy becomes an error `AlertBanner` of the library.',
	props: {
		defaults: [
			{ name: 'variant', v4: 'an error box', v5: "'info'", keepV4: 'variant="error"', behaviour: true },
			{ name: 'title', v4: "'Errore'", v5: 'none', keepV4: 'title="Errore"', behaviour: true },
			{
				name: 'description',
				v4: "'Si è verificato un problema durante il caricamento dei dati'",
				v5: 'none',
				keepV4: 'description="Si è verificato un problema durante il caricamento dei dati"',
				behaviour: true
			}
		]
	}
} satisfies LocalMigration;
