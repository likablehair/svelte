import { mdiCogOutline, mdiHomeOutline } from '@mdi/js';
import { createRawSnippet } from 'svelte';
import { describe, expect, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import HierarchyMenu, {
	type HierarchyMenuOption
} from '#lib/components/simple/navigation/HierarchyMenu.svelte';
import { renderWithDefaultLocale, tooltipText } from '../helpers.js';

const options: HierarchyMenuOption[] = [
	{ name: 'home', label: 'Home', icon: mdiHomeOutline, href: '/' },
	{ name: 'clients', label: 'Clients', href: '/clients', badge: 4 },
	{
		name: 'settings',
		label: 'Settings',
		icon: mdiCogOutline,
		options: [
			{ name: 'general', label: 'General', href: '/settings/general' },
			{
				name: 'billing',
				label: 'Billing',
				href: '/settings/billing',
				options: [{ name: 'invoices', label: 'Invoices', href: '/settings/billing/invoices' }]
			}
		]
	},
	{ name: 'reports', label: 'Reports' },
	{ name: 'admin', label: 'Admin', disabled: true }
];

function bound(initial: { selected?: string; expanded?: string[] } = {}) {
	let selected = $state(initial.selected);
	let expanded = $state(initial.expanded);
	return {
		get selected() {
			return selected;
		},
		set selected(value) {
			selected = value;
		},
		get expanded() {
			return expanded;
		},
		set expanded(value) {
			expanded = value;
		}
	};
}

const noNavigation = (event: { nativeEvent: MouseEvent }) => event.nativeEvent.preventDefault();

describe('HierarchyMenu', () => {
	test('renders a named nav with links for href and buttons otherwise', async () => {
		const screen = await render(HierarchyMenu, { options });
		await expect.element(screen.getByRole('navigation', { name: 'Menu' })).toBeInTheDocument();
		await expect.element(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
		await expect.element(screen.getByRole('link', { name: 'Clients 4' })).toBeInTheDocument();
		await expect.element(screen.getByRole('button', { name: 'Settings' })).toHaveAttribute('aria-expanded', 'false');
		await expect.element(screen.getByRole('button', { name: 'Reports' })).toBeInTheDocument();
		const home = screen.getByRole('link', { name: 'Home' }).element();
		expect(home.querySelector('svg path')?.getAttribute('d')).toBe(mdiHomeOutline);
		expect(screen.container.querySelector('.aurora-hierarchy-menu-badge')?.textContent).toBe('4');
	});

	test('aria-labelledby names the nav instead of the default label', async () => {
		const screen = await render(HierarchyMenu, { options, 'aria-labelledby': 'menu-title' });
		const nav = screen.container.querySelector('nav')!;
		expect(nav.getAttribute('aria-labelledby')).toBe('menu-title');
		expect(nav.hasAttribute('aria-label')).toBe(false);
	});

	test('forwards native attributes and the class parts', async () => {
		const screen = await render(HierarchyMenu, {
			options,
			selected: 'reports',
			expanded: ['settings'],
			id: 'main-menu',
			'aria-label': 'Main',
			'data-testid': 'menu',
			class: { container: 'app-nav', option: 'app-option', selected: 'app-selected', children: 'app-children' }
		});
		const nav = screen.getByTestId('menu').element();
		expect(nav.id).toBe('main-menu');
		expect(nav.getAttribute('aria-label')).toBe('Main');
		expect(nav.classList).toContain('aurora-hierarchy-menu');
		expect(nav.classList).toContain('app-nav');
		expect(nav.querySelectorAll('.app-option').length).toBe(8);
		expect(nav.querySelector('.app-selected')?.textContent?.trim()).toBe('Reports');
		expect(nav.querySelectorAll('.app-children').length).toBe(2);
	});

	test('choosing an option selects it and calls onoptionClick with the option and the event', async () => {
		const props = bound();
		const onoptionClick = vi.fn();
		const screen = await render(HierarchyMenu, {
			options,
			get selected() {
				return props.selected;
			},
			set selected(value) {
				props.selected = value;
			},
			onoptionClick
		});
		await screen.getByRole('button', { name: 'Reports' }).click();
		expect(props.selected).toBe('reports');
		expect(onoptionClick).toHaveBeenCalledOnce();
		expect(onoptionClick.mock.calls[0][0].option.name).toBe('reports');
		expect(onoptionClick.mock.calls[0][0].nativeEvent).toBeInstanceOf(MouseEvent);
		await expect.element(screen.getByRole('button', { name: 'Reports' })).toHaveAttribute('aria-current', 'true');
		expect(screen.container.querySelector('[data-selected]')?.textContent?.trim()).toBe('Reports');
	});

	test('a parent without href opens and closes its children without being chosen', async () => {
		const onoptionClick = vi.fn();
		const props = bound();
		const screen = await render(HierarchyMenu, {
			options,
			onoptionClick,
			get expanded() {
				return props.expanded;
			},
			set expanded(value) {
				props.expanded = value;
			}
		});
		const settings = screen.getByRole('button', { name: 'Settings' });
		const children = screen.container.querySelector('.aurora-hierarchy-menu-children')!;
		expect(children.hasAttribute('inert')).toBe(true);
		await settings.click();
		await expect.element(settings).toHaveAttribute('aria-expanded', 'true');
		expect(children.hasAttribute('inert')).toBe(false);
		expect(props.expanded).toEqual(['settings']);
		expect(document.getElementById(settings.element().getAttribute('aria-controls')!)).toBe(
			children.querySelector('ul')
		);
		await settings.click();
		await expect.element(settings).toHaveAttribute('aria-expanded', 'false');
		expect(props.expanded).toEqual([]);
		expect(onoptionClick).not.toHaveBeenCalled();
	});

	test('a parent with href is a link with a separate button for its children', async () => {
		const screen = await render(HierarchyMenu, { options, expanded: ['settings'], onoptionClick: noNavigation });
		const caret = screen.getByRole('button', { name: 'Billing submenu' });
		await expect.element(caret).toHaveAttribute('aria-expanded', 'false');
		await caret.click();
		await expect.element(caret).toHaveAttribute('aria-expanded', 'true');
		await expect.element(screen.getByRole('link', { name: 'Invoices' })).toBeVisible();
		await screen.getByRole('link', { name: 'Billing' }).click();
		await expect.element(screen.getByRole('link', { name: 'Billing' })).toHaveAttribute('aria-current', 'page');
	});

	test('currentPath selects the longest matching href and opens its parents', async () => {
		const props = bound();
		const screen = await render(HierarchyMenu, {
			options,
			currentPath: '/settings/billing/invoices/42',
			get selected() {
				return props.selected;
			},
			set selected(value) {
				props.selected = value;
			}
		});
		await expect.element(screen.getByRole('link', { name: 'Invoices' })).toHaveAttribute('aria-current', 'page');
		expect(props.selected).toBe('invoices');
		const ancestors = [...screen.container.querySelectorAll('[data-ancestor]')].map(
			(row) => row.parentElement?.dataset.name
		);
		expect(ancestors).toEqual(['settings', 'billing']);
		await expect.element(screen.getByRole('button', { name: 'Settings' })).toHaveAttribute('aria-expanded', 'true');
		await expect.element(screen.getByRole('button', { name: 'Billing submenu' })).toHaveAttribute('aria-expanded', 'true');
	});

	test('currentPath matches whole segments, and "/" only itself', async () => {
		const screen = await render(HierarchyMenu, { options, currentPath: '/clients-archive' });
		expect(screen.container.querySelector('[aria-current]')).toBeNull();
		await screen.rerender({ options, currentPath: '/clients/12/' });
		await expect.element(screen.getByRole('link', { name: 'Clients 4' })).toHaveAttribute('aria-current', 'page');
		await screen.rerender({ options, currentPath: '/' });
		await expect.element(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('aria-current', 'page');
	});

	test('a selected option opens its parents, which stay open', async () => {
		const props = bound({ selected: 'general' });
		const screen = await render(HierarchyMenu, {
			options,
			get selected() {
				return props.selected;
			},
			set selected(value) {
				props.selected = value;
			},
			get expanded() {
				return props.expanded;
			},
			set expanded(value) {
				props.expanded = value;
			}
		});
		await expect.element(screen.getByRole('button', { name: 'Settings' })).toHaveAttribute('aria-expanded', 'true');
		expect(props.expanded).toEqual(['settings']);
	});

	test('disabled options cannot be chosen', async () => {
		const onoptionClick = vi.fn();
		const screen = await render(HierarchyMenu, {
			options: [...options, { name: 'archive', label: 'Archive', href: '/archive', disabled: true }],
			onoptionClick
		});
		await expect.element(screen.getByRole('button', { name: 'Admin' })).toBeDisabled();
		const archive = screen.getByRole('link', { name: 'Archive' });
		await expect.element(archive).toHaveAttribute('aria-disabled', 'true');
		expect(archive.element().hasAttribute('href')).toBe(false);
		(archive.element() as HTMLElement).click();
		expect(onoptionClick).not.toHaveBeenCalled();
		expect(screen.container.querySelector('[data-selected]')).toBeNull();
	});

	test('a link opened with a modifier key does not change the selection', async () => {
		const onoptionClick = vi.fn();
		const screen = await render(HierarchyMenu, { options, selected: 'reports', onoptionClick });
		const link = screen.getByRole('link', { name: 'Home' }).element();
		link.addEventListener('click', (event) => event.preventDefault());
		link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, ctrlKey: true }));
		expect(onoptionClick).not.toHaveBeenCalled();
		await expect.element(screen.getByRole('button', { name: 'Reports' })).toHaveAttribute('aria-current', 'true');
	});

	test('the arrow keys, Home and End move between the visible options', async () => {
		const screen = await render(HierarchyMenu, { options });
		const home = screen.getByRole('link', { name: 'Home' });
		const settings = screen.getByRole('button', { name: 'Settings' });
		home.element().focus();
		await userEvent.keyboard('{ArrowDown}');
		await expect.element(screen.getByRole('link', { name: 'Clients 4' })).toHaveFocus();
		await userEvent.keyboard('{ArrowDown}');
		await expect.element(settings).toHaveFocus();
		await userEvent.keyboard('{ArrowDown}');
		await expect.element(screen.getByRole('button', { name: 'Reports' })).toHaveFocus();
		await userEvent.keyboard('{End}');
		await expect.element(screen.getByRole('button', { name: 'Reports' })).toHaveFocus();
		await userEvent.keyboard('{Home}');
		await expect.element(home).toHaveFocus();
		await userEvent.keyboard('{ArrowUp}');
		await expect.element(home).toHaveFocus();
	});

	test('Right opens a parent and enters it, Left goes back to the parent and closes it', async () => {
		const screen = await render(HierarchyMenu, { options });
		const settings = screen.getByRole('button', { name: 'Settings' });
		settings.element().focus();
		await userEvent.keyboard('{ArrowRight}');
		await expect.element(settings).toHaveAttribute('aria-expanded', 'true');
		await expect.element(settings).toHaveFocus();
		await userEvent.keyboard('{ArrowRight}');
		await expect.element(screen.getByRole('link', { name: 'General' })).toHaveFocus();
		await userEvent.keyboard('{ArrowLeft}');
		await expect.element(settings).toHaveFocus();
		await userEvent.keyboard('{ArrowLeft}');
		await expect.element(settings).toHaveAttribute('aria-expanded', 'false');
	});

	test('iconsOnly keeps the names, shows tooltips and turns badges into dots', async () => {
		const screen = await render(HierarchyMenu, { options, iconsOnly: true });
		await expect.element(screen.getByRole('navigation')).toHaveAttribute('data-icons-only', '');
		const home = screen.getByRole('link', { name: 'Home' });
		await expect.element(home).toBeInTheDocument();
		home.element().focus();
		await expect.poll(() => tooltipText(home.element())).toBe('Home');
		expect(screen.container.querySelector('.aurora-hierarchy-menu-badge')).toBeNull();
		expect(screen.container.querySelector('.aurora-hierarchy-menu-dot')).not.toBeNull();
		expect(screen.container.querySelector('.aurora-hierarchy-menu-children')).toBeNull();
		expect(screen.getByRole('button', { name: 'Reports' }).element().textContent).toContain('R');
	});

	test('v4 bug: with iconsOnly a parent opens a menu with its children', async () => {
		const props = bound();
		const onoptionClick = vi.fn((event: { nativeEvent: MouseEvent }) => event.nativeEvent.preventDefault());
		const screen = await render(HierarchyMenu, {
			options,
			iconsOnly: true,
			onoptionClick,
			get selected() {
				return props.selected;
			},
			set selected(value) {
				props.selected = value;
			}
		});
		const settings = screen.getByRole('button', { name: 'Settings' });
		await expect.element(settings).toHaveAttribute('aria-haspopup', 'true');
		await settings.click();
		await expect.element(settings).toHaveAttribute('aria-expanded', 'true');
		const flyout = screen.getByRole('navigation', { name: 'Settings' });
		await expect.element(flyout).toBeVisible();
		await expect.element(screen.getByRole('link', { name: 'General' })).toHaveFocus();
		await screen.getByRole('link', { name: 'General' }).click();
		expect(props.selected).toBe('general');
		expect(onoptionClick).toHaveBeenCalledOnce();
		await expect.element(flyout).not.toBeInTheDocument();
		await expect.element(settings).toHaveFocus();
		expect(settings.element().closest('.aurora-hierarchy-menu-row')?.hasAttribute('data-ancestor')).toBe(true);
	});

	test('v4 bug: every option is reachable with the keyboard', async () => {
		const screen = await render(HierarchyMenu, { options, expanded: ['settings'] });
		const reachable = [...screen.container.querySelectorAll<HTMLElement>('.aurora-hierarchy-menu-option')].filter(
			(node) => !node.closest('[inert]') && node.tabIndex >= 0
		);
		expect(reachable.map((node) => node.textContent?.trim())).toEqual([
			'Home',
			'Clients 4',
			'Settings',
			'General',
			'Billing',
			'Reports',
			'Admin'
		]);
	});

	test('v4 bug: href renders links instead of being ignored', async () => {
		const screen = await render(HierarchyMenu, { options, expanded: ['settings'] });
		await expect.element(screen.getByRole('link', { name: 'General' })).toHaveAttribute('href', '/settings/general');
	});

	test('renders the snippets with the option, the selection and the depth', async () => {
		const seen: string[] = [];
		const make = (kind: string) =>
			createRawSnippet((params: () => { option: HierarchyMenuOption; selected: boolean; depth: number }) => ({
				render: () => {
					const { option, selected, depth } = params();
					seen.push(`${kind}:${option.name}:${selected}:${depth}`);
					return `<span class="app-${kind}">${kind}-${option.name}</span>`;
				}
			}));
		const screen = await render(HierarchyMenu, {
			options: options.slice(2, 3),
			selected: 'general',
			prependSnippet: make('prepend'),
			optionSnippet: make('label'),
			appendSnippet: make('append')
		});
		await expect.element(screen.getByRole('link', { name: 'prepend-general label-general' })).toBeInTheDocument();
		expect(seen).toContain('label:general:true:1');
		expect(seen).toContain('append:settings:false:0');
		expect(screen.container.querySelector('.aurora-hierarchy-menu-append .app-append')).not.toBeNull();
	});

	test('reads the CSS variables of the instance', async () => {
		const screen = await render(HierarchyMenu, { options, selected: 'reports' });
		const nav = screen.container.querySelector<HTMLElement>('.aurora-hierarchy-menu')!;
		nav.style.setProperty('--hierarchy-menu-option-selected-background', 'rgb(1, 2, 3)');
		nav.style.setProperty('--hierarchy-menu-gap', '9px');
		const row = nav.querySelector('[data-selected]')!;
		expect(getComputedStyle(row).backgroundColor).toBe('rgb(1, 2, 3)');
		expect(getComputedStyle(nav.querySelector('.aurora-hierarchy-menu-list')!).rowGap).toBe('9px');
	});

	test('texts follow locale, with the default locale of the app', async () => {
		const screen = await render(HierarchyMenu, { options, expanded: ['settings'], locale: 'it' });
		await expect.element(screen.getByRole('button', { name: 'Sottomenu di Billing' })).toBeInTheDocument();
		await expect.element(screen.getByRole('navigation', { name: 'Menu' })).toBeInTheDocument();
		const app = await renderWithDefaultLocale('it', HierarchyMenu, { options, expanded: ['settings'], locale: 'en' });
		await expect.element(app.getByRole('button', { name: 'Billing submenu' })).toBeInTheDocument();
	});
});
