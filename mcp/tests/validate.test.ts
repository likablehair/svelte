import { describe, expect, test } from 'vitest';
import { formatIssues, validateUsage } from '../src/validate.ts';
import { spec } from './helpers.ts';

const file = (imports: string, markup: string, style = '') =>
	`<script lang="ts">\n\timport { ${imports} } from '@likable-hair/svelte';\n\tlet page = $state(1);\n</script>\n\n${markup}\n${style ? `<style>\n${style}\n</style>\n` : ''}`;

describe('validate_usage', () => {
	test('accepts correct usage', () => {
		const code = file(
			'Paginator, Dialog, Button',
			`<Paginator bind:page pageCount={10} onchange={({ page }) => console.log(page)} --paginator-gap="4px">
	{#snippet pageSnippet()}x{/snippet}
</Paginator>
<Dialog bind:open={page} title="T" --dialog-inset="0">
	{#snippet actionsSnippet()}<Button variant="primary" type="submit" aria-label="Ok" data-x="1">Ok</Button>{/snippet}
</Dialog>`,
			'.box { color: var(--global-color-text); }'
		);
		expect(validateUsage(spec, code)).toEqual([]);
	});

	test('accepts the CSS variables of the library components drawn inside, and exported classes', () => {
		const code = `<script lang="ts">\n\timport { ActivableButton, DescriptiveAvatar, FilterBuilder } from '@likable-hair/svelte';\n\tconst builder = new FilterBuilder();\n</script>\n\n<ActivableButton --button-padding="4px">B</ActivableButton>\n<DescriptiveAvatar title="Mario Rossi" --avatar-size="32px" />\n`;
		expect(validateUsage(spec, code)).toEqual([]);
		expect(validateUsage({ ...spec, exports: undefined }, code)).toEqual([]);
		const v4 = `<script lang="ts">\n\timport { PaginatedTable } from '@likable-hair/svelte';\n</script>\n\n<PaginatedTable />\n`;
		expect(validateUsage({ ...spec, exports: undefined }, v4).map((i) => i.message)).toEqual([expect.stringContaining('PaginatedTable is not a documented component')]);
	});

	test('finds unknown props, binds, snippets and CSS variables', () => {
		const code = file(
			'Paginator',
			`<Paginator bind:pageCount={page} maxPage={10} --paginator-colour="red">
	{#snippet itemSnippet()}x{/snippet}
</Paginator>`
		);
		const messages = validateUsage(spec, code).map((i) => i.message);
		expect(messages).toEqual(
			expect.arrayContaining([
				'pageCount is not bindable.',
				'Unknown prop "maxPage".',
				'CSS variable --paginator-colour does not exist on Paginator.',
				'Unknown snippet "itemSnippet".'
			])
		);
	});

	test('flags v4 habits: on: directives, { detail } and removed components', () => {
		const code = file(
			'Button, SimpleTable',
			`<Button on:click={() => {}}>A</Button>
<Button onclick={(e) => console.log(e.detail.nativeEvent)}>B</Button>
<SimpleTable />`
		);
		const issues = validateUsage(spec, code);
		expect(issues.some((i) => i.message.startsWith('on:click'))).toBe(true);
		expect(issues.some((i) => i.message.includes('{ detail }') && i.line === 7)).toBe(true);
		expect(issues.some((i) => i.message.includes('SimpleTable is not a documented component'))).toBe(true);
	});

	test('flags typos passed to native elements and hardcoded colors', () => {
		const code = file('Button', '<Button varient="primary">A</Button>', '.a { color: #ff0000; background: var(--x, #fff); }');
		const issues = validateUsage(spec, code);
		expect(issues.find((i) => i.message.includes('"varient"'))?.level).toBe('warning');
		expect(issues.some((i) => i.message.startsWith('Hardcoded color'))).toBe(true);
	});

	test('reports parse errors and formats the result', () => {
		expect(validateUsage(spec, '<div')[0].message).toMatch(/^Parse error/);
		expect(formatIssues([], 'A.svelte')).toContain('no problems found');
	});
});
