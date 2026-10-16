import { mdiContentCopy, mdiPencilOutline, mdiTrashCanOutline } from '@mdi/js';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import type { MenuOrDrawerOption } from '#lib/components/composed/common/MenuOrDrawerOptions.svelte';
import Harness from '../fixtures/menu-or-drawer/OptionsHarness.svelte';
import { renderWithDefaultLocale, snippet } from '../helpers.js';
import MenuOrDrawerOptions from '#lib/components/composed/common/MenuOrDrawerOptions.svelte';

const options: MenuOrDrawerOption[] = [
	{ name: 'edit', label: 'Edit', icon: mdiPencilOutline, shortcut: 'E' },
	{ name: 'duplicate', label: 'Duplicate', icon: mdiContentCopy, description: 'Same items, new date' },
	{ name: 'archive', label: 'Archive', disabled: true },
	{ name: 'delete', label: 'Delete', icon: mdiTrashCanOutline, variant: 'danger', divider: true }
];

async function open(props: Record<string, unknown> = {}) {
	const screen = await render(Harness, { props: { options, ...props } });
	const activator = screen.getByRole('button', { name: 'Open' });
	await activator.click();
	const menu = screen.getByRole('menu');
	await expect.element(menu).toBeVisible();
	return { screen, activator, menu };
}

