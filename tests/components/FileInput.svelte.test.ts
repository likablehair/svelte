import { createRawSnippet } from 'svelte';
import { describe, expect, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import FileInput from '#lib/components/simple/forms/FileInput.svelte';
import { renderWithDefaultLocale } from '../helpers.js';

function file(name: string, size = 10, type = '') {
	return new File([new Uint8Array(size)], name, { type, lastModified: 1 });
}

function drag(target: Element, type: string, files: File[]) {
	const dataTransfer = new DataTransfer();
	for (const item of files) dataTransfer.items.add(item);
	const event = new DragEvent(type, { dataTransfer, bubbles: true, cancelable: true });
	target.dispatchEvent(event);
	return event;
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

function parts(container: Element) {
	return {
		root: container.querySelector<HTMLElement>('.aurora-file-input')!,
		zone: container.querySelector<HTMLElement>('.aurora-file-input-zone')!,
		input: container.querySelector<HTMLInputElement>('input[type="file"]')!
	};
}

describe('FileInput', () => {
	test('renders a native file input named by its label, with the default texts', async () => {
		const screen = await render(FileInput, { label: 'Attachments', description: 'PDF up to 10 MB' });
		const input = screen.getByLabelText('Attachments');
		await expect.element(input).toHaveAttribute('type', 'file');
		await expect.element(input).toHaveAttribute('multiple');
		await expect.element(screen.getByText('Drop files here')).toBeVisible();
		await expect.element(screen.getByText('browse your files')).toBeVisible();
		await expect.element(screen.getByText('· PDF up to 10 MB')).toBeVisible();
	});

	test('without a label the zone text names the input', async () => {
		const screen = await render(FileInput, {});
		await expect.element(screen.getByLabelText(/Drop files here/)).toHaveAttribute('type', 'file');
	});

	test('forwards native attributes to the input and each class to its part', async () => {
		const screen = await render(FileInput, {
			label: 'Documents',
			hint: 'Scans or photos',
			id: 'documents',
			name: 'docs',
			required: true,
			accept: '.pdf',
			'data-testid': 'documents-input',
			class: { container: 'c', label: 'l', zone: 'z', hint: 'h' }
		});
		const input = screen.getByTestId('documents-input');
		await expect.element(input).toHaveAttribute('id', 'documents');
		await expect.element(input).toHaveAttribute('name', 'docs');
		await expect.element(input).toHaveAttribute('accept', '.pdf');
		await expect.element(input).toBeRequired();
		const { root, zone } = parts(screen.container);
		expect(root.classList.contains('c')).toBe(true);
		expect(root.querySelector('.aurora-file-input-label')?.classList.contains('l')).toBe(true);
		expect(root.querySelector<HTMLLabelElement>('.aurora-file-input-label')?.htmlFor).toBe('documents');
		expect(zone.classList.contains('z')).toBe(true);
		expect(root.querySelector('.aurora-file-input-hint')?.classList.contains('h')).toBe(true);
		await expect.element(input).toHaveAccessibleDescription('Scans or photos');
	});

	test('v4 bug: the zone is reached with Tab and shows a focus ring', async () => {
		const screen = await render(FileInput, { label: 'Attachments' });
		await userEvent.keyboard('{Tab}');
		await expect.element(screen.getByLabelText('Attachments')).toHaveFocus();
		const { zone } = parts(screen.container);
		expect(getComputedStyle(zone).outlineStyle).toBe('solid');
	});

	test('picked files are added to the bound list and reported as added', async () => {
		const onchange = vi.fn();
		const props = bound([], { label: 'Attachments', onchange });
		const screen = await render(FileInput, props);
		const input = screen.getByLabelText('Attachments');
		const first = file('a.pdf');
		await userEvent.upload(input, [first]);
		await expect.poll(() => props.files.map((item) => item.name)).toEqual(['a.pdf']);
		expect(onchange).toHaveBeenLastCalledWith({ files: [props.files[0]], added: [props.files[0]], removed: [] });
		await userEvent.upload(input, [file('b.pdf'), file('c.pdf')]);
		await expect.poll(() => props.files.map((item) => item.name)).toEqual(['a.pdf', 'b.pdf', 'c.pdf']);
		expect(onchange.mock.lastCall?.[0].added.map((item: File) => item.name)).toEqual(['b.pdf', 'c.pdf']);
	});

	test('dropped files are added; dragging files over the zone sets data-dragging', async () => {
		const onchange = vi.fn();
		const props = bound([], { onchange });
		const screen = await render(FileInput, props);
		const { root, zone } = parts(screen.container);
		const dropped = file('photo.jpg', 10, 'image/jpeg');
		drag(zone, 'dragenter', [dropped]);
		const over = drag(zone, 'dragover', [dropped]);
		expect(over.defaultPrevented).toBe(true);
		await expect.element(root).toHaveAttribute('data-dragging');
		drag(zone.querySelector('.aurora-file-input-title')!, 'dragenter', [dropped]);
		drag(zone, 'dragleave', [dropped]);
		await expect.element(root).toHaveAttribute('data-dragging');
		const drop = drag(zone, 'drop', [dropped]);
		expect(drop.defaultPrevented).toBe(true);
		await expect.element(root).not.toHaveAttribute('data-dragging');
		expect(props.files).toEqual([dropped]);
		expect(onchange).toHaveBeenCalledWith({ files: [dropped], added: [dropped], removed: [] });
	});

	test('drags without files (text, links) are ignored', async () => {
		const screen = await render(FileInput, {});
		const { root, zone } = parts(screen.container);
		const dataTransfer = new DataTransfer();
		dataTransfer.setData('text/plain', 'hello');
		const event = new DragEvent('dragover', { dataTransfer, bubbles: true, cancelable: true });
		zone.dispatchEvent(new DragEvent('dragenter', { dataTransfer, bubbles: true, cancelable: true }));
		zone.dispatchEvent(event);
		expect(event.defaultPrevented).toBe(false);
		await expect.element(root).not.toHaveAttribute('data-dragging');
	});

	test('replace swaps the files and reports the old ones as removed', async () => {
		const old = file('old.docx');
		const onchange = vi.fn();
		const props = bound([old], { replace: true, maxFiles: 1, onchange });
		const screen = await render(FileInput, props);
		const { root, zone } = parts(screen.container);
		await expect.element(root).not.toHaveAttribute('data-full');
		const fresh = file('new.docx');
		drag(zone, 'drop', [fresh]);
		expect(props.files).toEqual([fresh]);
		expect(onchange).toHaveBeenCalledWith({ files: [fresh], added: [fresh], removed: [old] });
	});

	test('accept and maxSize refuse files, also when dropped, with a message and onreject', async () => {
		const onreject = vi.fn();
		const props = bound([], { label: 'Photos', accept: 'image/*,.heic', maxSize: 1_000_000, onreject });
		const screen = await render(FileInput, props);
		const { root, zone } = parts(screen.container);
		const exe = file('setup.exe', 10, 'application/x-msdownload');
		const big = file('huge.png', 2_000_000, 'image/png');
		const heic = file('IMG_1.HEIC');
		drag(zone, 'drop', [exe, big, heic]);
		expect(props.files).toEqual([heic]);
		expect(onreject).toHaveBeenCalledWith({
			rejected: [
				{ file: exe, reason: 'type' },
				{ file: big, reason: 'size' }
			]
		});
		const alert = screen.getByRole('alert');
		await expect.element(alert).toHaveTextContent('setup.exe: file type not allowed');
		await expect.element(alert).toHaveTextContent('huge.png: larger than 1 MB');
		await expect.element(root).toHaveAttribute('data-state', 'error');
		await expect.element(screen.getByLabelText('Photos')).toHaveAttribute('aria-invalid', 'true');
		drag(zone, 'drop', [file('ok.png', 10, 'image/png')]);
		await expect.element(screen.getByRole('alert')).not.toBeInTheDocument();
		await expect.element(root).not.toHaveAttribute('data-state');
	});

	test('v4 bug: maxFiles refuses the files in excess instead of dropping them silently', async () => {
		const onreject = vi.fn();
		const props = bound([file('a.pdf')], { maxFiles: 2, onreject });
		const screen = await render(FileInput, props);
		const { zone } = parts(screen.container);
		const b = file('b.pdf');
		const c = file('c.pdf');
		drag(zone, 'drop', [b, c]);
		expect(props.files.map((item) => item.name)).toEqual(['a.pdf', 'b.pdf']);
		expect(onreject).toHaveBeenCalledWith({ rejected: [{ file: c, reason: 'count' }] });
		await expect.element(screen.getByRole('alert')).toHaveTextContent('c.pdf: no more than 2 files');
	});

	test('v4 bug: the same file is not added twice', async () => {
		const first = file('report.pdf', 50);
		const onreject = vi.fn();
		const props = bound([first], { onreject });
		const screen = await render(FileInput, props);
		const copy = file('report.pdf', 50);
		drag(parts(screen.container).zone, 'drop', [copy, file('report.pdf', 51)]);
		expect(props.files.map((item) => item.size)).toEqual([50, 51]);
		expect(onreject).toHaveBeenCalledWith({ rejected: [{ file: copy, reason: 'duplicate' }] });
		await expect.element(screen.getByRole('alert')).toHaveTextContent('report.pdf: already added');
	});

	test('with maxFiles={1} the picker takes one file and the zone is full once it is chosen', async () => {
		const props = bound([], { label: 'Logo', maxFiles: 1 });
		const screen = await render(FileInput, props);
		const { root, input } = parts(screen.container);
		expect(input.multiple).toBe(false);
		await expect.element(screen.getByText('Drop a file here')).toBeVisible();
		props.files = [file('logo.png')];
		await expect.element(root).toHaveAttribute('data-full');
		await expect.element(screen.getByLabelText('Logo')).toHaveAttribute('aria-disabled', 'true');
		const click = new MouseEvent('click', { bubbles: true, cancelable: true });
		input.dispatchEvent(click);
		expect(click.defaultPrevented).toBe(true);
		drag(parts(screen.container).zone, 'drop', [file('other.png')]);
		expect(props.files.map((item) => item.name)).toEqual(['logo.png']);
		props.files = [];
		await expect.element(root).not.toHaveAttribute('data-full');
	});

	test('disabled turns off the input and ignores drops', async () => {
		const props = bound([], { label: 'Contract', disabled: true });
		const screen = await render(FileInput, props);
		await expect.element(screen.getByLabelText('Contract')).toBeDisabled();
		const { root, zone } = parts(screen.container);
		await expect.element(root).toHaveAttribute('data-disabled');
		drag(zone, 'dragenter', [file('a.pdf')]);
		await expect.element(root).not.toHaveAttribute('data-dragging');
		drag(zone, 'drop', [file('a.pdf')]);
		expect(props.files).toEqual([]);
	});

	test('readonly hides the zone and the input', async () => {
		const screen = await render(FileInput, { label: 'Contract', readonly: true, hint: 'Signed copy' });
		expect(screen.container.querySelector('.aurora-file-input-zone')).toBeNull();
		expect(screen.container.querySelector('input')).toBeNull();
		await expect.element(screen.getByText('Signed copy')).toBeVisible();
	});

	test('the files go with a native form; required and reset work', async () => {
		const form = document.createElement('form');
		document.body.append(form);
		const onchange = vi.fn();
		const props = bound([], { label: 'Attachments', name: 'docs', required: true, onchange });
		const screen = await render(FileInput, { target: form, props });
		expect(form.checkValidity()).toBe(false);
		const { zone } = parts(screen.container);
		drag(zone, 'drop', [file('a.pdf')]);
		drag(zone, 'drop', [file('b.pdf')]);
		await expect.poll(() => new FormData(form).getAll('docs').map((value) => (value as File).name)).toEqual([
			'a.pdf',
			'b.pdf'
		]);
		expect(form.checkValidity()).toBe(true);
		const before = [...props.files];
		form.reset();
		expect(props.files).toEqual([]);
		expect(onchange).toHaveBeenLastCalledWith({ files: [], added: [], removed: before });
		form.remove();
	});

	test('v4 bug: a removed file can be picked again', async () => {
		const props = bound([], { label: 'Attachments' });
		const screen = await render(FileInput, props);
		const input = screen.getByLabelText('Attachments');
		const same = file('a.pdf');
		await userEvent.upload(input, [same]);
		await expect.poll(() => props.files.length).toBe(1);
		props.files = [];
		await expect.poll(() => (input.element() as HTMLInputElement).files?.length).toBe(0);
		await userEvent.upload(input, [same]);
		await expect.poll(() => props.files.length).toBe(1);
	});

	test('title, browseLabel, description, icon and compact change the zone', async () => {
		const screen = await render(FileInput, {
			title: 'Import the customers',
			browseLabel: 'choose a file',
			description: 'CSV',
			icon: 'M0 0H24V24H0Z',
			compact: true
		});
		const { root } = parts(screen.container);
		await expect.element(root).toHaveAttribute('data-compact');
		await expect.element(screen.getByText('Import the customers')).toBeVisible();
		await expect.element(screen.getByText('choose a file')).toBeVisible();
		expect(root.querySelector('.aurora-file-input-icon path')?.getAttribute('d')).toBe('M0 0H24V24H0Z');
	});

	test('bodySnippet replaces the zone content and knows when files are dragged over', async () => {
		const bodySnippet = createRawSnippet((state: () => { dragging: boolean; disabled: boolean }) => ({
			render: () => `<b>${state().dragging ? 'Release' : 'Drop the letter'}</b>`,
			setup: (node) => {
				$effect(() => {
					node.textContent = state().dragging ? 'Release' : 'Drop the letter';
				});
			}
		}));
		const screen = await render(FileInput, { bodySnippet });
		await expect.element(screen.getByText('Drop the letter')).toBeVisible();
		expect(screen.container.querySelector('.aurora-file-input-title')).toBeNull();
		drag(parts(screen.container).zone, 'dragenter', [file('a.docx')]);
		await expect.element(screen.getByText('Release')).toBeVisible();
	});

	test('rejectedSnippet replaces the messages about refused files', async () => {
		const rejectedSnippet = createRawSnippet((state: () => { rejected: { file: File }[] }) => ({
			render: () => `<span>${state().rejected.length} refused</span>`
		}));
		const screen = await render(FileInput, { accept: '.pdf', rejectedSnippet });
		drag(parts(screen.container).zone, 'drop', [file('a.exe'), file('b.exe')]);
		await expect.element(screen.getByRole('alert')).toHaveTextContent('2 refused');
	});

	test('texts follow locale, and their props win', async () => {
		const screen = await render(FileInput, { locale: 'it', maxSize: 1_500_000 });
		await expect.element(screen.getByText('Trascina qui i file')).toBeVisible();
		await expect.element(screen.getByText('sfoglia i file')).toBeVisible();
		drag(parts(screen.container).zone, 'drop', [file('foto.png', 2_000_000)]);
		await expect.element(screen.getByRole('alert')).toHaveTextContent('foto.png: più grande di 1,5 MB');
		await screen.unmount();
		const own = await render(FileInput, { locale: 'it', title: 'Carica il listino' });
		await expect.element(own.getByText('Carica il listino')).toBeVisible();
	});

	test('follow setDefaultLocale, and the locale prop wins over it', async () => {
		const inherited = await renderWithDefaultLocale('it', FileInput, {});
		await expect.element(inherited.getByText('Trascina qui i file')).toBeVisible();
		await inherited.unmount();
		const own = await renderWithDefaultLocale('it', FileInput, { locale: 'en' });
		await expect.element(own.getByText('Drop files here')).toBeVisible();
	});

	test('instance CSS variables style the zone', async () => {
		const screen = await render(FileInput, {});
		const { root, zone } = parts(screen.container);
		root.style.setProperty('--file-input-border-color', 'rgb(255, 0, 0)');
		root.style.setProperty('--file-input-background', 'rgb(0, 128, 0)');
		root.style.setProperty('--file-input-height', '200px');
		expect(getComputedStyle(zone).borderTopColor).toBe('rgb(255, 0, 0)');
		expect(getComputedStyle(zone).backgroundColor).toBe('rgb(0, 128, 0)');
		expect(zone.getBoundingClientRect().height).toBe(200);
	});
});
