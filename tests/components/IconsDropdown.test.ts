import {
	mdiFormatAlignCenter,
	mdiFormatAlignJustify,
	mdiFormatAlignLeft,
	mdiFormatAlignRight,
	mdiFormatBold,
	mdiFormatHeader1,
	mdiFormatHeader2,
	mdiFormatItalic,
	mdiFormatParagraph,
	mdiFormatUnderline
} from '@mdi/js';
import { describe, expect, test, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import IconsDropdown from '#lib/components/composed/forms/IconsDropdown.svelte';
import type { IconItem } from '#lib/components/simple/forms/item.js';

const alignments: IconItem[] = [
	{ value: 'left', label: 'Align left', icon: mdiFormatAlignLeft },
	{ value: 'center', label: 'Center', icon: mdiFormatAlignCenter },
	{ value: 'right', label: 'Align right', icon: mdiFormatAlignRight },
	{ value: 'justify', label: 'Justify', icon: mdiFormatAlignJustify }
];

const seven: IconItem[] = [
	{ value: 'p', label: 'Paragraph', icon: mdiFormatParagraph },
	{ value: 'h1', label: 'Heading 1', icon: mdiFormatHeader1 },
	{ value: 'h2', label: 'Heading 2', icon: mdiFormatHeader2 },
	{ value: 'bold', label: 'Bold', icon: mdiFormatBold },
	{ value: 'italic', label: 'Italic', icon: mdiFormatItalic },
	{ value: 'underline', label: 'Underline', icon: mdiFormatUnderline },
	{ value: 'justify', label: 'Justify', icon: mdiFormatAlignJustify }
];

const activeName = (trigger: Element) =>
	document
		.getElementById(trigger.getAttribute('aria-activedescendant') ?? '')
		?.querySelector('.aurora-icons-dropdown-hidden')?.textContent;

const openTooltip = () =>
	document.querySelector('.aurora-icons-dropdown-tooltip:popover-open')?.textContent?.trim();

describe('IconsDropdown', () => {
	test('the button is a combobox named by label, which is not shown, and shows the chosen icon as a tile', async () => {
		const screen = await render(IconsDropdown, {
			label: 'Alignment',
			items: alignments,
			values: [alignments[1]]
		});
		const trigger = screen.getByRole('combobox', { name: 'Alignment' });
		expect(trigger.element().tagName).toBe('BUTTON');
		const label = trigger.element().querySelector('.aurora-dropdown-label') as HTMLElement;
		expect(label.textContent).toBe('Alignment');
		expect(label.getBoundingClientRect().width).toBeLessThanOrEqual(1);
		const tiles = trigger.element().querySelectorAll('.aurora-icons-dropdown-value');
		expect(tiles).toHaveLength(1);
		expect(tiles[0].querySelector('path')?.getAttribute('d')).toBe(mdiFormatAlignCenter);
		expect(tiles[0]).toHaveAttribute('aria-hidden', 'true');
		expect(trigger.element().textContent).toContain('Center');
		expect(getComputedStyle(trigger.element().querySelector('.aurora-icons-dropdown-hidden:not(.aurora-dropdown-label)')!).position).toBe('absolute');
	});

	test('v4 bug: the selected icon is there from the first render', async () => {
		const screen = await render(IconsDropdown, { items: alignments, values: [alignments[2]] });
		expect(screen.container.querySelector('.aurora-icons-dropdown-value path')?.getAttribute('d')).toBe(mdiFormatAlignRight);
	});

	test('without a selection: the placeholder, or only the arrow with "Select" for screen readers', async () => {
		const empty = await render(IconsDropdown, { items: alignments });
		const trigger = empty.getByRole('combobox', { name: 'Select' });
		await expect.element(trigger).toBeInTheDocument();
		expect(trigger.element().querySelector('.aurora-icons-dropdown-value')).toBeNull();
		expect(trigger.element().querySelector('.aurora-icons-dropdown-placeholder')).toBeNull();
		await empty.unmount();

		const withPlaceholder = await render(IconsDropdown, { label: 'Icon', items: alignments, placeholder: 'Choose an icon' });
		const placeholder = withPlaceholder.container.querySelector('.aurora-icons-dropdown-placeholder');
		expect(placeholder?.textContent).toBe('Choose an icon');
		await expect.element(withPlaceholder.getByText('Choose an icon')).toBeVisible();
	});

	test('v4 bug: every option is named by its label', async () => {
		const screen = await render(IconsDropdown, { label: 'Alignment', items: alignments });
		await screen.getByRole('combobox').click();
		const listbox = screen.getByRole('listbox', { name: 'Alignment' });
		await expect.element(listbox).toBeVisible();
		for (const item of alignments)
			await expect.element(listbox.getByRole('option', { name: item.label })).toBeVisible();
		const tile = listbox.getByRole('option', { name: 'Center' }).element().querySelector('.aurora-icons-dropdown-tile path');
		expect(tile?.getAttribute('d')).toBe(mdiFormatAlignCenter);
	});

	test('the list is a grid: as many columns as options up to 5, or columns', async () => {
		const four = await render(IconsDropdown, { label: 'Alignment', items: alignments });
		await four.getByRole('combobox').click();
		const listbox = four.getByRole('listbox');
		await expect.element(listbox).toHaveAttribute('data-columns', '4');
		const tops = [...listbox.element().querySelectorAll('[role=option]')].map((option) => option.getBoundingClientRect().top);
		expect(new Set(tops).size).toBe(1);
		await four.unmount();

		const many = await render(IconsDropdown, { label: 'Format', items: seven });
		await many.getByRole('combobox').click();
		await expect.element(many.getByRole('listbox')).toHaveAttribute('data-columns', '5');
		await many.unmount();

		const custom = await render(IconsDropdown, { label: 'Format', items: seven, columns: 3 });
		await custom.getByRole('combobox').click();
		const grid = custom.getByRole('listbox').element();
		expect(grid.getAttribute('data-columns')).toBe('3');
		const options = [...grid.querySelectorAll('[role=option]')];
		expect(options[3].getBoundingClientRect().top).toBeGreaterThan(options[2].getBoundingClientRect().top);
		expect(Math.round(options[3].getBoundingClientRect().left)).toBe(Math.round(options[0].getBoundingClientRect().left));
	});

	test('keyboard: the four arrows move through the grid, Enter picks', async () => {
		const onchange = vi.fn();
		const screen = await render(IconsDropdown, { label: 'Format', items: seven, onchange });
		const trigger = screen.getByRole('combobox');
		await userEvent.keyboard('{Tab}{ArrowDown}');
		await expect.element(trigger).toHaveAttribute('aria-expanded', 'true');
		expect(activeName(trigger.element())).toBe('Paragraph');
		await userEvent.keyboard('{ArrowRight}{ArrowRight}');
		expect(activeName(trigger.element())).toBe('Heading 2');
		await userEvent.keyboard('{ArrowDown}');
		expect(activeName(trigger.element())).toBe('Justify');
		await userEvent.keyboard('{ArrowDown}');
		expect(activeName(trigger.element())).toBe('Justify');
		await userEvent.keyboard('{ArrowUp}');
		expect(activeName(trigger.element())).toBe('Heading 1');
		await userEvent.keyboard('{ArrowUp}{ArrowLeft}');
		expect(activeName(trigger.element())).toBe('Paragraph');
		await userEvent.keyboard('{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}{ArrowDown}');
		expect(activeName(trigger.element())).toBe('Justify');
		await userEvent.keyboard('{ArrowLeft}');
		expect(activeName(trigger.element())).toBe('Underline');
		await userEvent.keyboard('{ArrowLeft}');
		expect(activeName(trigger.element())).toBe('Italic');
		await userEvent.keyboard('{Enter}');
		expect(onchange).toHaveBeenCalledWith({ select: seven[4], unselect: undefined, selection: [seven[4]] });
		await expect.element(trigger).toHaveAttribute('aria-expanded', 'false');
		await expect.element(trigger).toHaveFocus();
	});

	test('in a right-to-left page the left arrow moves forward', async () => {
		const container = document.createElement('div');
		container.dir = 'rtl';
		document.body.append(container);
		const screen = await render(IconsDropdown, { target: container, props: { label: 'Alignment', items: alignments } });
		const trigger = screen.getByRole('combobox');
		await userEvent.keyboard('{Tab}{ArrowDown}{ArrowLeft}{ArrowLeft}');
		expect(activeName(trigger.element())).toBe('Align right');
		await userEvent.keyboard('{ArrowRight}');
		expect(activeName(trigger.element())).toBe('Center');
		container.remove();
	});

	test('type-ahead jumps to the option whose label starts with the letter', async () => {
		const screen = await render(IconsDropdown, { label: 'Format', items: seven });
		const trigger = screen.getByRole('combobox');
		await userEvent.keyboard('{Tab}u');
		await expect.element(trigger).toHaveAttribute('aria-expanded', 'true');
		expect(activeName(trigger.element())).toBe('Underline');
	});

	test('the highlighted tile shows its label in a Tooltip that screen readers skip', async () => {
		const screen = await render(IconsDropdown, { label: 'Alignment', items: alignments });
		await userEvent.keyboard('{Tab}{ArrowDown}');
		await expect.poll(openTooltip).toBe('Align left');
		const tooltip = document.querySelector('.aurora-icons-dropdown-tooltip:popover-open') as HTMLElement;
		expect(tooltip).toHaveAttribute('aria-hidden', 'true');
		expect(getComputedStyle(tooltip).pointerEvents).toBe('none');
		await userEvent.keyboard('{ArrowRight}');
		await expect.poll(openTooltip).toBe('Center');
		expect(document.querySelectorAll('.aurora-icons-dropdown-tooltip:popover-open')).toHaveLength(1);
		await screen.getByRole('option', { name: 'Justify' }).hover();
		await expect.poll(openTooltip).toBe('Justify');
		await expect.element(screen.getByRole('option', { name: 'Justify' })).toHaveAccessibleName('Justify');
	});

	test('the chosen tile and the highlighted one expose their state', async () => {
		const screen = await render(IconsDropdown, { label: 'Alignment', items: alignments, values: [alignments[0]] });
		await userEvent.keyboard('{Tab}{ArrowDown}');
		const listbox = screen.getByRole('listbox').element();
		const first = listbox.querySelector('[role=option] .aurora-icons-dropdown-tile') as HTMLElement;
		expect(first).toHaveAttribute('data-selected');
		expect(first).toHaveAttribute('data-highlighted');
		await userEvent.keyboard('{ArrowRight}');
		expect(first).not.toHaveAttribute('data-highlighted');
		const second = listbox.querySelectorAll('.aurora-icons-dropdown-tile')[1];
		expect(second).toHaveAttribute('data-highlighted');
		expect(second).not.toHaveAttribute('data-selected');
	});

	test('clearable is off by default; with it the X clears', async () => {
		const plain = await render(IconsDropdown, { label: 'Alignment', items: alignments, values: [alignments[0]] });
		await expect.element(plain.getByRole('button', { name: 'Clear selection' })).not.toBeInTheDocument();
		await plain.unmount();

		const onchange = vi.fn();
		const clearable = await render(IconsDropdown, {
			label: 'Alignment',
			items: alignments,
			values: [alignments[0]],
			clearable: true,
			onchange
		});
		await clearable.getByRole('button', { name: 'Clear selection' }).click();
		expect(onchange).toHaveBeenCalledWith({ select: undefined, unselect: alignments[0], selection: [] });
		expect(clearable.container.querySelector('.aurora-icons-dropdown-value')).toBeNull();
	});

	test('multiple: tiles up to maxVisibleIcons, then "+N"; screen readers hear every label', async () => {
		const onchange = vi.fn();
		const screen = await render(IconsDropdown, {
			label: 'Marks',
			items: seven,
			values: seven.slice(3, 6),
			multiple: true,
			maxVisibleIcons: 2,
			onchange
		});
		const trigger = screen.getByRole('combobox');
		expect(trigger.element().querySelectorAll('.aurora-icons-dropdown-value')).toHaveLength(2);
		expect(trigger.element().querySelector('.aurora-icons-dropdown-counter')?.textContent).toBe('+1');
		expect(trigger.element().textContent).toContain('Bold, Italic, Underline');
		await trigger.click();
		await screen.getByRole('option', { name: 'Paragraph' }).click();
		await expect.element(trigger).toHaveAttribute('aria-expanded', 'true');
		expect(onchange.mock.calls[0][0].selection.map((item: IconItem) => item.value)).toEqual(['bold', 'italic', 'underline', 'p']);
		await expect.poll(() => trigger.element().querySelector('.aurora-icons-dropdown-counter')?.textContent).toBe('+2');
	});

	test('selectionText sets what screen readers hear', async () => {
		const screen = await render(IconsDropdown, {
			label: 'Alignment',
			items: alignments,
			values: [alignments[3]],
			selectionText: (values: IconItem[]) => `Text is ${values[0].label.toLowerCase()}`
		});
		expect(screen.getByRole('combobox').element().textContent).toContain('Text is justify');
	});

	test('bind:values follows the choice', async () => {
		let values: IconItem[] | undefined = [alignments[0]];
		const screen = await render(IconsDropdown, {
			label: 'Alignment',
			items: alignments,
			get values() {
				return values;
			},
			set values(next) {
				values = next;
			}
		});
		await screen.getByRole('combobox').click();
		await screen.getByRole('option', { name: 'Align right' }).click();
		await expect.poll(() => values?.map((item) => item.value)).toEqual(['right']);
	});

	test('disabled: the list does not open', async () => {
		const screen = await render(IconsDropdown, { label: 'Alignment', items: alignments, values: [alignments[0]], disabled: true });
		const trigger = screen.getByRole('combobox');
		await expect.element(trigger).toBeDisabled();
		await userEvent.keyboard('{Tab}{ArrowDown}');
		await expect.element(trigger).toHaveAttribute('aria-expanded', 'false');
	});

	test('size follows the buttons and resizes the tile', async () => {
		const small = await render(IconsDropdown, { label: 'Alignment', items: alignments, values: [alignments[0]], size: 'sm' });
		const trigger = small.getByRole('combobox').element();
		expect(trigger).toHaveAttribute('data-size', 'sm');
		expect(trigger.getBoundingClientRect().height).toBe(28);
		expect(trigger.querySelector('.aurora-icons-dropdown-value')!.getBoundingClientRect().width).toBe(20);
		await small.unmount();

		const medium = await render(IconsDropdown, { label: 'Alignment', items: alignments, values: [alignments[0]] });
		const button = medium.getByRole('combobox').element();
		expect(button.getBoundingClientRect().height).toBe(34);
		expect(button.querySelector('.aurora-icons-dropdown-value')!.getBoundingClientRect().width).toBe(26);
	});

	test('--icons-dropdown-* variables restyle the button, the tiles and the menu', async () => {
		const container = document.createElement('div');
		container.style.setProperty('--icons-dropdown-width', '120px');
		container.style.setProperty('--icons-dropdown-value-size', '22px');
		container.style.setProperty('--icons-dropdown-value-background', 'rgb(255, 0, 0)');
		container.style.setProperty('--icons-dropdown-option-size', '40px');
		container.style.setProperty('--icons-dropdown-option-selected-background', 'rgb(0, 128, 0)');
		container.style.setProperty('--icons-dropdown-menu-gap', '10px');
		document.body.append(container);
		const screen = await render(IconsDropdown, {
			target: container,
			props: { label: 'Alignment', items: alignments, values: [alignments[0]] }
		});
		const trigger = screen.getByRole('combobox');
		expect(screen.container.querySelector('.aurora-icons-dropdown')!.getBoundingClientRect().width).toBe(120);
		const value = trigger.element().querySelector('.aurora-icons-dropdown-value')!;
		expect(value.getBoundingClientRect().width).toBe(22);
		expect(getComputedStyle(value).backgroundColor).toBe('rgb(255, 0, 0)');
		await trigger.click();
		const listbox = screen.getByRole('listbox').element();
		const tiles = listbox.querySelectorAll('.aurora-icons-dropdown-tile');
		expect((tiles[0] as HTMLElement).offsetWidth).toBe(40);
		expect(getComputedStyle(tiles[0]).backgroundImage).toBe('none');
		expect(getComputedStyle(tiles[0]).backgroundColor).toBe('rgb(0, 128, 0)');
		expect(getComputedStyle(listbox).columnGap).toBe('10px');
		container.remove();
	});

	test('--icons-dropdown-menu-width sets the width of the menu, which otherwise fits the grid', async () => {
		const screen = await render(IconsDropdown, { label: 'Alignment', items: alignments, values: [alignments[0]] });
		await screen.getByRole('combobox').click();
		const menu = screen.container.querySelector('.aurora-icons-dropdown-menu') as HTMLElement;
		await expect.element(menu).toBeVisible();
		const listbox = menu.querySelector('[role=listbox]')!;
		expect(menu.getBoundingClientRect().width).toBeLessThan(listbox.getBoundingClientRect().width + 20);
		expect(menu.getBoundingClientRect().width).toBeLessThan(220);
		await screen.unmount();

		const container = document.createElement('div');
		container.style.setProperty('--icons-dropdown-menu-width', '300px');
		document.body.append(container);
		const wide = await render(IconsDropdown, { target: container, props: { label: 'Alignment', items: alignments } });
		await wide.getByRole('combobox').click();
		const wideMenu = wide.container.querySelector('.aurora-icons-dropdown-menu') as HTMLElement;
		await expect.element(wideMenu).toBeVisible();
		expect(wideMenu.offsetWidth).toBe(300);
		container.remove();
	});

	test('class parts reach the right elements, tile on every tile', async () => {
		const screen = await render(IconsDropdown, {
			label: 'Alignment',
			items: alignments,
			values: [alignments[0]],
			class: { container: 'app-container', button: 'app-button', tile: 'app-tile', option: 'app-option', menu: 'app-menu' }
		});
		expect(screen.container.querySelector('.aurora-icons-dropdown')).toHaveClass('app-container');
		const trigger = screen.getByRole('combobox');
		await expect.element(trigger).toHaveClass('app-button');
		expect(trigger.element().querySelector('.aurora-icons-dropdown-value')).toHaveClass('app-tile');
		await trigger.click();
		expect(screen.container.querySelector('.aurora-icons-dropdown-menu')).toHaveClass('app-menu');
		await expect.element(screen.getByRole('option', { name: 'Center' })).toHaveClass('app-option');
		expect(screen.getByRole('option', { name: 'Center' }).element().querySelector('.aurora-icons-dropdown-tile')).toHaveClass('app-tile');
	});

	test('itemSnippet and valueSnippet replace the icons', async () => {
		const { createRawSnippet } = await import('svelte');
		const screen = await render(IconsDropdown, {
			label: 'Alignment',
			items: alignments,
			values: [alignments[0]],
			valueSnippet: createRawSnippet<[{ values: IconItem[]; text: string; placeholder: string }]>((params) => ({
				render: () => `<b class="app-value">${params().text}</b>`
			})),
			itemSnippet: createRawSnippet<[{ item: IconItem; index: number; selected: boolean; highlighted: boolean }]>((params) => ({
				render: () => `<i class="app-item">${params().item.value}</i>`
			}))
		});
		const trigger = screen.getByRole('combobox');
		expect(trigger.element().querySelector('.app-value')?.textContent).toBe('Align left');
		expect(trigger.element().querySelector('.aurora-icons-dropdown-value')).toBeNull();
		await trigger.click();
		const option = screen.getByRole('option', { name: 'Center' }).element();
		expect(option.querySelector('.aurora-icons-dropdown-tile .app-item')?.textContent).toBe('center');
	});

	test('mobile drawer: the grid opens in a bottom drawer and the arrows still move through it', async () => {
		await page.viewport(800, 700);
		try {
			const onchange = vi.fn();
			const screen = await render(IconsDropdown, { label: 'Format', items: seven, mobileDrawer: true, onchange });
			await screen.getByRole('combobox', { name: 'Format' }).click();
			const drawer = screen.getByRole('dialog', { name: 'Format' });
			await expect.element(drawer).toBeVisible();
			const listbox = drawer.getByRole('listbox');
			await expect.element(listbox).toHaveFocus();
			await expect.element(listbox).toHaveAttribute('data-columns', '5');
			const tile = listbox.element().querySelector('.aurora-icons-dropdown-tile')!;
			expect(tile.getBoundingClientRect().width).toBe(44);
			await userEvent.keyboard('{ArrowDown}{ArrowDown}{ArrowRight}{Enter}');
			expect(onchange.mock.calls[0][0].select).toEqual(seven[6]);
		} finally {
			await page.viewport(1280, 800);
		}
	});
});
