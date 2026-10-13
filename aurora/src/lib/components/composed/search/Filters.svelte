<!-- @component
Filter bar for lists and tables. The app declares the filterable `fields` (text, number, date, options, yes/no or its own input; columns, joins, relations and custom queries are declared on the field), and the user adds the conditions one at a time: "Add filter" lists the fields (with a search when they are many), then a card asks for the operator of that field and the value. Each condition becomes a pill "field · operator · value": click it to edit, its × removes it. The "Filters" button shows how many conditions are active and opens a panel with every condition in rows ("Where … and …"), where `allowOr` lets the user switch to OR and `maxDepth` allows nested groups. `pinned` fields are always in the bar, and `presets` are chips that add ready-made conditions. Changes apply as soon as a condition is complete (after `applyDelay`); with `confirm` the card and the panel have Cancel and Apply. On screens up to 1024px wide the panel opens in a bottom sheet (`mobileDrawer`). The conditions live in `value`, a plain JSON tree (see `createFilters`), and `onchange` receives it with the `FilterBuilder` of the query, built by `filtersToBuilder`. Every text can be translated with `labels`.
-->
<script lang="ts">
	import '../../../css/tokens.css';
	import './Filters.css';
	import { untrack, type Snippet } from 'svelte';
	import { MediaQuery } from 'svelte/reactivity';
	import type FilterBuilder from '../../../utils/filters/builder.js';
	import { filtersToBuilder } from '../../../utils/filters/convert.js';
	import { filterLabels, type FilterLabelsInput } from '../../../utils/filters/labels.js';
	import { inheritedLocale } from '../../../utils/locale.js';
	import {
		addFilterNode,
		clearFilters,
		countFilters,
		createFilters,
		fieldOperators,
		filterCondition,
		filterConditions,
		findFilterNode,
		isConditionComplete,
		isFilterGroup,
		pruneFilters,
		removeFilterNode,
		updateFilterNode,
		type FilterCondition,
		type FilterField,
		type FilterGroup,
		type FilterPreset,
		type SavedFilter,
		filterId
	} from '../../../utils/filters/model.js';
	import Button from '../../simple/buttons/Button.svelte';
	import Menu from '../../simple/common/Menu.svelte';
	import FilterEditor from './FilterEditor.svelte';
	import FilterFieldList from './filters/FilterFieldList.svelte';
	import FilterPills from './filters/FilterPills.svelte';
	import FilterPresets from './filters/FilterPresets.svelte';
	import FiltersPanel from './filters/FiltersPanel.svelte';
	import SavedFilters from './filters/SavedFilters.svelte';
	import { pointerPress } from './filters/pointer.svelte.js';
	import { togglePreset } from './filters/presets.js';
	import { readSaved, restoreSaved, writeSaved } from './filters/saved.js';

	const FILTER_ICON = 'M14,12V19.88C14.04,20.18 13.94,20.5 13.71,20.71C13.32,21.1 12.69,21.1 12.3,20.71L10.29,18.7C10.06,18.47 9.96,18.16 10,17.87V12H9.97L4.21,4.62C3.87,4.19 3.95,3.56 4.38,3.22C4.57,3.08 4.78,3 5,3V3H19V3C19.22,3 19.43,3.08 19.62,3.22C20.05,3.56 20.13,4.19 19.79,4.62L14.03,12H14Z';
	const BOOKMARK_ICON =
		'M17,18L12,15.82L7,18V5H17M17,3H7A2,2 0 0,0 5,5V21L12,18L19,21V5C19,3.89 18.1,3 17,3Z';

	interface Props {
		/** The fields the user can filter. */
		fields: FilterField[];
		/** The conditions: a tree of groups and conditions (see `createFilters`). Without it the component keeps its own; to clear them from the app pass `createFilters()`. */
		value?: FilterGroup;
		/** Lets the user combine the conditions with OR instead of AND. Turn it on only when the backend applies OR groups correctly. */
		allowOr?: boolean;
		/** How deep groups can be nested in the panel: `0` means no groups. With GET requests most backends read one level. */
		maxDepth?: number;
		/** The card and the panel work on a draft, with Cancel and Apply. Without it every complete change applies. */
		confirm?: boolean;
		/** Milliseconds between the last change and `onchange` (without `confirm`). */
		applyDelay?: number;
		/** Operators the fields without `operators` offer: `basic` (the essential ones), `standard` (default) or `all`. */
		operatorSet?: 'basic' | 'standard' | 'all';
		/** Own operator list per field type for the fields without `operators`, instead of `operatorSet` (for example `{ date: ['is', 'between', 'period'] }`). */
		typeOperators?: Partial<Record<'string' | 'number' | 'date' | 'select' | 'bool' | 'custom', string[]>>;
		/** Ready-made sets of conditions, shown as chips under the bar. */
		presets?: FilterPreset[];
		/** Shows "Saved filters": the user saves the current filters under a name and applies them later. On with `saved` or `savedKey` too. */
		savable?: boolean;
		/** The saved filters. Bind it (or use `onsavedchange`) to keep them in the backend. */
		saved?: SavedFilter[];
		/** Keeps the saved filters in the browser (`localStorage`) under this key. */
		savedKey?: string;
		/** Query the filters are added to in `onchange` (for example with the search and the sorting). */
		builder?: FilterBuilder;
		/** BCP 47 locale: the language of every text (`it` and `en` are built in, others fall back to English) and the format of dates and numbers. Defaults to the one set with `setDefaultLocale`, else `en`. */
		locale?: string;
		/** First day of the week for the periods `thisWeek`, `lastWeek` and `nextWeek`. Default 1 (Monday). */
		weekStart?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
		/** Negative operators ("is not", "does not contain", ≠, "is none of", "not between") also keep the rows where the field is empty, which SQL leaves out. On by default; it sends `null` modifiers, so pass `false` for backends that do not know them (variants E and E'). A field's `negativesIncludeEmpty` wins. */
		negativesIncludeEmpty?: boolean;
		/** Texts to change (see `FilterLabels`), on top of those of `locale`: pass only what differs, or every text for a language the library does not have. */
		labels?: FilterLabelsInput;
		/** Shows a pill for each condition in the bar. */
		showPills?: boolean;
		/** On screens up to 1024px wide, every editor opens in a bottom sheet with all the conditions. */
		mobileDrawer?: boolean;
		/** Extra classes for each part. */
		class?: { container?: string; bar?: string; pill?: string; panel?: string };
		/** Content at the start of the bar (for example a search field). */
		prependSnippet?: Snippet;
		/** Content after the filter buttons. */
		appendSnippet?: Snippet;
		/** Content at the end of the bar, pushed to the right (for example "New" or "Export"). */
		actionsSnippet?: Snippet;
		/** Replaces the text of a pill (field, operator and value). The pill keeps its buttons. */
		pillSnippet?: Snippet<[{ condition: FilterCondition; field: FilterField; operator: string; value: string }]>;
		/** Input of the value for `custom` fields and operators with `input: 'custom'`. Call `setValue` with the new value. */
		inputSnippet?: Snippet<
			[{ field: FilterField; operator: string; value: unknown; setValue: (value: unknown) => void }]
		>;
		/** Called when the query changes: the tree (complete conditions only) and the `FilterBuilder` built from it. */
		onchange?: (change: { value: FilterGroup; builder: FilterBuilder }) => void;
		/** Called when the user removes complete conditions (× of a pill, Remove, Clear, a row of the panel, a preset turned off), for example to reset state of the app. */
		onremove?: (change: { conditions: FilterCondition[] }) => void;
		/** Called when the user saves or deletes saved filters, with the new list. */
		onsavedchange?: (saved: SavedFilter[]) => void;
		/** Called when the list of fields, a card or the panel opens, for example to load the options of a field. */
		onopen?: (event: { view: 'fields' | 'editor' | 'panel'; field?: FilterField }) => void;
	}

	let {
		fields,
		value = $bindable(),
		allowOr = false,
		maxDepth = 0,
		confirm = false,
		applyDelay = 300,
		presets = [],
		builder,
		locale: localeProp,
		weekStart = 1,
		negativesIncludeEmpty = true,
		labels: textOverrides,
		showPills = true,
		mobileDrawer = true,
		class: clazz = {},
		prependSnippet,
		appendSnippet,
		actionsSnippet,
		pillSnippet,
		inputSnippet,
		onchange,
		onremove,
		onopen,
		operatorSet = 'standard',
		typeOperators,
		savable = false,
		saved = $bindable(),
		savedKey,
		onsavedchange
	}: Props = $props();

	const defaultLocale = inheritedLocale();
	let locale = $derived(localeProp ?? defaultLocale());
	const mobile = new MediaQuery('max-width: 1024px', false);
	const uid = $props.id();
	const panelId = `${uid}-panel`;

	let own = $state(untrack(() => value ?? createFilters()));
	let tree = $derived(value ?? own);
	let texts = $derived(filterLabels(textOverrides, locale));
	let drawerMode = $derived(mobileDrawer && mobile.current);
	let byName = $derived(new Map(fields.map((field) => [field.name, field])));
	let count = $derived(countFilters(tree, fields));
	let removable = $derived(
		filterConditions(tree).some((condition) => !condition.locked && !byName.get(condition.field)?.hidden)
	);

	let popupOpen = $state(false);
	let popupMode = $state<'fields' | 'editor'>('fields');
	let popupAnchor = $state<HTMLElement>();
	let draft = $state<FilterCondition>();
	let addButton = $state<HTMLButtonElement>();
	let rootElement = $state<HTMLDivElement>();
	let panelOpen = $state(false);
	let panelDraft = $state<FilterGroup>();
	let filtersButton = $state<HTMLButtonElement | HTMLAnchorElement>();

	let editingField = $derived(draft ? byName.get(draft.field) : undefined);
	let editingExisting = $derived(!!draft && !!findFilterNode(tree, draft.id));
	let pinned = $derived(fields.filter((field) => field.pinned && !field.hidden));
	let pills = $derived(
		tree.items.filter((node) => {
			if (isFilterGroup(node)) return filterConditions(node).some((condition) => isComplete(condition));
			const field = byName.get(node.field);
			return !!field && !field.hidden && (isComplete(node) || node.id === draft?.id);
		})
	);
	let returnTo: HTMLElement | undefined;
	let operatorOptions = $derived({ set: operatorSet, byType: typeOperators });
	let ownSaved = $state<SavedFilter[]>(untrack(() => saved ?? []));
	let savedList = $derived(saved ?? ownSaved);
	let showSaved = $derived(savable || saved !== undefined || !!savedKey);
	let savedOpen = $state(false);
	let savedButton = $state<HTMLButtonElement | HTMLAnchorElement>();
	let saveName = $state('');

	$effect(() => {
		const key = savedKey;
		if (!key) return;
		untrack(() => {
			const list = readSaved(key);
			if (list) setSaved(list, false);
		});
	});

	function setSaved(list: SavedFilter[], persist = true) {
		ownSaved = list;
		saved = list;
		if (!persist) return;
		if (savedKey) writeSaved(savedKey, list);
		onsavedchange?.(list);
	}

	function saveCurrent() {
		const name = saveName.trim();
		if (!name) return;
		const locked = filterConditions(tree).filter((condition) => condition.locked);
		let value = dropIncomplete(tree);
		for (const condition of locked) value = removeFilterNode(value, condition.id);
		setSaved([...savedList, { id: filterId(), name, value: pruneFilters(value) }]);
		saveName = '';
	}

	function applySaved(item: SavedFilter) {
		commit(restoreSaved(item, tree, fields));
		savedOpen = false;
		(savedButton as HTMLElement | undefined)?.focus();
	}

	let lastQuery = untrack(() => query(tree));
	let timer: ReturnType<typeof setTimeout> | undefined;

	$effect(() => {
		const current = query(tree);
		untrack(() => {
			clearTimeout(timer);
			if (current === lastQuery) return;
			const send = () => {
				lastQuery = current;
				onchange?.({ value: dropIncomplete(tree), builder: build(tree) });
			};
			if (confirm || applyDelay <= 0) send();
			else timer = setTimeout(send, applyDelay);
		});
	});

	$effect(() => () => clearTimeout(timer));

	$effect(() => {
		void pills;
		void pinned;
		untrack(() => {
			if (!popupOpen) return;
			const own =
				popupMode === 'editor'
					? rootElement?.querySelector<HTMLElement>('.aurora-filters-pill-main[aria-expanded="true"]')
					: undefined;
			if (own && own !== popupAnchor) popupAnchor = own;
			else if (popupAnchor?.isConnected === false) popupAnchor = own ?? addButton;
		});
	});

	const pointer = pointerPress();

	$effect(() => {
		if (popupOpen) return;
		untrack(() => {
			if (!pointer.down || !draft) return releaseDraft();
			const id = draft.id;
			pointer.afterRelease(() => {
				dropIfIncomplete(id);
				if (!popupOpen && draft?.id === id) draft = undefined;
			});
		});
	});

	function releaseDraft() {
		if (!draft) return;
		dropIfIncomplete(draft.id);
		draft = undefined;
	}

	function dropIfIncomplete(id: string) {
		const stored = findFilterNode(tree, id)?.node;
		if (stored && !isFilterGroup(stored) && !stored.locked && !isComplete(stored))
			commit(removeFilterNode(tree, id));
	}

	function build(current: FilterGroup) {
		return filtersToBuilder(current, fields, { builder, weekStart, negativesIncludeEmpty });
	}

	function query(current: FilterGroup) {
		return JSON.stringify(build(current).toJson());
	}

	function isComplete(condition: FilterCondition) {
		return isConditionComplete(condition, byName.get(condition.field));
	}

	function commit(next: FilterGroup) {
		const kept = new Set(filterConditions(next).map((condition) => condition.id));
		const removed = filterConditions(tree).filter(
			(condition) => !kept.has(condition.id) && isComplete(condition)
		);
		own = next;
		value = next;
		if (removed.length) onremove?.({ conditions: removed });
	}

	function newCondition(field: FilterField) {
		return filterCondition(
			field.name,
			field.defaultOperator ?? fieldOperators(field, operatorOptions)[0]?.name ?? '',
			field.defaultValue
		);
	}

	function dropIncomplete(current: FilterGroup): FilterGroup {
		let next = current;
		for (const condition of filterConditions(current))
			if (!condition.locked && !isComplete(condition)) next = removeFilterNode(next, condition.id);
		return pruneFilters(next);
	}

	function openFields(anchor: HTMLElement | undefined) {
		if (drawerMode) return openPanel(true);
		releaseDraft();
		popupMode = 'fields';
		popupAnchor = anchor;
		returnTo = anchor;
		popupOpen = true;
		onopen?.({ view: 'fields' });
	}

	function start(field: FilterField, anchor?: HTMLElement) {
		if (drawerMode) {
			const condition = newCondition(field);
			if (confirm) panelDraft = addFilterNode(panelDraft ?? tree, condition);
			else commit(addFilterNode(tree, condition));
			if (!panelOpen) onopen?.({ view: 'panel' });
			panelOpen = true;
			return;
		}
		const condition = newCondition(field);
		draft = condition;
		if (!confirm && isConditionComplete(condition, field)) commit(addFilterNode(tree, condition));
		popupMode = 'editor';
		if (anchor) popupAnchor = returnTo = anchor;
		popupOpen = true;
		onopen?.({ view: 'editor', field });
	}

	function edit(condition: FilterCondition, anchor: HTMLElement) {
		if (condition.locked) return;
		if (drawerMode) return openPanel();
		draft = { ...condition };
		popupMode = 'editor';
		popupAnchor = returnTo = anchor;
		popupOpen = true;
		onopen?.({ view: 'editor', field: byName.get(condition.field) });
	}

	function change(condition: FilterCondition) {
		draft = condition;
		if (findFilterNode(tree, condition.id)) commit(updateFilterNode(tree, condition.id, condition));
		else if (isComplete(condition)) commit(addFilterNode(tree, condition));
	}

	function apply(condition: FilterCondition) {
		if (findFilterNode(tree, condition.id)) commit(updateFilterNode(tree, condition.id, condition));
		else commit(addFilterNode(tree, condition));
		popupOpen = false;
		(returnTo?.isConnected ? returnTo : addButton)?.focus();
	}

	function remove(id: string) {
		commit(removeFilterNode(tree, id));
		if (draft?.id === id) popupOpen = false;
	}

	function clear() {
		commit(clearFilters(tree));
		popupOpen = false;
	}

	function openPanel(addRow = false) {
		popupOpen = false;
		const withRow = addRow ? addFilterNode(tree, filterCondition('', '')) : tree;
		if (confirm) panelDraft = withRow;
		else if (addRow) commit(withRow);
		panelOpen = true;
		onopen?.({ view: 'panel' });
	}

	function panelChange(next: FilterGroup) {
		if (confirm) panelDraft = next;
		else commit(next);
	}

	function closePanel(applyDraft: boolean) {
		if (confirm && applyDraft && panelDraft) commit(dropIncomplete(panelDraft));
		else if (!confirm) commit(dropIncomplete(tree));
		panelDraft = undefined;
		panelOpen = false;
	}

	$effect(() => {
		if (panelOpen) return;
		untrack(() => {
			if (panelDraft) panelDraft = undefined;
			const cleaned = dropIncomplete(tree);
			if (!confirm && JSON.stringify(cleaned) !== JSON.stringify(tree)) commit(cleaned);
		});
	});
