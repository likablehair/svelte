import { mdiCloseCircle, mdiTagOutline } from '@mdi/js';
import { createRawSnippet } from 'svelte';
import { describe, expect, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import Chip from '#lib/components/simple/navigation/Chip.svelte';
import ToggleExample from '../../src/docs/examples/chip/02-toggle.svelte';
import { snippet, text } from '../helpers.js';

const CLOSE_PATH =
	'M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z';

const root = (container: HTMLElement) => container.querySelector<HTMLElement>('.aurora-chip')!;

describe('Chip', () => {
	test('defaults to a neutral md chip with the text in a span', async () => {
		const screen = await render(Chip, { children: text('Paid') });
		const chip = root(screen.container);
		expect(chip.tagName).toBe('SPAN');
		expect(chip.dataset.variant).toBe('neutral');
		expect(chip.dataset.size).toBe('md');
		expect(chip.hasAttribute('data-selected')).toBe(false);
		expect(chip.hasAttribute('data-disabled')).toBe(false);
		expect(chip.querySelector('.aurora-chip-text')?.textContent).toBe('Paid');
	});

	test('forwards native attributes and class to the root span', async () => {
		const screen = await render(Chip, {
			children: text('VIP'),
			id: 'vip',
			title: 'Very important',
			'data-testid': 'chip',
			class: 'app-class'
		});
		const chip = screen.getByTestId('chip');
		await expect.element(chip).toHaveAttribute('id', 'vip');
		await expect.element(chip).toHaveAttribute('title', 'Very important');
		await expect.element(chip).toHaveClass('aurora-chip', 'app-class');
	});

	test('exposes variant, size, selected and disabled as data attributes', async () => {
		const screen = await render(Chip, {
			children: text('Pro'),
			variant: 'error',
			size: 'sm',
			selected: true,
			disabled: true
		});
		const chip = root(screen.container);
		expect(chip.dataset.variant).toBe('error');
		expect(chip.dataset.size).toBe('sm');
		expect(chip.dataset.selected).toBe('true');
		expect(chip.dataset.disabled).toBe('true');
	});

	test('v4 bug: a chip without onclick is not a button and not a tab stop', async () => {
		const screen = await render(Chip, { children: text('Tag'), closable: false });
		await expect.element(screen.getByRole('button')).not.toBeInTheDocument();
		expect(screen.container.querySelector('[role="button"], [tabindex]')).toBeNull();
		await userEvent.keyboard('{Tab}');
		expect(screen.container.contains(document.activeElement)).toBe(false);
	});

	test('onclick makes the content a native button and receives the MouseEvent', async () => {
		const onclick = vi.fn();
		const screen = await render(Chip, { children: text('Cut'), onclick });
		const button = screen.getByRole('button', { name: 'Cut' });
		await expect.element(button).toHaveAttribute('type', 'button');
		await expect.element(button).toHaveClass('aurora-chip-main');
		expect(root(screen.container)).toHaveClass('aurora-chip-clickable');
		await button.click();
		expect(onclick).toHaveBeenCalledOnce();
		const event = onclick.mock.calls[0][0];
		expect(event).toBeInstanceOf(MouseEvent);
		expect(event.detail).toBeTypeOf('number');
	});

	test('v4 bug: a clickable chip is a native tab stop; Enter and Space click it once', async () => {
		const onclick = vi.fn();
		const screen = await render(Chip, { children: text('Cut'), onclick });
		await userEvent.keyboard('{Tab}');
		await expect.element(screen.getByRole('button', { name: 'Cut' })).toHaveFocus();
		await userEvent.keyboard('{Enter}');
		expect(onclick).toHaveBeenCalledTimes(1);
		await userEvent.keyboard(' ');
		expect(onclick).toHaveBeenCalledTimes(2);
		expect(onclick.mock.calls.every(([event]) => event.isTrusted)).toBe(true);
	});

	test('selected with onclick is a toggle with aria-pressed', async () => {
		const screen = await render(Chip, {
			children: text('Color'),
			selected: false,
			onclick: () => {}
		});
		const button = screen.getByRole('button', { name: 'Color' });
		await expect.element(button).toHaveAttribute('aria-pressed', 'false');
		await screen.rerender({ selected: true });
		await expect.element(button).toHaveAttribute('aria-pressed', 'true');
		expect(root(screen.container).dataset.selected).toBe('true');
	});

	test('without onclick, selected only changes the look', async () => {
		const screen = await render(Chip, { children: text('Color'), selected: true });
		expect(root(screen.container).dataset.selected).toBe('true');
		expect(screen.container.querySelector('[aria-pressed]')).toBeNull();
	});

	test('toggle chips switch with the mouse and with Space (docs example)', async () => {
		const screen = await render(ToggleExample);
		const cut = screen.getByRole('button', { name: 'Cut' });
		const color = screen.getByRole('button', { name: 'Color' });
		await expect.element(cut).toHaveAttribute('aria-pressed', 'false');
		await expect.element(color).toHaveAttribute('aria-pressed', 'true');
		await color.click();
		await expect.element(color).toHaveAttribute('aria-pressed', 'false');
		await userEvent.keyboard('{Shift>}{Tab}{/Shift}');
		await expect.element(cut).toHaveFocus();
		await userEvent.keyboard(' ');
		await expect.element(cut).toHaveAttribute('aria-pressed', 'true');
		await expect.element(screen.getByText('Selected: Cut')).toBeInTheDocument();
	});

	test('closable adds a named close button that calls onclose with the MouseEvent', async () => {
		const onclick = vi.fn();
		const onclose = vi.fn();
		const screen = await render(Chip, {
			children: text('Balayage'),
			closable: true,
			closeLabel: 'Remove Balayage',
			onclick,
			onclose
		});
		const close = screen.getByRole('button', { name: 'Remove Balayage' });
		await expect.element(close).toHaveAttribute('type', 'button');
		await close.click();
		expect(onclose).toHaveBeenCalledOnce();
		expect(onclose.mock.calls[0][0]).toBeInstanceOf(MouseEvent);
		expect(onclick).not.toHaveBeenCalled();
	});

	test('the close button defaults to "Remove" with the MDI close icon', async () => {
		const screen = await render(Chip, { children: text('Tag'), closable: true });
		const close = screen.getByRole('button', { name: 'Remove' });
		expect(close.element().querySelector('svg path')?.getAttribute('d')).toBe(CLOSE_PATH);
	});

	test('v4 bug: the close button is a sibling of the chip button, not nested in it', async () => {
		const screen = await render(Chip, {
			children: text('Tag'),
			closable: true,
			onclick: () => {}
		});
		const close = screen.getByRole('button', { name: 'Remove' }).element();
		const main = screen.getByRole('button', { name: 'Tag' }).element();
		expect(main.contains(close)).toBe(false);
		expect(close.closest('.aurora-chip-end')?.parentElement).toBe(main.parentElement);
	});

	test('the close click bubbles (v4 stopped it)', async () => {
		const outer = vi.fn();
		const target = document.createElement('div');
		target.addEventListener('click', outer);
		document.body.append(target);
		const screen = await render(Chip, {
			target,
			props: { children: text('Tag'), closable: true, onclose: () => {} }
		});
		await screen.getByRole('button', { name: 'Remove' }).click();
		expect(outer).toHaveBeenCalledOnce();
		target.remove();
	});

	test('disabled disables both buttons and fires no callbacks', async () => {
		const onclick = vi.fn();
		const onclose = vi.fn();
		const screen = await render(Chip, {
			children: text('Tag'),
			disabled: true,
			closable: true,
			onclick,
			onclose
		});
		const main = screen.getByRole('button', { name: 'Tag' });
		const close = screen.getByRole('button', { name: 'Remove' });
		await expect.element(main).toBeDisabled();
		await expect.element(close).toBeDisabled();
		await main.click({ force: true });
		await close.click({ force: true });
		expect(onclick).not.toHaveBeenCalled();
		expect(onclose).not.toHaveBeenCalled();
	});

	test('tabindex reaches both buttons: -1 keeps them out of the tab order', async () => {
		const screen = await render(Chip, {
			children: text('Tag'),
			tabindex: -1,
			closable: true,
			onclick: () => {}
		});
		await expect
			.element(screen.getByRole('button', { name: 'Tag' }))
			.toHaveAttribute('tabindex', '-1');
		await expect
			.element(screen.getByRole('button', { name: 'Remove' }))
			.toHaveAttribute('tabindex', '-1');
		await userEvent.keyboard('{Tab}');
		expect(screen.container.contains(document.activeElement)).toBe(false);
	});

	test('prependIcon and closeIcon take SVG paths; prependSnippet replaces the icon', async () => {
		const icons = await render(Chip, {
			children: text('Tag'),
			prependIcon: mdiTagOutline,
			closable: true,
			closeIcon: mdiCloseCircle
		});
		const main = icons.container.querySelector('.aurora-chip-main')!;
		expect(main.querySelector('svg path')?.getAttribute('d')).toBe(mdiTagOutline);
		const close = icons.getByRole('button', { name: 'Remove' }).element();
		expect(close.querySelector('svg path')?.getAttribute('d')).toBe(mdiCloseCircle);
		icons.unmount();

		const custom = await render(Chip, {
			children: text('Online'),
			prependIcon: mdiTagOutline,
			prependSnippet: snippet('<i data-testid="dot"></i>')
		});
		await expect.element(custom.getByTestId('dot')).toBeInTheDocument();
		expect(custom.container.querySelector('svg')).toBeNull();
	});

	test('closeSnippet replaces the close button and gets close and closeLabel', async () => {
		const onclose = vi.fn();
		type Params = { close: (event: MouseEvent) => void; closeLabel: string };
		const closeSnippet = createRawSnippet<[Params]>((params) => ({
			render: () => `<button type="button">${params().closeLabel}</button>`,
			setup: (node) => {
				node.addEventListener('click', (event) => params().close(event as MouseEvent));
			}
		}));
		const screen = await render(Chip, {
			children: text('Tag'),
			closeLabel: 'Delete tag',
			closeSnippet,
			onclose
		});
		await screen.getByRole('button', { name: 'Delete tag' }).click();
		expect(onclose).toHaveBeenCalledOnce();
		expect(screen.container.querySelector('.aurora-chip-close')).toBeNull();
	});

	test('binds the root element', async () => {
		let element: HTMLSpanElement | undefined;
		await render(Chip, {
			children: text('Tag'),
			get chipElement() {
				return element as HTMLSpanElement;
			},
			set chipElement(value) {
				element = value;
			}
		});
		expect(element).toBeInstanceOf(HTMLSpanElement);
		expect(element).toHaveClass('aurora-chip');
	});

	test('cuts long text with an ellipsis past --chip-max-width', async () => {
		const screen = await render(Chip, {
			children: text('Keratin treatment with deep conditioning mask'),
			style: '--chip-max-width: 80px'
		});
		const chip = root(screen.container);
		const label = chip.querySelector<HTMLElement>('.aurora-chip-text')!;
		expect(chip.getBoundingClientRect().width).toBeLessThanOrEqual(80);
		expect(label.scrollWidth).toBeGreaterThan(label.clientWidth);
		expect(getComputedStyle(label).textOverflow).toBe('ellipsis');
	});

	test('instance CSS variables override the defaults', async () => {
		const screen = await render(Chip, {
			children: text('Tag'),
			style: '--chip-background: rgb(1, 2, 3); --chip-color: rgb(4, 5, 6); --chip-height: 40px'
		});
		const style = getComputedStyle(root(screen.container));
		expect(style.backgroundColor).toBe('rgb(1, 2, 3)');
		expect(style.color).toBe('rgb(4, 5, 6)');
		expect(style.height).toBe('40px');
	});

	test('--chip-selected-* variables apply only to selected chips', async () => {
		const style = '--chip-selected-background: rgb(1, 2, 3); --chip-selected-color: rgb(4, 5, 6)';
		const screen = await render(Chip, { children: text('Tag'), style });
		const chip = root(screen.container);
		expect(getComputedStyle(chip).backgroundColor).not.toBe('rgb(1, 2, 3)');
		await screen.rerender({ selected: true });
		await expect.poll(() => getComputedStyle(chip).backgroundColor).toBe('rgb(1, 2, 3)');
		expect(getComputedStyle(chip).color).toBe('rgb(4, 5, 6)');
	});

	test('--chip-selected-* wins over --chip-background and --chip-color', async () => {
		const screen = await render(Chip, {
			children: text('Tag'),
			selected: true,
			onclick: () => {},
			style:
				'--chip-background: rgb(1, 2, 3); --chip-color: rgb(4, 5, 6);' +
				' --chip-selected-background: rgb(7, 8, 9); --chip-selected-color: rgb(10, 11, 12)'
		});
		const style = getComputedStyle(root(screen.container));
		expect(style.backgroundColor).toBe('rgb(7, 8, 9)');
		expect(style.color).toBe('rgb(10, 11, 12)');
	});
});
