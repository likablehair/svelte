import { describe, expect, test } from 'vitest';
import { listComponents } from '../../src/docs/api.server.js';
import { specSources } from '../../scripts/spec-sources.js';

describe('spec.json', () => {
	const spec = specSources('5.0.0-test');

	test('has the header', () => {
		expect(spec).toMatchObject({ schema: 1, package: '@likable-hair/svelte', version: '5.0.0-test' });
	});

	test('contains every documented component with its markdown and examples', () => {
		const names = spec.components.map((c) => c.name);
		expect(names).toEqual(listComponents().map((c) => c.name));
		const button = spec.components.find((c) => c.name === 'Button')!;
		expect(button.props.some((p) => p.name === 'variant')).toBe(true);
		expect(button.markdown).toContain('# Button');
		expect(button.examples.length).toBeGreaterThan(0);
	});

	test('contains the library and gallery themes', () => {
		expect(spec.themes.filter((t) => t.gallery)).toHaveLength(14);
		expect(spec.themes.find((t) => t.name === 'classic')?.gallery).toBe(false);
		expect(spec.themes.find((t) => t.name === 'ocean')?.source).toContain('[data-theme');
	});

	test('contains tokens, styling and the search entries', () => {
		expect(spec.tokens.groups.length).toBeGreaterThan(0);
		expect(spec.styling).toContain('Tailwind');
		expect(spec.patterns.map((p) => p.id)).toContain('01-list-page');
		expect(spec.patterns[0].code).toContain("from '@likable-hair/svelte'");
		expect(spec.search.some((e) => e.kind === 'prop' && e.context === 'DataTable')).toBe(true);
	});
});