describe('MenuOrDrawerOptions', () => {
	afterEach(async () => {
		await page.viewport(1280, 800);
	});

	test('renders a menu of menuitems named "Actions" inside a menu popover', async () => {
		const { screen, menu } = await open();
		await expect.element(screen.getByRole('menu', { name: 'Actions' })).toBeVisible();
		expect(menu.element().closest('.aurora-menu')).not.toBeNull();
		const items = menu.getByRole('menuitem').elements();
		expect(items.map((item) => item.textContent?.replace(/\s+/g, ' ').trim())).toEqual([
			'Edit E',
			'Duplicate Same items, new date',
			'Archive',
			'Delete'
		]);
		expect(menu.element().querySelectorAll('[role="separator"]')).toHaveLength(1);
		expect(menu.element().querySelector('[role="separator"] + [role="menuitem"]')?.textContent).toContain(
			'Delete'
		);
		await expect.element(menu.getByRole('menuitem', { name: 'Edit', exact: true })).toContainElement(
			menu.element().querySelector('kbd')
		);
		await expect
			.element(menu.getByRole('menuitem', { name: 'Duplicate', exact: true }))
			.toHaveAccessibleDescription('Same items, new date');
		expect(menu.element().querySelectorAll('.aurora-menu-or-drawer-options-item svg')).toHaveLength(3);
	});

	test('the first enabled option takes the focus on open; arrows, Home and End move, wrapping', async () => {
		const { menu } = await open({ options: [{ name: 'off', label: 'Off', disabled: true }, ...options] });
		const item = (name: string) => menu.getByRole('menuitem', { name, exact: true });
		await expect.element(item('Edit')).toHaveFocus();
		await userEvent.keyboard('{ArrowUp}');
		await expect.element(item('Off')).toHaveFocus();
		await userEvent.keyboard('{ArrowUp}');
		await expect.element(item('Delete')).toHaveFocus();
		await userEvent.keyboard('{ArrowDown}');
		await expect.element(item('Off')).toHaveFocus();
		await userEvent.keyboard('{End}');
		await expect.element(item('Delete')).toHaveFocus();
		await userEvent.keyboard('{Home}');
		await expect.element(item('Off')).toHaveFocus();
	});

	test('a letter moves to the next option that starts with it', async () => {
		const { menu } = await open({
			options: [
				{ name: 'a', label: 'Archive' },
				{ name: 'b', label: 'Assign' },
				{ name: 'c', label: 'Copy' }
			]
		});
		await expect.element(menu.getByRole('menuitem', { name: 'Archive' })).toHaveFocus();
		await userEvent.keyboard('a');
		await expect.element(menu.getByRole('menuitem', { name: 'Assign' })).toHaveFocus();
		await userEvent.keyboard('a');
		await expect.element(menu.getByRole('menuitem', { name: 'Archive' })).toHaveFocus();
		await userEvent.keyboard('C');
		await expect.element(menu.getByRole('menuitem', { name: 'Copy' })).toHaveFocus();
	});

	test('choosing closes, gives the focus back to the activator, then calls onclick and onselect', async () => {
		const calls: string[] = [];
		const onclick = vi.fn((event: MouseEvent) => calls.push(event.type && 'onclick'));
		const onselect = vi.fn(() => calls.push('onselect'));
		const list = [{ ...options[0], onclick }, ...options.slice(1)];
		const { screen, activator, menu } = await open({ options: list, onselect });
		await menu.getByRole('menuitem', { name: 'Edit' }).click();
		await expect.element(screen.getByTestId('state')).toHaveTextContent('closed');
		await expect.element(activator).toHaveFocus();
		expect(calls).toEqual(['onclick', 'onselect']);
		expect(onclick.mock.calls[0][0]).toBeInstanceOf(MouseEvent);
		const [argument] = onselect.mock.calls[0] as unknown as [{ option: MenuOrDrawerOption; event: Event }];
		expect(argument.option).toBe(list[0]);
		expect(argument.event).toBeInstanceOf(MouseEvent);
	});

	test('Enter and Space choose the focused option', async () => {
		const onselect = vi.fn();
		const { screen, activator, menu } = await open({ onselect });
		await expect.element(menu.getByRole('menuitem', { name: 'Edit' })).toHaveFocus();
		await userEvent.keyboard('{ArrowDown}{Enter}');
		await expect.element(screen.getByTestId('state')).toHaveTextContent('closed');
		expect(onselect.mock.calls[0][0].option.name).toBe('duplicate');
		await activator.click();
		await expect.element(screen.getByRole('menuitem', { name: 'Edit' })).toHaveFocus();
		await userEvent.keyboard(' ');
		await expect.element(screen.getByTestId('state')).toHaveTextContent('closed');
		expect(onselect.mock.calls[1][0].option.name).toBe('edit');
	});

	test('Escape closes and gives the focus back to the activator', async () => {
		const { screen, activator } = await open();
		await userEvent.keyboard('{Escape}');
		await expect.element(screen.getByTestId('state')).toHaveTextContent('closed');
		await expect.element(activator).toHaveFocus();
	});

	test('v4 bug: disabled options are reachable, announced and do nothing', async () => {
		const onselect = vi.fn();
		const onclick = vi.fn();
		const list = options.map((option) => (option.disabled ? { ...option, onclick } : option));
		const { screen, menu } = await open({ options: list, onselect });
		const archive = menu.getByRole('menuitem', { name: 'Archive' });
		await expect.element(archive).toHaveAttribute('aria-disabled', 'true');
		await expect.element(menu.getByRole('menuitem', { name: 'Edit' })).toHaveFocus();
		await userEvent.keyboard('{ArrowDown}{ArrowDown}');
		await expect.element(archive).toHaveFocus();
		await userEvent.keyboard('{Enter}');
		(archive.element() as HTMLElement).click();
		expect(onselect).not.toHaveBeenCalled();
		expect(onclick).not.toHaveBeenCalled();
		await expect.element(screen.getByTestId('state')).toHaveTextContent('open');
	});

	test('checked makes the option a menuitemcheckbox with a check mark', async () => {
		const { menu } = await open({
			options: [
				{ name: 'favorite', label: 'Favorite', checked: true },
				{ name: 'pinned', label: 'Pinned', checked: false },
				{ name: 'share', label: 'Share' }
			]
		});
		const favorite = menu.getByRole('menuitemcheckbox', { name: 'Favorite' });
		await expect.element(favorite).toHaveAttribute('aria-checked', 'true');
		await expect.element(favorite).toHaveAttribute('data-checked');
		expect(favorite.element().querySelector('.aurora-menu-or-drawer-options-check')).not.toBeNull();
		const pinned = menu.getByRole('menuitemcheckbox', { name: 'Pinned' });
		await expect.element(pinned).toHaveAttribute('aria-checked', 'false');
		expect(pinned.element().querySelector('.aurora-menu-or-drawer-options-check')).toBeNull();
		await expect.element(menu.getByRole('menuitem', { name: 'Share' })).not.toHaveAttribute('aria-checked');
	});

	test('danger options use the error color, and the CSS variables work per instance', async () => {
		const { menu } = await open({
			style:
				'--menu-duration: 0s; --menu-or-drawer-options-danger-color: rgb(1, 2, 3); --menu-or-drawer-options-item-color: rgb(4, 5, 6)'
		});
		const remove = menu.getByRole('menuitem', { name: 'Delete' });
		await expect.element(remove).toHaveAttribute('data-variant', 'danger');
		expect(getComputedStyle(remove.element()).color).toBe('rgb(1, 2, 3)');
		const edit = menu.getByRole('menuitem', { name: 'Archive' });
		expect(getComputedStyle(edit.element()).color).toBe('rgb(4, 5, 6)');
	});

	test('class and attributes reach the menu element, class of an option reaches the option', async () => {
		const { menu } = await open({
			class: 'custom-list',
			id: 'row-actions',
			'data-extra': 'yes',
			'aria-label': 'Row actions',
			options: [{ name: 'a', label: 'A', class: 'custom-option' }]
		});
		await expect.element(menu).toHaveAttribute('aria-label', 'Row actions');
		await expect.element(menu).toHaveClass('custom-list');
		await expect.element(menu).toHaveAttribute('id', 'row-actions');
		await expect.element(menu).toHaveAttribute('data-extra', 'yes');
		await expect.element(menu.getByRole('menuitem', { name: 'A' })).toHaveClass('custom-option');
	});

	test('optionSnippet replaces the content of each option', async () => {
		const { menu } = await open({ optionSnippet: snippet('<b>Custom</b>') });
		const items = menu.getByRole('menuitem').elements();
		expect(items).toHaveLength(4);
		expect(items.every((item) => item.textContent === 'Custom')).toBe(true);
	});

	test('locale chooses the default name; aria-label wins; setDefaultLocale applies', async () => {
		const it = await open({ locale: 'it' });
		await expect.element(it.screen.getByRole('menu', { name: 'Azioni' })).toBeVisible();
		await it.screen.unmount();

		const screen = await renderWithDefaultLocale('it', MenuOrDrawerOptions, {
			open: true,
			options,
			style: '--menu-duration: 0s'
		});
		await expect.element(screen.getByRole('menu', { name: 'Azioni' })).toBeVisible();
		await screen.unmount();

		const english = await renderWithDefaultLocale('it', MenuOrDrawerOptions, {
			open: true,
			options,
			locale: 'en'
		});
		await expect.element(english.getByRole('menu', { name: 'Actions' })).toBeVisible();
	});

	describe('mobile', () => {
		test('opens a bottom sheet named like the menu, with taller options', async () => {
			await page.viewport(800, 700);
			const onselect = vi.fn();
			const screen = await render(Harness, { props: { options, onselect, 'aria-label': 'Row actions' } });
			await screen.getByRole('button', { name: 'Open' }).click();
			const sheet = screen.getByRole('dialog', { name: 'Row actions' });
			await expect.element(sheet).toBeVisible();
			const menu = sheet.getByRole('menu', { name: 'Row actions' });
			await expect.element(menu).toHaveAttribute('data-drawer');
			const edit = menu.getByRole('menuitem', { name: 'Edit' });
			await expect.element(edit).toHaveFocus();
			expect(edit.element().getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
			const panel = sheet.element().querySelector('.aurora-drawer-panel')!.getBoundingClientRect();
			expect(panel.height).toBeLessThan(400);
			await menu.getByRole('menuitem', { name: 'Duplicate' }).click();
			await expect.element(screen.getByTestId('state')).toHaveTextContent('closed');
			expect(onselect.mock.calls[0][0].option.name).toBe('duplicate');
		});

		test('a title in drawerProps names the sheet instead of aria-label', async () => {
			await page.viewport(800, 700);
			const screen = await render(Harness, { props: { options, drawerProps: { title: 'Invoice 12' } } });
			await screen.getByRole('button', { name: 'Open' }).click();
			const sheet = screen.getByRole('dialog', { name: 'Invoice 12' });
			await expect.element(sheet).toBeVisible();
			expect(sheet.element().hasAttribute('aria-label')).toBe(false);
		});
	});

	test('v4 bug: the ARIA roles are those of a menu', async () => {
		const { menu } = await open();
		expect(menu.element().querySelector('[role="listbox"], [role="button"], li')).toBeNull();
		for (const item of menu.getByRole('menuitem').elements()) expect(item.tagName).toBe('BUTTON');
	});
});
