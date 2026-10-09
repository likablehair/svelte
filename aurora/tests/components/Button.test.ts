import { mdiPlus } from '@mdi/js';
import { describe, expect, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import Button from '#lib/components/simple/buttons/Button.svelte';
import { snippet, text } from '../helpers.js';

describe('Button', () => {
	test('renders a native button that never submits by default', async () => {
		const screen = await render(Button, { children: text('Save') });
		const button = screen.getByRole('button', { name: 'Save' });
		await expect.element(button).toHaveAttribute('type', 'button');
		await expect.element(button).toHaveClass('aurora-button');
	});

	test('forwards native attributes and class to the button', async () => {
		const screen = await render(Button, {
			children: text('Save'),
			id: 'save',
			name: 'action',
			title: 'Save the form',
			'aria-describedby': 'hint',
			class: 'app-class'
		});
		const button = screen.getByRole('button', { name: 'Save' });
		await expect.element(button).toHaveAttribute('id', 'save');
		await expect.element(button).toHaveAttribute('name', 'action');
		await expect.element(button).toHaveAttribute('title', 'Save the form');
		await expect.element(button).toHaveAttribute('aria-describedby', 'hint');
		await expect.element(button).toHaveClass('aurora-button', 'app-class');
	});

	test('exposes its state as data attributes', async () => {
		const screen = await render(Button, {
			children: text('Delete'),
			variant: 'danger',
			size: 'lg',
			buttonType: 'text',
			loading: true
		});
		const button = screen.getByRole('button');
		await expect.element(button).toHaveAttribute('data-variant', 'danger');
		await expect.element(button).toHaveAttribute('data-size', 'lg');
		await expect.element(button).toHaveAttribute('data-shape', 'text');
		await expect.element(button).toHaveAttribute('data-loading', 'true');
	});

	test('defaults to primary, md, default shape', async () => {
		const screen = await render(Button, { children: text('Go') });
		const button = screen.getByRole('button');
		await expect.element(button).toHaveAttribute('data-variant', 'primary');
		await expect.element(button).toHaveAttribute('data-size', 'md');
		await expect.element(button).toHaveAttribute('data-shape', 'default');
		await expect.element(button).not.toHaveAttribute('data-loading');
	});

	test('onclick receives the native MouseEvent, not { detail: { nativeEvent } }', async () => {
		const onclick = vi.fn();
		const screen = await render(Button, { children: text('Go'), onclick });
		await screen.getByRole('button').click();
		expect(onclick).toHaveBeenCalledOnce();
		const event = onclick.mock.calls[0][0];
		expect(event).toBeInstanceOf(MouseEvent);
		expect(event.detail).toBeTypeOf('number');
	});

	test('v4 bug: disabled reaches the native button, which gets no focus and no clicks', async () => {
		const onclick = vi.fn();
		const screen = await render(Button, { children: text('Go'), disabled: true, onclick });
		const button = screen.getByRole('button');
		await expect.element(button).toBeDisabled();
		await button.click({ force: true });
		expect(onclick).not.toHaveBeenCalled();
		await userEvent.keyboard('{Tab}');
		await expect.element(button).not.toHaveFocus();
	});

	test('loading disables the button, sets aria-busy and keeps the text', async () => {
		const onclick = vi.fn();
		const screen = await render(Button, { children: text('Save'), loading: true, onclick });
		const button = screen.getByRole('button', { name: 'Save' });
		await expect.element(button).toBeDisabled();
		await expect.element(button).toHaveAttribute('aria-busy', 'true');
		expect(button.element().querySelector('.aurora-button-spinner')).not.toBeNull();
		await button.click({ force: true });
		expect(onclick).not.toHaveBeenCalled();
	});

	test('loading replaces the icon with the spinner or loadingSnippet', async () => {
		const screen = await render(Button, {
			children: text('Save'),
			icon: mdiPlus,
			loading: true,
			loadingSnippet: snippet('<i data-testid="custom-loader"></i>')
		});
		await expect.element(screen.getByTestId('custom-loader')).toBeInTheDocument();
		expect(screen.container.querySelector('svg')).toBeNull();
	});

	test('submits the form only with type="submit"', async () => {
		const onsubmit = vi.fn((event: SubmitEvent) => event.preventDefault());
		const form = document.createElement('form');
		form.addEventListener('submit', onsubmit);
		document.body.append(form);
		const plain = await render(Button, { target: form, props: { children: text('Plain') } });
		await plain.getByRole('button', { name: 'Plain' }).click();
		expect(onsubmit).not.toHaveBeenCalled();
		const submit = await render(Button, {
			target: form,
			props: { children: text('Send'), type: 'submit' }
		});
		await submit.getByRole('button', { name: 'Send' }).click();
		expect(onsubmit).toHaveBeenCalledOnce();
		form.remove();
	});

	test('is reachable with Tab and activated with Enter and Space', async () => {
		const onclick = vi.fn();
		const screen = await render(Button, { children: text('Go'), onclick });
		await userEvent.keyboard('{Tab}');
		await expect.element(screen.getByRole('button')).toHaveFocus();
		await userEvent.keyboard('{Enter}');
		await userEvent.keyboard(' ');
		expect(onclick).toHaveBeenCalledTimes(2);
	});

	test('icon with text renders both; icon alone makes an icon-only button', async () => {
		const withText = await render(Button, { children: text('Add'), icon: mdiPlus });
		const button = withText.getByRole('button', { name: 'Add' });
		await expect.element(button).not.toHaveClass('aurora-button-icon-only');
		expect(button.element().querySelector('svg path')?.getAttribute('d')).toBe(mdiPlus);

		const alone = await render(Button, { icon: mdiPlus, 'aria-label': 'Add item' });
		await expect
			.element(alone.getByRole('button', { name: 'Add item' }))
			.toHaveClass('aurora-button-icon-only');
	});

	test('appendIcon and appendSnippet render after the text', async () => {
		const screen = await render(Button, {
			children: text('Next'),
			appendSnippet: snippet('<kbd>N</kbd>')
		});
		const button = screen.getByRole('button', { name: /Next/ }).element();
		const append = button.querySelector('.aurora-button-append');
		expect(append?.textContent).toBe('N');
		expect(button.lastElementChild).toBe(append);
	});

	test('binds the native element', async () => {
		let element: HTMLElement | undefined;
		await render(Button, {
			children: text('Go'),
			get buttonElement() {
				return element as HTMLButtonElement;
			},
			set buttonElement(value) {
				element = value;
			}
		});
		expect(element).toBeInstanceOf(HTMLButtonElement);
	});

	describe('with href', () => {
		test('renders a link with the native link attributes', async () => {
			const screen = await render(Button, {
				props: { children: text('Docs'), href: '/docs', target: '_blank', download: 'file.pdf' }
			});
			const link = screen.getByRole('link', { name: 'Docs' });
			await expect.element(link).toHaveAttribute('href', '/docs');
			await expect.element(link).toHaveAttribute('target', '_blank');
			await expect.element(link).toHaveAttribute('rel', 'noopener noreferrer');
			await expect.element(link).toHaveAttribute('download', 'file.pdf');
			await expect.element(link).not.toHaveAttribute('type');
		});

		test('keeps an explicit rel', async () => {
			const screen = await render(Button, {
				props: { children: text('Docs'), href: '/docs', target: '_blank', rel: 'external' }
			});
			await expect.element(screen.getByRole('link')).toHaveAttribute('rel', 'external');
		});

		test('disabled or loading removes href, sets aria-disabled and blocks onclick', async () => {
			const screen = await render(Button, { children: text('Docs'), href: '/docs', disabled: true });
			const link = screen.getByRole('link', { name: 'Docs' });
			await expect.element(link).not.toHaveAttribute('href');
			await expect.element(link).toHaveAttribute('aria-disabled', 'true');
			await userEvent.keyboard('{Tab}');
			await expect.element(link).not.toHaveFocus();

			const onclick = vi.fn();
			await screen.rerender({ onclick });
			await link.click({ force: true });
			expect(onclick).not.toHaveBeenCalled();

			await screen.rerender({ disabled: false, loading: true });
			await expect.element(link).not.toHaveAttribute('href');
			await expect.element(link).toHaveAttribute('aria-busy', 'true');
		});
	});

	test('instance CSS variables override the defaults', async () => {
		const screen = await render(Button, {
			children: text('Go'),
			style: '--button-background: rgb(1, 2, 3); --button-height: 50px'
		});
		const style = getComputedStyle(screen.getByRole('button').element());
		expect(style.backgroundColor).toBe('rgb(1, 2, 3)');
		expect(style.height).toBe('50px');
	});

	test('unlayered app CSS wins over the component rules', async () => {
		const sheet = document.createElement('style');
		sheet.textContent = '.app-override { background: rgb(4, 5, 6); }';
		document.head.append(sheet);
		const screen = await render(Button, { children: text('Go'), class: 'app-override' });
		expect(getComputedStyle(screen.getByRole('button').element()).backgroundColor).toBe(
			'rgb(4, 5, 6)'
		);
		sheet.remove();
	});
});
