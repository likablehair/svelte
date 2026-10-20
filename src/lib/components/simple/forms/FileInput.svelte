<!-- @component
Drop zone for files: the user drops files on it or clicks it (or focuses it and presses Enter or Space) to open the file picker. It keeps the chosen files in `files` and adds new ones to them (`replace` swaps them instead). `accept`, `maxSize` and `maxFiles` refuse the files that do not fit: they are not added, a message under the zone says why and `onreject` receives them. A real `<input type="file">` holds the same files, so `name`, `required` and form reset work in a native form. To show the chosen files use FileInputList; FileInput alone suits pages that move the files elsewhere as soon as they arrive (read `added` in `onchange`). Its state is exposed as `data-dragging`, `data-full`, `data-disabled` and `data-state` for app CSS.
-->
<script lang="ts">
	import '../../../css/tokens.css';
	import './FileInput.css';
	import type { Snippet } from 'svelte';
	import type { HTMLInputAttributes } from 'svelte/elements';
	import Icon from '../media/Icon.svelte';
	import { inheritedLocale } from '../../../utils/locale.js';
	import { libraryTexts } from '../../../utils/texts.js';
	import { formatFileSize, matchesAccept, sameFile, type FileRejection } from '../../../utils/files.js';

	const UPLOAD_ICON =
		'M6.5 20Q4.22 20 2.61 18.43 1 16.85 1 14.58 1 12.63 2.17 11.1 3.35 9.57 5.25 9.15 5.88 6.85 7.75 5.43 9.63 4 12 4 14.93 4 16.96 6.04 19 8.07 19 11 20.73 11.2 21.86 12.5 23 13.78 23 15.5 23 17.38 21.69 18.69 20.38 20 18.5 20H13Q12.18 20 11.59 19.41 11 18.83 11 18V12.85L9.4 14.4L8 13L12 9L16 13L14.6 14.4L13 12.85V18H18.5Q19.55 18 20.27 17.27 21 16.55 21 15.5 21 14.45 20.27 13.73 19.55 13 18.5 13H17V11Q17 8.93 15.54 7.46 14.08 6 12 6 9.93 6 8.46 7.46 7 8.93 7 11H6.5Q5.05 11 4.03 12.03 3 13.05 3 14.5 3 15.95 4.03 17 5.05 18 6.5 18H9V20M12 13Z';

	interface Props
		extends Omit<
			HTMLInputAttributes,
			'value' | 'files' | 'class' | 'children' | 'type' | 'multiple' | 'accept' | 'onchange' | 'title'
		> {
		/** The chosen files. Bind it to read them and to remove or replace them from the app. */
		files?: File[];
		/** Native `accept`: extensions (`.pdf`) and MIME types (`image/*`, `application/pdf`), comma separated. Dropped files are checked too. */
		accept?: string;
		/** Largest accepted file, in bytes (decimal units: 10 MB = `10_000_000`). */
		maxSize?: number;
		/** Most files the list can hold. When it is full the zone is disabled; with `1` the picker chooses a single file. */
		maxFiles?: number;
		/** New files replace the ones in `files` instead of being added to them. The zone never counts as full. */
		replace?: boolean;
		/** Disables the zone and the native input. */
		disabled?: boolean;
		/** Hides the zone and the input: only the label, the hint and the content below stay. */
		readonly?: boolean;
		/** One-line zone, with a smaller icon and the texts beside it. */
		compact?: boolean;
		/** Visible label above the zone, linked to the input. */
		label?: string;
		/** Text below the zone. With `state` it becomes the error or success message. */
		hint?: string;
		/** Validation state: colors the zone border and the hint. `error` also sets `aria-invalid`. Refused files show an error on their own. */
		state?: 'error' | 'success';
		/** SVG path of the icon in the zone. Defaults to a cloud with an arrow. */
		icon?: string;
		/** Main text of the zone. Defaults to "Drop files here" ("Drop a file here" with `maxFiles={1}`), in the language of `locale`. */
		title?: string;
		/** Text after the browse link, such as the accepted formats and size ("PDF, JPG up to 10 MB"). */
		description?: string;
		/** The highlighted words after "or". Defaults to "browse your files", in the language of `locale`. */
		browseLabel?: string;
		/** BCP 47 locale of the texts and of the sizes in the messages (`it` and `en` are built in, other languages fall back to English). Defaults to the one set with `setDefaultLocale`, else `en`. */
		locale?: string;
		/** `id` of the input. Generated when missing, so the label always points to the input. */
		id?: string;
		/** Native `name`: the files are sent with the form under this name. */
		name?: string;
		/** Native `required`: a form with no files does not submit. */
		required?: boolean;
		/** The native `<input type="file">`. */
		input?: HTMLInputElement;
		/** Extra classes for each part. */
		class?: {
			container?: string;
			label?: string;
			zone?: string;
			hint?: string;
		};
		/** Called whenever the files change: dropped or picked files (`added`), files replaced with `replace` (`removed`), form reset. */
		onchange?: (event: { files: File[]; added: File[]; removed: File[] }) => void;
		/** Called with the files that were refused and the reason of each. */
		onreject?: (event: { rejected: FileRejection[] }) => void;
		/** Replaces the label content. It stays linked to the input. */
		labelSnippet?: Snippet<[{ label: string | undefined }]>;
		/** Replaces the content of the zone (icon and texts). `disabled` is also true when the zone is full. */
		bodySnippet?: Snippet<[{ dragging: boolean; disabled: boolean }]>;
		/** Replaces the hint below the zone. */
		hintSnippet?: Snippet<[{ hint: string | undefined }]>;
		/** Replaces the messages about refused files. */
		rejectedSnippet?: Snippet<[{ rejected: FileRejection[] }]>;
		/** Content below the zone and the hint, inside the field (FileInputList puts its list here). */
		children?: Snippet;
	}

	let {
		files = $bindable(),
		accept,
		maxSize,
		maxFiles,
		replace = false,
		disabled = false,
		readonly = false,
		compact = false,
		label,
		hint,
		state: stateProp,
		icon = UPLOAD_ICON,
		title,
		description,
		browseLabel,
		locale: localeProp,
		id,
		name,
		required,
		input = $bindable(),
		class: clazz = {},
		onchange,
		onreject,
		labelSnippet,
		bodySnippet,
		hintSnippet,
		rejectedSnippet,
		children,
		...rest
	}: Props = $props();

	const defaultLocale = inheritedLocale();
	let locale = $derived(localeProp ?? defaultLocale());
	let texts = $derived(libraryTexts(locale).fileInput);

	const uid = $props.id();
	let inputId = $derived(id ?? `${uid}-input`);
	const labelId = `${uid}-label`;
	const hintId = `${uid}-hint`;

	let inputNode = $state<HTMLInputElement>();
	let dragDepth = $state(0);
	let rejected = $state<FileRejection[]>([]);

	let list = $derived(files ?? []);
	let full = $derived(!replace && maxFiles != null && list.length >= maxFiles);
	let blocked = $derived(disabled || full);
	let dragging = $derived(dragDepth > 0 && !blocked);
	let currentState = $derived(stateProp ?? (rejected.length > 0 ? 'error' : undefined));
	let hasLabel = $derived(!!label || !!labelSnippet);
	let hasHint = $derived(rejected.length > 0 || !!hint || !!hintSnippet);
	let describedBy = $derived(
		[rest['aria-describedby'], hasHint && hintId].filter(Boolean).join(' ') || undefined
	);

	$effect(() => {
		const node = inputNode;
		const current = list;
		if (!node || typeof DataTransfer === 'undefined') return;
		const transfer = new DataTransfer();
		for (const file of current) transfer.items.add(file);
		node.files = transfer.files;
	});

	$effect(() => {
		const form = inputNode?.form;
		if (!form) return;
		const reset = () => {
			const removed = files ?? [];
			rejected = [];
			if (removed.length === 0) return;
			files = [];
			onchange?.({ files: [], added: [], removed });
		};
		form.addEventListener('reset', reset);
		return () => form.removeEventListener('reset', reset);
	});

	function rejectionText(rejection: FileRejection): string {
		const name = rejection.file.name;
		if (rejection.reason === 'type') return texts.rejectedType.replace('{name}', name);
		if (rejection.reason === 'size')
			return texts.rejectedSize.replace('{name}', name).replace('{size}', formatFileSize(maxSize ?? 0, locale));
		if (rejection.reason === 'count')
			return texts.rejectedCount.replace('{name}', name).replace('{count}', String(maxFiles));
		return texts.rejectedDuplicate.replace('{name}', name);
	}

	function add(incoming: File[]) {
		const before = files ?? [];
		const base = replace ? [] : before;
		const accepted: File[] = [];
		const refused: FileRejection[] = [];
		for (const file of incoming) {
			if (!matchesAccept(file, accept)) refused.push({ file, reason: 'type' });
			else if (maxSize != null && file.size > maxSize) refused.push({ file, reason: 'size' });
			else if ([...base, ...accepted].some((other) => sameFile(other, file)))
				refused.push({ file, reason: 'duplicate' });
			else if (maxFiles != null && base.length + accepted.length >= maxFiles)
				refused.push({ file, reason: 'count' });
			else accepted.push(file);
		}
		rejected = refused;
		if (accepted.length > 0) {
			const next = [...base, ...accepted];
			files = next;
			onchange?.({ files: next, added: accepted, removed: replace ? before : [] });
		}
		if (refused.length > 0) onreject?.({ rejected: refused });
	}

	function hasFiles(event: DragEvent): boolean {
		return !!event.dataTransfer?.types.includes('Files');
	}

	function ondragenter(event: DragEvent) {
		if (!hasFiles(event)) return;
		event.preventDefault();
		dragDepth++;
	}

	function ondragover(event: DragEvent) {
		if (!hasFiles(event)) return;
		event.preventDefault();
		if (event.dataTransfer) event.dataTransfer.dropEffect = blocked ? 'none' : 'copy';
	}

	function ondragleave(event: DragEvent) {
		if (!hasFiles(event)) return;
		dragDepth = Math.max(0, dragDepth - 1);
	}

	function ondrop(event: DragEvent) {
		if (!hasFiles(event)) return;
		event.preventDefault();
		dragDepth = 0;
		if (blocked) return;
		add(Array.from(event.dataTransfer?.files ?? []));
	}

	function onpick(event: Event & { currentTarget: HTMLInputElement }) {
		const picked = Array.from(event.currentTarget.files ?? []);
		if (picked.length > 0) add(picked);
	}

	function onclick(event: MouseEvent) {
		if (full) event.preventDefault();
	}
