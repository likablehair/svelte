import { describe, expect, test, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import Tooltip from '#lib/components/simple/common/Tooltip.svelte';
import SpreadAttributes from '../fixtures/tooltip/SpreadAttributes.svelte';
import TooltipHarness from '../fixtures/tooltip/TooltipHarness.svelte';
import TooltipInMenu from '../fixtures/tooltip/TooltipInMenu.svelte';
import { snippet, text } from '../helpers.js';

const instant = '--tooltip-duration: 0s';
const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function setup(props: Record<string, unknown> = {}) {
	const label = (props.label as string | undefined) ?? 'Save';
	const screen = await render(TooltipHarness, {
		props: { text: 'Save the draft', style: instant, ...props }
	});
	const activator = screen.getByRole('button', { name: label, exact: true });
	const element = screen.container.querySelector<HTMLElement>('.aurora-tooltip')!;
	const isOpen = () => element.matches(':popover-open');
	return { screen, activator, element, tooltip: page.elementLocator(element), isOpen };
}

function near(actual: number, expected: number) {
	expect(Math.abs(actual - expected)).toBeLessThanOrEqual(1);
}

describe('Tooltip', () => {
	test('is always in the DOM: a hidden role="tooltip" popover that describes the activator', async () => {
		const { activator, element, tooltip, isOpen } = await setup();
		await expect.element(tooltip).toHaveAttribute('role', 'tooltip');
		await expect.element(tooltip).toHaveAttribute('popover', 'manual');
		await expect.element(tooltip).toHaveClass('aurora-tooltip');
		await expect.element(tooltip).toHaveAttribute('data-variant', 'plain');
		expect(isOpen()).toBe(false);
		expect(getComputedStyle(element).display).toBe('none');
		await expect.element(activator).toHaveAttribute('aria-describedby', element.id);
		await expect.element(activator).toHaveAccessibleDescription('Save the draft');
	});

	test('adds its id to the existing aria-describedby and removes only its own on unmount', async () => {
		const button = document.createElement('button');
		button.textContent = 'Share';
		button.setAttribute('aria-describedby', 'hint');
		document.body.append(button);
		const screen = await render(Tooltip, {
			activator: button,
			text: 'Share the link',
			id: 'share-tip'
		});
		expect(button.getAttribute('aria-describedby')).toBe('hint share-tip');
		await screen.unmount();
		expect(button.getAttribute('aria-describedby')).toBe('hint');
		button.remove();
	});

	test('opens on hover only after appearTimeout', async () => {
		await pause(350);
		const { activator, isOpen } = await setup({ appearTimeout: 300 });
		const start = performance.now();
		await activator.hover();
		expect(isOpen()).toBe(false);
		await expect.poll(isOpen).toBe(true);
		expect(performance.now() - start).toBeGreaterThanOrEqual(300);
	});

	test('opens right away on keyboard focus and closes when the focus leaves', async () => {
		const { screen, activator, isOpen } = await setup({ appearTimeout: 5000 });
		await userEvent.keyboard('{Tab}');
		await expect.element(activator).toHaveFocus();
		await expect.poll(isOpen).toBe(true);
		await userEvent.keyboard('{Tab}');
		await expect.element(screen.getByRole('button', { name: 'After Save' })).toHaveFocus();
		await expect.poll(isOpen).toBe(false);
	});

	test('closes on Escape, keeping the focus on the activator', async () => {
		const { activator, isOpen } = await setup({ appearTimeout: 5000 });
		await userEvent.keyboard('{Tab}');
		await expect.poll(isOpen).toBe(true);
		await userEvent.keyboard('{Escape}');
		await expect.poll(isOpen).toBe(false);
		await expect.element(activator).toHaveFocus();
	});

	test('a click on the activator closes it', async () => {
		const { activator, isOpen } = await setup({ appearTimeout: 0 });
		await activator.hover();
		await expect.poll(isOpen).toBe(true);
		await activator.click();
		await expect.poll(isOpen).toBe(false);
		await pause(150);
		expect(isOpen()).toBe(false);
	});

	test('stays open while the pointer moves onto it and closes when the pointer leaves both', async () => {
		const { screen, activator, tooltip, isOpen } = await setup({ appearTimeout: 0 });
		await activator.hover();
		await expect.poll(isOpen).toBe(true);
		await tooltip.hover();
		await pause(250);
		expect(isOpen()).toBe(true);
		await screen.getByRole('button', { name: 'After Save' }).hover();
		await expect.poll(isOpen).toBe(false);
	});

	test('right after one tooltip closes, hovering another activator opens it without delay', async () => {
		const first = await setup({ appearTimeout: 5000 });
		const second = await setup({ label: 'Copy', text: 'Copy the link', appearTimeout: 5000 });
		await userEvent.keyboard('{Tab}');
		await expect.poll(first.isOpen).toBe(true);
		vi.useFakeTimers({ toFake: ['Date'] });
		try {
			await userEvent.keyboard('{Escape}');
			await expect.poll(first.isOpen).toBe(false);
			await second.activator.hover();
			await expect.poll(second.isOpen, { timeout: 2000 }).toBe(true);
		} finally {
			vi.useRealTimers();
		}
	});

	test('renders text, title, children and titleSnippet, with data-variant', async () => {
		const rich = await setup({ variant: 'rich', title: 'Fidelity', text: 'Based on visits' });
		await expect.element(rich.tooltip).toHaveAttribute('data-variant', 'rich');
		expect(rich.element.querySelector('.aurora-tooltip-title')?.textContent).toBe('Fidelity');
		expect(rich.element.querySelector('.aurora-tooltip-text')?.textContent).toBe('Based on visits');
		await expect.element(rich.activator).toHaveAccessibleDescription('Fidelity Based on visits');

		const custom = await setup({
			label: 'Copy',
			children: text('Copy link'),
			titleSnippet: snippet('<strong>Shortcut</strong>')
		});
		expect(custom.element.querySelector('.aurora-tooltip-title strong')?.textContent).toBe(
			'Shortcut'
		);
		expect(custom.element.querySelector('.aurora-tooltip-text')?.textContent).toBe('Copy link');
		expect(custom.element.textContent).not.toContain('Save the draft');
	});

	test('defaults to the top side and flips below when there is no room above', async () => {
		const above = await setup({ open: true });
		await expect.element(above.tooltip).toHaveAttribute('data-side', 'top');
		const a = above.activator.element().getBoundingClientRect();
		const t = above.element.getBoundingClientRect();
		near(t.bottom, a.top - 10);
		near(t.left + t.width / 2, a.left + a.width / 2);
		await above.screen.unmount();

		const flipped = await setup({ open: true, wrapperStyle: 'padding: 0 300px' });
		await expect.element(flipped.tooltip).toHaveAttribute('data-side', 'bottom');
	});

	test('placement and offset pick the side and the distance', async () => {
		const { activator, element, tooltip } = await setup({
			open: true,
			placement: 'right',
			offset: 20
		});
		await expect.element(tooltip).toHaveAttribute('data-side', 'right');
		const a = activator.element().getBoundingClientRect();
		const t = element.getBoundingClientRect();
		near(t.left, a.right + 20);
		near(t.top + t.height / 2, a.top + a.height / 2);
	});

	test('bind:open opens it from code and reports when it closes itself', async () => {
		const { screen, isOpen } = await setup({ appearTimeout: 5000 });
		const state = screen.getByTestId('state-Save');
		await screen.getByRole('button', { name: 'Show Save tip' }).click();
		await expect.poll(isOpen).toBe(true);
		await expect.element(state).toHaveTextContent('open');
		await userEvent.keyboard('{Escape}');
		await expect.poll(isOpen).toBe(false);
		await expect.element(state).toHaveTextContent('closed');
	});

	test('still opens after a spread attributes object is replaced', async () => {
		const screen = await render(SpreadAttributes);
		const element = screen.container.querySelector<HTMLElement>('.aurora-tooltip')!;
		await screen.getByRole('button', { name: 'Change text' }).click();
		await expect.poll(() => element.textContent?.trim()).toBe('Second text');
		await screen.getByRole('button', { name: 'Show tip' }).click();
		await expect.poll(() => element.matches(':popover-open')).toBe(true);
	});

	test('does not close the menu it is in; Escape closes the tooltip first, then the menu', async () => {
		const screen = await render(TooltipInMenu);
		await screen.getByRole('button', { name: 'Options' }).click();
		const menu = screen.getByRole('menu', { name: 'Options menu' });
		const item = screen.getByRole('menuitem', { name: 'Archive' });
		await expect.element(menu).toBeVisible();
		const tooltip = screen.container.querySelector<HTMLElement>('.aurora-tooltip')!;
		await item.hover();
		await expect.poll(() => tooltip.matches(':popover-open')).toBe(true);
		await expect.element(menu).toBeVisible();

		await userEvent.keyboard('{Escape}');
		await expect.poll(() => tooltip.matches(':popover-open')).toBe(false);
		await expect.element(menu).toBeVisible();
		await userEvent.keyboard('{Escape}');
		await expect.element(menu).not.toBeInTheDocument();
	});

	test('class, native attributes and instance CSS variables reach the tooltip element', async () => {
		const button = document.createElement('button');
		button.textContent = 'Save';
		document.body.append(button);
		let bound: HTMLDivElement | undefined;
		await render(Tooltip, {
			activator: button,
			text: 'Save the draft',
			class: 'app-tip',
			id: 'save-tip',
			'data-kind': 'hint',
			style: `${instant}; --tooltip-background: rgb(1, 2, 3); --tooltip-max-width: 120px`,
			get tooltipElement() {
				return bound;
			},
			set tooltipElement(value) {
				bound = value;
			}
		});
		const element = document.getElementById('save-tip')!;
		expect(bound).toBe(element);
		const tooltip = page.elementLocator(element);
		await expect.element(tooltip).toHaveClass('aurora-tooltip', 'app-tip');
		await expect.element(tooltip).toHaveAttribute('data-kind', 'hint');
		expect(button.getAttribute('aria-describedby')).toBe('save-tip');
		const style = getComputedStyle(element);
		expect(style.backgroundColor).toBe('rgb(1, 2, 3)');
		expect(style.maxWidth).toBe('120px');
		button.remove();
	});
});
