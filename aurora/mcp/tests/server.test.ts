import { describe, expect, test } from 'vitest';
import { call, connect, tempApp } from './helpers.ts';

describe('MCP server on a v5 app', async () => {
	const client = await connect(tempApp('^5.0.0'));

	test('lists the docs tools and no migration tools', async () => {
		const { tools } = await client.listTools();
		const names = tools.map((t) => t.name);
		expect(names).toEqual(
			expect.arrayContaining(['list_components', 'get_component', 'get_example', 'get_pattern', 'search_docs', 'get_tokens', 'list_themes', 'get_theme', 'get_styling_guide', 'validate_usage'])
		);
		expect(names.some((n) => n.startsWith('migration_'))).toBe(false);
	});

	test('gives the instructions with the version', () => {
		expect(client.getInstructions()).toContain('@likable-hair/svelte 5.0.0');
	});

	test('lists the components by category', async () => {
		const { text } = await call(client, 'list_components', { category: 'layouts' });
		expect(text).toContain('SidebarLayout');
		expect(text).not.toContain('- Button');
	});

	test('returns a component, whole or by section, case insensitive', async () => {
		const whole = await call(client, 'get_component', { name: 'button' });
		expect(whole.text).toContain('## Props');
		expect(whole.text).toContain('## CSS variables');
		const props = await call(client, 'get_component', { name: 'Button', sections: ['props'] });
		expect(props.text).toContain('## Props');
		expect(props.text).not.toContain('## CSS variables');
	});

	test('suggests close names for an unknown component', async () => {
		const result = await call(client, 'get_component', { name: 'SimpleTable' });
		expect(result.isError).toBe(true);
		expect(result.text).toContain('Table');
	});

	test('lists and returns examples', async () => {
		const list = await call(client, 'get_example', { name: 'Button' });
		const id = list.text.match(/^- ([\w-]+):/m)![1];
		const example = await call(client, 'get_example', { name: 'Button', id });
		expect(example.text).toContain("from '@likable-hair/svelte'");
	});

	test('lists and returns page patterns', async () => {
		const list = await call(client, 'get_pattern');
		expect(list.text).toContain('- list-page: List page.');
		const page = await call(client, 'get_pattern', { name: 'list-page' });
		expect(page.text).toContain('<DataTable');
	});

	test('searches the docs', async () => {
		const { text } = await call(client, 'search_docs', { query: 'selection actions' });
		expect(text).toContain('DataTable');
	});

	test('returns gallery and package themes with their usage', async () => {
		const list = await call(client, 'list_themes');
		expect(list.text).toContain('ocean');
		const gallery = await call(client, 'get_theme', { name: 'ocean' });
		expect(gallery.text).toContain('gallery theme');
		expect(gallery.text).toContain("setTheme('ocean')");
		expect(gallery.text).toContain(":root[data-theme='ocean']");
		const shipped = await call(client, 'get_theme', { name: 'classic' });
		expect(shipped.text).toContain("import '@likable-hair/svelte/themes/classic.css'");
	});

	test('validates code', async () => {
		const { text } = await call(client, 'validate_usage', {
			code: `<script>import { Button } from '@likable-hair/svelte';</script>\n<Button varient="primary">Go</Button>`
		});
		expect(text).toContain('varient');
	});

	test('offers the design prompts', async () => {
		const { prompts } = await client.listPrompts();
		expect(prompts.map((p) => p.name)).toEqual(expect.arrayContaining(['design-page', 'create-theme']));
	});
});

describe('MCP server on a v4 app', async () => {
	const client = await connect(tempApp('^4.3.2'));

	test('adds the migration tools and prompt', async () => {
		const { tools } = await client.listTools();
		expect(tools.map((t) => t.name)).toEqual(
			expect.arrayContaining(['migration_analyze', 'migration_setup', 'migration_codemod', 'migration_rules'])
		);
		const { prompts } = await client.listPrompts();
		expect(prompts.map((p) => p.name)).toContain('migrate-app');
		expect(client.getInstructions()).toContain('aurora-migrate');
	});

	test('returns the rules of a component', async () => {
		const { text, isError } = await call(client, 'migration_rules', { name: 'Button' });
		expect(isError).toBe(false);
		expect(text).toContain('## Button → Button');
	});
});
