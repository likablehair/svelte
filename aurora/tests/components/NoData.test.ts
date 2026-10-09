import { mdiDatabaseOffOutline, mdiMagnify } from '@mdi/js';
import { createRawSnippet } from 'svelte';
import { describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-svelte';
import NoData from '#lib/components/simple/common/NoData.svelte';
import { snippet } from '../helpers.js';

function withArgs<T>(markup: (args: T) => string) {
	return createRawSnippet<[T]>((args) => ({ render: () => markup(args()) }));
}

const root = (container: HTMLElement) => container.querySelector<HTMLElement>('.aurora-no-data')!;

describe('NoData', () => {
	test('defaults to the md illustration with the database icon and an English title', async () => {
		const screen = await render(NoData, {});
		const element = root(screen.container);
		expect(element.getAttribute('data-size')).toBe('md');
		await expect.element(screen.getByText('No data available')).toHaveClass('aurora-no-data-title');
		const icon = element.querySelector('.aurora-no-data-icon');
		expect(icon?.getAttribute('aria-hidden')).toBe('true');
		expect(icon?.querySelector('svg path')?.getAttribute('d')).toBe(mdiDatabaseOffOutline);
		expect(element.querySelector('.aurora-no-data-description')).toBeNull();
		expect(element.querySelector('.aurora-no-data-actions')).toBeNull();
	});

	test('renders title and description', async () => {
		const screen = await render(NoData, {
			title: 'No appointments',
			description: 'The day is free.'
		});
		await expect.element(screen.getByText('No appointments')).toHaveClass('aurora-no-data-title');
		await expect
			.element(screen.getByText('The day is free.'))
			.toHaveClass('aurora-no-data-description');
		expect(screen.container.textContent).not.toContain('No data available');
	});

	test('icon takes an SVG path; icon="" removes it', async () => {
		const custom = await render(NoData, { icon: mdiMagnify, title: 'No results' });
		expect(root(custom.container).querySelector('svg path')?.getAttribute('d')).toBe(mdiMagnify);

		const none = await render(NoData, { icon: '', title: 'Nothing' });
		expect(root(none.container).querySelector('.aurora-no-data-icon')).toBeNull();
	});

	test('md frames the icon in a box; sm keeps only the icon and the text', async () => {
		const md = await render(NoData, { title: 'Medium' });
		const mdIcon = getComputedStyle(root(md.container).querySelector('.aurora-no-data-icon')!);
		expect(mdIcon.width).toBe('96px');
		expect(mdIcon.borderTopStyle).toBe('solid');
		expect(getComputedStyle(root(md.container)).minHeight).toBe('200px');

		const sm = await render(NoData, { title: 'Small', size: 'sm' });
		const smRoot = root(sm.container);
		expect(smRoot.getAttribute('data-size')).toBe('sm');
		const smIcon = getComputedStyle(smRoot.querySelector('.aurora-no-data-icon')!);
		expect(smIcon.width).toBe('32px');
		expect(smIcon.borderTopStyle).toBe('none');
		expect(getComputedStyle(smRoot).minHeight).toBe('120px');
	});

	test('children are rendered as actions under the text', async () => {
		const screen = await render(NoData, {
			title: 'No clients',
			children: snippet('<button type="button">Add client</button>')
		});
		const action = screen.getByRole('button', { name: 'Add client' }).element();
		expect(action.parentElement?.classList.contains('aurora-no-data-actions')).toBe(true);
		const title = screen.getByText('No clients').element();
		expect(action.getBoundingClientRect().top).toBeGreaterThan(
			title.getBoundingClientRect().bottom
		);
	});

	test('titleSnippet, descriptionSnippet and iconSnippet replace their parts', async () => {
		const screen = await render(NoData, {
			title: 'Empty',
			titleSnippet: withArgs<{ title: string }>(({ title }) => `<em>Custom ${title}</em>`),
			descriptionSnippet: withArgs<{ description: string | undefined }>(
				({ description }) => `<em>Description: ${description ?? 'none'}</em>`
			),
			iconSnippet: snippet('<i data-testid="icon"></i>')
		});
		const element = root(screen.container);
		expect(element.querySelector('.aurora-no-data-title')?.textContent?.trim()).toBe(
			'Custom Empty'
		);
		expect(element.querySelector('.aurora-no-data-description')?.textContent?.trim()).toBe(
			'Description: none'
		);
		const icon = screen.getByTestId('icon').element();
		expect(icon.parentElement?.classList.contains('aurora-no-data-icon')).toBe(true);
		expect(element.querySelector('svg')).toBeNull();
	});

	test('forwards native attributes and class to the root', async () => {
		const screen = await render(NoData, {
			id: 'empty',
			role: 'status',
			'aria-label': 'Empty list',
			class: 'app-class'
		});
		const element = screen.getByRole('status', { name: 'Empty list' });
		await expect.element(element).toHaveAttribute('id', 'empty');
		await expect.element(element).toHaveClass('aurora-no-data', 'app-class');
		expect(element.element().querySelector('.app-class')).toBeNull();
	});

	test('lang is only the native attribute: the default title stays English', async () => {
		const screen = await render(NoData, { lang: 'it' });
		await expect.element(screen.getByText('No data available')).toBeInTheDocument();
		expect(root(screen.container).getAttribute('lang')).toBe('it');
	});

	test('v4 bug: the text is readable, not dimmed to 25%', async () => {
		const screen = await render(NoData, { size: 'sm' });
		const element = root(screen.container);
		const title = element.querySelector('.aurora-no-data-title')!;
		expect(getComputedStyle(element).opacity).toBe('1');
		expect(getComputedStyle(title).opacity).toBe('1');
	});

	test('instance CSS variables override the defaults', async () => {
		const screen = await render(NoData, {
			title: 'Styled',
			style: [
				'--no-data-height: 300px',
				'--no-data-gap: 5px',
				'--no-data-title-color: rgb(1, 2, 3)',
				'--no-data-icon-color: rgb(4, 5, 6)'
			].join(';')
		});
		const element = root(screen.container);
		const style = getComputedStyle(element);
		expect(style.height).toBe('300px');
		expect(style.rowGap).toBe('5px');
		expect(getComputedStyle(element.querySelector('.aurora-no-data-title')!).color).toBe(
			'rgb(1, 2, 3)'
		);
		expect(getComputedStyle(element.querySelector('.aurora-no-data-icon')!).color).toBe(
			'rgb(4, 5, 6)'
		);
	});
});
