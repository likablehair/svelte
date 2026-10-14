import { createRawSnippet } from 'svelte';
import { SvelteMap } from 'svelte/reactivity';
import { describe, expect, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import FileInputList from '#lib/components/simple/forms/FileInputList.svelte';
import type { FileStatus } from '#lib/utils/files.js';
import { renderWithDefaultLocale, tooltipText } from '../helpers.js';

function file(name: string, size = 10, type = '') {
	return new File([new Uint8Array(size)], name, { type, lastModified: 1 });
}

const PIXEL =
	'<svg xmlns="http://www.w3.org/2000/svg" width="4" height="4"><rect width="4" height="4" fill="red"/></svg>';

function image(name: string) {
	return new File([PIXEL], name, { type: 'image/svg+xml', lastModified: 1 });
}

function drop(target: Element, files: File[]) {
	const dataTransfer = new DataTransfer();
	for (const item of files) dataTransfer.items.add(item);
	target.dispatchEvent(new DragEvent('drop', { dataTransfer, bubbles: true, cancelable: true }));
}

function bound(initial: File[] = [], props: Record<string, unknown> = {}) {
	let files = $state(initial);
	return {
		...props,
		get files() {
			return files;
		},
		set files(value) {
			files = value;
		}
	};
}

const rowsOf = (container: Element) => [...container.querySelectorAll<HTMLElement>('.aurora-file-input-list-item')];

describe('FileInputList', () => {
	test('lists the files below the zone with type, size and a remove button', async () => {
		const pdf = file('invoice.pdf', 284_000, 'application/pdf');
		const sheet = file('prices.xlsx', 1_200_000);
		const other = file('notes.bin', 12);
		const screen = await render(FileInputList, bound([pdf, sheet, other], { label: 'Attachments' }));
		const list = screen.getByRole('list', { name: 'Files' });
		await expect.element(list).toBeVisible();
		const rows = rowsOf(screen.container);
		expect(rows.map((row) => row.dataset.kind)).toEqual(['pdf', 'spreadsheet', 'other']);
		await expect.element(screen.getByText('284 kB')).toBeVisible();
		await expect.element(screen.getByText('1.2 MB')).toBeVisible();
		await expect.element(screen.getByText('12 bytes')).toBeVisible();
		const remove = screen.getByRole('button', { name: 'Remove invoice.pdf' });
		await expect.element(remove).toBeVisible();
		expect(tooltipText(remove.element())).toBe('Remove');
		const zone = screen.container.querySelector('.aurora-file-input-zone')!;
		expect(zone.compareDocumentPosition(list.element()) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
	});

	test('the remove button takes the file out, reports it and moves the focus to the next one', async () => {
		const a = file('a.pdf');
		const b = file('b.pdf');
		const c = file('c.pdf');
		const onchange = vi.fn();
		const props = bound([a, b, c], { onchange });
		const screen = await render(FileInputList, props);
		await screen.getByRole('button', { name: 'Remove b.pdf' }).click();
		expect(props.files).toEqual([a, c]);
		expect(onchange).toHaveBeenCalledWith({ files: [a, c], added: [], removed: [b] });
		await expect.element(screen.getByRole('button', { name: 'Remove c.pdf' })).toHaveFocus();
		await userEvent.keyboard('{Enter}');
		await expect.element(screen.getByRole('button', { name: 'Remove a.pdf' })).toHaveFocus();
		await userEvent.keyboard('{Enter}');
		expect(props.files).toEqual([]);
		await expect.element(screen.getByLabelText(/Drop files here/)).toHaveFocus();
	});

	test('added files join the list and the zone becomes compact while files are listed', async () => {
		const props = bound([]);
		const screen = await render(FileInputList, props);
		const root = screen.container.querySelector<HTMLElement>('.aurora-file-input')!;
		await expect.element(root).not.toHaveAttribute('data-compact');
		expect(screen.container.querySelector('ul')).toBeNull();
		drop(screen.container.querySelector('.aurora-file-input-zone')!, [file('a.pdf')]);
		await expect.element(screen.getByText('a.pdf')).toBeVisible();
		await expect.element(root).toHaveAttribute('data-compact');
		await screen.unmount();
		const fixed = await render(FileInputList, bound([file('a.pdf')], { compact: false }));
		await expect.element(fixed.container.querySelector<HTMLElement>('.aurora-file-input')!).not.toHaveAttribute('data-compact');
	});

	test('fileStatus shows progress, done and error on each row', async () => {
		const uploading = file('photo.jpg');
		const done = file('invoice.pdf');
		const failed = file('archive.zip');
		const waiting = file('notes.txt');
		const statuses = new SvelteMap<File, FileStatus>([
			[uploading, { state: 'uploading', progress: 64 }],
			[done, { state: 'done' }],
			[failed, { state: 'error', message: 'too large for the server' }]
		]);
		const screen = await render(
			FileInputList,
			bound([uploading, done, failed, waiting], { fileStatus: (item: File) => statuses.get(item) })
		);
		const progress = screen.getByRole('progressbar', { name: 'Uploading photo.jpg' });
		await expect.element(progress).toHaveAttribute('aria-valuenow', '64');
		await expect.element(screen.getByText('64%')).toBeVisible();
		await expect.element(screen.getByText('· Uploaded')).toBeVisible();
		await expect.element(screen.getByText('· too large for the server')).toBeVisible();
		const rows = rowsOf(screen.container);
		expect(rows.map((row) => row.dataset.status)).toEqual(['uploading', 'done', 'error', undefined]);
		statuses.set(uploading, { state: 'uploading' });
		await expect.element(progress).not.toHaveAttribute('aria-valuenow');
		statuses.set(uploading, { state: 'done', message: 'Saved' });
		await expect.element(screen.getByText('· Saved')).toBeVisible();
		await expect.element(screen.getByRole('progressbar')).not.toBeInTheDocument();
	});

	test('images get a thumbnail whose object URL is revoked when the file leaves the list', async () => {
		const revoke = vi.spyOn(URL, 'revokeObjectURL');
		const photo = image('photo.svg');
		const props = bound([photo, file('doc.pdf', 10, 'application/pdf')], { view: 'grid' });
		const screen = await render(FileInputList, props);
		await expect.element(screen.getByRole('list')).toHaveAttribute('data-view', 'grid');
		const thumbnail = screen.container.querySelector<HTMLImageElement>('.aurora-file-input-list-thumbnail')!;
		expect(thumbnail.src.startsWith('blob:')).toBe(true);
		expect(screen.container.querySelectorAll('.aurora-file-input-list-thumbnail')).toHaveLength(1);
		const url = thumbnail.src;
		await screen.getByRole('button', { name: 'Remove photo.svg' }).click();
		expect(revoke).toHaveBeenCalledWith(url);
		revoke.mockRestore();
	});

	test('readonly shows only the list, and says when it is empty', async () => {
		const screen = await render(FileInputList, bound([file('contract.pdf')], { label: 'Contract', readonly: true }));
		await expect.element(screen.getByText('contract.pdf')).toBeVisible();
		expect(screen.container.querySelector('.aurora-file-input-zone')).toBeNull();
		await expect.element(screen.getByRole('button')).not.toBeInTheDocument();
		await screen.unmount();
		const empty = await render(FileInputList, bound([], { readonly: true }));
		await expect.element(empty.getByText('No files')).toBeVisible();
		await empty.unmount();
		const own = await render(FileInputList, bound([], { readonly: true, emptyLabel: 'No order yet' }));
		await expect.element(own.getByText('No order yet')).toBeVisible();
	});

	test('disabled disables the zone and the remove buttons', async () => {
		const screen = await render(FileInputList, bound([file('a.pdf')], { disabled: true }));
		await expect.element(screen.getByRole('button', { name: 'Remove a.pdf' })).toBeDisabled();
		await expect.element(screen.getByLabelText(/Drop files here/)).toBeDisabled();
	});

	test('with maxFiles reached the zone is full until a file is removed', async () => {
		const props = bound([file('logo.png')], { maxFiles: 1 });
		const screen = await render(FileInputList, props);
		const root = screen.container.querySelector<HTMLElement>('.aurora-file-input')!;
		await expect.element(root).toHaveAttribute('data-full');
		await screen.getByRole('button', { name: 'Remove logo.png' }).click();
		await expect.element(root).not.toHaveAttribute('data-full');
	});

	test('v4 bug: two files with the same name both show up', async () => {
		const screen = await render(FileInputList, bound([file('scan.pdf', 10), file('scan.pdf', 20)]));
		expect(rowsOf(screen.container)).toHaveLength(2);
	});

	test('v4 bug: clicking a file does not open an alert', async () => {
		const alert = vi.spyOn(window, 'alert').mockImplementation(() => {});
		const screen = await render(FileInputList, bound([file('a.pdf')]));
		await screen.getByText('a.pdf').click();
		expect(alert).not.toHaveBeenCalled();
		alert.mockRestore();
	});

	test('--file-input-list-height sets the height of the field and the list scrolls', async () => {
		const files = Array.from({ length: 12 }, (_, index) => file(`file-${index}.pdf`));
		const screen = await render(FileInputList, bound(files));
		const root = screen.container.querySelector<HTMLElement>('.aurora-file-input')!;
		root.style.setProperty('--file-input-list-height', '300px');
		const list = screen.container.querySelector<HTMLElement>('.aurora-file-input-list-items')!;
		await expect.poll(() => root.getBoundingClientRect().height).toBe(300);
		expect(list.scrollHeight).toBeGreaterThan(list.clientHeight);
		const zone = screen.container.querySelector<HTMLElement>('.aurora-file-input-zone')!;
		expect(zone.getBoundingClientRect().bottom).toBeLessThanOrEqual(list.getBoundingClientRect().top);
	});

	test('passes the FileInput props through and puts each class on its part', async () => {
		const screen = await render(
			FileInputList,
			bound([file('a.pdf')], {
				label: 'Attachments',
				name: 'docs',
				accept: '.pdf',
				class: { container: 'c', zone: 'z', list: 'l', item: 'i' }
			})
		);
		const input = screen.getByLabelText('Attachments');
		await expect.element(input).toHaveAttribute('name', 'docs');
		await expect.element(input).toHaveAttribute('accept', '.pdf');
		const root = screen.container.querySelector<HTMLElement>('.aurora-file-input')!;
		expect(root.classList.contains('aurora-file-input-list')).toBe(true);
		expect(root.classList.contains('c')).toBe(true);
		expect(root.querySelector('.aurora-file-input-zone')?.classList.contains('z')).toBe(true);
		expect(root.querySelector('ul')?.classList.contains('l')).toBe(true);
		expect(root.querySelector('li')?.classList.contains('i')).toBe(true);
	});

	test('fileSnippet, fileIconSnippet and fileListSnippet replace their parts', async () => {
		const fileIconSnippet = createRawSnippet((state: () => { kind: string }) => ({
			render: () => `<i>${state().kind}</i>`
		}));
		const icons = await render(FileInputList, bound([file('a.pdf', 10, 'application/pdf')], { fileIconSnippet }));
		await expect.element(icons.getByText('pdf', { exact: true })).toBeVisible();
		await icons.unmount();
		const fileSnippet = createRawSnippet((state: () => { file: File }) => ({
			render: () => `<span>custom ${state().file.name}</span>`
		}));
		const rows = await render(FileInputList, bound([file('a.pdf')], { fileSnippet }));
		await expect.element(rows.getByText('custom a.pdf')).toBeVisible();
		await expect.element(rows.getByRole('button', { name: /Remove/ })).not.toBeInTheDocument();
		await rows.unmount();
		const fileListSnippet = createRawSnippet((state: () => { files: File[] }) => ({
			render: () => `<p>${state().files.length} files</p>`
		}));
		const whole = await render(FileInputList, bound([file('a.pdf'), file('b.pdf')], { fileListSnippet }));
		await expect.element(whole.getByText('2 files')).toBeVisible();
		expect(whole.container.querySelector('ul')).toBeNull();
	});

	test('texts and sizes follow locale, and their props win', async () => {
		const screen = await render(FileInputList, bound([file('listino.xlsx', 1_250_000)], { locale: 'it' }));
		await expect.element(screen.getByRole('list', { name: 'File' })).toBeVisible();
		await expect.element(screen.getByText('1,3 MB')).toBeVisible();
		const remove = screen.getByRole('button', { name: 'Rimuovi listino.xlsx' });
		expect(tooltipText(remove.element())).toBe('Rimuovi');
		await expect.element(screen.getByText('Trascina qui i file')).toBeVisible();
		await screen.unmount();
		const own = await render(FileInputList, bound([file('a.pdf')], { locale: 'it', removeLabel: 'Togli' }));
		expect(tooltipText(own.getByRole('button', { name: 'Rimuovi a.pdf' }).element())).toBe('Togli');
	});

	test('follow setDefaultLocale, and the locale prop wins over it', async () => {
		const inherited = await renderWithDefaultLocale('it', FileInputList, { readonly: true, files: [] });
		await expect.element(inherited.getByText('Nessun file')).toBeVisible();
		await inherited.unmount();
		const own = await renderWithDefaultLocale('it', FileInputList, { readonly: true, files: [], locale: 'en' });
		await expect.element(own.getByText('No files')).toBeVisible();
	});

	test('instance CSS variables style the rows', async () => {
		const screen = await render(FileInputList, bound([file('a.pdf', 10, 'application/pdf')]));
		const root = screen.container.querySelector<HTMLElement>('.aurora-file-input')!;
		root.style.setProperty('--file-input-list-item-background', 'rgb(0, 128, 0)');
		root.style.setProperty('--file-input-list-icon-color', 'rgb(255, 0, 0)');
		const row = rowsOf(screen.container)[0];
		expect(getComputedStyle(row).backgroundColor).toBe('rgb(0, 128, 0)');
		expect(getComputedStyle(row.querySelector('.aurora-file-input-list-icon')!).color).toBe('rgb(255, 0, 0)');
	});
});
