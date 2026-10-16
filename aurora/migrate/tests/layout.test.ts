import { describe, expect, test } from 'vitest';
import { addAppearance, addDefaultLocale } from '../src/layout.ts';
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

describe('addAppearance', () => {
	test('adds the import, the call and the head script, once', () => {
		const source = "<script lang=\"ts\">\n\timport { Toaster } from '@likable-hair/svelte';\n\timport '../app.css';\n\n\tlet { children } = $props();\n</script>\n\n<Toaster />\n{@render children()}\n";
		const { text, changed } = addAppearance(source);
		expect(changed).toBe(true);
		expect(text).toBe(
			"<script lang=\"ts\">\n\timport { Toaster, appearanceScript, rememberAppearance } from '@likable-hair/svelte';\n\timport '../app.css';\n\n\trememberAppearance();\n\n\tlet { children } = $props();\n</script>\n\n<svelte:head>{@html '<script>' + appearanceScript() + '</script>'}</svelte:head>\n\n<Toaster />\n{@render children()}\n"
		);
		expect(addAppearance(text).changed).toBe(false);
	});

	test('goes into an existing svelte:head, and works without a script', () => {
		const withHead = addAppearance("<script>\n\timport x from './x';\n</script>\n\n<svelte:head><title>App</title></svelte:head>\n", false).text;
		expect(withHead).toContain("<svelte:head>{@html '<script>' + appearanceScript() + '</script>'}<title>App</title></svelte:head>");
		expect(withHead).toContain("import { appearanceScript, rememberAppearance } from '@likable-hair/svelte';");
		const bare = addAppearance('<slot />\n', false).text;
		expect(bare).toBe(
			"<script>\n\timport { appearanceScript, rememberAppearance } from '@likable-hair/svelte';\n\n\trememberAppearance();\n</script>\n\n<svelte:head>{@html '<script>' + appearanceScript() + '</script>'}</svelte:head>\n\n<slot />\n"
		);
	});
});

