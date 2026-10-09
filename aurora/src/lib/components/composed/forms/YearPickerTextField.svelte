<!-- @component
Year field: type the year or choose it in a scrolling grid of years. The value is `selectedYear`, a number. Typing accepts four digits; a year outside `min` and `max` (and an unfinished one when the field loses focus) turns the field to the error state with `invalidText`, and the form refuses it. On desktop, focusing or clicking the field opens a `YearSelector` in a menu; Arrow Down moves the focus into it, Escape closes it and Tab leaves it. On screens up to 1024px wide the calendar button opens it in a bottom drawer instead (`mobileDrawer`). Choosing a year closes the menu (`closeOnSelect`). Its state is exposed as `data-state`, `data-disabled`, `data-readonly` and `data-open` for app CSS.
-->
<script lang="ts">
	import '../../../css/tokens.css';
	import './YearPickerTextField.css';
	import { tick, untrack, type Snippet } from 'svelte';
	import type { HTMLInputAttributes } from 'svelte/elements';
	import { MediaQuery } from 'svelte/reactivity';
	import Menu from '../../simple/common/Menu.svelte';
	import YearSelector from '../../simple/dates/YearSelector.svelte';
	import Icon from '../../simple/media/Icon.svelte';
	import Drawer from '../../simple/navigation/Drawer.svelte';

	const CALENDAR_ICON =
		'M9,10H7V12H9V10M13,10H11V12H13V10M17,10H15V12H17V10M19,3H18V1H16V3H8V1H6V3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3M19,19H5V8H19V19Z';
	const CHEVRON_ICON = 'M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z';
	const CLEAR_ICON =
		'M12,2C17.53,2 22,6.47 22,12C22,17.53 17.53,22 12,22C6.47,22 2,17.53 2,12C2,6.47 6.47,2 12,2M15.59,7L12,10.59L8.41,7L7,8.41L10.59,12L7,15.59L8.41,17L12,13.41L15.59,17L17,15.59L13.41,12L17,8.41L15.59,7Z';
	const ALERT_ICON =
		'M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z';
	const SUCCESS_ICON =
		'M12 2C6.5 2 2 6.5 2 12S6.5 22 12 22 22 17.5 22 12 17.5 2 12 2M10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z';

	interface Props
		extends Omit<
			HTMLInputAttributes,
			| 'value'
			| 'type'
			| 'class'
			| 'children'
			| 'min'
			| 'max'
			| 'onchange'
			| 'name'
			| 'placeholder'
			| 'disabled'
			| 'readonly'
			| 'required'
			| 'id'
		> {
		/** The year. `undefined` while the field is empty or its text is not a valid year. */
		selectedYear?: number;
		/** Whether the menu of years is open. `undefined` counts as closed. */
		open?: boolean;
		/** First year that can be chosen or typed. */
		min?: number;
		/** Last year that can be chosen or typed. */
		max?: number;
		/** Visible label above the field, linked to the input. In the mobile drawer it is the title. */
		label?: string;
		/** Text below the field. With `state` it becomes the error or success message. */
		hint?: string;
		/** Validation state: colors the border and the hint and shows an icon. `error` also sets `aria-invalid`. Without it the field still shows the error state for an invalid year. */
		state?: 'error' | 'success';
		/** Message shown below the field, and given to the form, when the typed year is not valid. */
		invalidText?: string;
		/** Native `placeholder`. */
		placeholder?: string;
		/** Native `disabled`. */
		disabled?: boolean;
		/** Native `readonly`: the year is shown but cannot be changed. */
		readonly?: boolean;
		/** Native `required`. */
		required?: boolean;
		/** `id` of the input. Generated when missing, so the label always points to it. */
		id?: string;
		/** Name of a hidden input that submits the year (empty when there is none). */
		name?: string;
		/** Shows a button that empties the field. */
		clearable?: boolean;
		/** Accessible name of the clear button. */
		clearLabel?: string;
		/** Closes the menu when a year is chosen. */
		closeOnSelect?: boolean;
		/** Side of the field where the menu opens. It flips when there is not enough space. */
		placement?:
			| 'bottom-start'
			| 'bottom'
			| 'bottom-end'
			| 'top-start'
			| 'top'
			| 'top-end'
			| 'left-start'
			| 'left'
			| 'left-end'
			| 'right-start'
			| 'right'
			| 'right-end';
		/** On screens up to 1024px wide, opens the years in a bottom drawer from the calendar button instead of a menu, and focusing the field does not open it. */
		mobileDrawer?: boolean;
		/** Title of the mobile drawer. Defaults to `label`. */
		drawerTitle?: string;
		/** Accessible name of the close button of the mobile drawer. */
		closeLabel?: string;
		/** Accessible name of the calendar button. */
		openLabel?: string;
		/** The input element. */
		input?: HTMLInputElement;
		/** Extra classes for each part. `picker` goes on the `YearSelector`. */
		class?: {
			container?: string;
			label?: string;
			row?: string;
			field?: string;
			input?: string;
			hint?: string;
			picker?: string;
		};
		/** Replaces the label content. It stays linked to the input. */
		labelSnippet?: Snippet<[{ label: string | undefined }]>;
		/** Replaces the hint below the field. */
		hintSnippet?: Snippet<[{ hint: string | undefined }]>;
		/** Replaces the icon shown for the validation state. Render nothing to hide it. */
		stateIconSnippet?: Snippet<[{ state: 'error' | 'success' }]>;
		/** Replaces the calendar icon. The button around it keeps opening the years. */
		iconSnippet?: Snippet;
		/** Replaces the chevron at the end of the field. */
		chevronSnippet?: Snippet;
		/** Content outside the field, on the left. */
		prependSnippet?: Snippet;
		/** Content inside the field, before the clear button and the chevron. */
		appendInnerSnippet?: Snippet;
		/** Content outside the field, on the right. */
		appendSnippet?: Snippet;
		/** Replaces the icon of the clear button. */
		clearSnippet?: Snippet;
		/** Called when the user changes the year: in the grid, by typing a whole valid year (or making it invalid again) and with the clear button. */
		onchange?: (event: { year: number | undefined }) => void;
	}

	let {
		selectedYear = $bindable(),
		open = $bindable(),
		min = 1900,
		max = 2100,
		label,
		hint,
		state: validationState,
		invalidText = 'Enter a valid year',
		placeholder,
		disabled = false,
		readonly = false,
		required = false,
		id,
		name,
		clearable = false,
		clearLabel = 'Clear',
		closeOnSelect = true,
		placement = 'bottom-start',
		mobileDrawer = true,
		drawerTitle,
		closeLabel = 'Close',
		openLabel = 'Choose year',
		input = $bindable(),
		class: clazz = {},
		labelSnippet,
		hintSnippet,
		stateIconSnippet,
		iconSnippet,
		chevronSnippet,
		prependSnippet,
		appendInnerSnippet,
		appendSnippet,
		clearSnippet,
		onchange,
		oninput,
		onfocus,
		onblur,
		onclick,
		onkeydown,
		...rest
	}: Props = $props();

	const uid = $props.id();
	const labelId = `${uid}-label`;
	const hintId = `${uid}-hint`;
	const pickerId = `${uid}-picker`;
	const mobile = new MediaQuery('max-width: 1024px', false);

	let inputId = $derived(id ?? `${uid}-input`);
	let drawerMode = $derived(mobileDrawer && mobile.current);
	let anchor = $state<HTMLDivElement>();
	let inputNode = $state<HTMLInputElement>();
	let menuNode = $state<HTMLDivElement>();
	let picker = $state<ReturnType<typeof YearSelector>>();
	let editing = $state(false);
	let silent = false;
	let typed = $state<string>();

	let text = $derived(typed ?? (selectedYear === undefined ? '' : String(selectedYear)));
	let invalid = $derived(!!text && (text.length === 4 ? accept(text) === undefined : !editing));
	let validation = $derived(validationState ?? (invalid ? 'error' : undefined));
	let hintText = $derived(invalid && !validationState ? invalidText : hint);
	let describedBy = $derived(
		[rest['aria-describedby'], (hintText || hintSnippet) && hintId].filter(Boolean).join(' ') ||
			undefined
	);

	$effect(() => {
		const year = selectedYear;
		untrack(() => {
			if (typed !== undefined && accept(typed) !== year) typed = undefined;
		});
	});

	$effect(() => {
		inputNode?.setCustomValidity(invalid ? invalidText : '');
	});

	$effect(() => {
		if (!open || !drawerMode) return;
		tick().then(() => picker?.focus());
	});

	function accept(value: string) {
		if (!/^\d{4}$/.test(value)) return undefined;
		const year = Number(value);
		return year >= Math.min(min, max) && year <= Math.max(min, max) ? year : undefined;
	}

	function handleInput(node: HTMLInputElement) {
		const value = node.value.replace(/\D/g, '').slice(0, 4);
		if (value !== node.value) node.value = value;
		typed = value;
		const year = accept(value);
		if (year === selectedYear) return;
		selectedYear = year;
		onchange?.({ year });
	}

	function openMenu() {
		if (disabled || readonly || open) return;
		open = true;
	}

	function close(returnFocus = false) {
		menuNode?.setAttribute('inert', '');
		open = false;
		if (returnFocus && !drawerMode) focusField();
	}

	function focusField() {
		silent = true;
		inputNode?.focus();
		silent = false;
	}

	async function focusPicker() {
		if (disabled || readonly) return;
		open = true;
		await tick();
		picker?.focus();
	}

	function clear() {
		typed = undefined;
		const changed = selectedYear !== undefined;
		selectedYear = undefined;
		if (changed) onchange?.({ year: undefined });
		focusField();
	}

	function pick(event: { year: number }) {
		typed = undefined;
		if (event.year !== selectedYear) {
			selectedYear = event.year;
			onchange?.(event);
		}
		if (closeOnSelect) close(true);
	}

	function focusOut(event: FocusEvent) {
		const next = event.relatedTarget as Node | null;
		if (anchor?.contains(next) || menuNode?.contains(next)) return;
		if (open && next && !drawerMode) close();
	}
