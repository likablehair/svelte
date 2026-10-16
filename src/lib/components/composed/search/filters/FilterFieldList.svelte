<script lang="ts">
	import type { FilterField } from '../../../../utils/filters/model.js';
	import type { FilterLabels } from '../../../../utils/filters/labels.js';
	import SimpleTextField from '../../../simple/forms/SimpleTextField.svelte';
	import Icon from '../../../simple/media/Icon.svelte';

	const SEARCH_ICON =
		'M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z';

	interface Props {
		fields: FilterField[];
		labels: FilterLabels;
		autofocus?: boolean;
		onselect: (field: FilterField) => void;
	}

	let { fields, labels, autofocus = false, onselect }: Props = $props();

	const uid = $props.id();
	let search = $state('');
	let active = $state(0);

	const normalize = (text: string) =>
		text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase();

	let matches = $derived(
		fields.filter((field) =>
			normalize(`${field.label} ${field.category ?? ''} ${field.description ?? ''}`).includes(
				normalize(search.trim())
			)
		)
	);
	let groups = $derived.by(() => {
		const map = new Map<string, FilterField[]>();
		for (const field of matches) {
			const key = field.category ?? '';
			map.set(key, [...(map.get(key) ?? []), field]);
		}
		return [...map.entries()];
	});
	let ordered = $derived(groups.flatMap(([, list]) => list));
	let searchable = $derived(fields.length > 7);

	$effect(() => {
		void search;
		active = 0;
	});

	function keydown(event: KeyboardEvent) {
		if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
			event.preventDefault();
			const step = event.key === 'ArrowDown' ? 1 : -1;
			active = (active + step + ordered.length) % Math.max(ordered.length, 1);
			document.getElementById(`${uid}-option-${active}`)?.scrollIntoView({ block: 'nearest' });
		} else if (event.key === 'Enter' && ordered[active]) {
			event.preventDefault();
			onselect(ordered[active]);
		}
	}
</script>

<div class="aurora-filter-fields">
	{#if searchable}
		<!-- svelte-ignore a11y_autofocus -->
		<SimpleTextField
			bind:value={search}
			prependInnerIcon={SEARCH_ICON}
			placeholder={labels.searchFields}
			aria-label={labels.searchFields}
			role="combobox"
			aria-expanded="true"
			aria-controls="{uid}-list"
			aria-activedescendant={ordered.length ? `${uid}-option-${active}` : undefined}
			aria-autocomplete="list"
			autocomplete="off"
			{autofocus}
			onkeydown={keydown}
		/>
	{/if}
	<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_autofocus -->
	<div
		class="aurora-filter-fields-list"
		role="listbox"
		id="{uid}-list"
		aria-label={labels.addFilter}
		tabindex={searchable ? -1 : 0}
		aria-activedescendant={!searchable && ordered.length ? `${uid}-option-${active}` : undefined}
		autofocus={autofocus && !searchable}
		onkeydown={searchable ? undefined : keydown}
		onmousedown={(event) => event.preventDefault()}
	>
		{#each groups as [category, list] (category)}
			{#if category}
				<div class="aurora-filter-fields-category" role="presentation">{category}</div>
			{/if}
			{#each list as field (field.name)}
				{@const index = ordered.indexOf(field)}
				<!-- svelte-ignore a11y_click_events_have_key_events, a11y_interactive_supports_focus -->
				<div
					class="aurora-filter-fields-option"
					role="option"
					id="{uid}-option-{index}"
					aria-selected={index === active}
					data-active={index === active || undefined}
					onclick={() => onselect(field)}
					onmousemove={() => (active = index)}
				>
					{#if field.icon}<Icon path={field.icon} />{/if}
					<span class="aurora-filter-fields-label">
						{field.label}
						{#if field.description}<small>{field.description}</small>{/if}
					</span>
				</div>
			{/each}
		{/each}
		{#if !ordered.length}
			<div class="aurora-filter-fields-empty" role="presentation">{labels.noFields}</div>
		{/if}
	</div>
</div>

<style>
	@layer reset, theme, base, global.base, global.theme, global.components, components, utilities;

	@layer global.components {
		.aurora-filter-fields {
			display: flex;
			flex-direction: column;
			gap: 6px;
			box-sizing: border-box;
			width: var(--filters-field-list-width, 260px);
			max-width: 100%;
			padding: 4px;
		}

		.aurora-filter-fields-list {
			display: flex;
			flex-direction: column;
			max-height: var(--filters-field-list-max-height, 320px);
			overflow-y: auto;
			outline: none;
		}

		.aurora-filter-fields-list:focus-visible {
			outline: var(--global-focus-ring-width) solid var(--global-focus-ring-color);
			outline-offset: 2px;
			border-radius: var(--global-radius-sm);
		}

		.aurora-filter-fields-category {
			padding: 8px 10px 4px;
			color: var(--global-color-text-3);
			font-size: 11px;
			font-weight: 600;
			letter-spacing: 0.06em;
			text-transform: uppercase;
		}

		.aurora-filter-fields-option {
			display: flex;
			align-items: center;
			gap: 10px;
			padding: 8px 10px;
			border-radius: var(--global-radius-sm);
			color: var(--global-color-text);
			font-size: 13.5px;
			cursor: pointer;
			--icon-size: 18px;
			--icon-color: var(--global-color-text-3);
		}

		.aurora-filter-fields-option[data-active] {
			background: var(--global-color-surface-2);
		}

		.aurora-filter-fields-label {
			display: flex;
			flex-direction: column;
			min-width: 0;
		}

		.aurora-filter-fields-label small {
			color: var(--global-color-text-3);
			font-size: 12px;
		}

		.aurora-filter-fields-empty {
			padding: 12px 10px;
			color: var(--global-color-text-3);
			font-size: 13px;
		}
	}
</style>
