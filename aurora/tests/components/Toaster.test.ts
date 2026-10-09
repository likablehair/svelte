import { mdiCake } from '@mdi/js';
import { createRawSnippet } from 'svelte';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import Toaster from '#lib/components/simple/notifiers/Toaster.svelte';
import {
	addErrorToast,
	addInfoToast,
	addSuccessToast,
	addToast,
	addWarningToast,
	removeToast,
	toaster,
	updateToast,
	type Toast
} from '#lib/components/simple/notifiers/toasts.svelte.js';
import ToasterWithDialog from '../fixtures/toaster/ToasterWithDialog.svelte';

function fakeTimers() {
	vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
}

function visible(title: string) {
	return toaster.items.some((toast) => toast.title === title);
}

function toast(title: string) {
	return page.getByRole('group', { name: title });
}

afterEach(() => {
	for (const { id } of [...toaster.items]) removeToast(id);
	vi.useRealTimers();
});

describe('Toaster', () => {
	test('add* functions show a toast of each variant and return its id', async () => {
		await render(Toaster);
		const ids = [
			addToast('Plain'),
			addInfoToast('Info'),
			addSuccessToast('Saved'),
			addWarningToast('Low stock'),
			addErrorToast('Payment failed')
		];
		expect(new Set(ids).size).toBe(5);
		expect(ids.every((id) => typeof id === 'number' && id > 0)).toBe(true);
		await expect.element(toast('Plain')).toHaveAttribute('data-variant', 'info');
		await expect.element(toast('Info')).toHaveAttribute('data-variant', 'info');
		await expect.element(toast('Saved')).toHaveAttribute('data-variant', 'success');
		await expect.element(toast('Low stock')).toHaveAttribute('data-variant', 'warning');
		await expect.element(toast('Payment failed')).toHaveAttribute('data-variant', 'error');
		await expect.element(toast('Saved')).toBeVisible();
	});

	test('an options object sets title, description, variant and icon', async () => {
		await render(Toaster);
		addToast({
			variant: 'warning',
			title: 'Low stock',
			description: '3 products are below the minimum.',
			icon: mdiCake
		});
		const item = toast('Low stock');
		await expect.element(item).toHaveAttribute('data-variant', 'warning');
		await expect.element(item).toHaveTextContent('3 products are below the minimum.');
		expect(item.element().querySelector('svg path')?.getAttribute('d')).toBe(mdiCake);

		addSuccessToast({ title: 'No icon', icon: '' });
		await expect.element(toast('No icon')).toBeVisible();
		expect(toast('No icon').element().querySelector('.aurora-alert-banner-icon')).toBeNull();
	});

	test('the toasts sit in a labelled region in the chosen corner', async () => {
		await render(Toaster, { label: 'Messages', class: 'app-toaster' });
		addInfoToast('Hello');
		const region = page.getByRole('region', { name: 'Messages' });
		await expect.element(region).toHaveAttribute('data-position', 'bottom-end');
		await expect.element(region).toHaveClass('aurora-toaster', 'app-toaster');
		const rect = region.element().getBoundingClientRect();
		expect(rect.right).toBeCloseTo(window.innerWidth - 16, 0);
		expect(rect.bottom).toBeCloseTo(window.innerHeight - 16, 0);
	});

	test('position moves the region', async () => {
		await render(Toaster, { position: 'top-start' });
		addInfoToast('Hello');
		const region = page.getByRole('region', { name: 'Notifications' });
		await expect.element(region).toHaveAttribute('data-position', 'top-start');
		const rect = region.element().getBoundingClientRect();
		expect(rect.left).toBeCloseTo(16, 0);
		expect(rect.top).toBeCloseTo(16, 0);
	});

	test('a toast closes after 5000 ms by default, or after duration', async () => {
		fakeTimers();
		await render(Toaster);
		const onclose = vi.fn();
		addInfoToast({ title: 'Default', onclose });
		addInfoToast({ title: 'Short', duration: 1000 });
		await expect.element(toast('Default')).toBeVisible();
		vi.advanceTimersByTime(1000);
		expect(visible('Short')).toBe(false);
		vi.advanceTimersByTime(3999);
		expect(visible('Default')).toBe(true);
		vi.advanceTimersByTime(1);
		expect(visible('Default')).toBe(false);
		expect(onclose).toHaveBeenCalledExactlyOnceWith('timeout');
		await expect.element(toast('Default')).not.toBeInTheDocument();
	});

	test('duration: 0 keeps a toast open', async () => {
		fakeTimers();
		await render(Toaster);
		addErrorToast({ title: 'Sticky', duration: 0 });
		vi.advanceTimersByTime(60_000);
		await expect.element(toast('Sticky')).toBeVisible();
	});

	test('the timer pauses while the pointer is over a toast', async () => {
		fakeTimers();
		await render(Toaster);
		addInfoToast({ title: 'Hover me', duration: 1000 });
		await userEvent.hover(toast('Hover me'));
		vi.advanceTimersByTime(5000);
		expect(visible('Hover me')).toBe(true);
		await userEvent.unhover(toast('Hover me'));
		vi.advanceTimersByTime(999);
		expect(visible('Hover me')).toBe(true);
		vi.advanceTimersByTime(1);
		expect(visible('Hover me')).toBe(false);
	});

	test('the timer pauses while the focus is inside the toasts', async () => {
		fakeTimers();
		await render(Toaster);
		addInfoToast({ title: 'Focus me', duration: 1000 });
		const close = toast('Focus me').getByRole('button', { name: 'Dismiss' });
		await expect.element(close).toBeVisible();
		(close.element() as HTMLElement).focus();
		vi.advanceTimersByTime(5000);
		expect(visible('Focus me')).toBe(true);
		(close.element() as HTMLElement).blur();
		vi.advanceTimersByTime(1000);
		expect(visible('Focus me')).toBe(false);
	});

	test('the timer pauses while the tab is hidden', async () => {
		fakeTimers();
		await render(Toaster);
		addInfoToast({ title: 'Background', duration: 1000 });
		Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
		document.dispatchEvent(new Event('visibilitychange'));
		vi.advanceTimersByTime(5000);
		expect(visible('Background')).toBe(true);
		delete (document as { hidden?: boolean }).hidden;
		document.dispatchEvent(new Event('visibilitychange'));
		vi.advanceTimersByTime(1000);
		expect(visible('Background')).toBe(false);
	});

	test('the close button has an accessible name and dismisses the toast', async () => {
		await render(Toaster, { closeLabel: 'Close notification' });
		const onclose = vi.fn();
		addSuccessToast({ title: 'Saved', onclose });
		await toast('Saved').getByRole('button', { name: 'Close notification' }).click();
		await expect.element(toast('Saved')).not.toBeInTheDocument();
		expect(onclose).toHaveBeenCalledExactlyOnceWith('dismiss');
	});

	test('closable: false hides the close button', async () => {
		await render(Toaster);
		addInfoToast({ title: 'Locked', closable: false });
		await expect.element(toast('Locked')).toBeVisible();
		await expect.element(toast('Locked').getByRole('button')).not.toBeInTheDocument();
	});

	test('the action runs its callback with the click and closes the toast', async () => {
		await render(Toaster);
		const onclick = vi.fn();
		const onclose = vi.fn();
		addToast({ title: 'Client deleted', action: { label: 'Undo', onclick }, onclose });
		await toast('Client deleted').getByRole('button', { name: 'Undo' }).click();
		expect(onclick).toHaveBeenCalledOnce();
		expect(onclick.mock.calls[0][0]).toBeInstanceOf(MouseEvent);
		await expect.element(toast('Client deleted')).not.toBeInTheDocument();
		expect(onclose).toHaveBeenCalledExactlyOnceWith('action');
	});

	test('an action that calls preventDefault keeps the toast open', async () => {
		await render(Toaster);
		const onclick = vi.fn((event: MouseEvent) => event.preventDefault());
		addToast({ title: 'Retry?', action: { label: 'Retry', onclick } });
		await toast('Retry?').getByRole('button', { name: 'Retry' }).click();
		expect(onclick).toHaveBeenCalledOnce();
		await expect.element(toast('Retry?')).toBeVisible();
	});

	test('updateToast turns a loading toast into a success that closes by itself', async () => {
		fakeTimers();
		await render(Toaster);
		const id = addToast({ title: 'Importing clients', loading: true, closable: false });
		const loading = toast('Importing clients');
		const bar = loading.getByRole('progressbar', { name: 'Importing clients' });
		await expect.element(bar).toHaveAttribute('data-indeterminate');
		expect(loading.element().querySelector('.aurora-circular-loader')).not.toBeNull();
		vi.advanceTimersByTime(60_000);
		expect(visible('Importing clients')).toBe(true);

		updateToast(id, { variant: 'success', title: '248 clients imported', loading: false });
		const done = toast('248 clients imported');
		await expect.element(done).toHaveAttribute('data-variant', 'success');
		await expect.element(done.getByRole('progressbar')).not.toBeInTheDocument();
		expect(done.element().querySelector('.aurora-circular-loader')).toBeNull();
		vi.advanceTimersByTime(5000);
		expect(visible('248 clients imported')).toBe(false);
	});

	test('progress shows a bar that updateToast moves', async () => {
		await render(Toaster);
		const id = addToast({ title: 'Uploading photos', progress: 30, duration: 0 });
		const bar = toast('Uploading photos').getByRole('progressbar', { name: 'Uploading photos' });
		await expect.element(bar).toHaveAttribute('aria-valuenow', '30');
		updateToast(id, { progress: 60 });
		await expect.element(bar).toHaveAttribute('aria-valuenow', '60');
	});

	test('removeToast closes a toast and onclose receives "remove"', async () => {
		await render(Toaster);
		const onclose = vi.fn();
		const id = addInfoToast({ title: 'Going away', duration: 0, onclose });
		await expect.element(toast('Going away')).toBeVisible();
		removeToast(id);
		await expect.element(toast('Going away')).not.toBeInTheDocument();
		expect(onclose).toHaveBeenCalledExactlyOnceWith('remove');
		removeToast(id);
		updateToast(id, { title: 'Ghost' });
		expect(onclose).toHaveBeenCalledOnce();
		expect(visible('Ghost')).toBe(false);
	});

	test('an identical visible toast restarts its timer instead of stacking', async () => {
		fakeTimers();
		await render(Toaster);
		const first = addSuccessToast({ title: 'Saved', duration: 1000 });
		vi.advanceTimersByTime(800);
		expect(addSuccessToast({ title: 'Saved', duration: 1000 })).toBe(first);
		await expect.element(toast('Saved')).toHaveLength(1);
		vi.advanceTimersByTime(800);
		expect(visible('Saved')).toBe(true);
		vi.advanceTimersByTime(200);
		expect(visible('Saved')).toBe(false);

		const a = addSuccessToast({ title: 'Saved', description: 'Client A' });
		const b = addSuccessToast({ title: 'Saved', description: 'Client B' });
		const c = addErrorToast({ title: 'Saved', description: 'Client B' });
		expect(new Set([a, b, c]).size).toBe(3);
	});

	test('loading and progress toasts are never merged', async () => {
		await render(Toaster);
		const a = addToast({ title: 'Syncing', loading: true });
		const b = addToast({ title: 'Syncing', loading: true });
		expect(a).not.toBe(b);
		await expect.element(toast('Syncing')).toHaveLength(2);
	});

	test('beyond 5 toasts the oldest that closes by itself goes', async () => {
		await render(Toaster);
		const onclose = vi.fn();
		addInfoToast({ title: 'Pinned', duration: 0 });
		addInfoToast({ title: 'Toast 1', onclose });
		for (const index of [2, 3, 4, 5]) addInfoToast(`Toast ${index}`);
		expect(toaster.items.map((item) => item.title)).toEqual([
			'Pinned',
			'Toast 2',
			'Toast 3',
			'Toast 4',
			'Toast 5'
		]);
		expect(onclose).toHaveBeenCalledExactlyOnceWith('remove');
		await expect.element(page.getByRole('group')).toHaveLength(5);
	});

	test('limit changes the maximum', async () => {
		await render(Toaster, { limit: 2 });
		for (const index of [1, 2, 3]) addInfoToast(`Toast ${index}`);
		await expect.element(page.getByRole('group')).toHaveLength(2);
		await expect.element(toast('Toast 1')).not.toBeInTheDocument();
	});

	test('announces info and success politely, warnings and errors assertively', async () => {
		await render(Toaster);
		addSuccessToast('Appointment saved');
		addInfoToast({ title: 'New version', description: 'Reload to update.' });
		addWarningToast('Low stock');
		addErrorToast({ title: 'Payment failed', description: 'The card was declined.' });
		const polite = page.getByRole('status');
		const assertive = page.getByRole('alert');
		await expect.element(polite).toHaveTextContent('Appointment saved');
		await expect.element(polite).toHaveTextContent('New version. Reload to update.');
		await expect.element(polite).not.toHaveTextContent('Low stock');
		await expect.element(assertive).toHaveTextContent('Low stock');
		await expect.element(assertive).toHaveTextContent('Payment failed. The card was declined.');
		await expect.element(assertive).not.toHaveTextContent('Appointment saved');
		expect(polite.element().closest('.aurora-toaster')).toBeNull();
	});

	test('toastSnippet replaces each toast and receives close', async () => {
		const toastSnippet = createRawSnippet(
			(args: () => { toast: Toast; close: () => void }) => ({
				render: () => `<button type="button">Custom ${args().toast.title}</button>`,
				setup: (node: Element) => {
					node.addEventListener('click', () => args().close());
				}
			})
		);
		await render(Toaster, { toastSnippet });
		const onclose = vi.fn();
		addInfoToast({ title: 'Snippet', onclose });
		await page.getByRole('button', { name: 'Custom Snippet' }).click();
		expect(onclose).toHaveBeenCalledExactlyOnceWith('dismiss');
		expect(visible('Snippet')).toBe(false);
	});

	describe('with a Dialog open', () => {
		test('the toasts show inside the dialog and stay clickable', async () => {
			await render(ToasterWithDialog, { open: true });
			const dialog = page.getByRole('dialog', { name: 'Edit appointment' });
			await expect.element(dialog).toBeVisible();
			const onclick = vi.fn();
			addSuccessToast({ title: 'Changes saved', action: { label: 'View', onclick } });
			await expect.element(toast('Changes saved')).toBeVisible();
			expect(dialog.element().contains(toast('Changes saved').element())).toBe(true);
			await expect.element(dialog.getByRole('status')).toHaveTextContent('Changes saved');
			await toast('Changes saved').getByRole('button', { name: 'View' }).click();
			expect(onclick).toHaveBeenCalledOnce();
			await expect.element(toast('Changes saved')).not.toBeInTheDocument();
		});

		test('Escape still closes the dialog while a toast is open', async () => {
			let open = true;
			await render(ToasterWithDialog, {
				get open() {
					return open;
				},
				set open(value) {
					open = value;
				}
			});
			const dialog = page.getByRole('dialog', { name: 'Edit appointment' });
			await expect.element(dialog).toBeVisible();
			addInfoToast({ title: 'Still here', duration: 0 });
			await expect.element(toast('Still here')).toBeVisible();
			await userEvent.keyboard('{Escape}');
			await expect.poll(() => open).toBe(false);
		});

		test('on close the toasts go back to the page without a new announcement', async () => {
			const screen = await render(ToasterWithDialog, { open: true });
			await expect.element(page.getByRole('dialog')).toBeVisible();
			addInfoToast({ title: 'Kept', duration: 0 });
			await expect.element(toast('Kept')).toBeVisible();
			await screen.rerender({ open: false });
			await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
			await expect.element(toast('Kept')).toBeVisible();
			expect(toast('Kept').element().closest('dialog')).toBeNull();
			await expect.element(page.getByRole('status')).not.toHaveTextContent('Kept');
			await toast('Kept').getByRole('button', { name: 'Dismiss' }).click();
			await expect.element(toast('Kept')).not.toBeInTheDocument();
		});
	});
});
