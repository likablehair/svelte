import { mdiCogOutline, mdiHomeOutline } from '@mdi/js';
import { createRawSnippet } from 'svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import SidebarLayout from '#lib/components/layouts/SidebarLayout.svelte';
import type { HierarchyMenuOption } from '#lib/components/simple/navigation/HierarchyMenu.svelte';
import { instantDrawers, renderWithDefaultLocale, text } from '../helpers.js';

const options: HierarchyMenuOption[] = [
	{ name: 'home', label: 'Home', icon: mdiHomeOutline, href: '/' },
	{ name: 'clients', label: 'Clients', icon: mdiHomeOutline, href: '/clients' },
	{
		name: 'settings',
		label: 'Settings',
		icon: mdiCogOutline,
		options: [{ name: 'general', label: 'General', href: '/settings/general' }]
	}
];

type State = { hamburgerVisible: boolean; sidebarExpanded: boolean; collapsed: boolean };

function stateSnippet(kind: string, seen: string[] = []) {
	return createRawSnippet((params: () => State) => ({
		render: () => {
			const { hamburgerVisible, sidebarExpanded, collapsed } = params();
			seen.push(`${kind}:${hamburgerVisible}:${sidebarExpanded}:${collapsed}`);
			return `<span class="app-${kind}">${kind}</span>`;
		}
	}));
}

function bound(
	initial: { sidebarExpanded?: boolean; drawerOpened?: boolean; selected?: string; currentPath?: string } = {}
) {
	let currentPath = $state(initial.currentPath);
	let sidebarExpanded = $state(initial.sidebarExpanded);
	let drawerOpened = $state(initial.drawerOpened);
	let selected = $state(initial.selected);
	return {
		get currentPath() {
			return currentPath;
		},
		set currentPath(value) {
			currentPath = value;
		},
		get sidebarExpanded() {
			return sidebarExpanded;
		},
		set sidebarExpanded(value) {
			sidebarExpanded = value;
		},
		get drawerOpened() {
			return drawerOpened;
		},
		set drawerOpened(value) {
			drawerOpened = value;
		},
		get selected() {
			return selected;
		},
		set selected(value) {
			selected = value;
		}
	};
}

const noNavigation = (event: { option: HierarchyMenuOption; nativeEvent: MouseEvent }) =>
	event.nativeEvent.preventDefault();

function parts(container: HTMLElement) {
	return {
		root: container.querySelector<HTMLElement>('.aurora-sidebar-layout')!,
		sidebar: container.querySelector<HTMLElement>('.aurora-sidebar-layout-sidebar')!,
		main: container.querySelector<HTMLElement>('main')!
	};
}

