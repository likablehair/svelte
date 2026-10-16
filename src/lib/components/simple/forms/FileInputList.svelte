<!-- @component
FileInput with the chosen files listed below the zone: each row shows an icon in the color of the file type (a thumbnail for images), the name, the size and a button that removes it. While files are listed the zone becomes a single line (`compact`). The app can show the upload of each file with `fileStatus`: a progress bar, a check when it is done, an error with its message. `view="grid"` shows cards with large thumbnails instead of rows; `readonly` shows only the list. It takes every prop of FileInput (`accept`, `maxSize`, `maxFiles`, `replace`, `name`, ...), and its zone is styled with the `--file-input-*` variables of FileInput. `--file-input-list-height` sets the height of the whole field, and the list scrolls when it does not fit.
-->
<script lang="ts">
	import '../../../css/tokens.css';
	import './FileInputList.css';
	import { tick, type ComponentProps, type Snippet } from 'svelte';
	import FileInput from './FileInput.svelte';
	import Button from '../buttons/Button.svelte';
	import Icon from '../media/Icon.svelte';
	import Tooltip from '../common/Tooltip.svelte';
	import ProgressBar from '../progress/ProgressBar.svelte';
	import { inheritedLocale } from '../../../utils/locale.js';
	import { libraryTexts } from '../../../utils/texts.js';
	import {
		canPreview,
		fileKind,
		formatFileSize,
		objectUrl,
		type FileKind,
		type FileStatus
	} from '../../../utils/files.js';

	const ICONS: Record<FileKind, string> = {
		pdf: 'M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3M9.5 11.5C9.5 12.3 8.8 13 8 13H7V15H5.5V9H8C8.8 9 9.5 9.7 9.5 10.5V11.5M14.5 13.5C14.5 14.3 13.8 15 13 15H10.5V9H13C13.8 9 14.5 9.7 14.5 10.5V13.5M18.5 10.5H17V11.5H18.5V13H17V15H15.5V9H18.5V10.5M12 10.5H13V13.5H12V10.5M7 10.5H8V11.5H7V10.5Z',
		image:
			'M19,19H5V5H19M19,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3M13.96,12.29L11.21,15.83L9.25,13.47L6.5,17H17.5L13.96,12.29Z',
		spreadsheet:
			'M14 2H6C4.89 2 4 2.9 4 4V20C4 21.11 4.89 22 6 22H18C19.11 22 20 21.11 20 20V8L14 2M18 20H6V4H13V9H18V20M12.9 14.5L15.8 19H14L12 15.6L10 19H8.2L11.1 14.5L8.2 10H10L12 13.4L14 10H15.8L12.9 14.5Z',
		document:
			'M14 2H6C4.89 2 4 2.9 4 4V20C4 21.11 4.89 22 6 22H18C19.11 22 20 21.11 20 20V8L14 2M18 20H6V4H13V9H18V20M17.35 10L15.25 19H13.85L12.05 12.21L10.25 19H8.85L6.65 10H8.15L9.55 16.81L11.35 10H12.65L14.45 16.81L15.85 10H17.35Z',
		presentation:
			'M14 2H6C4.89 2 4 2.9 4 4V20C4 21.11 4.89 22 6 22H18C19.11 22 20 21.11 20 20V8L14 2M18 20H6V4H13V9H18V20M15.2 10.8C14.7 10.3 14.1 10 12.8 10H9V19H10.6V15.7H12.8C14.1 15.7 14.6 15.5 15.2 15C15.8 14.5 16 13.8 16 12.9C16 12 15.8 11.4 15.2 10.8M13.9 14C13.6 14.3 13.3 14.5 12.7 14.5H10.6V11.3H12.6C13.2 11.3 13.6 11.5 13.9 11.8C14.2 12.1 14.3 12.4 14.3 12.9S14.2 13.7 13.9 14Z',
		archive:
			'M20 6H12L10 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V8C22 6.9 21.1 6 20 6M20 18H16V16H14V18H4V8H14V10H16V8H20V18M16 12V10H18V12H16M14 12H16V14H14V12M18 16H16V14H18V16Z',
		video:
			'M14,2L20,8V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V4A2,2 0 0,1 6,2H14M18,20V9H13V4H6V20H18M16,18L13.5,16.3V18H8V13H13.5V14.7L16,13V18Z',
		audio:
			'M14,2L20,8V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V4A2,2 0 0,1 6,2H14M18,20V9H13V4H6V20H18M13,10V12H11V17A2,2 0 0,1 9,19A2,2 0 0,1 7,17A2,2 0 0,1 9,15C9.4,15 9.7,15.1 10,15.3V10H13Z',
		other:
			'M6,2A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2H6M6,4H13V9H18V20H6V4M8,12V14H16V12H8M8,16V18H13V16H8Z'
	};
	const CLOSE_ICON =
		'M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z';
	const DONE_ICON =
		'M12 2C6.5 2 2 6.5 2 12S6.5 22 12 22 22 17.5 22 12 17.5 2 12 2M10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z';
	const ERROR_ICON =
		'M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z';

	interface Props extends Omit<ComponentProps<typeof FileInput>, 'compact' | 'readonly' | 'children' | 'class'> {
		/** `list`: one row per file. `grid`: cards with a large thumbnail for images. */
		view?: 'list' | 'grid';
		/** One-line zone. `auto` makes it compact while files are listed. */
		compact?: boolean | 'auto';
		/** Shows only the list: no zone and no remove buttons. With no files it says "No files". */
		readonly?: boolean;
		/** Upload state of a file, read for each row: progress, done or error, and a message. It can read reactive state (`$state`, `SvelteMap`). */
		fileStatus?: (file: File) => FileStatus | undefined;
		/** Tooltip of the remove buttons. Defaults to "Remove", in the language of `locale`. */
		removeLabel?: string;
		/** Text of the empty list with `readonly`. Defaults to "No files", in the language of `locale`. */
		emptyLabel?: string;
		/** Extra classes for each part. */
		class?: {
			container?: string;
			label?: string;
			zone?: string;
			hint?: string;
			list?: string;
			item?: string;
		};
		/** Replaces the content of a row or card. `remove` takes the file out of the list. */
		fileSnippet?: Snippet<[{ file: File; kind: FileKind; status: FileStatus | undefined; remove: () => void }]>;
		/** Replaces the icon or thumbnail of a file. */
		fileIconSnippet?: Snippet<[{ file: File; kind: FileKind }]>;
		/** Replaces the whole list. `remove` takes a file out of it. */
		fileListSnippet?: Snippet<[{ files: File[]; remove: (file: File) => void }]>;
	}

	let {
		files = $bindable(),
		view = 'list',
		compact = 'auto',
		readonly = false,
		disabled = false,
		fileStatus,
		removeLabel,
		emptyLabel,
		locale: localeProp,
		input = $bindable(),
		class: clazz = {},
		onchange,
		fileSnippet,
		fileIconSnippet,
		fileListSnippet,
		...rest
	}: Props = $props();

	const defaultLocale = inheritedLocale();
	let locale = $derived(localeProp ?? defaultLocale());
	let texts = $derived(libraryTexts(locale).fileInputList);

	const ids = new WeakMap<File, number>();
	let nextId = 0;
	function idOf(file: File): number {
		let id = ids.get(file);
		if (id === undefined) {
			id = nextId++;
			ids.set(file, id);
		}
		return id;
	}

	let list = $derived(files ?? []);
	let rows = $derived.by(() => {
		const seen = new Map<File, number>();
		return list.map((file) => {
			const count = seen.get(file) ?? 0;
			seen.set(file, count + 1);
			return { file, key: `${idOf(file)}-${count}`, kind: fileKind(file) };
		});
	});

	let inputNode = $state<HTMLInputElement>();
	let listNode = $state<HTMLElement>();
	let removeButtons = $state<Record<string, HTMLButtonElement | HTMLAnchorElement | undefined>>({});

	async function remove(file: File) {
		const before = files ?? [];
		const index = before.indexOf(file);
		if (index < 0) return;
		const hadFocus = !!listNode?.contains(document.activeElement);
		const next = before.filter((_, position) => position !== index);
		files = next;
		onchange?.({ files: next, added: [], removed: [file] });
		if (!hadFocus) return;
		await tick();
		const buttons = listNode?.querySelectorAll<HTMLElement>('.aurora-file-input-list-remove') ?? [];
		const target = buttons[Math.min(index, buttons.length - 1)] ?? inputNode;
		target?.focus();
	}

	function details(file: File, status: FileStatus | undefined): string | undefined {
		if (status?.message) return status.message;
		if (status?.state === 'done') return texts.done;
		if (status?.state === 'error') return texts.error;
		return undefined;
	}
