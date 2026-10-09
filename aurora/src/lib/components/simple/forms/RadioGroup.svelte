<!-- @component
Group of radio buttons built from a list, inside a `<fieldset>` with `role="radiogroup"`: `label` is its legend, every radio shares a generated `name` so Tab enters the group and the arrow keys move the selection, and `disabled` and `required` work as in HTML forms. Options are `RadioItem` objects, `{ value: string | number; label?: string | number; icon?: string; description?: string; disabled?: boolean; data?: Data }`, and `value` holds the `value` of the selected one (`bind:value`). `card` shows every option as a bordered box, and `orientation="horizontal"` puts them side by side. Its state is exposed as `data-state`, `data-disabled` and `data-orientation` for app CSS.
-->
<script lang="ts" generics="Data">
	import '../../../css/tokens.css';
	import './RadioGroup.css';
	import type { Snippet } from 'svelte';
	import type { HTMLFieldsetAttributes } from 'svelte/elements';
	import Icon from '../media/Icon.svelte';
	import RadioButton from './RadioButton.svelte';
	import type { RadioItem } from './item.js';

	interface Props extends Omit<HTMLFieldsetAttributes, 'class' | 'children'> {
		/** Options to choose from. */
		items?: RadioItem<Data>[];
		/** `value` of the selected option. `undefined` while none is selected. */
		value?: string | number;
		/** Legend of the group, read as its name. */
		label?: string;
		/** Native `name` shared by the radios, sent with forms. Generated when missing, so the radios always form a group. */
		name?: string;
		/** Puts the options in a column or side by side (wrapping when there is no room). */
		orientation?: 'vertical' | 'horizontal';
		/** Shows every option as a bordered box that highlights when selected. */
		card?: boolean;
		/** Disables the whole group (native `disabled` of the fieldset). */
		disabled?: boolean;
		/** Native `required`: a form cannot be submitted until an option is selected. */
		required?: boolean;
		/** Text below the options. With `state` it becomes the error or success message. */
		hint?: string;
		/** Validation state: colors the circles and the hint. `error` also sets `aria-invalid`. */
		state?: 'error' | 'success';
		/** Extra classes for each part: the fieldset, the legend, the list of options, each option and the hint. */
		class?: {
			container?: string;
			label?: string;
			items?: string;
			item?: string;
			hint?: string;
		};
		/** Replaces the legend content. */
		labelSnippet?: Snippet<[{ label: string | undefined }]>;
		/** Replaces the label of each option (icon and text). A click on it still selects the option. */
		itemSnippet?: Snippet<[{ item: RadioItem<Data>; index: number; checked: boolean }]>;
		/** Replaces the secondary text of each option. */
		itemDescriptionSnippet?: Snippet<[{ item: RadioItem<Data>; index: number; checked: boolean }]>;
		/** Replaces the hint below the options. */
		hintSnippet?: Snippet<[{ hint: string | undefined }]>;
	}

	let {
		items = [],
		value = $bindable(),
		label,
		name,
		orientation = 'vertical',
		card = false,
		disabled = false,
		required = false,
		hint,
		state,
		class: clazz = {},
		labelSnippet,
		itemSnippet,
		itemDescriptionSnippet,
		hintSnippet,
		...rest
	}: Props = $props();

	const uid = $props.id();
	const legendId = `${uid}-legend`;
	const hintId = `${uid}-hint`;
	let groupName = $derived(name ?? uid);
	let hasLabel = $derived(!!label || !!labelSnippet);
	let hasHint = $derived(!!hint || !!hintSnippet);

	const text = (item: RadioItem<Data>) => String(item.label ?? item.value);
</script>

<fieldset
	{...rest}
	class={['aurora-radio-group', clazz.container]}
	role="radiogroup"
	aria-labelledby={hasLabel ? legendId : rest['aria-labelledby']}
	aria-describedby={hasHint ? hintId : rest['aria-describedby']}
	aria-invalid={state === 'error' || undefined}
	aria-required={required || undefined}
	{disabled}
	data-state={state}
	data-disabled={disabled || undefined}
	data-orientation={orientation}
	data-card={card || undefined}
