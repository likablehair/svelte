import { describe, expect, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import Menu from '#lib/components/simple/common/Menu.svelte';
import ActionsExample from '../../src/docs/examples/menu/01-actions.svelte';
import MenuGroup from '../fixtures/menu/MenuGroup.svelte';
import MenuHarness from '../fixtures/menu/MenuHarness.svelte';
import SpreadAttributes from '../fixtures/menu/SpreadAttributes.svelte';
import { text } from '../helpers.js';

const instant = '--menu-duration: 0s';
const centered = 'position: fixed; top: 300px; left: 500px';

type Box = Omit<DOMRect, 'x' | 'y' | 'toJSON'>;

async function openHarness(props: Record<string, unknown> = {}) {
	const screen = await render(MenuHarness, {
		props: { style: instant, containerStyle: 'padding: 40px', ...props }
	});
	const activator = screen.getByRole('button', { name: 'Actions' });
	await activator.click();
	const menu = screen.getByRole('menu', { name: 'Actions menu' });
	await expect.element(menu).toBeVisible();
	return { screen, activator, menu };
}

function near(actual: number, expected: number) {
	expect(Math.abs(actual - expected)).toBeLessThanOrEqual(1);
}

function boxes(menu: { element(): Element }, activator: { element(): Element }) {
	return {
		m: menu.element().getBoundingClientRect() as Box,
		a: activator.element().getBoundingClientRect() as Box
	};
}

describe('Menu', () => {
	test('opens as a manual popover on the top layer, with no z-index', async () => {
		const { menu } = await openHarness();
		const element = menu.element();
		expect(element.matches(':popover-open')).toBe(true);
		await expect.element(menu).toHaveAttribute('popover', 'manual');
		await expect.element(menu).toHaveClass('aurora-menu');
		const style = getComputedStyle(element);
		expect(style.position).toBe('fixed');
		expect(style.zIndex).toBe('auto');
	});

	test('v4 bug: renders nothing while closed (no hidden controller element)', async () => {
		const screen = await render(Menu, { children: text('Hidden') });
		expect(screen.container.children).toHaveLength(0);
		await expect.element(screen.getByText('Hidden')).not.toBeInTheDocument();
	});

	test.each([
		['bottom-start', 'bottom', (a: Box, m: Box) => [a.bottom + 6, a.left]],
		['bottom', 'bottom', (a: Box, m: Box) => [a.bottom + 6, a.left + a.width / 2 - m.width / 2]],
		['bottom-end', 'bottom', (a: Box, m: Box) => [a.bottom + 6, a.right - m.width]],
		['top-start', 'top', (a: Box, m: Box) => [a.top - 6 - m.height, a.left]],
		['right', 'right', (a: Box, m: Box) => [a.top + a.height / 2 - m.height / 2, a.right + 6]],
		['left-end', 'left', (a: Box, m: Box) => [a.bottom - m.height, a.left - 6 - m.width]]
	] as const)('placement="%s" puts the menu on the %s side', async (placement, side, expected) => {
		const { menu, activator } = await openHarness({ placement, containerStyle: centered });
		await expect.element(menu).toHaveAttribute('data-side', side);
		const { m, a } = boxes(menu, activator);
		const [top, left] = expected(a, m);
		near(m.top, top);
		near(m.left, left);
	});

	test('offset sets the distance from the activator', async () => {
		const { menu, activator } = await openHarness({ offset: 20, containerStyle: centered });
		const { m, a } = boxes(menu, activator);
		near(m.top - a.bottom, 20);
	});

	test('v4 bug: flips and stays in the viewport by default', async () => {
		const low = await openHarness({ containerStyle: 'position: fixed; bottom: 10px; left: 300px' });
		await expect.element(low.menu).toHaveAttribute('data-side', 'top');
		const flipped = boxes(low.menu, low.activator);
		near(flipped.m.bottom, flipped.a.top - 6);
		await low.screen.unmount();

		const edge = await openHarness({
			containerStyle: 'position: fixed; top: 300px; right: 0',
			style: `${instant}; --menu-width: 300px`
		});
		const shifted = edge.menu.element().getBoundingClientRect();
		expect(shifted.width).toBe(300);
		expect(shifted.right).toBeLessThanOrEqual(document.documentElement.clientWidth - 8 + 0.5);
		await expect.element(edge.menu).toHaveAttribute('data-side', 'bottom');
	});

	test('closes on a click outside; a click on the activator only toggles it', async () => {
		const { screen, activator, menu } = await openHarness();
		const state = screen.getByTestId('state');
		await screen.getByRole('menuitem', { name: 'Edit' }).click();
		await expect.element(menu).toBeVisible();

		await activator.click();
		await expect.element(menu).not.toBeInTheDocument();
		await expect.element(state).toHaveTextContent('closed');

		await activator.click();
		await expect.element(menu).toBeVisible();
		await screen.getByRole('button', { name: 'Outside' }).click();
		await expect.element(menu).not.toBeInTheDocument();
		await expect.element(state).toHaveTextContent('closed');
	});

	test('closeOnClickOutside={false} keeps it open on outside clicks, not on Escape', async () => {
		const { screen, menu } = await openHarness({ closeOnClickOutside: false });
		await screen.getByRole('button', { name: 'Outside' }).click();
		await new Promise((resolve) => setTimeout(resolve, 100));
		await expect.element(menu).toBeVisible();
		await userEvent.keyboard('{Escape}');
		await expect.element(menu).not.toBeInTheDocument();
	});

	test('v4 bug: Escape closes the menu and returns focus to the activator', async () => {
		const { screen, activator, menu } = await openHarness();
		(screen.getByRole('menuitem', { name: 'Delete' }).element() as HTMLElement).focus();
		await userEvent.keyboard('{Escape}');
		await expect.element(menu).not.toBeInTheDocument();
		await expect.element(activator).toHaveFocus();
		await expect.element(screen.getByTestId('state')).toHaveTextContent('closed');
	});

	test('bind:open: the menu writes false when it closes and follows changes from outside', async () => {
		const { screen, menu } = await openHarness({ closeOnClickOutside: false });
		const state = screen.getByTestId('state');
		await expect.element(state).toHaveTextContent('open');
		await screen.getByRole('button', { name: 'Set closed' }).click();
		await expect.element(menu).not.toBeInTheDocument();
		await expect.element(state).toHaveTextContent('closed');

		let open: boolean | undefined = true;
		await render(Menu, {
			get open() {
				return open;
			},
			set open(value) {
				open = value;
			},
			activator: document.body,
			children: text('Bound')
		});
		await userEvent.keyboard('{Escape}');
		expect(open).toBe(false);
	});

	test('v4 bug: opening a menu closes the others without openingId, except nested and persistent ones', async () => {
		const screen = await render(MenuGroup);
		const press = async (name: string) => {
			(screen.getByRole('button', { name }).element() as HTMLElement).focus();
			await userEvent.keyboard('{Enter}');
		};
		const first = screen.getByRole('menu', { name: 'First menu' });
		const nested = screen.getByRole('menu', { name: 'Nested menu' });
		const second = screen.getByRole('menu', { name: 'Second menu' });
		const pinned = screen.getByRole('menu', { name: 'Pinned menu' });

		await press('Pinned');
		await expect.element(pinned).toBeVisible();
		await press('First');
		await expect.element(first).toBeVisible();
		await screen.getByRole('menuitem', { name: 'More' }).click();
		await expect.element(nested).toBeVisible();
		await expect.element(first).toBeVisible();
		await expect.element(pinned).toBeVisible();

		await press('Second');
		await expect.element(second).toBeVisible();
		await expect.element(first).not.toBeInTheDocument();
		await expect.element(nested).not.toBeInTheDocument();
		await expect.element(pinned).toBeVisible();
	});

	test('Escape closes only the innermost open menu', async () => {
		const screen = await render(MenuGroup);
		const first = screen.getByRole('menu', { name: 'First menu' });
		const nested = screen.getByRole('menu', { name: 'Nested menu' });
		await screen.getByRole('button', { name: 'First' }).click();
		await screen.getByRole('menuitem', { name: 'More' }).click();
		await expect.element(nested).toBeVisible();

		await userEvent.keyboard('{Escape}');
		await expect.element(nested).not.toBeInTheDocument();
		await expect.element(first).toBeVisible();
		await userEvent.keyboard('{Escape}');
		await expect.element(first).not.toBeInTheDocument();
	});

	test('matchActivatorWidth makes the menu as wide as the activator', async () => {
		const { menu, activator } = await openHarness({
			matchActivatorWidth: true,
			activatorStyle: 'width: 260px',
			style: `${instant}; --menu-width: 100px`
		});
		const { m, a } = boxes(menu, activator);
		expect(a.width).toBe(260);
		expect(m.width).toBe(260);
		near(m.left, a.left);
	});

	test('a virtual activator places the menu at its rect; without activator it is centered', async () => {
		const point = { getBoundingClientRect: () => new DOMRect(200, 150, 0, 0) };
		const screen = await render(Menu, {
			open: true,
			activator: point,
			style: instant,
			children: text('At the cursor')
		});
		const atPoint = screen.getByText('At the cursor').element().closest('.aurora-menu')!;
		await expect.poll(() => Math.round(atPoint.getBoundingClientRect().left)).toBe(200);
		near(atPoint.getBoundingClientRect().top, 156);
		await screen.unmount();

		const free = await render(Menu, { open: true, style: instant, children: text('Centered') });
		const centeredMenu = free.getByText('Centered').element().closest('.aurora-menu')!;
		const box = centeredMenu.getBoundingClientRect();
		const html = document.documentElement;
		near(box.left + box.width / 2, html.clientWidth / 2);
		near(box.top + box.height / 2, html.clientHeight / 2);
	});

	test('v4 bug: placed on screen coordinates inside fixed, flex, transformed and clipping ancestors', async () => {
		const { menu, activator } = await openHarness({
			containerStyle: [
				'position: fixed; top: 200px; left: 300px; width: 120px; height: 40px',
				'display: flex; transform: translateX(0); overflow: hidden'
			].join('; '),
			style: `${instant}; --menu-width: 300px`
		});
		const { m, a } = boxes(menu, activator);
		near(m.top, a.bottom + 6);
		near(m.left, a.left);
		const corner = document.elementFromPoint(m.right - 4, m.bottom - 4);
		expect(menu.element().contains(corner)).toBe(true);
	});

	test('v4 bug: follows the activator when its container scrolls or it moves, without refreshPosition', async () => {
		const { screen, menu, activator } = await openHarness({
			containerStyle: 'height: 160px; overflow: auto; padding: 40px',
			scrollable: true
		});
		const gap = () => {
			const { m, a } = boxes(menu, activator);
			return [Math.round(m.top - a.bottom), Math.round(m.left - a.left)];
		};
		expect(gap()).toEqual([6, 0]);
		const container = screen.getByTestId('container').element();
		container.scrollTop = 30;
		await expect.poll(() => activator.element().getBoundingClientRect().top).toBeLessThan(40);
		await expect.poll(gap).toEqual([6, 0]);
		(activator.element() as HTMLElement).style.marginLeft = '120px';
		await expect.poll(gap).toEqual([6, 0]);
	});

	test('class, native attributes and instance CSS variables reach the menu element', async () => {
		const onkeydown = vi.fn();
		const { screen, menu } = await openHarness({
			class: 'app-menu',
			id: 'actions',
			onkeydown,
			style: `${instant}; --menu-background: rgb(1, 2, 3); --menu-padding: 9px`
		});
		await expect.element(menu).toHaveClass('aurora-menu', 'app-menu');
		await expect.element(menu).toHaveAttribute('id', 'actions');
		const style = getComputedStyle(menu.element());
		expect(style.backgroundColor).toBe('rgb(1, 2, 3)');
		expect(style.paddingTop).toBe('9px');
		(screen.getByRole('menuitem', { name: 'Edit' }).element() as HTMLElement).focus();
		await userEvent.keyboard('a');
		expect(onkeydown).toHaveBeenCalledOnce();
		expect(onkeydown.mock.calls[0][0]).toBeInstanceOf(KeyboardEvent);
	});

	test('style props on the component reach the popup and choosing an action closes it', async () => {
		const screen = await render(ActionsExample);
		await screen.getByRole('button', { name: 'Actions' }).click();
		const menu = screen.getByRole('menu', { name: 'Actions' });
		await expect.element(menu).toBeVisible();
		expect(getComputedStyle(menu.element()).minWidth).toBe('200px');
		await screen.getByRole('menuitem', { name: 'Duplicate' }).click();
		await expect.element(menu).not.toBeInTheDocument();
		await expect.element(screen.getByText('Last action: Duplicate')).toBeVisible();
	});

	test('keeps closing on Escape after a spread attributes object is replaced while open', async () => {
		const screen = await render(SpreadAttributes);
		await screen.getByRole('button', { name: 'Target' }).click();
		await expect.element(screen.getByRole('menu', { name: 'First menu' })).toBeVisible();
		await screen.getByRole('button', { name: 'Change label' }).click();
		const menu = screen.getByRole('menu', { name: 'Second menu' });
		await expect.element(menu).toBeVisible();
		await userEvent.keyboard('{Escape}');
		await expect.element(menu).not.toBeInTheDocument();
	});

	test('binds the menu element', async () => {
		let element: HTMLDivElement | undefined;
		await render(Menu, {
			open: true,
			children: text('Bound'),
			get menuElement() {
				return element;
			},
			set menuElement(value) {
				element = value;
			}
		});
		expect(element).toBeInstanceOf(HTMLDivElement);
		expect(element?.matches(':popover-open')).toBe(true);
	});
});
