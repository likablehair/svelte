import { mdiFormatBold } from '@mdi/js';
import { createRawSnippet } from 'svelte';
import { describe, expect, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import ActivableButton from '#lib/components/composed/buttons/ActivableButton.svelte';
import Toolbar from '../../src/docs/examples/activable-button/02-toolbar.svelte';
import { snippet, text } from '../helpers.js';

const dotOf = (button: Element) => button.querySelector('.aurora-activable-button-dot');

describe('ActivableButton', () => {
	test('renders a secondary Button, off by default, with native attributes and class', async () => {
		const screen = await render(ActivableButton, {
			children: text('Favorites'),
			id: 'favorites',
			title: 'Only favorites',
			'aria-describedby': 'hint',
			class: 'app-class'
		});
		const button = screen.getByRole('button', { name: 'Favorites' });
		await expect.element(button).toHaveAttribute('aria-pressed', 'false');
		await expect.element(button).not.toHaveAttribute('data-active');
		await expect.element(button).toHaveAttribute('data-variant', 'secondary');
		await expect.element(button).toHaveAttribute('type', 'button');
		await expect.element(button).toHaveAttribute('id', 'favorites');
		await expect.element(button).toHaveAttribute('title', 'Only favorites');
		await expect.element(button).toHaveAttribute('aria-describedby', 'hint');
		await expect
			.element(button)
			.toHaveClass('aurora-button', 'aurora-activable-button', 'app-class');
	});

	test('v4 bug: announces its state with aria-pressed and data-active', async () => {
		const screen = await render(ActivableButton, { children: text('Favorites'), active: true });
		const button = screen.getByRole('button', { name: 'Favorites', pressed: true });
		await expect.element(button).toHaveAttribute('aria-pressed', 'true');
		await expect.element(button).toHaveAttribute('data-active', 'true');
	});

	test('a click flips active first, then calls onclick with the native MouseEvent', async () => {
		let active = $state(false);
		const seen: boolean[] = [];
		const onclick = vi.fn<(event: MouseEvent) => void>(() => {
			seen.push(active);
		});
		const screen = await render(ActivableButton, {
			children: text('Favorites'),
			onclick,
			get active() {
				return active;
			},
			set active(value) {
				active = value;
			}
		});
		const button = screen.getByRole('button', { name: 'Favorites' });
		await button.click();
		expect(onclick).toHaveBeenCalledOnce();
		expect(onclick.mock.calls[0][0]).toBeInstanceOf(MouseEvent);
		expect(seen).toEqual([true]);
		await expect.element(button).toHaveAttribute('aria-pressed', 'true');
		await button.click();
		expect(active).toBe(false);
		await expect.element(button).toHaveAttribute('aria-pressed', 'false');
	});

	test('bind:active follows changes made outside', async () => {
		let active = $state(false);
		const screen = await render(ActivableButton, {
			children: text('Favorites'),
			get active() {
				return active;
			},
			set active(value) {
				active = value;
			}
		});
		const button = screen.getByRole('button', { name: 'Favorites' });
		active = true;
		await expect.element(button).toHaveAttribute('aria-pressed', 'true');
		active = false;
		await expect.element(button).toHaveAttribute('aria-pressed', 'false');
	});

	test('without bind:, it is driven from outside by the value the app sets in onclick', async () => {
		let bold = $state(true);
		const screen = await render(ActivableButton, {
			icon: mdiFormatBold,
			'aria-label': 'Bold',
			get active() {
				return bold;
			},
			onclick: () => (bold = !bold)
		});
		const button = screen.getByRole('button', { name: 'Bold' });
		await expect.element(button).toHaveAttribute('aria-pressed', 'true');
		await button.click();
		expect(bold).toBe(false);
		await expect.element(button).toHaveAttribute('aria-pressed', 'false');
		bold = true;
		await expect.element(button).toHaveAttribute('aria-pressed', 'true');
	});

	test('the toolbar example keeps the buttons and the formatting in sync', async () => {
		const screen = await render(Toolbar);
		const italic = screen.getByRole('button', { name: 'Italic' });
		const sample = screen.getByText('Sample text');
		await expect.element(italic).toHaveAttribute('aria-pressed', 'false');
		await italic.click();
		await expect.element(italic).toHaveAttribute('aria-pressed', 'true');
		await expect.element(sample).toHaveClass('italic');
		await italic.click();
		await expect.element(italic).toHaveAttribute('aria-pressed', 'false');
		await expect.element(sample).not.toHaveClass('italic');
	});

	test('is reachable with Tab and toggled with Space and Enter', async () => {
		const onclick = vi.fn();
		const screen = await render(ActivableButton, { children: text('Favorites'), onclick });
		const button = screen.getByRole('button', { name: 'Favorites' });
		await userEvent.keyboard('{Tab}');
		await expect.element(button).toHaveFocus();
		await userEvent.keyboard(' ');
		await expect.element(button).toHaveAttribute('aria-pressed', 'true');
		await userEvent.keyboard('{Enter}');
		await expect.element(button).toHaveAttribute('aria-pressed', 'false');
		expect(onclick).toHaveBeenCalledTimes(2);
	});

	test('v4 bug: Button props go directly on the component instead of buttonProps', async () => {
		const onclick = vi.fn();
		const screen = await render(ActivableButton, {
			children: text('Favorites'),
			size: 'sm',
			disabled: true,
			onclick
		});
		const button = screen.getByRole('button', { name: 'Favorites' });
		await expect.element(button).toHaveAttribute('data-size', 'sm');
		await expect.element(button).toBeDisabled();
		await button.click({ force: true });
		expect(onclick).not.toHaveBeenCalled();
		await expect.element(button).toHaveAttribute('aria-pressed', 'false');

		await screen.rerender({ disabled: false, loading: true });
		await expect.element(button).toHaveAttribute('aria-busy', 'true');
		await expect.element(button).toBeDisabled();
	});

	test('shows the state dot on buttons with text and no icon; dot={false} hides it', async () => {
		const withDot = await render(ActivableButton, { children: text('With dot') });
		const dot = dotOf(withDot.getByRole('button', { name: 'With dot' }).element());
		expect(dot).not.toBeNull();
		expect(dot?.getAttribute('aria-hidden')).toBe('true');

		const noDot = await render(ActivableButton, { children: text('No dot'), dot: false });
		expect(dotOf(noDot.getByRole('button', { name: 'No dot' }).element())).toBeNull();
	});

	test('icon or iconSnippet replace the dot; an icon-only button is named by aria-label', async () => {
		const withIcon = await render(ActivableButton, { children: text('Bold'), icon: mdiFormatBold });
		const button = withIcon.getByRole('button', { name: 'Bold' }).element();
		expect(dotOf(button)).toBeNull();
		expect(button.querySelector('svg path')?.getAttribute('d')).toBe(mdiFormatBold);

		const custom = await render(ActivableButton, {
			children: text('Custom'),
			iconSnippet: snippet('<i data-testid="custom-icon"></i>')
		});
		await expect.element(custom.getByTestId('custom-icon')).toBeInTheDocument();
		expect(dotOf(custom.getByRole('button', { name: 'Custom' }).element())).toBeNull();

		const iconOnly = await render(ActivableButton, {
			icon: mdiFormatBold,
			'aria-label': 'Toggle bold'
		});
		const iconButton = iconOnly.getByRole('button', { name: 'Toggle bold' }).element();
		expect(dotOf(iconButton)).toBeNull();
		expect(iconButton.querySelector('svg path')?.getAttribute('d')).toBe(mdiFormatBold);
	});

	test('an icon-only button is square, like an icon-only Button', async () => {
		const screen = await render(ActivableButton, {
			icon: mdiFormatBold,
			'aria-label': 'Toggle bold'
		});
		const button = screen.getByRole('button', { name: 'Toggle bold' });
		await expect.element(button).toHaveClass('aurora-button-icon-only');
		const { width, height } = button.element().getBoundingClientRect();
		expect(width).toBe(height);
	});

	test('dotSnippet replaces the dot and receives the state', async () => {
		const screen = await render(ActivableButton, {
			children: text('Favorites'),
			active: true,
			dotSnippet: createRawSnippet<[{ active: boolean }]>((args) => ({
				render: () => `<i data-testid="dot" data-on="${args().active}"></i>`
			}))
		});
		await expect.element(screen.getByTestId('dot')).toHaveAttribute('data-on', 'true');
		expect(dotOf(screen.getByRole('button').element())).toBeNull();
	});

	test('v4 bug: one --activable-button-* variable per state, no -deactive- names', async () => {
		const off = await render(ActivableButton, {
			children: text('Off'),
			style:
				'--activable-button-background: rgb(1, 2, 3); --activable-button-hover-background: rgb(1, 2, 3)'
		});
		expect(
			getComputedStyle(off.getByRole('button', { name: 'Off' }).element()).backgroundColor
		).toBe('rgb(1, 2, 3)');

		const on = await render(ActivableButton, {
			children: text('On'),
			active: true,
			style:
				'--activable-button-active-background: rgb(4, 5, 6); --activable-button-active-hover-background: rgb(4, 5, 6)'
		});
		expect(
			getComputedStyle(on.getByRole('button', { name: 'On' }).element()).backgroundColor
		).toBe('rgb(4, 5, 6)');
	});
});
