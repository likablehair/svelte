import { describe, expect, test } from 'vitest';
import { expandIndex, prepareEntries, rankEntries, type SearchIndex } from '../../src/docs/search.js';

const component = (name: string, slug: string, extra: Partial<SearchIndex['components'][number]> = {}) => ({
	name,
	slug,
	description: `${name} description.`,
	text: `${name} description.`,
	examples: [],
	props: [],
	events: [],
	snippets: [],
	methods: [],
	types: [],
	css: [],
	...extra
});

const index: SearchIndex = {
	pages: [
		{ label: 'Themes', href: '/themes' },
		{ label: 'Light, dark and remembering the choice', href: '/themes#light-dark', page: 'Themes' },
		{ label: 'Elevation', href: '/#elevation', page: 'Tokens' }
	],
	tokens: [['--global-color-primary', 'Brand · #1f5af0']],
	components: [
		component('Autocomplete', 'autocomplete', {
			props: [['loading', 'Shows a spinner.']],
			examples: [['01-loading', 'Loading']]
		}),
		component('Button', 'button', {
			text: 'Button that starts an upload.',
			props: [
				['loading', 'Shows a spinner.'],
				['buttonType', 'Shape.']
			],
			css: [['--button-background', 'var(--global-fill-primary)']],
			types: [['ButtonVariant', 'Color.']]
		}),
		component('DatePicker', 'date-picker'),
		component('DatePickerTextField', 'date-picker-text-field'),
		component('Table', 'table', {
			props: Array.from({ length: 8 }, (_, i): [string, string] => [`option${i}`, ''])
		})
	]
};

const entries = prepareEntries(expandIndex(index));
const search = (text: string, currentPath?: string) => rankEntries(entries, text, currentPath);

describe('docs search', () => {
	test('expandIndex builds the links with the anchors of the component page', () => {
		const hrefs = expandIndex(index).map((entry) => entry.href);
		expect(hrefs).toContain('/components/button#prop-loading');
		expect(hrefs).toContain('/components/button#css-button-background');
		expect(hrefs).toContain('/components/button#type-ButtonVariant');
		expect(hrefs).toContain('/components/autocomplete#01-loading');
		expect(hrefs).toContain('/#token-global-color-primary');
	});

	test('an exact name comes first, props before examples, and the open page wins a tie', () => {
		expect(search('loading').map((r) => [r.group, r.description])).toEqual([
			['Props', 'Autocomplete · Shows a spinner.'],
			['Props', 'Button · Shows a spinner.'],
			['Examples', 'Autocomplete example']
		]);
		expect(search('loading', '/components/button')[0].href).toBe('/components/button#prop-loading');
	});

	test('the words of the query can be in any order and match the component name', () => {
		expect(search('background button')[0].label).toBe('--button-background');
		expect(search('date picker').map((r) => r.label)).toEqual(['DatePicker', 'DatePickerTextField']);
	});

	test('the description of a component is searched last, accents and case are ignored', () => {
		expect(search('UPLOAD').map((r) => r.label)).toEqual(['Button']);
		expect(search('élévation').map((r) => r.href)).toEqual(['/#elevation']);
		expect(search('dark')[0].label).toBe('Light, dark and remembering the choice');
	});

	test('each group shows at most five results', () => {
		expect(search('option').filter((r) => r.group === 'Props')).toHaveLength(5);
		expect(search('   ')).toEqual([]);
	});
});
