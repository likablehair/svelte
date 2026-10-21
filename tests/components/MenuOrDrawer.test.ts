import { afterEach, describe, expect, test, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import InsideDrawerExample from '../../src/docs/examples/menu-or-drawer/03-inside-drawer.svelte';
import Harness from '../fixtures/menu-or-drawer/Harness.svelte';

async function open(props: Record<string, unknown> = {}) {
	const screen = await render(Harness, { props });
	const activator = screen.getByRole('button', { name: 'Open' });
	await activator.click();
	await expect.element(screen.getByTestId('state')).toHaveTextContent('open');
	return { screen, activator };
}

describe('MenuOrDrawer', () => {
	afterEach(async () => {
		await page.viewport(1280, 800);
	});

	test('inside a Drawer, the sheet covers the bottom of the screen with its own size and padding', async () => {
		await page.viewport(400, 700);
		document.documentElement.style.setProperty('--drawer-duration', '0s');
		try {
			const screen = await render(InsideDrawerExample);
			await screen.getByRole('button', { name: 'Open drawer' }).click();
			const drawer = screen.getByRole('dialog', { name: 'Menu' });
			await expect.element(drawer).toBeVisible();
			await screen.getByRole('button', { name: 'Giulia Marini' }).click();
			const sheet = screen.getByRole('dialog', { name: 'Account' });
			await expect.element(sheet).toBeVisible();
			const panel = sheet.element().querySelector<HTMLElement>('.aurora-drawer-panel')!;
			const box = panel.getBoundingClientRect();
			expect(box.left).toBe(0);
			expect(box.width).toBe(window.innerWidth);
			expect(box.bottom).toBe(window.innerHeight);
			expect(box.height).toBeLessThan(320);
			expect(panel.scrollHeight).toBeLessThanOrEqual(panel.clientHeight + 1);
			expect(getComputedStyle(panel).padding).toBe('18px 12px');
			await screen.getByRole('button', { name: 'Profile' }).click();
			await expect.element(sheet).not.toBeInTheDocument();
			await expect.element(drawer).toBeVisible();
		} finally {
			document.documentElement.style.removeProperty('--drawer-duration');
		}
	});

	test('opens a menu anchored to the activator on wide screens', async () => {
		const { screen, activator } = await open();
		const menu = document.querySelector<HTMLElement>('.aurora-menu.aurora-menu-or-drawer-menu')!;
		expect(menu).not.toBeNull();
		expect(menu.matches(':popover-open')).toBe(true);
		expect(document.querySelector('dialog')).toBeNull();
		await expect.element(screen.getByTestId('flags')).toHaveTextContent('menu');
		await expect.element(screen.getByTestId('elements')).toHaveTextContent('menu');
		expect(menu.dataset.side).toBe('bottom');
		const m = menu.getBoundingClientRect();
		const a = activator.element().getBoundingClientRect();
		expect(Math.abs(m.left + m.width / 2 - (a.left + a.width / 2))).toBeLessThanOrEqual(1);
		expect(m.top).toBeGreaterThan(a.bottom);
	});

	test('opens a bottom drawer as tall as its content on screens up to 1024px', async () => {
		await page.viewport(800, 700);
		const { screen } = await open();
		const drawer = screen.getByRole('dialog');
		await expect.element(drawer).toBeVisible();
		expect(drawer.element().getAttribute('data-position')).toBe('bottom');
		expect(drawer.element().classList).toContain('aurora-menu-or-drawer-drawer');
		await expect.element(screen.getByTestId('flags')).toHaveTextContent('drawer');
		await expect.element(screen.getByTestId('elements')).toHaveTextContent('drawer');
		const panel = drawer.element().querySelector('.aurora-drawer-panel')!.getBoundingClientRect();
		expect(panel.height).toBeLessThan(260);
		expect(Math.round(panel.bottom)).toBe(700);
		expect(document.querySelector('.aurora-menu')).toBeNull();
	});

	test('the drawer grows up to 85% of the screen, then its body scrolls', async () => {
		await page.viewport(800, 700);
		const { screen } = await open({ lines: 60 });
		const drawer = screen.getByRole('dialog');
		await expect.element(drawer).toBeVisible();
		const panel = drawer.element().querySelector('.aurora-drawer-panel')!.getBoundingClientRect();
		expect(Math.round(panel.height)).toBe(Math.round(700 * 0.85));
		const body = drawer.element().querySelector<HTMLElement>('.aurora-drawer-body')!;
		expect(body.scrollHeight).toBeGreaterThan(body.clientHeight);
	});

	test('--drawer-size fixes the height of the drawer', async () => {
		await page.viewport(800, 700);
		const { screen } = await open({
			style: '--menu-duration: 0s; --drawer-duration: 0s; --drawer-size: 400px'
		});
		const drawer = screen.getByRole('dialog');
		await expect.element(drawer).toBeVisible();
		const panel = drawer.element().querySelector('.aurora-drawer-panel')!.getBoundingClientRect();
		expect(Math.round(panel.height)).toBe(400);
	});

	test('mode forces the menu or the drawer', async () => {
		const desktop = await open({ mode: 'drawer' });
		await expect.element(desktop.screen.getByRole('dialog')).toBeVisible();
		await desktop.screen.unmount();

		await page.viewport(800, 700);
		const mobile = await open({ mode: 'menu' });
		await expect.element(mobile.screen.getByTestId('flags')).toHaveTextContent('menu');
		expect(document.querySelector('dialog')).toBeNull();
	});

	test('close from the content closes the menu and gives the focus back to the activator', async () => {
		const { screen, activator } = await open();
		const done = screen.getByRole('button', { name: 'Done' });
		(done.element() as HTMLElement).focus();
		await userEvent.keyboard('{Enter}');
		await expect.element(screen.getByTestId('state')).toHaveTextContent('closed');
		await expect.element(activator).toHaveFocus();
	});

	test('Escape closes the menu and gives the focus back to the activator', async () => {
		const { screen, activator } = await open();
		(screen.getByRole('button', { name: 'Done' }).element() as HTMLElement).focus();
		await userEvent.keyboard('{Escape}');
		await expect.element(screen.getByTestId('state')).toHaveTextContent('closed');
		await expect.element(activator).toHaveFocus();
	});

	test('close and Escape close the drawer, and the drawer calls its onclose', async () => {
		await page.viewport(800, 700);
		const onclose = vi.fn();
		const { screen, activator } = await open({ drawerProps: { onclose } });
		await screen.getByRole('button', { name: 'Done' }).click();
		await expect.element(screen.getByTestId('state')).toHaveTextContent('closed');
		expect(onclose).toHaveBeenCalledTimes(1);
		await activator.click();
		await expect.element(screen.getByRole('dialog')).toBeVisible();
		await userEvent.keyboard('{Escape}');
		await expect.element(screen.getByTestId('state')).toHaveTextContent('closed');
		await expect.element(activator).toHaveFocus();
	});

	test('placement, menuProps and drawerProps reach the menu and the drawer', async () => {
		const { screen } = await open({
			placement: 'right-start',
			menuProps: { offset: 20, class: 'custom-menu', 'aria-label': 'Custom menu' }
		});
		const menu = screen.getByLabelText('Custom menu');
		await expect.element(menu).toHaveClass('custom-menu');
		await expect.element(menu).toHaveClass('aurora-menu-or-drawer-menu');
		expect(menu.element().getAttribute('data-side')).toBe('right');
		const a = screen.getByRole('button', { name: 'Open' }).element().getBoundingClientRect();
		expect(Math.round(menu.element().getBoundingClientRect().left - a.right)).toBe(20);
		await screen.unmount();

		await page.viewport(800, 700);
		const mobile = await open({
			drawerProps: { title: 'Choose', closable: true, class: { panel: 'custom-panel' } }
		});
		const drawer = mobile.screen.getByRole('dialog', { name: 'Choose' });
		await expect.element(drawer).toBeVisible();
		await expect.element(drawer).toHaveClass('aurora-menu-or-drawer-sheet');
		expect(drawer.element().querySelector('.custom-panel')).not.toBeNull();
		await mobile.screen.getByRole('button', { name: 'Close' }).click();
		await expect.element(mobile.screen.getByTestId('state')).toHaveTextContent('closed');
	});

	test('a side drawer keeps the size of the Drawer', async () => {
		await page.viewport(800, 700);
		const { screen } = await open({ drawerProps: { position: 'right', 'aria-label': 'Side' } });
		const drawer = screen.getByRole('dialog', { name: 'Side' });
		await expect.element(drawer).toBeVisible();
		expect(drawer.element().classList).not.toContain('aurora-menu-or-drawer-sheet');
		const panel = drawer.element().querySelector('.aurora-drawer-panel')!.getBoundingClientRect();
		expect(Math.round(panel.width)).toBe(320);
	});

	test('switches from menu to drawer when the screen narrows while open', async () => {
		const { screen } = await open();
		await expect.element(screen.getByTestId('flags')).toHaveTextContent('menu');
		await page.viewport(800, 700);
		await expect.element(screen.getByRole('dialog')).toBeVisible();
		await expect.element(screen.getByTestId('flags')).toHaveTextContent('drawer');
	});

	test('v4 bug: menuProps and drawerProps are not written to', async () => {
		const menuProps = Object.freeze({ offset: 10 });
		const drawerProps = Object.freeze({ title: 'Frozen' });
		const { screen } = await open({ menuProps, drawerProps });
		await expect.element(screen.getByTestId('flags')).toHaveTextContent('menu');
		await page.viewport(800, 700);
		await expect.element(screen.getByRole('dialog', { name: 'Frozen' })).toBeVisible();
		expect(menuProps).toEqual({ offset: 10 });
		expect(drawerProps).toEqual({ title: 'Frozen' });
	});
});