</script>

<div class={['aurora-filters', clazz.container]} bind:this={rootElement} data-count={count} data-open={popupOpen || panelOpen || undefined}>
	<div class={['aurora-filters-bar', clazz.bar]}>
		{@render prependSnippet?.()}
		<Button
			variant="secondary"
			size="sm"
			icon={FILTER_ICON}
			bind:buttonElement={filtersButton}
			aria-haspopup="dialog"
			aria-expanded={panelOpen}
			aria-controls={panelOpen && !drawerMode ? panelId : undefined}
			onclick={() => (panelOpen ? closePanel(false) : openPanel())}
		>
			{texts.filters}
			{#if count}<span class="aurora-filters-count">{count}</span>{/if}
		</Button>
		{#if showSaved}
			<Button
				variant="secondary"
				size="sm"
				icon={BOOKMARK_ICON}
				bind:buttonElement={savedButton}
				aria-haspopup="dialog"
				aria-expanded={savedOpen}
				onclick={() => (savedOpen = !savedOpen)}
			>
				{texts.savedFilters}
			</Button>
		{/if}
		<FilterPills
			{fields}
			{pinned}
			{pills}
			logic={tree.logic}
			{showPills}
			labels={texts}
			{locale}
			pillClass={clazz.pill}
			{pillSnippet}
			editing={popupOpen ? draft?.id : undefined}
			fieldsOpen={popupOpen && popupMode === 'fields'}
			{panelOpen}
			bind:addButton
			onedit={edit}
			onremove={remove}
			onstart={start}
			onopenpanel={() => openPanel()}
			onopenfields={openFields}
		/>
		{#if removable}
			<Button buttonType="text" size="sm" onclick={clear}>{texts.clear}</Button>
		{/if}
		{@render appendSnippet?.()}
		{#if actionsSnippet}
			<div class="aurora-filters-actions">{@render actionsSnippet()}</div>
		{/if}
	</div>
	<FilterPresets {presets} {tree} labels={texts} ontoggle={(preset) => commit(togglePreset(tree, preset))} />
</div>

<FiltersPanel
	bind:open={panelOpen}
	drawer={drawerMode}
	group={(confirm ? panelDraft : tree) ?? tree}
	{fields}
	{maxDepth}
	{allowOr}
	{operatorOptions}
	labels={texts}
	{locale}
	{inputSnippet}
	{confirm}
	{removable}
	id={panelId}
	activator={filtersButton}
	panelClass={clazz.panel}
	onchange={panelChange}
	onclose={closePanel}
/>

{#if !drawerMode}
	<Menu bind:open={popupOpen} activator={popupAnchor} placement="bottom-start" class="aurora-filters-popup">
		{#if popupMode === 'fields'}
			<FilterFieldList
				fields={fields.filter((field) => !field.hidden)}
				labels={texts}
				autofocus
				onselect={(field) => start(field)}
			/>
		{:else if draft && editingField}
			<FilterEditor
				field={editingField}
				bind:condition={() => draft!, (condition) => (draft = condition)}
				{confirm}
				{operatorSet}
				{typeOperators}
				removable={editingExisting}
				labels={textOverrides}
				{locale}
				autofocus
				{inputSnippet}
				onchange={change}
				onapply={apply}
				oncancel={() => (popupOpen = false)}
				onremove={() => draft && remove(draft.id)}
				onclose={() => (popupOpen = false)}
			/>
		{/if}
	</Menu>
{/if}

{#if showSaved}
	<SavedFilters
		bind:open={savedOpen}
		bind:name={saveName}
		activator={savedButton}
		list={savedList}
		{count}
		labels={texts}
		onapply={applySaved}
		ondelete={(item) => setSaved(savedList.filter((other) => other.id !== item.id))}
		onsave={saveCurrent}
	/>
{/if}

<style>
	@layer reset, theme, base, global.base, global.theme, global.components, components, utilities;

	@layer global.components {
		.aurora-filters {
			display: flex;
			flex-direction: column;
			gap: var(--filters-gap, var(--filters-default-gap));
			box-sizing: border-box;
			width: var(--filters-width, 100%);
			min-width: 0;
		}

		.aurora-filters-bar {
			display: flex;
			flex-wrap: wrap;
			align-items: center;
			gap: var(--filters-gap, var(--filters-default-gap));
			min-width: 0;
		}

		.aurora-filters-count {
			min-width: 18px;
			height: 18px;
			padding: 0 6px;
			box-sizing: border-box;
			border-radius: var(--global-radius-full);
			background: var(--filters-count-background, var(--filters-default-count-background));
			color: var(--filters-count-color, var(--filters-default-count-color));
			font-size: 11px;
			font-weight: 600;
			line-height: 18px;
		}

		.aurora-filters-actions {
			display: flex;
			flex-wrap: wrap;
			align-items: center;
			gap: 8px;
			margin-inline-start: auto;
		}
	}
</style>
