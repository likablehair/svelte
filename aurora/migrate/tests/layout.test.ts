import { describe, expect, test } from 'vitest';
import { addDefaultLocale } from '../src/layout.ts';
import { guessLanguage } from '../src/analyze.ts';

describe('addDefaultLocale', () => {
	test('adds the import and the call after the last import, with the indentation of the file', () => {
		const source = "<script lang=\"ts\">\n  import '../app.css'\n  import Toaster from '$lib/Toaster.svelte'\n\n  let { children } = $props()\n</script>\n\n{@render children()}\n";
		expect(addDefaultLocale(source, 'it').text).toBe(
			"<script lang=\"ts\">\n  import '../app.css'\n  import Toaster from '$lib/Toaster.svelte'\n  import { setDefaultLocale } from '@likable-hair/svelte'\n\n  setDefaultLocale('it')\n\n  let { children } = $props()\n</script>\n\n{@render children()}\n"
		);
	});

	test('joins an existing import from the library', () => {
		const source = "<script>\n\timport { Button } from '@likable-hair/svelte';\n</script>\n";
		expect(addDefaultLocale(source, 'it').text).toBe(
			"<script>\n\timport { Button, setDefaultLocale } from '@likable-hair/svelte';\n\n\tsetDefaultLocale('it');\n</script>\n"
		);
	});

	test('a layout without script gets one; an existing call is left alone', () => {
		expect(addDefaultLocale('<slot />\n', 'it').text).toBe(
			"<script lang=\"ts\">\n\timport { setDefaultLocale } from '@likable-hair/svelte';\n\n\tsetDefaultLocale('it');\n</script>\n\n<slot />\n"
		);
		const done = "<script>\n\timport { setDefaultLocale } from '@likable-hair/svelte';\n\tsetDefaultLocale('it');\n</script>\n";
		expect(addDefaultLocale(done, 'it')).toEqual({ text: done, changed: false });
	});
});

describe('guessLanguage', () => {
	test('reads the words of the interface, not of the scripts', () => {
		expect(guessLanguage(['<h1>Utenti</h1><Button>Salva</Button><span>Nuovo ruolo</span>']).guess).toBe('it');
		expect(guessLanguage(['<script>const Save = 1; const Cancel = 2; const New = 3;</script><p>Utenti</p>']).guess).toBe(null);
		expect(guessLanguage(['<Button>Save</Button><Button>Cancel</Button><h1>Users</h1>']).guess).toBe('en');
	});
});