describe('SidebarLayout', () => {
	instantDrawers();

	beforeEach(async () => {
		await page.viewport(1280, 800);
		document.documentElement.style.setProperty('--sidebar-layout-duration', '0s');
	});

	afterEach(async () => {
		await page.viewport(1280, 800);
		document.documentElement.style.removeProperty('--sidebar-layout-duration');
	});

	test('renders the sidebar with the menu, the bar and the content in a main landmark', async () => {
		const screen = await render(SidebarLayout, { options, children: text('Page body') });
		await expect.element(screen.getByRole('navigation', { name: 'Menu' })).toBeInTheDocument();
		await expect.element(screen.getByRole('banner')).toBeInTheDocument();
		const main = screen.getByRole('main');
		await expect.element(main).toHaveTextContent('Page body');
		const skip = screen.getByRole('link', { name: 'Skip to content' });
		expect(skip.element().getAttribute('href')).toBe(`#${main.element().id}`);
		await expect.element(main).toHaveAttribute('tabindex', '-1');
	});

	test('forwards native attributes and the class parts', async () => {
		const screen = await render(SidebarLayout, {
			options,
			id: 'shell',
			'data-testid': 'layout',
			class: { container: 'app-root', sidebar: 'app-side', header: 'app-header', content: 'app-main' }
		});
		const root = screen.getByTestId('layout').element();
		expect(root.id).toBe('shell');
		expect(root.classList).toContain('aurora-sidebar-layout');
		expect(root.classList).toContain('app-root');
		expect(root.querySelector('.aurora-sidebar-layout-sidebar')?.classList).toContain('app-side');
		expect(root.querySelector('header')?.classList).toContain('app-header');
		expect(root.querySelector('main')?.classList).toContain('app-main');
	});

	test('the toggle button widens the sidebar and pushes the content', async () => {
		const props = bound();
		const onsidebarToggle = vi.fn();
		const screen = await render(SidebarLayout, {
			options,
			onsidebarToggle,
			get sidebarExpanded() {
				return props.sidebarExpanded;
			},
			set sidebarExpanded(value) {
				props.sidebarExpanded = value;
			}
		});
		const { root, sidebar, main } = parts(screen.container);
		const toggle = screen.getByRole('button', { name: 'Sidebar' });
		await expect.element(toggle).toHaveAttribute('aria-expanded', 'false');
		expect(getComputedStyle(screen.container.querySelector('.aurora-sidebar-layout-hamburger')!).display).toBe(
			'none'
		);
		expect(root.dataset.expandOn).toBe('toggle');
		const narrow = main.getBoundingClientRect().left;
		expect(sidebar.getBoundingClientRect().width).toBe(64);
		await expect.element(screen.getByRole('navigation')).toHaveAttribute('data-icons-only', '');
		await toggle.click();
		expect(props.sidebarExpanded).toBe(true);
		expect(onsidebarToggle).toHaveBeenCalledWith({ expanded: true });
		await expect.element(toggle).toHaveAttribute('aria-expanded', 'true');
		expect(root.hasAttribute('data-expanded')).toBe(true);
		await expect.poll(() => sidebar.getBoundingClientRect().width).toBe(288);
		expect(main.getBoundingClientRect().left).toBeGreaterThan(narrow + 200);
		await expect.element(screen.getByRole('navigation')).not.toHaveAttribute('data-icons-only');
	});

	test('the toggle button sits at the top of the sidebar, after the logo, and not in the bar', async () => {
		const screen = await render(SidebarLayout, { options, logoSnippet: stateSnippet('logo'), sidebarExpanded: true });
		const toggle = screen.getByRole('button', { name: 'Sidebar' }).element();
		const top = screen.container.querySelector('.aurora-sidebar-layout-sidebar > .aurora-sidebar-layout-top')!;
		expect(top.contains(toggle)).toBe(true);
		expect(top.firstElementChild?.querySelector('.app-logo')).not.toBeNull();
		expect(toggle.previousElementSibling?.classList).toContain('aurora-sidebar-layout-logo');
		expect(screen.container.querySelector('header')!.contains(toggle)).toBe(false);
		const sidebar = screen.container.querySelector('.aurora-sidebar-layout-sidebar')!.getBoundingClientRect();
		expect(toggle.getBoundingClientRect().right).toBeGreaterThan(sidebar.right - 20);
	});

	test('narrow, the logo turns into the toggle button under the pointer and with the keyboard focus', async () => {
		const screen = await render(SidebarLayout, { options, logoSnippet: stateSnippet('logo') });
		const toggle = screen.getByRole('button', { name: 'Sidebar' }).element();
		const logo = screen.container.querySelector('.aurora-sidebar-layout-logo')!;
		await userEvent.hover(screen.getByRole('main'));
		await expect.poll(() => getComputedStyle(toggle).opacity).toBe('0');
		expect(getComputedStyle(logo).opacity).toBe('1');
		await page.elementLocator(screen.container.querySelector('.aurora-sidebar-layout-top')!).hover();
		await expect.poll(() => getComputedStyle(toggle).opacity).toBe('1');
		await expect.poll(() => getComputedStyle(logo).opacity).toBe('0');
		await userEvent.hover(screen.getByRole('main'));
		await expect.poll(() => getComputedStyle(toggle).opacity).toBe('0');
		await userEvent.keyboard('{Tab}{Tab}');
		expect(document.activeElement).toBe(toggle);
		await expect.poll(() => getComputedStyle(toggle).opacity).toBe('1');
	});

	test('narrow, a click on an empty spot of the rail widens the sidebar; wide, it does not narrow it', async () => {
		const props = bound();
		const onsidebarToggle = vi.fn();
		const screen = await render(SidebarLayout, {
			options,
			onsidebarToggle,
			get sidebarExpanded() {
				return props.sidebarExpanded;
			},
			set sidebarExpanded(value) {
				props.sidebarExpanded = value;
			}
		});
		const { sidebar } = parts(screen.container);
		expect(getComputedStyle(sidebar).cursor).toBe('e-resize');
		const empty = { position: { x: 20, y: sidebar.getBoundingClientRect().height - 40 } };
		await page.elementLocator(sidebar).click(empty);
		expect(props.sidebarExpanded).toBe(true);
		expect(onsidebarToggle).toHaveBeenCalledWith({ expanded: true });
		expect(getComputedStyle(sidebar).cursor).not.toBe('e-resize');
		await page.elementLocator(sidebar).click(empty);
		expect(props.sidebarExpanded).toBe(true);
		expect(onsidebarToggle).toHaveBeenCalledOnce();
	});

	test('with sidebarSnippet the toggle button stays in the bar', async () => {
		const screen = await render(SidebarLayout, { options, sidebarSnippet: stateSnippet('sidebar') });
		const toggle = screen.getByRole('button', { name: 'Sidebar' }).element();
		expect(screen.container.querySelector('header')!.contains(toggle)).toBe(true);
		expect(screen.container.querySelector('.aurora-sidebar-layout-top')).toBeNull();
	});

	test('expandOn="hover" widens over the content with the pointer and the keyboard focus', async () => {
		const screen = await render(SidebarLayout, { options, expandOn: 'hover', children: text('Body') });
		const { root, sidebar, main } = parts(screen.container);
		expect(screen.container.querySelector('.aurora-sidebar-layout-dock')).toBeNull();
		const left = main.getBoundingClientRect().left;
		await userEvent.hover(screen.getByRole('link', { name: 'Home' }));
		await expect.poll(() => root.hasAttribute('data-expanded')).toBe(true);
		expect(sidebar.hasAttribute('data-overlay')).toBe(true);
		await expect.poll(() => sidebar.getBoundingClientRect().width).toBe(288);
		expect(main.getBoundingClientRect().left).toBe(left);
		await userEvent.hover(screen.getByRole('main'));
		await expect.poll(() => root.hasAttribute('data-expanded')).toBe(false);
		await userEvent.keyboard('{Tab}{Tab}');
		await expect.poll(() => root.hasAttribute('data-expanded')).toBe(true);
	});

	test('expandOn="click" widens with a click on the rail until a click outside or Escape', async () => {
		const screen = await render(SidebarLayout, {
			options,
			expandOn: 'click',
			children: text('Body'),
			onmenuSelect: noNavigation
		});
		const { root, sidebar } = parts(screen.container);
		await userEvent.click(sidebar, { position: { x: 30, y: 700 } });
		await expect.poll(() => root.hasAttribute('data-expanded')).toBe(true);
		await userEvent.click(screen.getByRole('main'));
		await expect.poll(() => root.hasAttribute('data-expanded')).toBe(false);
		await userEvent.click(sidebar, { position: { x: 30, y: 700 } });
		await expect.poll(() => root.hasAttribute('data-expanded')).toBe(true);
		await userEvent.keyboard('{Escape}');
		await expect.poll(() => root.hasAttribute('data-expanded')).toBe(false);
	});

	test('v4 bug: with expandOn="click" choosing an option narrows the sidebar', async () => {
		const props = bound({ sidebarExpanded: true });
		const screen = await render(SidebarLayout, {
			options,
			expandOn: 'click',
			onmenuSelect: noNavigation,
			get sidebarExpanded() {
				return props.sidebarExpanded;
			},
			set sidebarExpanded(value) {
				props.sidebarExpanded = value;
			}
		});
		await screen.getByRole('link', { name: 'Clients' }).click();
		expect(props.sidebarExpanded).toBe(false);
		expect(parts(screen.container).root.hasAttribute('data-expanded')).toBe(false);
	});

	test('expandOn="none" with sidebarExpanded keeps a wide sidebar without a button', async () => {
		const screen = await render(SidebarLayout, { options, expandOn: 'none', sidebarExpanded: true });
		const { sidebar, main } = parts(screen.container);
		expect(screen.container.querySelector('.aurora-sidebar-layout-dock')).toBeNull();
		expect(sidebar.getBoundingClientRect().width).toBe(288);
		expect(main.getBoundingClientRect().left).toBe(288);
		await userEvent.hover(sidebar);
		expect(sidebar.hasAttribute('data-overlay')).toBe(false);
	});

	test('choosing an option selects it and calls onmenuSelect', async () => {
		const props = bound();
		const onmenuSelect = vi.fn(noNavigation);
		const screen = await render(SidebarLayout, {
			options,
			sidebarExpanded: true,
			onmenuSelect,
			get selected() {
				return props.selected;
			},
			set selected(value) {
				props.selected = value;
			}
		});
		await screen.getByRole('link', { name: 'Clients' }).click();
		expect(props.selected).toBe('clients');
		expect(onmenuSelect).toHaveBeenCalledOnce();
		expect(onmenuSelect.mock.calls[0][0].option.name).toBe('clients');
		expect(onmenuSelect.mock.calls[0][0].nativeEvent).toBeInstanceOf(MouseEvent);
	});

	test('currentPath selects the option of the page, also on mobile with the drawer closed', async () => {
		await page.viewport(800, 700);
		const props = bound();
		await render(SidebarLayout, {
			options,
			currentPath: '/settings/general',
			get selected() {
				return props.selected;
			},
			set selected(value) {
				props.selected = value;
			}
		});
		await expect.poll(() => props.selected).toBe('general');
	});

	test('a long menu scrolls by itself to show the selected option', async () => {
		await page.viewport(1280, 400);
		const many: HierarchyMenuOption[] = Array.from({ length: 40 }, (_, index) => ({
			name: `page-${index}`,
			label: `Page ${index}`,
			href: `/page-${index}`
		}));
		const screen = await render(SidebarLayout, {
			options: many,
			expandOn: 'none',
			sidebarExpanded: true,
			currentPath: '/page-35'
		});
		const menu = screen.container.querySelector<HTMLElement>('.aurora-sidebar-layout-menu')!;
		await expect.poll(() => menu.scrollTop).toBeGreaterThan(0);
		const box = menu.getBoundingClientRect();
		const option = screen.getByRole('link', { name: 'Page 35' }).element().getBoundingClientRect();
		expect(option.top).toBeGreaterThanOrEqual(box.top);
		expect(option.bottom).toBeLessThanOrEqual(box.bottom);
	});

	test('passes the state to the snippets', async () => {
		const seen: string[] = [];
		const screen = await render(SidebarLayout, {
			options,
			logoSnippet: stateSnippet('logo', seen),
			menuSnippet: stateSnippet('menu', seen),
			userSnippet: stateSnippet('user', seen),
			headerSnippet: stateSnippet('header', seen)
		});
		expect(screen.container.querySelector('.aurora-sidebar-layout-logo .app-logo')).not.toBeNull();
		expect(screen.container.querySelector('.aurora-sidebar-layout-menu .app-menu')).not.toBeNull();
		expect(screen.container.querySelector('.aurora-sidebar-layout-user .app-user')).not.toBeNull();
		expect(screen.container.querySelector('header .app-header')).not.toBeNull();
		expect(screen.container.querySelector('.aurora-hierarchy-menu')).toBeNull();
		expect(seen).toEqual(
			expect.arrayContaining(['logo:false:false:true', 'menu:false:false:true', 'header:false:false:true'])
		);
	});

	test('sidebarSnippet replaces the whole sidebar and toggleSnippet the button', async () => {
		const toggleSnippet = createRawSnippet((params: () => { toggle: () => void; drawerOpened: boolean }) => ({
			render: () => `<button type="button" class="app-toggle">Open ${params().drawerOpened}</button>`,
			setup: (node: Element) => {
				node.addEventListener('click', () => params().toggle());
			}
		}));
		const props = bound();
		const screen = await render(SidebarLayout, {
			options,
			sidebarSnippet: stateSnippet('sidebar'),
			toggleSnippet,
			get sidebarExpanded() {
				return props.sidebarExpanded;
			},
			set sidebarExpanded(value) {
				props.sidebarExpanded = value;
			}
		});
		expect(screen.container.querySelector('.aurora-sidebar-layout-sidebar .app-sidebar')).not.toBeNull();
		expect(screen.container.querySelector('.aurora-sidebar-layout-menu')).toBeNull();
		expect(screen.container.querySelector('.aurora-sidebar-layout-dock')).toBeNull();
		await screen.getByRole('button', { name: 'Open false' }).click();
		expect(props.sidebarExpanded).toBe(true);
	});

	test('on mobile the menu button opens the sidebar in a drawer, closed by choosing an option', async () => {
		await page.viewport(800, 700);
		const props = bound();
		const ondrawerChange = vi.fn();
		const screen = await render(SidebarLayout, {
			options,
			logoSnippet: stateSnippet('logo'),
			ondrawerChange,
			onmenuSelect: noNavigation,
			get drawerOpened() {
				return props.drawerOpened;
			},
			set drawerOpened(value) {
				props.drawerOpened = value;
			}
		});
		const { sidebar } = parts(screen.container);
		expect(getComputedStyle(sidebar).display).toBe('none');
		const button = screen.getByRole('button', { name: 'Menu' });
		await expect.element(button).toHaveAttribute('aria-expanded', 'false');
		await button.click();
		const drawer = screen.getByRole('dialog', { name: 'Menu' });
		await expect.element(drawer).toBeVisible();
		expect(props.drawerOpened).toBe(true);
		expect(ondrawerChange).toHaveBeenLastCalledWith({ opened: true });
		await expect.element(button).toHaveAttribute('aria-expanded', 'true');
		expect(drawer.element().querySelector('.app-logo')).not.toBeNull();
		await expect.element(screen.getByRole('navigation', { name: 'Menu' })).not.toHaveAttribute('data-icons-only');
		await screen.getByRole('link', { name: 'Clients' }).click();
		await expect.element(drawer).not.toBeInTheDocument();
		expect(props.drawerOpened).toBe(false);
		expect(ondrawerChange).toHaveBeenLastCalledWith({ opened: false });
	});

	test('on mobile the drawer focuses the option of the page, not its scrolling list', async () => {
		await page.viewport(400, 300);
		const many: HierarchyMenuOption[] = Array.from({ length: 30 }, (_, index) => ({
			name: `page-${index}`,
			label: `Page ${index}`,
			href: `/page-${index}`
		}));
		const screen = await render(SidebarLayout, { options: many, currentPath: '/page-20' });
		await screen.getByRole('button', { name: 'Menu' }).click();
		await expect.element(screen.getByRole('link', { name: 'Page 20' })).toHaveFocus();
	});

	test('on mobile the drawer closes with Escape and when currentPath changes', async () => {
		await page.viewport(800, 700);
		const props = bound({ currentPath: '/' });
		const screen = await render(SidebarLayout, {
			options,
			get currentPath() {
				return props.currentPath;
			},
			get drawerOpened() {
				return props.drawerOpened;
			},
			set drawerOpened(value) {
				props.drawerOpened = value;
			}
		});
		await screen.getByRole('button', { name: 'Menu' }).click();
		await expect.element(screen.getByRole('dialog')).toBeVisible();
		await userEvent.keyboard('{Escape}');
		await expect.element(screen.getByRole('dialog')).not.toBeInTheDocument();
		expect(props.drawerOpened).toBe(false);
		await screen.getByRole('button', { name: 'Menu' }).click();
		await expect.element(screen.getByRole('dialog')).toBeVisible();
		props.currentPath = '/clients';
		await expect.element(screen.getByRole('dialog')).not.toBeInTheDocument();
		expect(props.drawerOpened).toBe(false);
	});

	test('growing to desktop closes the drawer', async () => {
		await page.viewport(800, 700);
		const props = bound();
		const screen = await render(SidebarLayout, {
			options,
			get drawerOpened() {
				return props.drawerOpened;
			},
			set drawerOpened(value) {
				props.drawerOpened = value;
			}
		});
		await screen.getByRole('button', { name: 'Menu' }).click();
		await expect.element(screen.getByRole('dialog')).toBeVisible();
		await page.viewport(1280, 800);
		await expect.poll(() => props.drawerOpened).toBe(false);
		await expect.element(screen.getByRole('dialog')).not.toBeInTheDocument();
	});

	test('v4 bug: no placeholder texts without snippets', async () => {
		const screen = await render(SidebarLayout, {});
		const words = screen.container.textContent ?? '';
		expect(words).not.toMatch(/\b(Content|logo|Sidebar)\b/);
		expect(screen.container.querySelector('.aurora-sidebar-layout-logo')).toBeNull();
		expect(screen.container.querySelector('.aurora-sidebar-layout-user')).toBeNull();
	});

	test('v4 bug: the menu button has a name and says whether the drawer is open', async () => {
		await page.viewport(800, 700);
		const screen = await render(SidebarLayout, { options });
		const button = screen.getByRole('button', { name: 'Menu' });
		await expect.element(button).toBeVisible();
		await expect.element(button).toHaveAttribute('aria-expanded', 'false');
	});

	test('reads the CSS variables of the instance', async () => {
		const screen = await render(SidebarLayout, { options, children: text('Body') });
		const { root, sidebar, main } = parts(screen.container);
		root.style.setProperty('--sidebar-layout-sidebar-width', '80px');
		root.style.setProperty('--sidebar-layout-content-padding', '7px');
		root.style.setProperty('--sidebar-layout-header-height', '70px');
		expect(sidebar.getBoundingClientRect().width).toBe(80);
		expect(getComputedStyle(main).paddingTop).toBe('7px');
		expect(screen.container.querySelector('header')!.getBoundingClientRect().height).toBe(70);
	});

	test('texts follow locale, with the default locale of the app', async () => {
		const screen = await render(SidebarLayout, { options, locale: 'it' });
		await expect.element(screen.getByRole('button', { name: 'Barra laterale' })).toBeInTheDocument();
		await expect.element(screen.getByRole('link', { name: 'Vai al contenuto' })).toBeInTheDocument();
		const app = await renderWithDefaultLocale('it', SidebarLayout, { options, locale: 'en' });
		await expect.element(app.getByRole('link', { name: 'Skip to content' })).toBeInTheDocument();
		const labelled = await render(SidebarLayout, { options, sidebarLabel: 'Pannello', skipLabel: 'Salta' });
		await expect.element(labelled.getByRole('button', { name: 'Pannello' })).toBeInTheDocument();
		await expect.element(labelled.getByRole('link', { name: 'Salta' })).toBeInTheDocument();
	});
});
