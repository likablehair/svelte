import { describe, expect, test, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import Dialog from '#lib/components/simple/dialogs/Dialog.svelte';
import FormExample from '../../src/docs/examples/dialog/02-form.svelte';
import NestedExample from '../../src/docs/examples/dialog/03-persistent.svelte';
import LightboxExample from '../../src/docs/examples/dialog/04-lightbox.svelte';
import DialogWithMenu from '../fixtures/dialog/DialogWithMenu.svelte';
import ModalHarness from '../fixtures/dialog/ModalHarness.svelte';
import { snippet, text } from '../helpers.js';

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function openHarness(props: Record<string, unknown> = {}) {
	const screen = await render(ModalHarness, { props: { title: 'Edit client', ...props } });
	const opener = screen.getByRole('button', { name: 'Open' });
	await opener.click();
	const dialog = screen.getByRole('dialog');
	await expect.element(dialog).toBeVisible();
	return { screen, opener, dialog, state: screen.getByTestId('state') };
}

function clickBackdrop(dialog: { element(): Element }) {
	const backdrop = dialog.element().querySelector('[data-backdrop]')!;
	return page.elementLocator(backdrop).click({ position: { x: 5, y: 5 } });
}

describe('Dialog', () => {
	test('opens a modal <dialog> on the top layer, named by its title', async () => {
		const { screen, dialog } = await openHarness();
		await expect.element(screen.getByRole('dialog', { name: 'Edit client' })).toBeVisible();
		const element = dialog.element() as HTMLDialogElement;
		expect(element.tagName).toBe('DIALOG');
		expect(element.matches(':modal')).toBe(true);
		await expect.element(dialog).toHaveClass('aurora-dialog');
		const heading = screen.getByRole('heading', { name: 'Edit client', level: 2 });
		await expect.element(dialog).toHaveAttribute('aria-labelledby', heading.element().id);
		expect(getComputedStyle(element).zIndex).toBe('auto');
	});

	test('v4 bug: closed content is not in the DOM and its state resets at every opening', async () => {
		const screen = await render(ModalHarness);
		expect(screen.container.querySelector('dialog')).toBeNull();
		await expect.element(screen.getByLabelText('Name')).not.toBeInTheDocument();

		await screen.getByRole('button', { name: 'Open' }).click();
		await screen.getByLabelText('Name').fill('Giulia');
		await userEvent.keyboard('{Escape}');
		await expect.element(screen.getByRole('dialog')).not.toBeInTheDocument();
		await screen.getByRole('button', { name: 'Open' }).click();
		await expect.element(screen.getByLabelText('Name')).toHaveValue('');
	});

	test('v4 bug: focus moves inside, the page is inert, and focus returns to the opener', async () => {
		const { screen, opener, dialog } = await openHarness();
		await expect.element(screen.getByLabelText('Name')).toHaveFocus();
		const pageButton = screen.getByRole('button', { name: 'Page button', includeHidden: true });
		(pageButton.element() as HTMLElement).focus();
		await expect.element(screen.getByLabelText('Name')).toHaveFocus();
		await userEvent.keyboard('{Escape}');
		await expect.element(dialog).not.toBeInTheDocument();
		await expect.element(opener).toHaveFocus();
	});

	test('Escape closes it and calls onclose with the keyboard event', async () => {
		const onclose = vi.fn();
		const { dialog, state } = await openHarness({ onclose });
		await userEvent.keyboard('{Escape}');
		await expect.element(dialog).not.toBeInTheDocument();
		await expect.element(state).toHaveTextContent('closed');
		expect(onclose).toHaveBeenCalledOnce();
		expect(onclose.mock.calls[0][0]).toBeInstanceOf(KeyboardEvent);
	});

	test('a click on the backdrop closes it; clicks and drags that start inside do not', async () => {
		const onclose = vi.fn();
		const { screen, dialog } = await openHarness({ onclose });
		const inside = screen.getByRole('button', { name: 'Inside' });
		await inside.click();
		const backdrop = dialog.element().querySelector('[data-backdrop]')!;
		const releasedOn: EventTarget[] = [];
		dialog.element().addEventListener('pointerup', (event) => releasedOn.push(event.target!));
		await userEvent.dragAndDrop(inside, page.elementLocator(backdrop), {
			targetPosition: { x: 5, y: 5 }
		});
		expect(releasedOn).toContain(backdrop);
		await pause(100);
		await expect.element(dialog).toBeVisible();
		expect(onclose).not.toHaveBeenCalled();

		await clickBackdrop(dialog);
		await expect.element(dialog).not.toBeInTheDocument();
		expect(onclose).toHaveBeenCalledOnce();
		expect(onclose.mock.calls[0][0]).toBeInstanceOf(MouseEvent);
	});

	test('persistent blocks Escape and the backdrop, not the close button', async () => {
		const onclose = vi.fn();
		const { screen, dialog } = await openHarness({ persistent: true, closable: true, onclose });
		await userEvent.keyboard('{Escape}');
		await userEvent.keyboard('{Escape}');
		await userEvent.keyboard('{Escape}');
		await clickBackdrop(dialog);
		await pause(100);
		await expect.element(dialog).toBeVisible();
		expect((dialog.element() as HTMLDialogElement).open).toBe(true);
		expect(onclose).not.toHaveBeenCalled();

		await screen.getByRole('button', { name: 'Close' }).click();
		await expect.element(dialog).not.toBeInTheDocument();
		expect(onclose).toHaveBeenCalledOnce();
		expect(onclose.mock.calls[0][0]).toBeInstanceOf(MouseEvent);
	});

	test('closable shows a close button named by closeLabel', async () => {
		const { screen, dialog } = await openHarness({ closable: true, closeLabel: 'Chiudi' });
		const close = screen.getByRole('button', { name: 'Chiudi' });
		await expect.element(close).toHaveClass('aurora-dialog-close');
		await close.click();
		await expect.element(dialog).not.toBeInTheDocument();
	});

	test('a <form method="dialog"> closes it with the submit event, even when persistent', async () => {
		const onclose = vi.fn();
		const { screen, dialog, state } = await openHarness({
			withForm: true,
			persistent: true,
			onclose
		});
		await screen.getByRole('button', { name: 'Send' }).click();
		await expect.element(dialog).not.toBeInTheDocument();
		await expect.element(state).toHaveTextContent('closed');
		expect(onclose).toHaveBeenCalledOnce();
		expect(onclose.mock.calls[0][0]).toBeInstanceOf(SubmitEvent);
	});

	test('an invalid form does not close it; autofocus picks the first field (docs example)', async () => {
		const screen = await render(FormExample);
		await screen.getByRole('button', { name: 'New service' }).click();
		const dialog = screen.getByRole('dialog', { name: 'New service' });
		const name = screen.getByRole('textbox', { name: 'Name' });
		await expect.element(name).toHaveFocus();
		await screen.getByRole('button', { name: 'Create service' }).click();
		await pause(100);
		await expect.element(dialog).toBeVisible();
		await name.fill('Balayage');
		await screen.getByRole('button', { name: 'Create service' }).click();
		await expect.element(dialog).not.toBeInTheDocument();
		await expect.element(screen.getByText('Created: Balayage')).toBeVisible();
	});

	test('onclose is not called when open is set to false from outside', async () => {
		const onclose = vi.fn();
		const screen = await render(ModalHarness, { props: { open: true, onclose } });
		const dialog = screen.getByRole('dialog');
		await expect.element(dialog).toBeVisible();
		await screen.rerender({ open: false });
		await expect.element(dialog).not.toBeInTheDocument();
		expect(onclose).not.toHaveBeenCalled();
	});

	test('v4 bug: Escape closes only the topmost dialog and respects persistent', async () => {
		const screen = await render(NestedExample);
		await screen.getByRole('button', { name: 'Open terms' }).click();
		const terms = screen.getByRole('dialog', { name: 'Accept the new terms' });
		await expect.element(terms).toBeVisible();
		await screen.getByRole('button', { name: 'Read the details' }).click();
		const details = screen.getByRole('dialog', { name: 'Terms of service' });
		await expect.element(details).toBeVisible();

		await userEvent.keyboard('{Escape}');
		await expect.element(details).not.toBeInTheDocument();
		await expect.element(terms).toBeVisible();
		expect((terms.element() as HTMLDialogElement).matches(':modal')).toBe(true);
		await userEvent.keyboard('{Escape}');
		await pause(100);
		await expect.element(terms).toBeVisible();
		await screen.getByRole('button', { name: 'Not now' }).click();
		await expect.element(terms).not.toBeInTheDocument();
	});

	test('with a menu open inside, Escape and a backdrop click close only the menu', async () => {
		const screen = await render(DialogWithMenu);
		const dialog = screen.getByRole('dialog', { name: 'Edit client' });
		const menu = screen.getByRole('menu', { name: 'Options menu' });
		const options = screen.getByRole('button', { name: 'Options' });
		await options.click();
		await expect.element(menu).toBeVisible();
		await userEvent.keyboard('{Escape}');
		await expect.element(menu).not.toBeInTheDocument();
		await expect.element(dialog).toBeVisible();

		await options.click();
		await expect.element(menu).toBeVisible();
		await clickBackdrop(dialog);
		await expect.element(menu).not.toBeInTheDocument();
		await expect.element(dialog).toBeVisible();

		await userEvent.keyboard('{Escape}');
		await expect.element(dialog).not.toBeInTheDocument();
	});

	test('v4 bug: the scroll lock is CSS only and goes away on close and on unmount while open', async () => {
		const overflow = () => getComputedStyle(document.documentElement).overflow;
		const { dialog } = await openHarness();
		expect(overflow()).toBe('hidden');
		expect(document.body.style.overflow).toBe('');
		await userEvent.keyboard('{Escape}');
		await expect.element(dialog).not.toBeInTheDocument();
		expect(overflow()).toBe('visible');

		const screen = await render(Dialog, {
			open: true,
			'aria-label': 'Unmounted',
			children: text('Body')
		});
		expect(overflow()).toBe('hidden');
		await screen.unmount();
		expect(overflow()).toBe('visible');
	});

	test('v4 bug: no teleport, so CSS variables set on an ancestor reach the dialog', async () => {
		const { screen, dialog } = await openHarness({
			wrapperStyle: '--dialog-background: rgb(1, 2, 3); --dialog-max-width: 300px'
		});
		expect(dialog.element().parentElement).toBe(screen.getByTestId('wrapper').element());
		const surface = dialog.element().querySelector('.aurora-dialog-surface')!;
		const style = getComputedStyle(surface);
		expect(style.backgroundColor).toBe('rgb(1, 2, 3)');
		expect(style.maxWidth).toBe('300px');
	});

	test('v4 bug: while closing it stays on the top layer, inert, with data-closing', async () => {
		const { dialog } = await openHarness();
		const element = dialog.element() as HTMLDialogElement;
		await userEvent.keyboard('{Escape}');
		await expect.poll(() => element.hasAttribute('data-closing')).toBe(true);
		expect(element.inert).toBe(true);
		expect(element.matches(':modal')).toBe(true);
		expect(getComputedStyle(element).zIndex).toBe('auto');
		await expect.poll(() => element.isConnected).toBe(false);
	});

	test('side snippets sit on the backdrop, outside the surface, and receive close (docs example)', async () => {
		const screen = await render(LightboxExample);
		await screen.getByRole('button', { name: 'Open gallery' }).click();
		const dialog = screen.getByRole('dialog', { name: 'Gallery' });
		await expect.element(dialog).toBeVisible();
		const next = screen.getByRole('button', { name: 'Next photo' });
		expect(next.element().closest('.aurora-dialog-surface')).toBeNull();
		expect(next.element().closest('.aurora-dialog-side-end')).not.toBeNull();
		await next.click();
		await expect.element(screen.getByText('Copper bob · 2 of 3')).toBeVisible();
		const close = screen.getByRole('button', { name: 'Close' });
		expect(close.element().closest('.aurora-dialog-top-right')).not.toBeNull();
		await close.click();
		await expect.element(dialog).not.toBeInTheDocument();
	});

	test('class object, native attributes, title and actions reach their parts', async () => {
		let bound: HTMLDialogElement | undefined;
		const screen = await render(Dialog, {
			open: true,
			id: 'client-dialog',
			'data-kind': 'confirm',
			class: {
				dialog: 'app-dialog',
				surface: 'app-surface',
				body: 'app-body',
				actions: 'app-actions'
			},
			titleSnippet: snippet('<em>Delete client?</em>'),
			children: text('Gone for good'),
			actionsSnippet: snippet('<button>Confirm</button>'),
			get dialogElement() {
				return bound;
			},
			set dialogElement(value) {
				bound = value;
			}
		});
		const dialog = screen.getByRole('dialog', { name: 'Delete client?' });
		await expect.element(dialog).toHaveAttribute('id', 'client-dialog');
		await expect.element(dialog).toHaveAttribute('data-kind', 'confirm');
		await expect.element(dialog).toHaveClass('aurora-dialog', 'app-dialog');
		expect(bound).toBe(dialog.element());
		const element = dialog.element();
		expect(element.querySelector('.aurora-dialog-surface.app-surface')).not.toBeNull();
		const body = element.querySelector('.aurora-dialog-body.app-body');
		expect(body?.textContent).toBe('Gone for good');
		const footer = element.querySelector('footer.aurora-dialog-actions.app-actions');
		expect(footer?.querySelector('button')?.textContent).toBe('Confirm');
	});
});