>
	{#if labelSnippet}
		<legend class={['aurora-radio-group-label', clazz.label]} id={legendId}
			>{@render labelSnippet({ label })}</legend
		>
	{:else if label}
		<legend class={['aurora-radio-group-label', clazz.label]} id={legendId}>{label}</legend>
	{/if}
	<div class={['aurora-radio-group-items', clazz.items]}>
		{#each items as item, index (item.value)}
			{@const checked = value === item.value}
			{#snippet itemLabel()}
				{#if itemSnippet}
					{@render itemSnippet({ item, index, checked })}
				{:else}
					<span class="aurora-radio-group-item-label">
						{#if item.icon}<Icon path={item.icon} />{/if}{text(item)}
					</span>
				{/if}
			{/snippet}
			{#snippet itemDescription()}
				{#if itemDescriptionSnippet}
					{@render itemDescriptionSnippet({ item, index, checked })}
				{:else}
					{item.description}
				{/if}
			{/snippet}
			<RadioButton
				bind:group={value}
				value={item.value}
				name={groupName}
				{required}
				{card}
				disabled={disabled || item.disabled}
				class={{ container: clazz.item }}
				labelSnippet={itemLabel}
				descriptionSnippet={item.description || itemDescriptionSnippet ? itemDescription : undefined}
			/>
		{/each}
	</div>
	{#if hintSnippet}
		<div class={['aurora-radio-group-hint', clazz.hint]} id={hintId}>{@render hintSnippet({ hint })}</div>
	{:else if hint}
		<div class={['aurora-radio-group-hint', clazz.hint]} id={hintId}>{hint}</div>
	{/if}
</fieldset>

<style>
	@layer reset, theme, base, global.base, global.theme, global.components, components, utilities;

	@layer global.components {
		.aurora-radio-group {
			--_hint: var(--radio-group-hint-color, var(--radio-group-default-hint-color));
			--_items-gap: var(--radio-group-default-items-gap);
			--icon-size: var(--radio-group-icon-size, var(--radio-group-default-icon-size));

			display: flex;
			flex-direction: column;
			gap: var(--radio-group-gap, var(--radio-group-default-gap));
			min-inline-size: 0;
			margin: 0;
			padding: 0;
			border: 0;
		}

		.aurora-radio-group[data-orientation='horizontal']:not([data-card]) {
			--_items-gap: var(--radio-group-default-horizontal-items-gap);
		}

		.aurora-radio-group[data-state='error'] {
			--_hint: var(--radio-group-error-color, var(--radio-group-default-error-color));
		}

		.aurora-radio-group[data-state='success'] {
			--_hint: var(--radio-group-success-color, var(--radio-group-default-success-color));
		}

		.aurora-radio-group[data-state] {
			--radio-button-default-border-color: var(--_hint);
			--radio-button-default-card-border-color: var(--_hint);
		}

		.aurora-radio-group-label {
			float: inline-start;
			padding: 0;
			color: var(--radio-group-label-color, var(--radio-group-default-label-color));
			font-size: var(--radio-group-label-font-size, var(--radio-group-default-label-font-size));
			font-weight: var(--radio-group-label-font-weight, var(--radio-group-default-label-font-weight));
		}

		.aurora-radio-group-items {
			display: flex;
			flex-direction: column;
			align-items: flex-start;
			gap: var(--radio-group-items-gap, var(--_items-gap));
		}

		.aurora-radio-group[data-card] .aurora-radio-group-items {
			align-items: stretch;
		}

		.aurora-radio-group[data-orientation='horizontal'] .aurora-radio-group-items {
			flex-direction: row;
			flex-wrap: wrap;
			align-items: flex-start;
		}

		.aurora-radio-group[data-orientation='horizontal'][data-card] .aurora-radio-group-items {
			align-items: stretch;
		}

		.aurora-radio-group[data-orientation='horizontal'][data-card]
			.aurora-radio-group-items
			> :global(.aurora-radio-button) {
			flex: 1 1 var(--radio-group-card-min-width, var(--radio-group-default-card-min-width));
		}

		.aurora-radio-group-item-label {
			display: inline-flex;
			align-items: center;
			gap: 6px;
		}

		.aurora-radio-group-hint {
			color: var(--_hint);
			font-size: var(--radio-group-hint-font-size, var(--radio-group-default-hint-font-size));
		}
	}
</style>