</script>

<div
	class={['aurora-file-input', clazz.container]}
	data-state={currentState}
	data-disabled={disabled || undefined}
	data-readonly={readonly || undefined}
	data-full={full || undefined}
	data-dragging={dragging || undefined}
	data-compact={compact || undefined}
>
	{#if labelSnippet}
		<label class={['aurora-file-input-label', clazz.label]} id={labelId} for={readonly ? undefined : inputId}
			>{@render labelSnippet({ label })}</label
		>
	{:else if label}
		<label class={['aurora-file-input-label', clazz.label]} id={labelId} for={readonly ? undefined : inputId}
			>{label}</label
		>
	{/if}
	{#if !readonly}
		<label
			class={['aurora-file-input-zone', clazz.zone]}
			{ondragenter}
			{ondragover}
			{ondragleave}
			{ondrop}
		>
			<input
				{...rest}
				bind:this={() => inputNode, (node) => (inputNode = input = node)}
				type="file"
				class="aurora-file-input-native"
				id={inputId}
				{name}
				{accept}
				{required}
				{disabled}
				multiple={maxFiles !== 1}
				aria-labelledby={rest['aria-labelledby'] ?? (hasLabel ? labelId : undefined)}
				aria-describedby={describedBy}
				aria-invalid={currentState === 'error' || rest['aria-invalid'] || undefined}
				aria-disabled={full || rest['aria-disabled'] || undefined}
				onchange={onpick}
				{onclick}
			/>
			{#if bodySnippet}
				{@render bodySnippet({ dragging, disabled: blocked })}
			{:else}
				<span class="aurora-file-input-icon"><Icon path={icon} /></span>
				<span class="aurora-file-input-texts">
					<span class="aurora-file-input-title">{title ?? (maxFiles === 1 ? texts.titleSingle : texts.title)}</span>
					<span class="aurora-file-input-text"
						>{texts.or} <span class="aurora-file-input-browse">{browseLabel ?? texts.browse}</span
						>{#if description}<span class="aurora-file-input-description">{' · '}{description}</span>{/if}</span
					>
				</span>
			{/if}
		</label>
	{/if}
	{#if rejected.length > 0}
		<div class={['aurora-file-input-hint', clazz.hint]} id={hintId} role="alert">
			{#if rejectedSnippet}
				{@render rejectedSnippet({ rejected })}
			{:else}
				{#each rejected as rejection, index (index)}
					<div>{rejectionText(rejection)}</div>
				{/each}
			{/if}
		</div>
	{:else if hintSnippet}
		<div class={['aurora-file-input-hint', clazz.hint]} id={hintId}>{@render hintSnippet({ hint })}</div>
	{:else if hint}
		<div class={['aurora-file-input-hint', clazz.hint]} id={hintId}>{hint}</div>
	{/if}
	{@render children?.()}
</div>

<style>
	@layer reset, theme, base, global.base, global.theme, global.components, components, utilities;

	@layer global.components {
		.aurora-file-input {
			--_border: var(--file-input-border-color, var(--file-input-default-border-color));
			--_hover-border: var(--file-input-hover-border-color, var(--file-input-default-hover-border-color));
			--_hint: var(--file-input-hint-color, var(--file-input-default-hint-color));
			--_padding: var(--file-input-default-padding);
			--_inner-gap: var(--file-input-default-inner-gap);
			--_icon-box: var(--file-input-default-icon-box-size);
			--_icon-size: var(--file-input-default-icon-size);

			display: flex;
			flex-direction: column;
			gap: var(--file-input-gap, var(--file-input-default-gap));
			box-sizing: border-box;
			width: var(--file-input-width, var(--file-input-default-width));
			height: var(--file-input-height, var(--file-input-default-height));
			min-width: 0;
			min-height: 0;
		}

		.aurora-file-input[data-compact] {
			--_padding: var(--file-input-default-compact-padding);
			--_inner-gap: var(--file-input-default-compact-inner-gap);
			--_icon-box: var(--file-input-default-compact-icon-box-size);
			--_icon-size: var(--file-input-default-compact-icon-size);
		}

		.aurora-file-input[data-state='error'] {
			--_border: var(--file-input-error-color, var(--file-input-default-error-color));
			--_hover-border: var(--_border);
			--_hint: var(--_border);
		}

		.aurora-file-input[data-state='success'] {
			--_border: var(--file-input-success-color, var(--file-input-default-success-color));
			--_hover-border: var(--_border);
			--_hint: var(--_border);
		}

		.aurora-file-input-label {
			color: var(--file-input-label-color, var(--file-input-default-label-color));
			font-size: var(--file-input-label-font-size, var(--file-input-default-label-font-size));
			font-weight: var(--file-input-label-font-weight, var(--file-input-default-label-font-weight));
		}

		.aurora-file-input-zone {
			position: relative;
			display: flex;
			flex: 1 0 auto;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			gap: var(--_inner-gap);
			box-sizing: border-box;
			padding: var(--file-input-padding, var(--_padding));
			border: var(--file-input-border-width, var(--file-input-default-border-width))
				var(--file-input-border-style, var(--file-input-default-border-style)) var(--_border);
			border-radius: var(--file-input-border-radius, var(--file-input-default-border-radius));
			background: var(--file-input-background, var(--file-input-default-background));
			color: var(--file-input-color, var(--file-input-default-color));
			text-align: center;
			cursor: pointer;
			transition:
				border-color var(--global-duration) var(--global-ease),
				background var(--global-duration) var(--global-ease),
				opacity var(--global-duration) var(--global-ease);
		}

		.aurora-file-input[data-compact] .aurora-file-input-zone {
			flex-direction: row;
			justify-content: flex-start;
			text-align: start;
		}

		@media (hover: hover) {
			.aurora-file-input:not([data-disabled], [data-full]) .aurora-file-input-zone:hover {
				border-color: var(--_hover-border);
				background: var(--file-input-hover-background, var(--file-input-default-hover-background));
			}

			.aurora-file-input:not([data-disabled], [data-full]) .aurora-file-input-zone:hover .aurora-file-input-icon {
				transform: translateY(var(--file-input-icon-hover-lift, var(--file-input-default-icon-hover-lift)));
			}
		}

		.aurora-file-input[data-dragging] .aurora-file-input-zone {
			border-color: var(--file-input-dragging-border-color, var(--file-input-default-dragging-border-color));
			background: var(--file-input-dragging-background, var(--file-input-default-dragging-background));
		}

		.aurora-file-input-zone:has(.aurora-file-input-native:focus-visible) {
			outline: var(--file-input-focus-ring-width, var(--file-input-default-focus-ring-width)) solid
				var(--file-input-focus-ring-color, var(--file-input-default-focus-ring-color));
			outline-offset: var(--file-input-focus-ring-offset, var(--file-input-default-focus-ring-offset));
		}

		.aurora-file-input[data-disabled] .aurora-file-input-zone,
		.aurora-file-input[data-full] .aurora-file-input-zone {
			opacity: var(--file-input-disabled-opacity, var(--file-input-default-disabled-opacity));
			cursor: not-allowed;
		}

		.aurora-file-input-native {
			position: absolute;
			width: 1px;
			height: 1px;
			margin: -1px;
			padding: 0;
			overflow: hidden;
			clip-path: inset(50%);
			white-space: nowrap;
			opacity: 0;
		}

		.aurora-file-input-icon {
			--icon-size: var(--_icon-size);

			display: grid;
			flex-shrink: 0;
			place-items: center;
			width: var(--_icon-box);
			height: var(--_icon-box);
			margin-block-end: calc(var(--_inner-gap) * 2);
			border-radius: var(--file-input-icon-border-radius, var(--file-input-default-icon-border-radius));
			background: var(--file-input-icon-background, var(--file-input-default-icon-background));
			color: var(--file-input-icon-color, var(--file-input-default-icon-color));
			box-shadow: var(--file-input-icon-box-shadow, var(--file-input-default-icon-box-shadow));
			transition: transform var(--global-duration-slow) var(--global-ease-spring);
		}

		.aurora-file-input[data-compact] .aurora-file-input-icon {
			margin-block-end: 0;
		}

		.aurora-file-input-texts {
			display: flex;
			flex-direction: column;
			gap: var(--file-input-default-inner-gap);
			min-width: 0;
		}

		.aurora-file-input-title {
			color: var(--file-input-title-color, var(--file-input-default-title-color));
			font-size: var(--file-input-title-font-size, var(--file-input-default-title-font-size));
			font-weight: var(--file-input-title-font-weight, var(--file-input-default-title-font-weight));
		}

		.aurora-file-input-text {
			color: var(--file-input-text-color, var(--file-input-default-text-color));
			font-size: var(--file-input-text-font-size, var(--file-input-default-text-font-size));
		}

		.aurora-file-input-browse {
			color: var(--file-input-browse-color, var(--file-input-default-browse-color));
			font-weight: var(--file-input-browse-font-weight, var(--file-input-default-browse-font-weight));
		}

		.aurora-file-input-hint {
			color: var(--_hint);
			font-size: var(--file-input-hint-font-size, var(--file-input-default-hint-font-size));
		}
	}
</style>
