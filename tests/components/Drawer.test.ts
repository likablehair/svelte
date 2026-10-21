import { describe, expect, test, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import Drawer from '#lib/components/simple/navigation/Drawer.svelte';
import BottomSheetExample from '../../src/docs/examples/drawer/03-bottom-sheet.svelte';
import ModalHarness from '../fixtures/dialog/ModalHarness.svelte';
import NestedDrawers from '../fixtures/drawer/NestedDrawers.svelte';
import { renderWithDefaultLocale, snippet, text } from '../helpers.js';

const instant = '--drawer-duration: 0s';
const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function openHarness(props: Record<string, unknown> = {}) {
	const screen = await render(ModalHarness, {
		props: { component: Drawer, title: 'Filters', ...props }
	});
	const opener = screen.getByRole('button', { name: 'Open' });
	await opener.click();
	const drawer = screen.getByRole('dialog');
	await expect.element(drawer).toBeVisible();
	return { screen, opener, drawer, state: screen.getByTestId('state') };
}

function clickBackdrop(drawer: { element(): Element }) {
	const backdrop = drawer.element().querySelector('[data-backdrop]')!;
	const box = backdrop.getBoundingClientRect();
	const panel = panelOf(drawer).getBoundingClientRect();
	const x = panel.left > box.left + 10 ? 5 : box.width - 5;
	const y = panel.top > box.top + 10 ? 5 : box.height - 5;
	return page.elementLocator(backdrop).click({ position: { x, y } });
}

function panelOf(drawer: { element(): Element }) {
	return drawer.element().querySelector('.aurora-drawer-panel')!;
}

describe('Drawer', () => {
	test('opens a modal <dialog> on the top layer, named by its title, from the left', async () => {
		const { screen, drawer } = await openHarness();
		await expect.element(screen.getByRole('dialog', { name: 'Filters' })).toBeVisible();
		const element = drawer.element();
		expect(element.tagName).toBe('DIALOG');
		expect(element.matches(':modal')).toBe(true);
		await expect.element(drawer).toHaveClass('aurora-drawer');
		await expect.element(drawer).toHaveAttribute('data-position', 'left');
		expect(getComputedStyle(element).zIndex).toBe('auto');
	});

	test.each(['left', 'right', 'top', 'bottom'] as const)(
		'position="%s" pins a 20rem panel to that side',
		async (position) => {
			const { drawer } = await openHarness({ position, style: instant });
			await expect.element(drawer).toHaveAttribute('data-position', position);
			const screenBox = drawer.element().getBoundingClientRect();
			const panel = panelOf(drawer).getBoundingClientRect();
			const vertical = position === 'left' || position === 'right';
			expect(vertical ? panel.width : panel.height).toBe(320);
			expect(vertical ? panel.height : panel.width).toBe(
				vertical ? screenBox.height : screenBox.width
			);
			expect(panel[position]).toBe(screenBox[position]);
		}
	);

	test('the focus moved inside on opening does not scroll the sheet while it slides in', async () => {
		const { drawer } = await openHarness({ position: 'bottom', style: '--drawer-duration: 2s' });
		const element = drawer.element() as HTMLElement;
		expect(getComputedStyle(element).overflow).toBe('clip');
		expect(element.scrollTop).toBe(0);
		expect(element.contains(document.activeElement)).toBe(true);
		expect(panelOf(drawer).getBoundingClientRect().top).toBeGreaterThan(element.getBoundingClientRect().bottom - 320);
	});

	test('--drawer-size sets the panel size, capped by --drawer-max-size', async () => {
		const small = await openHarness({
			position: 'right',
			style: `${instant}; --drawer-size: 200px`
		});
		expect(panelOf(small.drawer).getBoundingClientRect().width).toBe(200);
		await small.screen.unmount();

		const capped = await openHarness({
			position: 'bottom',
			style: `${instant}; --drawer-size: 2000px; --drawer-max-size: 50%`
		});
		const screenHeight = capped.drawer.element().getBoundingClientRect().height;
		expect(panelOf(capped.drawer).getBoundingClientRect().height).toBe(screenHeight / 2);
	});

	test('v4 bug: closed content is not in the DOM and its state resets at every opening', async () => {
		const screen = await render(ModalHarness, { props: { component: Drawer } });
		expect(screen.container.querySelector('dialog')).toBeNull();
		await expect.element(screen.getByLabelText('Name')).not.toBeInTheDocument();

		await screen.getByRole('button', { name: 'Open' }).click();
		await screen.getByLabelText('Name').fill('Color');
		await userEvent.keyboard('{Escape}');
		await expect.element(screen.getByRole('dialog')).not.toBeInTheDocument();
		await screen.getByRole('button', { name: 'Open' }).click();
		await expect.element(screen.getByLabelText('Name')).toHaveValue('');
	});

	test('v4 bug: focus moves inside, the page is inert, and focus returns to the opener', async () => {
		const { screen, opener, drawer } = await openHarness();
		await expect.element(screen.getByLabelText('Name')).toHaveFocus();
		const pageButton = screen.getByRole('button', { name: 'Page button', includeHidden: true });
		(pageButton.element() as HTMLElement).focus();
		await expect.element(screen.getByLabelText('Name')).toHaveFocus();
		await userEvent.keyboard('{Escape}');
		await expect.element(drawer).not.toBeInTheDocument();
		await expect.element(opener).toHaveFocus();
	});

	test('Escape closes it and onclose receives the keyboard event', async () => {
		const onclose = vi.fn();
		const { drawer, state } = await openHarness({ onclose });
		await userEvent.keyboard('{Escape}');
		await expect.element(drawer).not.toBeInTheDocument();
		await expect.element(state).toHaveTextContent('closed');
		expect(onclose).toHaveBeenCalledOnce();
		expect(onclose.mock.calls[0][0]).toBeInstanceOf(KeyboardEvent);
	});

	test('a click on the backdrop closes it; a click inside does not', async () => {
		const onclose = vi.fn();
		const { screen, drawer } = await openHarness({ onclose });
		await screen.getByRole('button', { name: 'Inside' }).click();
		await pause(100);
		await expect.element(drawer).toBeVisible();
		await clickBackdrop(drawer);
		await expect.element(drawer).not.toBeInTheDocument();
		expect(onclose).toHaveBeenCalledOnce();
		expect(onclose.mock.calls[0][0]).toBeInstanceOf(MouseEvent);
	});

	test('persistent (v4 closeOnClickOutside={false}) blocks Escape and the backdrop, not the X', async () => {
		const onclose = vi.fn();
		const { screen, drawer } = await openHarness({
			persistent: true,
			closable: true,
			closeLabel: 'Chiudi',
			onclose
		});
		await userEvent.keyboard('{Escape}');
		await userEvent.keyboard('{Escape}');
		await clickBackdrop(drawer);
		await pause(100);
		await expect.element(drawer).toBeVisible();
		expect(onclose).not.toHaveBeenCalled();

		const close = screen.getByRole('button', { name: 'Chiudi' });
		await expect.element(close).toHaveClass('aurora-drawer-close');
		await close.click();
		await expect.element(drawer).not.toBeInTheDocument();
		expect(onclose).toHaveBeenCalledOnce();
	});

	test('a <form method="dialog"> closes it with the submit event', async () => {
		const onclose = vi.fn();
		const { screen, drawer } = await openHarness({ withForm: true, persistent: true, onclose });
		await screen.getByRole('button', { name: 'Send' }).click();
		await expect.element(drawer).not.toBeInTheDocument();
		expect(onclose).toHaveBeenCalledOnce();
		expect(onclose.mock.calls[0][0]).toBeInstanceOf(SubmitEvent);
	});

	test('v4 bug: the drawer locks the page scroll, in CSS only, until it closes or unmounts', async () => {
		const overflow = () => getComputedStyle(document.documentElement).overflow;
		const { drawer } = await openHarness();
		expect(overflow()).toBe('hidden');
		expect(document.body.style.overflow).toBe('');
		await userEvent.keyboard('{Escape}');
		await expect.element(drawer).not.toBeInTheDocument();
		expect(overflow()).toBe('visible');

		const screen = await render(Drawer, {
			open: true,
			'aria-label': 'Unmounted',
			children: text('Body')
		});
		expect(overflow()).toBe('hidden');
		await screen.unmount();
		expect(overflow()).toBe('visible');
	});

	test('v4 bug: never teleported, so CSS variables set on an ancestor reach the drawer', async () => {
		const { screen, drawer } = await openHarness({
			wrapperStyle: '--drawer-background: rgb(1, 2, 3); --drawer-size: 240px'
		});
		expect(drawer.element().parentElement).toBe(screen.getByTestId('wrapper').element());
		const panel = getComputedStyle(panelOf(drawer));
		expect(panel.backgroundColor).toBe('rgb(1, 2, 3)');
		expect(panel.width).toBe('240px');
	});

	test('v4 bug: the backdrop is always there (no overlay prop); a transparent one still closes on click', async () => {
		const { drawer } = await openHarness({
			style: '--drawer-backdrop-background: transparent; --drawer-backdrop-filter: none'
		});
		const backdrop = drawer.element().querySelector('[data-backdrop]')!;
		expect(getComputedStyle(backdrop).backgroundColor).toBe('rgba(0, 0, 0, 0)');
		await clickBackdrop(drawer);
		await expect.element(drawer).not.toBeInTheDocument();
	});

	test('v4 bug: without children there is no fallback navigation, only the panel', async () => {
		const screen = await render(Drawer, { open: true, 'aria-label': 'Empty' });
		const drawer = screen.getByRole('dialog', { name: 'Empty' });
		await expect.element(drawer).toBeVisible();
		const panel = panelOf(drawer);
		expect(panel.children).toHaveLength(0);
		expect(drawer.element().querySelector('nav, a')).toBeNull();
	});

	test('actionsSnippet stays pinned at the bottom while the body scrolls (docs example)', async () => {
		const screen = await render(BottomSheetExample);
		await screen.getByRole('button', { name: 'Filters' }).click();
		const drawer = screen.getByRole('dialog', { name: 'Filter by service' });
		await expect.element(drawer).toHaveAttribute('data-position', 'bottom');
		const body = drawer.element().querySelector('.aurora-drawer-body')!;
		const footer = drawer.element().querySelector('.aurora-drawer-actions')!;
		await expect.poll(() => body.scrollHeight > body.clientHeight).toBe(true);
		body.scrollTop = body.scrollHeight;
		const panel = panelOf(drawer);
		await expect
			.poll(() => footer.getBoundingClientRect().bottom <= panel.getBoundingClientRect().bottom)
			.toBe(true);
		await userEvent.keyboard('{Escape}');
		await pause(100);
		await expect.element(drawer).toBeVisible();
		await screen.getByRole('checkbox', { name: 'Color' }).click();
		await screen.getByRole('button', { name: 'Apply' }).click();
		await expect.element(drawer).not.toBeInTheDocument();
		await expect.element(screen.getByText('Applied: Color')).toBeVisible();
	});

	test('class object, native attributes, title snippet and drawerElement reach their parts', async () => {
		let bound: HTMLDialogElement | undefined;
		const screen = await render(Drawer, {
			open: true,
			position: 'right',
			id: 'nav-drawer',
			'data-kind': 'navigation',
			class: {
				drawer: 'app-drawer',
				panel: 'app-panel',
				body: 'app-body',
				actions: 'app-actions'
			},
			titleSnippet: snippet('<em>Navigation</em>'),
			children: text('Links'),
			actionsSnippet: snippet('<button>Log out</button>'),
			get drawerElement() {
				return bound;
			},
			set drawerElement(value) {
				bound = value;
			}
		});
		const drawer = screen.getByRole('dialog', { name: 'Navigation' });
		await expect.element(drawer).toHaveAttribute('id', 'nav-drawer');
		await expect.element(drawer).toHaveAttribute('data-kind', 'navigation');
		await expect.element(drawer).toHaveClass('aurora-drawer', 'app-drawer');
		expect(bound).toBe(drawer.element());
		const element = drawer.element();
		expect(element.querySelector('.aurora-drawer-panel.app-panel')).not.toBeNull();
		expect(element.querySelector('.aurora-drawer-body.app-body')?.textContent).toBe('Links');
		const footer = element.querySelector('footer.aurora-drawer-actions.app-actions');
		expect(footer?.querySelector('button')?.textContent).toBe('Log out');
	});

	test('a drawer opened inside another one starts from its own defaults and covers the screen', async () => {
		const screen = await render(NestedDrawers);
		const outer = screen.getByRole('dialog', { name: 'Outer' });
		await expect.element(outer).toBeVisible();
		const outerPanel = getComputedStyle(panelOf(outer));
		expect(outerPanel.width).toBe('240px');
		expect(outerPanel.padding).toBe('0px 0px 14px');
		const outerBackdrop = outer.element().querySelector('[data-backdrop]')!;
		expect(getComputedStyle(outerBackdrop).backgroundColor).toBe('rgb(1, 2, 3)');

		await screen.getByRole('button', { name: 'Open inner' }).click();
		const inner = screen.getByRole('dialog', { name: 'Inner' });
		await expect.element(inner).toBeVisible();
		expect(inner.element().matches(':modal')).toBe(true);
		const panel = panelOf(inner);
		const box = panel.getBoundingClientRect();
		expect(box.left).toBe(0);
		expect(box.width).toBe(window.innerWidth);
		expect(box.bottom).toBe(window.innerHeight);
		expect(box.height).toBe(320);
		expect(getComputedStyle(panel).padding).toBe('18px 12px');
		const innerBackdrop = inner.element().querySelector('[data-backdrop]')!;
		expect(getComputedStyle(innerBackdrop).backgroundColor).not.toBe('rgb(1, 2, 3)');
	});

});

function handleOf(drawer: { element(): Element }) {
	return drawer.element().querySelector<HTMLElement>('.aurora-drawer-handle');
}

function pointer(target: EventTarget, type: string, clientY: number) {
	target.dispatchEvent(
		new PointerEvent(type, {
			bubbles: true,
			cancelable: true,
			pointerId: 1,
			isPrimary: true,
			button: 0,
			pointerType: 'touch',
			clientY
		})
	);
}

async function drag(from: Element, distances: number[], gap: number, release = true) {
	const box = from.getBoundingClientRect();
	const y = box.top + box.height / 2;
	pointer(from, 'pointerdown', y);
	for (const distance of distances) {
		await pause(gap);
		pointer(from, 'pointermove', y + distance);
	}
	if (!release) return () => pointer(from, 'pointerup', y + distances.at(-1)!);
	await pause(gap);
	pointer(from, 'pointerup', y + distances.at(-1)!);
}

describe('Drawer handle', () => {
	test('a bottom drawer has a handle first in the panel; other sides, persistent and handle={false} have none', async () => {
		const { drawer } = await openHarness({ position: 'bottom', style: instant });
		const handle = handleOf(drawer)!;
		expect(handle).not.toBeNull();
		expect(handle.getAttribute('aria-hidden')).toBe('true');
		expect(panelOf(drawer).firstElementChild).toBe(handle);
		await expect.element(drawer).toHaveAttribute('data-handle', '');
		const bar = getComputedStyle(handle, '::before');
		expect([bar.width, bar.height]).toEqual(['38px', '5px']);
		for (const props of [
			{ position: 'left' },
			{ position: 'top' },
			{ position: 'bottom', persistent: true },
			{ position: 'bottom', handle: false }
		] as const) {
			const screen = await render(Drawer, { open: true, title: 'Sheet', ...props });
			const element = screen.getByRole('dialog', { name: 'Sheet' });
			await expect.element(element).toBeVisible();
			expect(handleOf(element)).toBeNull();
			await expect.element(element).not.toHaveAttribute('data-handle');
			await screen.unmount();
		}
	});

	test('dragging the handle down past a quarter of the panel closes it, with the pointer event', async () => {
		const onclose = vi.fn();
		const { drawer, state } = await openHarness({ position: 'bottom', style: instant, onclose });
		await drag(handleOf(drawer)!, [20, 60, 100], 150);
		await expect.element(state).toHaveTextContent('closed');
		expect(onclose).toHaveBeenCalledOnce();
		expect(onclose.mock.calls[0][0]).toBeInstanceOf(PointerEvent);
		expect(onclose.mock.calls[0][0].type).toBe('pointerup');
	});

	test('a shorter, slow drag springs back; data-dragging only while dragging', async () => {
		const { drawer, state } = await openHarness({ position: 'bottom', style: instant });
		const panel = panelOf(drawer) as HTMLElement;
		const release = (await drag(handleOf(drawer)!, [10, 30], 150, false))!;
		await expect.element(drawer).toHaveAttribute('data-dragging', '');
		expect(panel.style.translate).toBe('0px 30px');
		await pause(150);
		release();
		await expect.element(drawer).not.toHaveAttribute('data-dragging');
		expect(panel.style.translate).toBe('');
		await expect.element(state).toHaveTextContent('open');
	});

	test('a quick flick closes it even when short', async () => {
		const { drawer, state } = await openHarness({ position: 'bottom', style: instant });
		await drag(handleOf(drawer)!, [10, 40], 16);
		await expect.element(state).toHaveTextContent('closed');
	});

	test('the header drags too, its buttons do not', async () => {
		const { screen, opener, drawer, state } = await openHarness({
			position: 'bottom',
			closable: true,
			style: instant
		});
		await drag(drawer.element().querySelector('.aurora-drawer-title')!, [40, 120], 150);
		await expect.element(state).toHaveTextContent('closed');
		await opener.click();
		const again = screen.getByRole('dialog');
		const close = again.getByRole('button', { name: 'Close' }).element();
		await drag(close, [40, 120], 150, false);
		await expect.element(again).not.toHaveAttribute('data-dragging');
		expect((panelOf(again) as HTMLElement).style.translate).toBe('');
		await expect.element(state).toHaveTextContent('open');
	});

	test('persistent with handle shows it but only springs back, with resistance', async () => {
		const { drawer, state } = await openHarness({
			position: 'bottom',
			persistent: true,
			handle: true,
			style: instant
		});
		const panel = panelOf(drawer) as HTMLElement;
		const release = (await drag(handleOf(drawer)!, [100, 200], 150, false))!;
		expect(panel.style.translate).toBe('0px 50px');
		release();
		expect(panel.style.translate).toBe('');
		await expect.element(state).toHaveTextContent('open');
	});

	test('class.handle and the handle variables reach the handle', async () => {
		const screen = await render(Drawer, {
			open: true,
			position: 'bottom',
			title: 'Sheet',
			class: { handle: 'app-handle' },
			style: '--drawer-handle-width: 60px; --drawer-handle-background: rgb(255, 0, 0)'
		});
		const drawer = screen.getByRole('dialog');
		await expect.element(drawer).toBeVisible();
		const handle = handleOf(drawer)!;
		expect(handle.classList).toContain('app-handle');
		const bar = getComputedStyle(handle, '::before');
		expect(bar.width).toBe('60px');
		expect(bar.backgroundColor).toBe('rgb(255, 0, 0)');
	});
});

describe('Drawer texts', () => {
	test('follow locale, and closeLabel wins', async () => {
		const props = { open: true, title: 'Cliente', closable: true, locale: 'it' };
		const italian = await render(Drawer, props);
		await expect.element(italian.getByRole('button', { name: 'Chiudi' })).toBeVisible();
		await italian.unmount();
		const own = await render(Drawer, { ...props, closeLabel: 'Esci' });
		await expect.element(own.getByRole('button', { name: 'Esci' })).toBeVisible();
	});

	test('follow setDefaultLocale, and the locale prop wins over it', async () => {
		const props = { open: true, title: 'Cliente', closable: true };
		const inherited = await renderWithDefaultLocale('it', Drawer, props);
		await expect.element(inherited.getByRole('button', { name: 'Chiudi' })).toBeVisible();
		await inherited.unmount();
		const own = await renderWithDefaultLocale('it', Drawer, { ...props, locale: 'en' });
		await expect.element(own.getByRole('button', { name: 'Close' })).toBeVisible();
	});
});