</script>

{#snippet years()}
	<YearSelector
		bind:this={picker}
		{selectedYear}
		{min}
		{max}
		id={pickerId}
		aria-label={label ?? openLabel}
		class={{ container: clazz.picker }}
		onchange={pick}
		onfocusout={focusOut}
		onmousedown={(event) => {
			if (!drawerMode) event.preventDefault();
		}}
		onkeydown={(event) => {
			if (event.key !== 'Escape' || event.defaultPrevented || drawerMode) return;
			event.preventDefault();
			close(true);
		}}
	/>
{/snippet}

<div
	class={['aurora-year-picker-text-field', clazz.container]}
	data-state={validation}
	data-disabled={disabled || undefined}
	data-readonly={readonly || undefined}
	data-open={open || undefined}
	onfocusout={focusOut}
>
	{#if labelSnippet || label}
		<label id={labelId} class={['aurora-year-picker-text-field-label', clazz.label]} for={inputId}>
			{#if labelSnippet}
				{@render labelSnippet({ label })}
			{:else}
				{label}
			{/if}
		</label>
	{/if}
	<div class={['aurora-year-picker-text-field-row', clazz.row]}>
		{@render prependSnippet?.()}
		<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
		<div
			class={['aurora-year-picker-text-field-control', clazz.field]}
			bind:this={anchor}
			onmousedown={(event) => {
				if ((event.target as Element).closest('input, button')) return;
				event.preventDefault();
				if (document.activeElement !== inputNode) inputNode?.focus();
				else if (!drawerMode) openMenu();
			}}
		>
			<button
				type="button"
				class="aurora-year-picker-text-field-toggle"
				tabindex="-1"
				aria-label={openLabel}
				aria-haspopup="listbox"
				aria-expanded={!!open}
				aria-controls={open ? pickerId : undefined}
				disabled={disabled || readonly}
				onmousedown={(event) => {
					if (!drawerMode) event.preventDefault();
				}}
				onclick={() => {
					if (open) close();
					else {
						open = true;
						if (!drawerMode) focusField();
					}
				}}
			>
				{#if iconSnippet}
					{@render iconSnippet()}
				{:else}
					<Icon path={CALENDAR_ICON} />
				{/if}
			</button>
			<input
				inputmode="numeric"
				autocomplete="off"
				maxlength={4}
				{...rest}
				bind:this={() => inputNode, (node) => (inputNode = input = node)}
				id={inputId}
				type="text"
				role="combobox"
				aria-haspopup="listbox"
				aria-expanded={!!open}
				aria-controls={open ? pickerId : undefined}
				aria-invalid={invalid || validationState === 'error' || rest['aria-invalid'] || undefined}
				aria-describedby={describedBy}
				value={text}
				{placeholder}
				{disabled}
				{readonly}
				{required}
				class={clazz.input}
				oninput={(event) => {
					oninput?.(event);
					handleInput(event.currentTarget);
				}}
				onfocus={(event) => {
					onfocus?.(event);
					editing = true;
					if (!silent && !drawerMode) openMenu();
				}}
				onblur={(event) => {
					onblur?.(event);
					editing = false;
				}}
				onclick={(event) => {
					onclick?.(event);
					if (!drawerMode) openMenu();
				}}
				onkeydown={(event) => {
					onkeydown?.(event);
					if (event.defaultPrevented) return;
					if (event.key === 'ArrowDown') {
						event.preventDefault();
						focusPicker();
					} else if (event.key === 'Enter' && open) {
						event.preventDefault();
						close();
					} else if (event.key === 'Tab' && open && !drawerMode) close();
				}}
			/>
			<span class="aurora-year-picker-text-field-end">
				{@render appendInnerSnippet?.()}
				{#if clearable && text && !disabled && !readonly}
					<button
						type="button"
						class="aurora-year-picker-text-field-clear"
						aria-label={clearLabel}
						onmousedown={(event) => event.preventDefault()}
						onclick={clear}
					>
						{#if clearSnippet}
							{@render clearSnippet()}
						{:else}
							<Icon path={CLEAR_ICON} />
						{/if}
					</button>
				{/if}
				{#if validation && stateIconSnippet}
					{@render stateIconSnippet({ state: validation })}
				{:else if validation}
					<Icon
						path={validation === 'error' ? ALERT_ICON : SUCCESS_ICON}
						class="aurora-year-picker-text-field-state-icon"
					/>
				{/if}
				{#if chevronSnippet}
					{@render chevronSnippet()}
				{:else}
					<Icon path={CHEVRON_ICON} class="aurora-year-picker-text-field-chevron" />
				{/if}
			</span>
		</div>
		{@render appendSnippet?.()}
	</div>
	{#if hintSnippet}
		<div class={['aurora-year-picker-text-field-hint', clazz.hint]} id={hintId}>
			{@render hintSnippet({ hint: hintText })}
		</div>
	{:else if hintText}
		<div class={['aurora-year-picker-text-field-hint', clazz.hint]} id={hintId}>{hintText}</div>
	{/if}
	{#if name}
		<input type="hidden" {name} value={selectedYear ?? ''} />
	{/if}
</div>

{#if drawerMode}
	<Drawer
		bind:open
		position="bottom"
		title={drawerTitle ?? label}
		aria-label={(drawerTitle ?? label) ? undefined : openLabel}
		closable
		{closeLabel}
		class={{
			drawer: 'aurora-year-picker-text-field-drawer',
			body: 'aurora-year-picker-text-field-drawer-body'
		}}
	>
		{@render years()}
	</Drawer>
{:else}
	<Menu
		bind:open
		bind:menuElement={menuNode}
		activator={anchor}
		{placement}
		class="aurora-year-picker-text-field-menu"
	>
		{@render years()}
	</Menu>
{/if}

<style>
	@layer reset, theme, base, global.base, global.theme, global.components, components, utilities;

	@layer global.components {
		.aurora-year-picker-text-field {
			--_border: var(
				--year-picker-text-field-border-color,
				var(--year-picker-text-field-default-border-color)
			);
			--_hover-border: var(
				--year-picker-text-field-hover-border-color,
				var(--year-picker-text-field-default-hover-border-color)
			);
			--_focus-border: var(
				--year-picker-text-field-focus-border-color,
				var(--year-picker-text-field-default-focus-border-color)
			);
			--_ring: var(
				--year-picker-text-field-focus-ring-color,
				var(--year-picker-text-field-default-focus-ring-color)
			);
			--_hint: var(
				--year-picker-text-field-hint-color,
				var(--year-picker-text-field-default-hint-color)
			);
			--icon-size: var(
				--year-picker-text-field-icon-size,
				var(--year-picker-text-field-default-icon-size)
			);

			display: flex;
			flex-direction: column;
			gap: var(--year-picker-text-field-gap, var(--year-picker-text-field-default-gap));
			box-sizing: border-box;
			width: var(--year-picker-text-field-width, var(--year-picker-text-field-default-width));
			max-width: var(
				--year-picker-text-field-max-width,
				var(--year-picker-text-field-default-max-width)
			);
			min-width: 0;
		}

		.aurora-year-picker-text-field[data-state='error'] {
			--_border: var(
				--year-picker-text-field-error-color,
				var(--year-picker-text-field-default-error-color)
			);
			--_hover-border: var(--_border);
			--_focus-border: var(--_border);
			--_ring: color-mix(in oklab, var(--_border) 18%, transparent);
			--_hint: var(--_border);
		}

		.aurora-year-picker-text-field[data-state='success'] {
			--_border: var(
				--year-picker-text-field-success-color,
				var(--year-picker-text-field-default-success-color)
			);
			--_hover-border: var(--_border);
			--_focus-border: var(--_border);
			--_ring: color-mix(in oklab, var(--_border) 18%, transparent);
			--_hint: var(--_border);
		}

		.aurora-year-picker-text-field-label {
			color: var(
				--year-picker-text-field-label-color,
				var(--year-picker-text-field-default-label-color)
			);
			font-size: var(
				--year-picker-text-field-label-font-size,
				var(--year-picker-text-field-default-label-font-size)
			);
			font-weight: var(
				--year-picker-text-field-label-font-weight,
				var(--year-picker-text-field-default-label-font-weight)
			);
		}

		.aurora-year-picker-text-field-row {
			display: flex;
			align-items: center;
			gap: var(
				--year-picker-text-field-outer-gap,
				var(--year-picker-text-field-default-outer-gap)
			);
			color: var(
				--year-picker-text-field-icon-color,
				var(--year-picker-text-field-default-icon-color)
			);
		}

		.aurora-year-picker-text-field-control {
			flex: 1;
			min-width: 0;
			box-sizing: border-box;
			display: flex;
			align-items: center;
			gap: var(
				--year-picker-text-field-inner-gap,
				var(--year-picker-text-field-default-inner-gap)
			);
			height: var(--year-picker-text-field-height, var(--year-picker-text-field-default-height));
			padding: var(
				--year-picker-text-field-padding,
				var(--year-picker-text-field-default-padding)
			);
			background: var(
				--year-picker-text-field-background,
				var(--year-picker-text-field-default-background)
			);
			border: var(
					--year-picker-text-field-border-width,
					var(--year-picker-text-field-default-border-width)
				)
				solid var(--_border);
			border-radius: var(
				--year-picker-text-field-border-radius,
				var(--year-picker-text-field-default-border-radius)
			);
			box-shadow: var(
				--year-picker-text-field-box-shadow,
				var(--year-picker-text-field-default-box-shadow)
			);
			cursor: text;
			transition:
				border-color var(--global-duration) var(--global-ease),
				box-shadow var(--global-duration) var(--global-ease),
				background var(--global-duration) var(--global-ease);
		}

		@media (hover: hover) {
			.aurora-year-picker-text-field:not([data-disabled])
				.aurora-year-picker-text-field-control:hover:not(:focus-within) {
				border-color: var(--_hover-border);
			}
		}

		.aurora-year-picker-text-field-control:focus-within,
		.aurora-year-picker-text-field[data-open] .aurora-year-picker-text-field-control {
			border-color: var(--_focus-border);
			box-shadow:
				0 0 0
				var(
					--year-picker-text-field-focus-ring-width,
					var(--year-picker-text-field-default-focus-ring-width)
				)
				var(--_ring);
			outline: 2px solid transparent;
		}

		.aurora-year-picker-text-field-toggle,
		.aurora-year-picker-text-field-clear {
			display: inline-flex;
			flex: none;
			align-items: center;
			justify-content: center;
			margin: 0;
			padding: 0;
			border: 0;
			border-radius: var(--global-radius-xs);
			background: transparent;
			color: inherit;
			cursor: pointer;
		}

		.aurora-year-picker-text-field-toggle:disabled {
			cursor: inherit;
		}

		.aurora-year-picker-text-field-control:focus-within .aurora-year-picker-text-field-toggle,
		.aurora-year-picker-text-field[data-open] .aurora-year-picker-text-field-toggle {
			color: var(--_focus-border);
		}

		.aurora-year-picker-text-field-clear:focus-visible {
			outline: var(--global-focus-ring-width) solid var(--global-focus-ring-color);
			outline-offset: 1px;
		}

		input {
			flex: 1;
			min-width: 0;
			height: 100%;
			margin: 0;
			padding: 0;
			border: 0;
			outline: none;
			background: transparent;
			color: var(--year-picker-text-field-color, var(--year-picker-text-field-default-color));
			font-family: var(
				--year-picker-text-field-font-family,
				var(--year-picker-text-field-default-font-family)
			);
			font-size: var(
				--year-picker-text-field-font-size,
				var(--year-picker-text-field-default-font-size)
			);
			font-weight: var(
				--year-picker-text-field-font-weight,
				var(--year-picker-text-field-default-font-weight)
			);
			font-variant-numeric: tabular-nums;
		}

		input::placeholder {
			color: var(
				--year-picker-text-field-placeholder-color,
				var(--year-picker-text-field-default-placeholder-color)
			);
			opacity: 1;
		}

		.aurora-year-picker-text-field-end {
			display: flex;
			flex: none;
			align-items: center;
			gap: var(
				--year-picker-text-field-inner-gap,
				var(--year-picker-text-field-default-inner-gap)
			);
			margin-inline-start: auto;
		}

		.aurora-year-picker-text-field-end:empty {
			display: none;
		}

		.aurora-year-picker-text-field-control :global(.aurora-year-picker-text-field-state-icon) {
			color: var(--_border);
		}

		.aurora-year-picker-text-field-hint {
			color: var(--_hint);
			font-size: var(
				--year-picker-text-field-hint-font-size,
				var(--year-picker-text-field-default-hint-font-size)
			);
		}

		.aurora-year-picker-text-field[data-disabled] .aurora-year-picker-text-field-control {
			background: var(
				--year-picker-text-field-disabled-background,
				var(--year-picker-text-field-default-disabled-background)
			);
			opacity: var(
				--year-picker-text-field-disabled-opacity,
				var(--year-picker-text-field-default-disabled-opacity)
			);
			cursor: not-allowed;
		}

		.aurora-year-picker-text-field[data-disabled] input {
			cursor: not-allowed;
		}

		:global(.aurora-year-picker-text-field-drawer) {
			--drawer-default-size: auto;
		}

		:global(.aurora-drawer-body.aurora-year-picker-text-field-drawer-body) {
			display: grid;
			justify-items: center;
		}

		:global(.aurora-year-picker-text-field-menu) {
			--menu-default-width: var(
				--year-picker-text-field-menu-width,
				var(--year-picker-text-field-default-menu-width)
			);
			--menu-default-padding: var(
				--year-picker-text-field-menu-padding,
				var(--year-picker-text-field-default-menu-padding)
			);
		}

		:global(.aurora-year-picker-text-field-drawer) :global(.aurora-year-selector) {
			--year-selector-default-max-height: 50dvh;
			width: min(100%, 360px);
		}

		.aurora-year-picker-text-field-control :global(.aurora-year-picker-text-field-chevron) {
			flex: none;
			transition: rotate var(--global-duration) var(--global-ease);
		}

		.aurora-year-picker-text-field[data-open] :global(.aurora-year-picker-text-field-chevron) {
			rotate: 180deg;
		}

	}
</style>