</script>

<FileInput
	{...rest}
	bind:files
	bind:input={() => inputNode, (node) => (inputNode = input = node)}
	locale={localeProp}
	{disabled}
	{readonly}
	compact={compact === 'auto' ? list.length > 0 : compact}
	{onchange}
	class={{
		container: ['aurora-file-input-list', clazz.container].filter(Boolean).join(' '),
		label: clazz.label,
		zone: clazz.zone,
		hint: clazz.hint
	}}
>
	{#if fileListSnippet}
		{@render fileListSnippet({ files: list, remove })}
	{:else if rows.length > 0}
		<ul
			class={['aurora-file-input-list-items', clazz.list]}
			data-view={view}
			aria-label={texts.list}
			bind:this={listNode}
		>
			{#each rows as row (row.key)}
				{@const status = fileStatus?.(row.file)}
				{@const message = details(row.file, status)}
				<li
					class={['aurora-file-input-list-item', clazz.item]}
					data-kind={row.kind}
					data-status={status?.state}
				>
					{#if fileSnippet}
						{@render fileSnippet({ file: row.file, kind: row.kind, status, remove: () => remove(row.file) })}
					{:else}
						<span class="aurora-file-input-list-icon">
							{#if fileIconSnippet}
								{@render fileIconSnippet({ file: row.file, kind: row.kind })}
							{:else if canPreview(row.file)}
								<img class="aurora-file-input-list-thumbnail" alt="" {@attach objectUrl(row.file)} />
							{:else}
								<Icon path={ICONS[row.kind]} />
							{/if}
						</span>
						<span class="aurora-file-input-list-meta">
							<span class="aurora-file-input-list-name">{row.file.name}</span>
							{#if status?.state === 'uploading'}
								<ProgressBar
									class="aurora-file-input-list-progress"
									value={status.progress ?? 0}
									indeterminate={status.progress == null}
									aria-label={texts.uploading.replace('{name}', row.file.name)}
								/>
							{:else}
								<span class="aurora-file-input-list-details"
									>{formatFileSize(row.file.size, locale)}{#if message}<span class="aurora-file-input-list-message"
											>{' · '}{message}</span
										>{/if}</span
								>
							{/if}
						</span>
						{#if status?.state === 'uploading' && status.progress != null}
							<span class="aurora-file-input-list-percent">{Math.round(status.progress)}%</span>
						{:else if status?.state === 'done'}
							<Icon path={DONE_ICON} class="aurora-file-input-list-status" />
						{:else if status?.state === 'error'}
							<Icon path={ERROR_ICON} class="aurora-file-input-list-status" />
						{/if}
						{#if !readonly}
							<Button
								class="aurora-file-input-list-remove"
								buttonType="icon"
								variant="secondary"
								size="sm"
								icon={CLOSE_ICON}
								{disabled}
								aria-label={texts.removeFile.replace('{name}', row.file.name)}
								bind:buttonElement={removeButtons[row.key]}
								onclick={() => remove(row.file)}
							/>
							<Tooltip activator={removeButtons[row.key]} text={removeLabel ?? texts.remove} />
						{/if}
					{/if}
				</li>
			{/each}
		</ul>
	{:else if readonly}
		<p class="aurora-file-input-list-empty">{emptyLabel ?? texts.empty}</p>
	{/if}
</FileInput>

<style>
	@layer reset, theme, base, global.base, global.theme, global.components, components, utilities;

	@layer global.components {
		:global(.aurora-file-input.aurora-file-input-list) {
			width: var(--file-input-list-width, var(--file-input-list-default-width));
			height: var(--file-input-list-height, var(--file-input-list-default-height));
		}

		.aurora-file-input-list-items {
			display: flex;
			flex: 0 1 auto;
			flex-direction: column;
			gap: var(--file-input-list-gap, var(--file-input-list-default-gap));
			box-sizing: border-box;
			min-height: 0;
			margin: calc(-1 * var(--global-focus-ring-width));
			padding: var(--global-focus-ring-width);
			overflow: auto;
			list-style: none;
		}

		.aurora-file-input-list-items[data-view='grid'] {
			display: grid;
			grid-template-columns: repeat(
				auto-fill,
				minmax(var(--file-input-list-card-min-width, var(--file-input-list-default-card-min-width)), 1fr)
			);
			align-content: start;
		}

		.aurora-file-input-list-item {
			--_kind: var(--file-input-list-default-other-color);

			position: relative;
			display: flex;
			align-items: center;
			gap: var(--file-input-list-item-gap, var(--file-input-list-default-item-gap));
			box-sizing: border-box;
			min-width: 0;
			padding: var(--file-input-list-item-padding, var(--file-input-list-default-item-padding));
			border: var(--file-input-list-item-border-width, var(--file-input-list-default-item-border-width)) solid
				var(--file-input-list-item-border-color, var(--file-input-list-default-item-border-color));
			border-radius: var(--file-input-list-item-border-radius, var(--file-input-list-default-item-border-radius));
			background: var(--file-input-list-item-background, var(--file-input-list-default-item-background));
		}

		.aurora-file-input-list-item[data-kind='pdf'] {
			--_kind: var(--file-input-list-default-pdf-color);
		}

		.aurora-file-input-list-item[data-kind='image'] {
			--_kind: var(--file-input-list-default-image-color);
		}

		.aurora-file-input-list-item[data-kind='spreadsheet'] {
			--_kind: var(--file-input-list-default-spreadsheet-color);
		}

		.aurora-file-input-list-item[data-kind='document'] {
			--_kind: var(--file-input-list-default-document-color);
		}

		.aurora-file-input-list-item[data-kind='presentation'] {
			--_kind: var(--file-input-list-default-presentation-color);
		}

		.aurora-file-input-list-item[data-kind='archive'] {
			--_kind: var(--file-input-list-default-archive-color);
		}

		.aurora-file-input-list-item[data-kind='video'] {
			--_kind: var(--file-input-list-default-video-color);
		}

		.aurora-file-input-list-item[data-kind='audio'] {
			--_kind: var(--file-input-list-default-audio-color);
		}

		.aurora-file-input-list-icon {
			--icon-size: var(--file-input-list-icon-size, var(--file-input-list-default-icon-size));

			display: grid;
			flex-shrink: 0;
			place-items: center;
			width: var(--file-input-list-icon-box-size, var(--file-input-list-default-icon-box-size));
			height: var(--file-input-list-icon-box-size, var(--file-input-list-default-icon-box-size));
			overflow: hidden;
			border-radius: var(--file-input-list-icon-border-radius, var(--file-input-list-default-icon-border-radius));
			background: var(--file-input-list-icon-background, color-mix(in oklab, var(--_kind) 12%, transparent));
			color: var(--file-input-list-icon-color, var(--_kind));
		}

		.aurora-file-input-list-thumbnail {
			width: 100%;
			height: 100%;
			object-fit: cover;
		}

		.aurora-file-input-list-meta {
			display: flex;
			flex: 1;
			flex-direction: column;
			gap: 4px;
			min-width: 0;
		}

		.aurora-file-input-list-name {
			overflow: hidden;
			color: var(--file-input-list-name-color, var(--file-input-list-default-name-color));
			font-size: var(--file-input-list-name-font-size, var(--file-input-list-default-name-font-size));
			font-weight: var(--file-input-list-name-font-weight, var(--file-input-list-default-name-font-weight));
			text-overflow: ellipsis;
			white-space: nowrap;
		}

		.aurora-file-input-list-details,
		.aurora-file-input-list-percent {
			overflow: hidden;
			color: var(--file-input-list-details-color, var(--file-input-list-default-details-color));
			font-family: var(--file-input-list-details-font-family, var(--file-input-list-default-details-font-family));
			font-size: var(--file-input-list-details-font-size, var(--file-input-list-default-details-font-size));
			font-variant-numeric: tabular-nums;
			text-overflow: ellipsis;
			white-space: nowrap;
		}

		.aurora-file-input-list-percent {
			flex-shrink: 0;
		}

		.aurora-file-input-list-meta :global(.aurora-file-input-list-progress) {
			--progress-bar-height: var(--file-input-list-progress-height, var(--file-input-list-default-progress-height));
		}

		.aurora-file-input-list-item :global(.aurora-file-input-list-status) {
			--icon-size: var(--file-input-list-status-icon-size, var(--file-input-list-default-status-icon-size));

			flex-shrink: 0;
		}

		.aurora-file-input-list-item[data-status='done'] :global(.aurora-file-input-list-status) {
			color: var(--file-input-list-done-color, var(--file-input-list-default-done-color));
		}

		.aurora-file-input-list-item[data-status='error'] :global(.aurora-file-input-list-status),
		.aurora-file-input-list-item[data-status='error'] .aurora-file-input-list-message {
			color: var(--file-input-list-error-color, var(--file-input-list-default-error-color));
		}

		.aurora-file-input-list-item :global(.aurora-file-input-list-remove) {
			flex-shrink: 0;
		}

		.aurora-file-input-list-items[data-view='grid'] .aurora-file-input-list-item {
			flex-direction: column;
			align-items: stretch;
			gap: 0;
			padding: 0;
			overflow: hidden;
		}

		.aurora-file-input-list-items[data-view='grid'] .aurora-file-input-list-icon {
			--icon-size: var(--file-input-list-card-icon-size, var(--file-input-list-default-card-icon-size));

			width: 100%;
			height: var(--file-input-list-card-media-height, var(--file-input-list-default-card-media-height));
			border-radius: 0;
		}

		.aurora-file-input-list-items[data-view='grid'] .aurora-file-input-list-meta {
			padding: var(--file-input-list-item-padding, var(--file-input-list-default-item-padding));
		}

		.aurora-file-input-list-items[data-view='grid'] .aurora-file-input-list-percent,
		.aurora-file-input-list-items[data-view='grid'] :global(.aurora-file-input-list-status) {
			position: absolute;
			inset-block-start: 8px;
			inset-inline-start: 8px;
		}

		.aurora-file-input-list-items[data-view='grid'] .aurora-file-input-list-percent {
			padding: 2px 6px;
			border-radius: var(--global-radius-full);
			background: var(--file-input-list-item-background, var(--file-input-list-default-item-background));
		}

		.aurora-file-input-list-items[data-view='grid'] :global(.aurora-file-input-list-remove) {
			--button-background: var(--file-input-list-item-background, var(--file-input-list-default-item-background));

			position: absolute;
			inset-block-start: 6px;
			inset-inline-end: 6px;
		}

		.aurora-file-input-list-empty {
			margin: 0;
			color: var(--file-input-list-empty-color, var(--file-input-list-default-empty-color));
			font-size: var(--file-input-list-empty-font-size, var(--file-input-list-default-empty-font-size));
		}
	}
</style>
