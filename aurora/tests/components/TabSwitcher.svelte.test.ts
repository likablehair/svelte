import { mdiPlus } from '@mdi/js';
import { createRawSnippet, flushSync, mount, unmount } from 'svelte';
import { describe, expect, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import TabSwitcher, { type Tab } from '#lib/components/simple/navigation/TabSwitcher.svelte';
import { text } from '../helpers.js';

const tabs: Tab[] = [
	{ name: 'overview', label: 'Overview', panelId: 'panel-overview' },
	{ name: 'services', label: 'Services', icon: mdiPlus },
	{ name: 'history', label: 'History', badge: 12 },
	{ name: 'documents', label: 'Documents', disabled: true }
];

function bound(initial?: string) {
	let selected = $state(initial);
	return {
		get selected() {
			return selected;
		},
		set selected(value) {
			selected = value;
		}
	};
}

function rect(element: Element) {
	const { left, right, top, bottom } = element.getBoundingClientRect();
	return { left: Math.round(left), right: Math.round(right), top, bottom };
}

describe('TabSwitcher', () => {
	test('renders an ARIA tab list with one tab per item', async () => {
		const screen = await render(TabSwitcher, { tabs, selected: 'services', 'aria-label': 'Client' });
		const list = screen.getByRole('tablist', { name: 'Client' });
		await expect.element(list).toHaveAttribute('aria-orientation', 'horizontal');
		await expect.element(screen.getByRole('tab')).toHaveLength(4);
		await expect.element(screen.getByRole('tab', { name: 'Services' })).toHaveAttribute('aria-selected', 'true');
		await expect.element(screen.getByRole('tab', { name: 'Overview' })).toHaveAttribute('aria-selected', 'false');
		await expect.element(screen.getByRole('tab', { name: 'Overview' })).toHaveAttribute('aria-controls', 'panel-overview');
		await expect.element(screen.getByRole('tab', { name: 'Documents' })).toBeDisabled();
	});

	test('renders the icon, the label and the badge of a tab', async () => {
		const screen = await render(TabSwitcher, { tabs });
		const services = screen.getByRole('tab', { name: 'Services' }).element();
		expect(services.querySelector('svg path')?.getAttribute('d')).toBe(mdiPlus);
		const history = screen.getByRole('tab', { name: 'History 12' }).element();
		expect(history.querySelector('.aurora-tab-switcher-badge')?.textContent).toBe('12');
	});

	test('forwards native attributes to the root and the class parts to their elements', async () => {
		const screen = await render(TabSwitcher, {
			tabs,
			selected: 'overview',
			id: 'sections',
			title: 'Sections',
			'data-testid': 'switcher',
			class: { container: 'app-root', tab: 'app-tab', selected: 'app-selected', indicator: 'app-indicator' }
		});
		const root = screen.getByTestId('switcher').element();
		expect(root.id).toBe('sections');
		expect(root.getAttribute('title')).toBe('Sections');
		expect(root.classList).toContain('aurora-tab-switcher');
		expect(root.classList).toContain('app-root');
		expect(root.querySelectorAll('.app-tab')).toHaveLength(4);
		expect(root.querySelector('.app-selected')?.textContent?.trim()).toBe('Overview');
		expect(root.querySelector('.aurora-tab-switcher-indicator')?.classList).toContain('app-indicator');
	});

	test('exposes the variant and the selected tab as data attributes', async () => {
		const screen = await render(TabSwitcher, { tabs, selected: 'history', variant: 'segmented' });
		const root = screen.container.querySelector('.aurora-tab-switcher')!;
		expect(root.getAttribute('data-variant')).toBe('segmented');
		await expect.element(screen.getByRole('tab', { name: 'History' })).toHaveAttribute('data-selected', '');
		await expect.element(screen.getByRole('tab', { name: 'Overview' })).not.toHaveAttribute('data-selected');
	});

	test('defaults to the underline variant', async () => {
		const screen = await render(TabSwitcher, { tabs });
		expect(screen.container.querySelector('.aurora-tab-switcher')?.getAttribute('data-variant')).toBe('underline');
	});

	test('mandatory selects the first enabled tab and writes it back', async () => {
		const state = bound();
		const disabledFirst = [{ name: 'a', label: 'A', disabled: true }, ...tabs];
		const screen = await render(TabSwitcher, withSelected({ tabs: disabledFirst }, state));
		await expect.element(screen.getByRole('tab', { name: 'Overview' })).toHaveAttribute('aria-selected', 'true');
		expect(state.selected).toBe('overview');
	});

	test('mandatory={false} leaves the tabs unselected, with the first enabled one in the Tab order', async () => {
		const screen = await render(TabSwitcher, { tabs, mandatory: false });
		for (const tab of screen.getByRole('tab').elements()) expect(tab.getAttribute('aria-selected')).toBe('false');
		await expect.element(screen.getByRole('tab', { name: 'Overview' })).toHaveAttribute('tabindex', '0');
		const root = screen.container.querySelector('.aurora-tab-switcher')!;
		expect(root.hasAttribute('data-indicator')).toBe(false);
	});

	test('mandatory picks the first tab when the tabs arrive later', async () => {
		const state = bound();
		let items = $state<Tab[]>([]);
		const screen = await render(
			TabSwitcher,
			withSelected(
				{
					get tabs() {
						return items;
					}
				},
				state
			)
		);
		items = [{ name: 'late', label: 'Late' }];
		await expect.element(screen.getByRole('tab', { name: 'Late' })).toHaveAttribute('aria-selected', 'true');
		expect(state.selected).toBe('late');
	});

	test('a click selects the tab and calls ontabClick with { tab, nativeEvent }', async () => {
		const state = bound('overview');
		const ontabClick = vi.fn((event: { tab: Tab }) => expect(state.selected).toBe(event.tab.name));
		const screen = await render(TabSwitcher, withSelected({ tabs, ontabClick }, state));
		await screen.getByRole('tab', { name: 'History' }).click();
		expect(state.selected).toBe('history');
		await expect.element(screen.getByRole('tab', { name: 'History' })).toHaveAttribute('aria-selected', 'true');
		expect(ontabClick).toHaveBeenCalledOnce();
		const argument = ontabClick.mock.calls[0][0] as unknown as { tab: Tab; nativeEvent: MouseEvent; detail?: unknown };
		expect(argument.tab).toEqual(tabs[2]);
		expect(argument.nativeEvent).toBeInstanceOf(MouseEvent);
		expect(argument.detail).toBeUndefined();
	});

	test('the selected prop drives the selection from outside', async () => {
		const state = bound('overview');
		const screen = await render(TabSwitcher, withSelected({ tabs }, state));
		state.selected = 'services';
		await expect.element(screen.getByRole('tab', { name: 'Services' })).toHaveAttribute('aria-selected', 'true');
		await expect.element(screen.getByRole('tab', { name: 'Overview' })).toHaveAttribute('aria-selected', 'false');
	});

	test('a disabled tab is neither selected nor reported', async () => {
		const ontabClick = vi.fn();
		const screen = await render(TabSwitcher, { tabs, selected: 'overview', ontabClick });
		await screen.getByRole('tab', { name: 'Documents' }).click({ force: true });
		expect(ontabClick).not.toHaveBeenCalled();
		await expect.element(screen.getByRole('tab', { name: 'Overview' })).toHaveAttribute('aria-selected', 'true');
	});

	test('only one tab is in the Tab order, the selected one', async () => {
		const screen = await render(TabSwitcher, { tabs, selected: 'history' });
		const order = screen.getByRole('tab').elements().map((tab) => tab.getAttribute('tabindex'));
		expect(order).toEqual(['-1', '-1', '0', '-1']);
		await userEvent.keyboard('{Tab}');
		await expect.element(screen.getByRole('tab', { name: 'History' })).toHaveFocus();
	});

	test('arrows move the focus, skip disabled tabs and wrap, without selecting', async () => {
		const ontabClick = vi.fn();
		const screen = await render(TabSwitcher, { tabs, selected: 'services', ontabClick });
		await userEvent.keyboard('{Tab}');
		await userEvent.keyboard('{ArrowRight}');
		await expect.element(screen.getByRole('tab', { name: 'History' })).toHaveFocus();
		await userEvent.keyboard('{ArrowRight}');
		await expect.element(screen.getByRole('tab', { name: 'Overview' })).toHaveFocus();
		await userEvent.keyboard('{ArrowLeft}');
		await expect.element(screen.getByRole('tab', { name: 'History' })).toHaveFocus();
		await expect.element(screen.getByRole('tab', { name: 'History' })).toHaveAttribute('tabindex', '0');
		await expect.element(screen.getByRole('tab', { name: 'Services' })).toHaveAttribute('aria-selected', 'true');
		expect(ontabClick).not.toHaveBeenCalled();
	});

	test('Home and End go to the first and last enabled tab', async () => {
		const screen = await render(TabSwitcher, { tabs, selected: 'services' });
		await userEvent.keyboard('{Tab}');
		await userEvent.keyboard('{End}');
		await expect.element(screen.getByRole('tab', { name: 'History' })).toHaveFocus();
		await userEvent.keyboard('{Home}');
		await expect.element(screen.getByRole('tab', { name: 'Overview' })).toHaveFocus();
	});

	test('Enter and Space select the focused tab and call ontabClick', async () => {
		const state = bound('overview');
		const ontabClick = vi.fn();
		const screen = await render(TabSwitcher, withSelected({ tabs, ontabClick }, state));
		await userEvent.keyboard('{Tab}');
		await userEvent.keyboard('{ArrowRight}');
		await userEvent.keyboard('{Enter}');
		expect(state.selected).toBe('services');
		await userEvent.keyboard('{ArrowRight}');
		await userEvent.keyboard(' ');
		expect(state.selected).toBe('history');
		expect(ontabClick).toHaveBeenCalledTimes(2);
		await expect.element(screen.getByRole('tab', { name: 'History' })).toHaveAttribute('aria-selected', 'true');
	});

	test('leaving the list and coming back focuses the selected tab', async () => {
		const container = document.createElement('div');
		const after = document.createElement('button');
		after.textContent = 'After';
		document.body.append(container, after);
		const screen = await render(TabSwitcher, { target: container, props: { tabs, selected: 'services' } });
		await userEvent.keyboard('{Tab}');
		await userEvent.keyboard('{ArrowRight}');
		await userEvent.keyboard('{Tab}');
		expect(document.activeElement).toBe(after);
		await userEvent.keyboard('{Shift>}{Tab}{/Shift}');
		await expect.element(screen.getByRole('tab', { name: 'Services' })).toHaveFocus();
		after.remove();
	});

	test('in a right-to-left page ArrowLeft goes to the next tab', async () => {
		const container = document.createElement('div');
		container.dir = 'rtl';
		document.body.append(container);
		const screen = await render(TabSwitcher, { target: container, props: { tabs, selected: 'overview' } });
		await userEvent.keyboard('{Tab}');
		await userEvent.keyboard('{ArrowLeft}');
		await expect.element(screen.getByRole('tab', { name: 'Services' })).toHaveFocus();
	});

	test('keyboard focus shows a focus ring', async () => {
		const screen = await render(TabSwitcher, { tabs, selected: 'overview' });
		await userEvent.keyboard('{Tab}');
		const tab = screen.getByRole('tab', { name: 'Overview' }).element();
		expect(getComputedStyle(tab).outlineStyle).toBe('solid');
		expect(parseFloat(getComputedStyle(tab).outlineWidth)).toBeGreaterThan(0);
	});

	test('the indicator sits under the selected tab and follows it', async () => {
		const state = bound('overview');
		const screen = await render(TabSwitcher, withSelected({ tabs }, state));
		const root = screen.container.querySelector('.aurora-tab-switcher')!;
		const indicator = root.querySelector('.aurora-tab-switcher-indicator')!;
		await expect.poll(() => root.hasAttribute('data-indicator')).toBe(true);
		await screen.getByRole('tab', { name: 'History' }).click();
		const history = screen.getByRole('tab', { name: 'History' }).element();
		await expect.poll(() => rect(indicator).left).toBe(rect(history).left);
		await expect.poll(() => rect(indicator).right).toBe(rect(history).right);
		expect(Math.round(rect(indicator).bottom)).toBe(Math.round(rect(history).bottom));
	});

	test('the segmented indicator covers the whole selected tab', async () => {
		const screen = await render(TabSwitcher, { tabs, selected: 'services', variant: 'segmented' });
		const root = screen.container.querySelector('.aurora-tab-switcher')!;
		const indicator = root.querySelector('.aurora-tab-switcher-indicator')!;
		const services = screen.getByRole('tab', { name: 'Services' }).element();
		await expect.poll(() => rect(indicator)).toEqual(rect(services));
	});

	test('the selected tab is scrolled into view when the tabs overflow', async () => {
		const container = document.createElement('div');
		container.style.width = '200px';
		document.body.append(container);
		const many = Array.from({ length: 12 }, (_, index) => ({ name: `t${index}`, label: `Month ${index}` }));
		const screen = await render(TabSwitcher, { target: container, props: { tabs: many, selected: 't11' } });
		const list = screen.getByRole('tablist').element();
		const last = screen.getByRole('tab', { name: 'Month 11' }).element();
		await expect.poll(() => list.scrollLeft).toBeGreaterThan(0);
		await expect.poll(() => rect(last).right <= rect(list).right).toBe(true);
	});

	test('tabSnippet replaces the content of every tab and receives the selected state', async () => {
		const tabSnippet = createRawSnippet((params: () => { tab: Tab; selected: boolean }) => ({
			render: () => `<span class="custom">${params().tab.label}${params().selected ? ' ✓' : ''}</span>`
		}));
		const screen = await render(TabSwitcher, { tabs, selected: 'services', tabSnippet });
		await expect.element(screen.getByRole('tab', { name: 'Services ✓' })).toBeInTheDocument();
		await expect.element(screen.getByRole('tab', { name: 'Overview' })).toBeInTheDocument();
		expect(screen.container.querySelector('.aurora-tab-switcher-badge')).toBeNull();
	});

	test('appendSnippet sits after the tabs, outside the tab list', async () => {
		const screen = await render(TabSwitcher, { tabs, appendSnippet: text('Add') });
		const append = screen.getByText('Add').element();
		expect(screen.getByRole('tablist').element().contains(append)).toBe(false);
		expect(append.closest('.aurora-tab-switcher-append')).not.toBeNull();
	});

	test('instance CSS variables style the tabs', async () => {
		const screen = await render(TabSwitcher, {
			tabs,
			selected: 'overview',
			style: '--tab-switcher-selected-color: rgb(1, 2, 3); --tab-switcher-color: rgb(4, 5, 6); --tab-switcher-gap: 40px'
		});
		const overview = screen.getByRole('tab', { name: 'Overview' }).element();
		expect(getComputedStyle(overview).color).toBe('rgb(1, 2, 3)');
		expect(getComputedStyle(screen.getByRole('tab', { name: 'Services' }).element()).color).toBe('rgb(4, 5, 6)');
		expect(getComputedStyle(screen.getByRole('tablist').element()).columnGap).toBe('40px');
	});

	describe('with href', () => {
		const links: Tab[] = [
			{ name: 'general', label: 'General', href: '#general' },
			{ name: 'permissions', label: 'Permissions', href: '#permissions' },
			{ name: 'billing', label: 'Billing', href: '#billing', disabled: true }
		];

		test('renders a nav of links with aria-current on the selected one', async () => {
			const screen = await render(TabSwitcher, { tabs: links, selected: 'permissions', 'aria-label': 'Settings' });
			await expect.element(screen.getByRole('navigation', { name: 'Settings' })).toBeInTheDocument();
			expect(screen.container.querySelector('[role="tablist"], [role="tab"]')).toBeNull();
			await expect.element(screen.getByRole('link', { name: 'General' })).toHaveAttribute('href', '#general');
			await expect.element(screen.getByRole('link', { name: 'Permissions' })).toHaveAttribute('aria-current', 'page');
			await expect.element(screen.getByRole('link', { name: 'General' })).not.toHaveAttribute('aria-current');
		});

		test('a disabled link has no href and is marked aria-disabled', async () => {
			const screen = await render(TabSwitcher, { tabs: links });
			const billing = screen.getByRole('link', { name: 'Billing' });
			await expect.element(billing).not.toHaveAttribute('href');
			await expect.element(billing).toHaveAttribute('aria-disabled', 'true');
		});

		test('every link is in the Tab order', async () => {
			const screen = await render(TabSwitcher, { tabs: links, selected: 'general' });
			await userEvent.keyboard('{Tab}');
			await expect.element(screen.getByRole('link', { name: 'General' })).toHaveFocus();
			await userEvent.keyboard('{Tab}');
			await expect.element(screen.getByRole('link', { name: 'Permissions' })).toHaveFocus();
		});

		test('a click selects the link, a modified click (new browser tab) does not', async () => {
			const state = bound('general');
			const ontabClick = vi.fn();
			const screen = await render(TabSwitcher, withSelected({ tabs: links, ontabClick }, state));
			const permissions = screen.getByRole('link', { name: 'Permissions' }).element();
			const modified = new MouseEvent('click', { bubbles: true, cancelable: true, ctrlKey: true });
			modified.preventDefault();
			permissions.dispatchEvent(modified);
			expect(state.selected).toBe('general');
			expect(ontabClick).not.toHaveBeenCalled();
			await screen.getByRole('link', { name: 'Permissions' }).click();
			expect(state.selected).toBe('permissions');
			expect(ontabClick).toHaveBeenCalledOnce();
		});
	});

	test('v4 bug: the first tab is selected in the first render, not after mount', () => {
		const target = document.createElement('div');
		document.body.append(target);
		const component = mount(TabSwitcher, { target, props: { tabs } });
		expect(target.querySelector('[aria-selected="true"]')?.textContent?.trim()).toBe('Overview');
		flushSync();
		unmount(component);
		target.remove();
	});

	test('v4 bug: tabs have ARIA roles and the keyboard works', async () => {
		const screen = await render(TabSwitcher, { tabs, selected: 'overview' });
		await expect.element(screen.getByRole('tablist')).toBeInTheDocument();
		await userEvent.keyboard('{Tab}');
		await userEvent.keyboard('{ArrowRight}');
		await expect.element(screen.getByRole('tab', { name: 'Services' })).toHaveFocus();
	});
});

function withSelected<T extends object>(props: T, state: { selected: string | undefined }) {
	return Object.defineProperty(props, 'selected', {
		enumerable: true,
		configurable: true,
		get: () => state.selected,
		set: (value: string | undefined) => (state.selected = value)
	}) as T & { selected?: string };
}
