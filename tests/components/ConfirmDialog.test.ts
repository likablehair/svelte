import { describe, expect, test, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { createRawSnippet } from 'svelte';
import ConfirmDialog from '#lib/components/composed/dialogs/ConfirmDialog.svelte';
import ConfirmHarness from '../fixtures/confirm-dialog/ConfirmHarness.svelte';
import { renderWithDefaultLocale, snippet, text } from '../helpers.js';

const TRASH = 'M9,3V4H4V6H5V19A2,2 0 0,0 7,21H17A2,2 0 0,0 19,19V6H20V4H15V3H9Z';

function deferred() {
	let resolve!: () => void;
	let reject!: (error: unknown) => void;
	const promise = new Promise<void>((res, rej) => {
		resolve = res;
		reject = rej;
	});
	return { promise, resolve, reject };
}

async function openHarness(props: Record<string, unknown> = {}) {
	const screen = await render(ConfirmHarness, {
		props: { title: 'Delete the client?', description: 'It cannot be undone.', ...props }
	});
	const opener = screen.getByRole('button', { name: 'Open' });
	await opener.click();
	const dialog = screen.getByRole('alertdialog');
	await expect.element(dialog).toBeVisible();
	return { screen, opener, dialog, state: screen.getByTestId('state') };
}

function tokenColor(token: string) {
	const probe = document.createElement('span');
	probe.style.color = `var(${token})`;
	document.body.append(probe);
	const color = getComputedStyle(probe).color;
	probe.remove();
	return color;
}

function clickBackdrop(dialog: { element(): Element }) {
	const backdrop = dialog.element().querySelector('[data-backdrop]')!;
	return page.elementLocator(backdrop).click({ position: { x: 5, y: 5 } });
}

describe('ConfirmDialog', () => {
	test('is a modal alertdialog named by its title and described by its description', async () => {
		const { screen, dialog } = await openHarness();
		const element = dialog.element() as HTMLDialogElement;
		expect(element.tagName).toBe('DIALOG');
		expect(element.matches(':modal')).toBe(true);
		await expect.element(dialog).toHaveClass('aurora-confirm-dialog');
		await expect
			.element(screen.getByRole('alertdialog', { name: 'Delete the client?' }))
			.toBeVisible();
		await expect.element(dialog).toHaveAccessibleDescription('It cannot be undone.');
		await expect
			.element(screen.getByRole('heading', { name: 'Delete the client?', level: 2 }))
			.toBeVisible();
	});

	test('danger by default: icon in the danger tone, "Delete" and "Cancel", focus on Cancel', async () => {
		const { screen, dialog } = await openHarness();
		await expect.element(dialog).toHaveAttribute('data-variant', 'danger');
		const confirm = screen.getByRole('button', { name: 'Delete' });
		await expect.element(confirm).toHaveAttribute('data-variant', 'danger');
		await expect.element(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();
		const icon = dialog.element().querySelector('.aurora-confirm-dialog-icon')!;
		expect(icon.querySelector('svg')!.getAttribute('aria-hidden')).toBe('true');
		expect(getComputedStyle(icon).color).toBe(tokenColor('--global-color-error'));
	});

	test('primary: icon and button in the primary tone, "Confirm", focus on the action', async () => {
		const { screen, dialog } = await openHarness({ variant: 'primary' });
		await expect.element(dialog).toHaveAttribute('data-variant', 'primary');
		const confirm = screen.getByRole('button', { name: 'Confirm' });
		await expect.element(confirm).toHaveAttribute('data-variant', 'primary');
		await expect.element(confirm).toHaveFocus();
		const icon = dialog.element().querySelector('.aurora-confirm-dialog-icon')!;
		expect(getComputedStyle(icon).color).toBe(tokenColor('--global-color-primary'));
		const primaryPath = icon.querySelector('path')!.getAttribute('d');
		await screen.unmount();
		await render(ConfirmDialog, { open: true, title: 'A' });
		const dangerPath = document.querySelector('.aurora-confirm-dialog-icon path')!.getAttribute('d');
		expect(primaryPath).not.toBe(dangerPath);
	});

	test('without a description it has no aria-describedby', async () => {
		const screen = await render(ConfirmDialog, { open: true, title: 'Delete?' });
		await expect.element(screen.getByRole('alertdialog', { name: 'Delete?' })).toBeVisible();
		expect(screen.container.querySelector('.aurora-confirm-dialog-description')).toBeNull();
		await expect.element(screen.getByRole('alertdialog')).not.toHaveAttribute('aria-describedby');
	});

	test('confirmText, cancelText and icon replace the defaults; an empty icon removes it', async () => {
		const screen = await render(ConfirmDialog, {
			open: true,
			title: 'Remove?',
			confirmText: 'Remove',
			cancelText: 'Keep',
			icon: TRASH
		});
		await expect.element(screen.getByRole('button', { name: 'Remove' })).toBeVisible();
		await expect.element(screen.getByRole('button', { name: 'Keep' })).toBeVisible();
		expect(
			screen.container.ownerDocument.querySelector('.aurora-confirm-dialog-icon path')!.getAttribute('d')
		).toBe(TRASH);
		await screen.rerender({ icon: '' });
		await expect
			.poll(() => document.querySelector('.aurora-confirm-dialog-icon'))
			.toBeNull();
	});

	test('an array of descriptions renders one paragraph each, and line breaks are kept', async () => {
		const screen = await render(ConfirmDialog, {
			open: true,
			title: 'Delete?',
			description: ['First line\nsecond line', '', 'Another paragraph']
		});
		const paragraphs = [
			...screen.getByRole('alertdialog').element().querySelectorAll('.aurora-confirm-dialog-description p')
		];
		expect(paragraphs.map((p) => p.textContent)).toEqual([
			'First line\nsecond line',
			'Another paragraph'
		]);
		expect(getComputedStyle(paragraphs[0]).whiteSpace).toBe('pre-line');
		await expect
			.element(screen.getByRole('alertdialog'))
			.toHaveAccessibleDescription('First line second line Another paragraph');
	});

	test('a plain onconfirm is called with the click and the dialog closes by itself', async () => {
		const onconfirm = vi.fn();
		const oncancel = vi.fn();
		const { screen, dialog, state, opener } = await openHarness({ onconfirm, oncancel });
		await screen.getByRole('button', { name: 'Delete' }).click();
		await expect.element(dialog).not.toBeInTheDocument();
		await expect.element(state).toHaveTextContent('closed');
		expect(onconfirm).toHaveBeenCalledOnce();
		expect(onconfirm.mock.calls[0][0]).toBeInstanceOf(MouseEvent);
		expect(oncancel).not.toHaveBeenCalled();
		await expect.element(opener).toHaveFocus();
	});

	test('event.preventDefault() in onconfirm keeps it open', async () => {
		const onconfirm = vi.fn((event: MouseEvent) => event.preventDefault());
		const { screen, dialog, state } = await openHarness({ onconfirm });
		await screen.getByRole('button', { name: 'Delete' }).click();
		expect(onconfirm).toHaveBeenCalledOnce();
		await expect.element(dialog).toBeVisible();
		await expect.element(state).toHaveTextContent('open');
	});

	test('closeOnConfirm={false} leaves the closing to the app', async () => {
		const onconfirm = vi.fn();
		const { screen, dialog, state } = await openHarness({ onconfirm, closeOnConfirm: false });
		await screen.getByRole('button', { name: 'Delete' }).click();
		expect(onconfirm).toHaveBeenCalledOnce();
		await expect.element(dialog).toBeVisible();
		await expect.element(state).toHaveTextContent('open');
	});

	test('a Promise from onconfirm shows the spinner, blocks every way of closing, then closes', async () => {
		const { promise, resolve } = deferred();
		const onconfirm = vi.fn(() => promise);
		const oncancel = vi.fn();
		const { screen, dialog, state } = await openHarness({ onconfirm, oncancel });
		const confirm = screen.getByRole('button', { name: 'Delete' });
		await confirm.click();
		await expect.element(dialog).toHaveAttribute('data-loading');
		await expect.element(confirm).toHaveAttribute('aria-busy', 'true');
		await expect.element(confirm).toBeDisabled();
		await expect.element(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
		await expect.element(screen.getByRole('button', { name: 'Close' })).toBeDisabled();

		await userEvent.keyboard('{Escape}');
		await clickBackdrop(dialog);
		(confirm.element() as HTMLButtonElement).click();
		await expect.element(dialog).toBeVisible();
		expect(onconfirm).toHaveBeenCalledOnce();

		resolve();
		await expect.element(dialog).not.toBeInTheDocument();
		await expect.element(state).toHaveTextContent('closed');
		expect(oncancel).not.toHaveBeenCalled();
	});

	test('a Promise that rejects keeps it open, stops the spinner and gives the focus back', async () => {
		const swallow = (event: PromiseRejectionEvent) => event.preventDefault();
		window.addEventListener('unhandledrejection', swallow);
		try {
			const { promise, reject } = deferred();
			promise.catch(() => {});
			const { screen, dialog, state } = await openHarness({ onconfirm: () => promise });
			const confirm = screen.getByRole('button', { name: 'Delete' });
			await confirm.click();
			await expect.element(dialog).toHaveAttribute('data-loading');
			reject(new Error('offline'));
			await expect.element(dialog).not.toHaveAttribute('data-loading');
			await expect.element(confirm).toBeEnabled();
			await expect.element(confirm).toHaveFocus();
			await expect.element(state).toHaveTextContent('open');
		} finally {
			window.removeEventListener('unhandledrejection', swallow);
		}
	});

	test('a request that is still running does not close the dialog opened again after it', async () => {
		const { promise, resolve } = deferred();
		const { screen, dialog, state } = await openHarness({ onconfirm: () => promise });
		await screen.getByRole('button', { name: 'Delete' }).click();
		await expect.element(dialog).toHaveAttribute('data-loading');
		await screen.rerender({ open: false });
		await expect.element(state).toHaveTextContent('closed');
		await screen.getByRole('button', { name: 'Open' }).click();
		const reopened = screen.getByRole('alertdialog');
		await expect.element(reopened).not.toHaveAttribute('data-loading');
		resolve();
		await new Promise((done) => setTimeout(done, 50));
		await expect.element(reopened).toBeVisible();
		await expect.element(state).toHaveTextContent('open');
	});

	test('the loading prop shows the spinner and blocks confirm, cancel and closing', async () => {
		const onconfirm = vi.fn();
		const oncancel = vi.fn();
		const { screen, dialog } = await openHarness({ onconfirm, oncancel, loading: true });
		await expect.element(dialog).toHaveAttribute('data-loading');
		const confirm = screen.getByRole('button', { name: 'Delete' });
		await expect.element(confirm).toHaveAttribute('aria-busy', 'true');
		(confirm.element() as HTMLButtonElement).click();
		await userEvent.keyboard('{Escape}');
		await clickBackdrop(dialog);
		await expect.element(dialog).toBeVisible();
		expect(onconfirm).not.toHaveBeenCalled();
		expect(oncancel).not.toHaveBeenCalled();
	});

	test.each([
		['Cancel', async (screen: Awaited<ReturnType<typeof openHarness>>) => {
			await screen.screen.getByRole('button', { name: 'Cancel' }).click();
		}, MouseEvent],
		['the close button', async (screen: Awaited<ReturnType<typeof openHarness>>) => {
			await screen.screen.getByRole('button', { name: 'Close' }).click();
		}, MouseEvent],
		['Escape', async () => {
			await userEvent.keyboard('{Escape}');
		}, KeyboardEvent],
		['the backdrop', async (screen: Awaited<ReturnType<typeof openHarness>>) => {
			await clickBackdrop(screen.dialog);
		}, MouseEvent]
	])('copies bug: %s closes it and calls oncancel', async (_, close, type) => {
		const oncancel = vi.fn();
		const onconfirm = vi.fn();
		const opened = await openHarness({ oncancel, onconfirm });
		await close(opened);
		await expect.element(opened.dialog).not.toBeInTheDocument();
		await expect.element(opened.state).toHaveTextContent('closed');
		expect(oncancel).toHaveBeenCalledOnce();
		expect(oncancel.mock.calls[0][0]).toBeInstanceOf(type);
		expect(onconfirm).not.toHaveBeenCalled();
		await expect.element(opened.opener).toHaveFocus();
	});

	test('copies bug: persistent blocks Escape as well as the backdrop; Cancel still closes', async () => {
		const oncancel = vi.fn();
		const { screen, dialog } = await openHarness({ oncancel, persistent: true });
		await userEvent.keyboard('{Escape}');
		await clickBackdrop(dialog);
		await expect.element(dialog).toBeVisible();
		expect(oncancel).not.toHaveBeenCalled();
		await screen.getByRole('button', { name: 'Cancel' }).click();
		await expect.element(dialog).not.toBeInTheDocument();
		expect(oncancel).toHaveBeenCalledOnce();
	});

	test('confirmDisable disables the action; cancelDisable disables Cancel, the close button and Escape', async () => {
		const onconfirm = vi.fn();
		const oncancel = vi.fn();
		const { screen, dialog } = await openHarness({
			onconfirm,
			oncancel,
			confirmDisable: true,
			cancelDisable: true
		});
		await expect.element(screen.getByRole('button', { name: 'Delete' })).toBeDisabled();
		await expect.element(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
		await expect.element(screen.getByRole('button', { name: 'Close' })).toBeDisabled();
		await userEvent.keyboard('{Escape}');
		await clickBackdrop(dialog);
		await expect.element(dialog).toBeVisible();
		expect(onconfirm).not.toHaveBeenCalled();
		expect(oncancel).not.toHaveBeenCalled();
	});

	test('closable={false} removes the close button', async () => {
		const screen = await render(ConfirmDialog, { open: true, title: 'Delete?', closable: false });
		await expect.element(screen.getByRole('button', { name: 'Close' })).not.toBeInTheDocument();
		await expect.element(screen.getByRole('button', { name: 'Cancel' })).toBeVisible();
	});

	test('children go under the description and keep the focus order', async () => {
		const { screen, dialog } = await openHarness({ withField: true });
		const content = dialog.element().querySelector('.aurora-confirm-dialog-content')!;
		expect(content.previousElementSibling?.classList.contains('aurora-confirm-dialog-description')).toBe(
			true
		);
		await expect.element(screen.getByLabelText('Name')).toBeVisible();
	});

	test('titleSnippet, iconSnippet and actionsSnippet replace their parts', async () => {
		const onconfirm = vi.fn();
		const oncancel = vi.fn();
		const actionsSnippet = createRawSnippet<
			[{ confirm: (event: MouseEvent) => void; cancel: (event: Event) => void; loading: boolean }]
		>((args) => ({
			render: () => `<div><button type="button">No</button><button type="button">Yes</button></div>`,
			setup: (node) => {
				const [no, yes] = node.querySelectorAll('button');
				no.onclick = (event) => args().cancel(event);
				yes.onclick = (event) => args().confirm(event);
			}
		}));
		const screen = await render(ConfirmHarness, {
			props: {
				open: true,
				title: 'Plain',
				titleSnippet: text('Custom title'),
				iconSnippet: snippet('<span data-testid="own-icon">!</span>'),
				actionsSnippet,
				onconfirm,
				oncancel
			}
		});
		await expect.element(screen.getByRole('heading', { name: 'Custom title' })).toBeVisible();
		await expect.element(screen.getByTestId('own-icon')).toBeVisible();
		expect(document.querySelector('.aurora-confirm-dialog-icon')).toBeNull();
		await expect.element(screen.getByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
		await screen.getByRole('button', { name: 'Yes' }).click();
		expect(onconfirm).toHaveBeenCalledOnce();
		await expect.element(screen.getByTestId('state')).toHaveTextContent('closed');
		await screen.getByRole('button', { name: 'Open' }).click();
		await screen.getByRole('button', { name: 'No' }).click();
		expect(oncancel).toHaveBeenCalledOnce();
		await expect.element(screen.getByTestId('state')).toHaveTextContent('closed');
	});

	test('class for each part, attributes on the <dialog>, aria-describedby merged, dialogElement', async () => {
		let element: HTMLDialogElement | undefined;
		await render(ConfirmDialog, {
			props: {
				open: true,
				title: 'Delete?',
				id: 'confirm',
				description: 'Text',
				'aria-describedby': 'extra',
				class: {
					dialog: 'd',
					surface: 's',
					icon: 'i',
					title: 't',
					description: 'x',
					actions: 'a',
					cancel: 'c',
					confirm: 'k'
				},
				get dialogElement() {
					return element;
				},
				set dialogElement(value) {
					element = value;
				}
			}
		});
		const dialog = document.getElementById('confirm')!;
		expect(dialog).toBe(element);
		expect(dialog.classList.contains('d')).toBe(true);
		for (const name of ['s', 'i', 't', 'x', 'a', 'c', 'k'])
			expect(dialog.querySelector(`.${name}`), name).not.toBeNull();
		const ids = dialog.getAttribute('aria-describedby')!.split(' ');
		expect(ids).toContain('extra');
		expect(ids).toContain(dialog.querySelector('.aurora-confirm-dialog-description')!.id);
	});

	test('CSS variables reach the dialog for one instance', async () => {
		const { dialog } = await openHarness({
			wrapperStyle: '--confirm-dialog-icon-size: 52px; --confirm-dialog-max-width: 300px'
		});
		const icon = dialog.element().querySelector<HTMLElement>('.aurora-confirm-dialog-icon')!;
		expect(icon.offsetWidth).toBe(52);
		const surface = dialog.element().querySelector<HTMLElement>('.aurora-dialog-surface')!;
		expect(surface.offsetWidth).toBe(300);
	});

	test('follow locale, and the text props win', async () => {
		const italian = await render(ConfirmDialog, { open: true, title: 'Eliminare?', locale: 'it' });
		await expect.element(italian.getByRole('button', { name: 'Elimina' })).toBeVisible();
		await expect.element(italian.getByRole('button', { name: 'Annulla' })).toBeVisible();
		await expect.element(italian.getByRole('button', { name: 'Chiudi' })).toBeVisible();
		await italian.rerender({ variant: 'primary' });
		await expect.element(italian.getByRole('button', { name: 'Conferma' })).toBeVisible();
		await italian.rerender({ confirmText: 'Invia', closeLabel: 'Esci' });
		await expect.element(italian.getByRole('button', { name: 'Invia' })).toBeVisible();
		await expect.element(italian.getByRole('button', { name: 'Esci' })).toBeVisible();
	});

	test('follow setDefaultLocale, and the locale prop wins over it', async () => {
		const inherited = await renderWithDefaultLocale('it', ConfirmDialog, { open: true, title: 'Eliminare?' });
		await expect.element(inherited.getByRole('button', { name: 'Elimina' })).toBeVisible();
		await inherited.unmount();
		const own = await renderWithDefaultLocale('it', ConfirmDialog, {
			open: true,
			title: 'Delete?',
			locale: 'en'
		});
		await expect.element(own.getByRole('button', { name: 'Delete' })).toBeVisible();
	});
});
