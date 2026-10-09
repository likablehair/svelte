import { mdiCheck, mdiClose } from '@mdi/js';
import { createRawSnippet } from 'svelte';
import { describe, expect, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import ConfirmOrCancelButtons from '#lib/components/composed/forms/ConfirmOrCancelButtons.svelte';
import { text } from '../helpers.js';

type CancelArgs = {
	loading: boolean;
	handleCancel: (event: MouseEvent | KeyboardEvent) => void;
	cancelText: string;
	cancelDisable: boolean;
};

type ConfirmArgs = {
	loading: boolean;
	handleConfirm: (event: MouseEvent) => void;
	confirmText: string;
	confirmDisable: boolean;
};

function customButton<T>(
	markup: (args: T) => string,
	onclick: (args: T, event: MouseEvent) => void
) {
	return createRawSnippet<[T]>((args) => ({
		render: () => markup(args()),
		setup: (node) => {
			node.addEventListener('click', (event) => onclick(args(), event as MouseEvent));
		}
	}));
}

function box(width: string) {
	const element = document.createElement('div');
	element.style.width = width;
	document.body.append(element);
	return element;
}

describe('ConfirmOrCancelButtons', () => {
	test('renders a text Cancel button and a primary Save button by default', async () => {
		const screen = await render(ConfirmOrCancelButtons, {});
		const cancel = screen.getByRole('button', { name: 'Cancel' });
		const confirm = screen.getByRole('button', { name: 'Save' });
		await expect.element(cancel).toHaveAttribute('data-shape', 'text');
		await expect.element(cancel).toHaveAttribute('type', 'button');
		await expect.element(confirm).toHaveAttribute('data-shape', 'default');
		await expect.element(confirm).toHaveAttribute('data-variant', 'primary');
		await expect.element(confirm).toHaveAttribute('type', 'button');
		const root = screen.container.querySelector('.aurora-confirm-or-cancel-buttons');
		expect(root?.hasAttribute('data-loading')).toBe(false);
	});

	test('keeps the v4 prop names for texts and callbacks, which get the native MouseEvent', async () => {
		const onconfirmClick = vi.fn();
		const oncancelClick = vi.fn();
		const screen = await render(ConfirmOrCancelButtons, {
			confirmText: 'Publish',
			cancelText: 'Back',
			onconfirmClick,
			oncancelClick
		});
		await screen.getByRole('button', { name: 'Publish' }).click();
		await screen.getByRole('button', { name: 'Back' }).click();
		expect(onconfirmClick).toHaveBeenCalledOnce();
		expect(onconfirmClick.mock.calls[0][0]).toBeInstanceOf(MouseEvent);
		expect(oncancelClick).toHaveBeenCalledOnce();
		expect(oncancelClick.mock.calls[0][0]).toBeInstanceOf(MouseEvent);
	});

	test('forwards native attributes to the root and the class object to each part', async () => {
		const screen = await render(ConfirmOrCancelButtons, {
			id: 'actions',
			'aria-label': 'Form actions',
			'data-form': 'client',
			class: {
				container: 'app-container',
				content: 'app-content',
				actions: 'app-actions',
				cancel: 'app-cancel',
				confirm: 'app-confirm'
			},
			children: text('Unsaved changes')
		});
		const root = screen.container.querySelector('.aurora-confirm-or-cancel-buttons')!;
		expect(root.id).toBe('actions');
		expect(root.getAttribute('aria-label')).toBe('Form actions');
		expect(root.getAttribute('data-form')).toBe('client');
		expect(root.classList.contains('app-container')).toBe(true);
		expect(root.querySelector('.app-content')?.textContent).toBe('Unsaved changes');
		expect(root.querySelector('.app-actions')).not.toBeNull();
		await expect.element(screen.getByRole('button', { name: 'Cancel' })).toHaveClass('app-cancel');
		await expect.element(screen.getByRole('button', { name: 'Save' })).toHaveClass('app-confirm');
	});

	test('v4 bug: cancelDisable really disables the cancel button', async () => {
		const oncancelClick = vi.fn();
		const screen = await render(ConfirmOrCancelButtons, { cancelDisable: true, oncancelClick });
		const cancel = screen.getByRole('button', { name: 'Cancel' });
		await expect.element(cancel).toBeDisabled();
		await cancel.click({ force: true });
		expect(oncancelClick).not.toHaveBeenCalled();
		await expect.element(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
	});

	test('confirmDisable disables the confirm button only', async () => {
		const onconfirmClick = vi.fn();
		const screen = await render(ConfirmOrCancelButtons, { confirmDisable: true, onconfirmClick });
		const confirm = screen.getByRole('button', { name: 'Save' });
		await expect.element(confirm).toBeDisabled();
		await confirm.click({ force: true });
		expect(onconfirmClick).not.toHaveBeenCalled();
		await expect.element(screen.getByRole('button', { name: 'Cancel' })).toBeEnabled();
	});

	test('loading shows the spinner on the confirm button, disables it and sets data-loading', async () => {
		const onconfirmClick = vi.fn();
		const screen = await render(ConfirmOrCancelButtons, { loading: true, onconfirmClick });
		const confirm = screen.getByRole('button', { name: 'Save' });
		await expect.element(confirm).toHaveAttribute('aria-busy', 'true');
		await expect.element(confirm).toBeDisabled();
		await confirm.click({ force: true });
		expect(onconfirmClick).not.toHaveBeenCalled();
		await expect.element(screen.getByRole('button', { name: 'Cancel' })).toBeEnabled();
		const root = screen.container.querySelector('.aurora-confirm-or-cancel-buttons');
		expect(root?.getAttribute('data-loading')).toBe('true');
	});

	test('confirmType="submit" submits the surrounding form after its validation', async () => {
		const onsubmit = vi.fn((event: SubmitEvent) => event.preventDefault());
		const form = document.createElement('form');
		const input = document.createElement('input');
		input.name = 'name';
		input.required = true;
		form.append(input);
		form.addEventListener('submit', onsubmit);
		document.body.append(form);

		const plain = await render(ConfirmOrCancelButtons, {
			target: form,
			props: { confirmText: 'Plain' }
		});
		input.value = 'Giulia';
		await plain.getByRole('button', { name: 'Plain' }).click();
		await plain.getByRole('button', { name: 'Cancel' }).click();
		expect(onsubmit).not.toHaveBeenCalled();
		await plain.unmount();

		const submit = await render(ConfirmOrCancelButtons, {
			target: form,
			props: { confirmType: 'submit' }
		});
		const save = submit.getByRole('button', { name: 'Save' });
		await expect.element(save).toHaveAttribute('type', 'submit');
		input.value = '';
		await save.click();
		expect(onsubmit).not.toHaveBeenCalled();
		input.value = 'Giulia';
		await save.click();
		expect(onsubmit).toHaveBeenCalledOnce();
		form.remove();
	});

	test('v4 bug: no top margin', async () => {
		const screen = await render(ConfirmOrCancelButtons, {});
		const root = screen.container.querySelector('.aurora-confirm-or-cancel-buttons')!;
		expect(getComputedStyle(root).marginTop).toBe('0px');
	});

	test('in a wide container the buttons sit in a row at the end, cancel first', async () => {
		const wide = box('800px');
		const screen = await render(ConfirmOrCancelButtons, { target: wide, props: {} });
		const cancel = screen.getByRole('button', { name: 'Cancel' }).element().getBoundingClientRect();
		const confirm = screen.getByRole('button', { name: 'Save' }).element().getBoundingClientRect();
		const container = wide.getBoundingClientRect();
		expect(Math.round(confirm.top)).toBe(Math.round(cancel.top));
		expect(confirm.left).toBeGreaterThan(cancel.right);
		expect(Math.round(confirm.right)).toBe(Math.round(container.right));
		expect(confirm.width).toBeLessThan(container.width / 2);
		wide.remove();
	});

	test('v4 bug: stacks in a narrow container whatever the viewport, confirm on top at full width', async () => {
		const narrow = box('320px');
		const screen = await render(ConfirmOrCancelButtons, { target: narrow, props: {} });
		const cancel = screen.getByRole('button', { name: 'Cancel' }).element().getBoundingClientRect();
		const confirm = screen.getByRole('button', { name: 'Save' }).element().getBoundingClientRect();
		expect(confirm.bottom).toBeLessThanOrEqual(cancel.top);
		expect(Math.round(confirm.width)).toBe(320);
		expect(Math.round(cancel.width)).toBe(320);
		narrow.remove();
	});

	test('children sit at the start of the row; icons and confirmVariant change the buttons', async () => {
		const wide = box('800px');
		const screen = await render(ConfirmOrCancelButtons, {
			target: wide,
			props: {
				children: text('Unsaved changes'),
				confirmText: 'Delete',
				confirmVariant: 'danger',
				confirmIcon: mdiCheck,
				cancelIcon: mdiClose
			}
		});
		const content = screen.getByText('Unsaved changes').element().getBoundingClientRect();
		const cancel = screen.getByRole('button', { name: 'Cancel' }).element();
		const confirm = screen.getByRole('button', { name: 'Delete' }).element();
		expect(Math.round(content.left)).toBe(Math.round(wide.getBoundingClientRect().left));
		expect(content.right).toBeLessThan(cancel.getBoundingClientRect().left);
		expect(confirm.getAttribute('data-variant')).toBe('danger');
		expect(confirm.querySelector('svg path')?.getAttribute('d')).toBe(mdiCheck);
		expect(cancel.querySelector('svg path')?.getAttribute('d')).toBe(mdiClose);
		wide.remove();
	});

	test('the button snippets replace the buttons and receive native handlers and state', async () => {
		const onconfirmClick = vi.fn();
		const oncancelClick = vi.fn();
		const screen = await render(ConfirmOrCancelButtons, {
			loading: true,
			cancelDisable: true,
			confirmText: 'Send',
			onconfirmClick,
			oncancelClick,
			cancelButtonSnippet: customButton<CancelArgs>(
				({ loading, cancelDisable, cancelText }) =>
					`<button data-loading="${loading}" data-disable="${cancelDisable}">My ${cancelText}</button>`,
				({ handleCancel }, event) => handleCancel(event)
			),
			confirmButtonSnippet: customButton<ConfirmArgs>(
				({ loading, confirmDisable, confirmText }) =>
					`<button data-loading="${loading}" data-disable="${confirmDisable}">My ${confirmText}</button>`,
				({ handleConfirm }, event) => handleConfirm(event)
			)
		});
		const cancel = screen.getByRole('button', { name: 'My Cancel' });
		const confirm = screen.getByRole('button', { name: 'My Send' });
		await expect.element(cancel).toHaveAttribute('data-loading', 'true');
		await expect.element(cancel).toHaveAttribute('data-disable', 'true');
		await expect.element(confirm).toHaveAttribute('data-disable', 'false');
		await cancel.click();
		await confirm.click();
		expect(oncancelClick).not.toHaveBeenCalled();
		expect(onconfirmClick).not.toHaveBeenCalled();

		await screen.rerender({ loading: false, cancelDisable: false });
		await cancel.click();
		await confirm.click();
		expect(oncancelClick).toHaveBeenCalledOnce();
		expect(oncancelClick.mock.calls[0][0]).toBeInstanceOf(MouseEvent);
		expect(onconfirmClick).toHaveBeenCalledOnce();
		expect(onconfirmClick.mock.calls[0][0]).toBeInstanceOf(MouseEvent);
	});

	test('Tab reaches cancel, then confirm; Enter activates them', async () => {
		const onconfirmClick = vi.fn();
		const oncancelClick = vi.fn();
		const screen = await render(ConfirmOrCancelButtons, { onconfirmClick, oncancelClick });
		await userEvent.keyboard('{Tab}');
		await expect.element(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();
		await userEvent.keyboard('{Enter}');
		await userEvent.keyboard('{Tab}');
		await expect.element(screen.getByRole('button', { name: 'Save' })).toHaveFocus();
		await userEvent.keyboard('{Enter}');
		expect(oncancelClick).toHaveBeenCalledOnce();
		expect(onconfirmClick).toHaveBeenCalledOnce();
	});
});
