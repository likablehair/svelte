<!-- @component
Grid of widgets for a dashboard: `columns` equal columns, rows `--dashboard-shaper-row-height` tall, each widget placed by its `left`, `top`, `width` and `height` (the same shape saved by v4) and drawn by `widgetSnippet`. Read-only by default, it shows only the rows in use. With `editing` the user arranges it: the empty spaces become dashed "Add widget" buttons that open the catalog (a dialog, a bottom sheet on screens up to 1024px) with the widgets of `catalog` and the sizes that fit there; widgets get a remove button, can be dragged to free cells (onto a widget of the same size they swap places, the others never move on their own; on touch screens after holding them for a moment, so that the page still scrolls, or at once from their handle) and resized with the handle in their corner among the `sizes` of their catalog entry; `movable` and `resizable` turn those two off. From the keyboard the handle next to the remove button moves the widget with the arrow keys, resizes it with Shift and the arrow keys and removes it with Delete. While editing, a free band as tall as the tallest size of the catalog stays below the widgets, up to `rows` when set. Every change updates `widgets` and calls `onchange`; `hasEmptySlots` tells whether the rows in use have holes. Narrower than `stackBelow` (640px of the component) the widgets go in one column, in reading order and with their height; while editing there the dashboard shows the real grid in small, each widget as a block with its icon, title and size: tapping a block selects it: then it drags at once and shows its remove button and the handle to resize it; any block also drags after a hold. `preview` draws plain blocks instead of the widgets, for thumbnails, and keeps the grid at every width. The root has `data-editing`, `data-stacked` and `data-preview`; a widget being dragged or resized has `data-dragging` or `data-resizing`.
-->
<script lang="ts" generics="Data = unknown, Name extends string = string">
	import '../../../css/tokens.css';
	import './DashboardShaper.css';
	import { tick, type Snippet } from 'svelte';
	import { flip } from 'svelte/animate';
	import type { HTMLAttributes } from 'svelte/elements';
	import { MediaQuery } from 'svelte/reactivity';
	import Icon from '../../simple/media/Icon.svelte';
	import Catalog from './dashboard-shaper/Catalog.svelte';
	import { breakpoints } from '../../../utils/breakpoints.svelte.js';
	import { inheritedLocale } from '../../../utils/locale.js';
	import { observeWidth } from '../../../utils/size.js';
	import { libraryTexts } from '../../../utils/texts.js';
	import {
		bottomOf,
		emptyAreas,
		fits,
		fittingSizes,
		hasHoles,
		nearestSize,
		newWidgetId,
		placeWidget,
		readingOrder,
		resizeWidget,
		sameSize,
		stepSize,
		stepTarget,
		type Area,
		type Direction,
		type Place
	} from '../../../utils/dashboard/grid.js';
	import type {
		DashboardCatalogItem,
		DashboardChange,
		DashboardWidget,
		DashboardWidgetSize
	} from '../../../utils/dashboard/types.js';

	const GRIP_ICON =
		'M7,19V17H9V19H7M11,19V17H13V19H11M15,19V17H17V19H15M7,15V13H9V15H7M11,15V13H13V15H11M15,15V13H17V15H15M7,11V9H9V11H7M11,11V9H13V11H11M15,11V9H17V11H15M7,7V5H9V7H7M11,7V5H13V7H11M15,7V5H17V7H15Z';
	const CLOSE_ICON =
		'M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z';
	const PLUS_ICON = 'M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z';
	const HOLD_MS = 300;
	const DIRECTIONS: Record<string, Direction> = {
		ArrowLeft: 'left',
		ArrowRight: 'right',
		ArrowUp: 'up',
		ArrowDown: 'down'
	};

	interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'class' | 'onchange'> {
		/** The widgets on the dashboard, each with its `name`, its place (`left`, `top`, from 1) and its size (`width`, `height`). Updated by every change the user makes. */
		widgets?: DashboardWidget<Data, Name>[];
		/** Types of widget the user can add, with the sizes each comes in. Also gives the title of each widget and the sizes it can be resized to. */
		catalog?: DashboardCatalogItem<Name>[];
		/** Number of columns. */
		columns?: number;
		/** Maximum number of rows. Without it the dashboard grows downwards as needed. */
		rows?: number;
		/** Lets the user arrange the dashboard: add, remove, move and resize widgets. */
		editing?: boolean;
		/** While editing, widgets can be moved. Turn it off to only add and remove them, as in v4. */
		movable?: boolean;
		/** While editing, widgets with more than one size in `catalog` can be resized. */
		resizable?: boolean;
		/** Draws a plain block for each widget, for a small thumbnail of the layout. */
		preview?: boolean;
		/** Whether some cell is empty in the rows in use, for example to save only complete dashboards. Read it with `bind:hasEmptySlots`. */
		hasEmptySlots?: boolean;
		/** Width of the component, in pixels, under which the widgets go in one column. `false` keeps the grid at every width. */
		stackBelow?: number | false;
		/** BCP 47 locale of the texts: `it` and `en` are built in, other languages fall back to English. Defaults to the one set with `setDefaultLocale`, else `en`. */
		locale?: string;
		/** Texts to change, on top of those of `locale`. `{title}`, `{width}`, `{height}`, `{row}` and `{column}` are replaced by the title of a widget, its size and its place. */
		labels?: {
			add?: string;
			catalog?: string;
			all?: string;
			noFit?: string;
			size?: string;
			addSize?: string;
			widget?: string;
			move?: string;
			moveHint?: string;
			resizeHint?: string;
			removeHint?: string;
			resize?: string;
			remove?: string;
			schemaHint?: string;
			close?: string;
			moved?: string;
			resized?: string;
			removed?: string;
			added?: string;
		};
		/** Called after every change made by the user, with all the widgets and the ones added, removed, moved or resized. */
		onchange?: (event: DashboardChange<Data, Name>) => void;
		/** Extra classes for each part: `container` the grid, `widget` the box of each widget, `slot` the empty spaces, `catalog` the dialog or sheet of the catalog. */
		class?: {
			container?: string;
			widget?: string;
			slot?: string;
			catalog?: string;
		};
		/** Content of a widget. `item` is its entry in `catalog`, `editing` is true while the dashboard is being arranged (the content is then inert) and `remove` takes the widget away. Defaults to the title of the widget. */
		widgetSnippet?: Snippet<
			[
				{
					widget: DashboardWidget<Data, Name>;
					item: DashboardCatalogItem<Name> | undefined;
					editing: boolean;
					remove: () => void;
				}
			]
		>;
		/** Replaces the "Add widget" button of an empty space, `width` columns by `height` rows; `add` opens the catalog for that space. */
		slotSnippet?: Snippet<[{ width: number; height: number; add: () => void }]>;
		/** Replaces the title of the catalog. */
		catalogHeaderSnippet?: Snippet<[]>;
		/** Content of a widget type in the catalog, instead of its icon, title, description and size buttons; `sizes` are the ones that fit and `add(size)` adds the widget. */
		catalogItemSnippet?: Snippet<
			[{ item: DashboardCatalogItem<Name>; sizes: DashboardWidgetSize[]; add: (size: DashboardWidgetSize) => void }]
		>;
	}

	let {
		widgets = $bindable(),
		catalog = [],
		columns = 6,
		rows,
		editing = $bindable(),
		movable = true,
		resizable = true,
		preview = false,
		hasEmptySlots = $bindable(),
		stackBelow = 640,
		locale: localeProp,
		labels,
		onchange,
		class: clazz = {},
		widgetSnippet,
		slotSnippet,
		catalogHeaderSnippet,
		catalogItemSnippet,
		...rest
	}: Props = $props();

	type Widget = DashboardWidget<Data, Name>;
	type Item = DashboardCatalogItem<Name>;

	const defaultLocale = inheritedLocale();
	let locale = $derived(localeProp ?? defaultLocale());
	let texts = $derived({ ...libraryTexts(locale).dashboardShaper, ...labels });

	const id = $props.id();
	const reducedMotion = new MediaQuery('prefers-reduced-motion: reduce', false);

	let list = $derived(widgets ?? []);
	let ordered = $derived(readingOrder(list));
	let byName = $derived(new Map(catalog.map((item) => [item.name, item])));

	let width = $state(0);
	let narrow = $derived(!preview && stackBelow !== false && width > 0 && width < stackBelow);
	let edit = $derived(!!editing && !preview);
	let stacked = $derived(narrow && !edit);
	let schema = $derived(narrow && edit);
	let canMove = $derived(edit && movable);
	let canResize = $derived(edit && resizable);

	let selectedId = $state<string | number>();
	let selected = $derived(schema ? list.find((widget) => widget.id === selectedId) : undefined);

	let tallest = $derived(
		Math.max(1, ...catalog.flatMap((item) => item.sizes.map((size) => size.height)), ...list.map((w) => w.height))
	);
	let bottom = $derived(bottomOf(list));
	let shownRows = $derived(edit ? Math.min(rows ?? Infinity, bottom + tallest) : bottom);
	let slots = $derived(edit && catalog.length ? emptyAreas(list, columns, shownRows) : ([] as Area[]));

	$effect(() => {
		const holes = hasHoles(list, columns);
		if (hasEmptySlots !== holes) hasEmptySlots = holes;
	});

	let gridNode = $state<HTMLElement>();
	const gripNodes: Record<string, HTMLElement | null> = {};
	let announcement = $state('');

	function hint(resizable: boolean) {
		return [canMove && texts.moveHint, resizable && texts.resizeHint, texts.removeHint].filter(Boolean).join(' ');
	}

	function fill(text: string, values: Record<string, string | number>) {
		return text.replace(/\{(\w+)\}/g, (match, name) => (name in values ? String(values[name]) : match));
	}

	function titleOf(widget: Widget) {
		return byName.get(widget.name)?.title ?? widget.name;
	}

	function gridArea(area: Area) {
		return `${area.top} / ${area.left} / span ${area.height} / span ${area.width}`;
	}

	function commit(next: Widget[], change: Partial<Omit<DashboardChange<Data, Name>, 'widgets'>>) {
		widgets = next;
		onchange?.({ widgets: next, added: [], removed: [], changed: [], ...change });
	}

	async function focusGrip(widgetId: string | number) {
		await tick();
		gripNodes[String(widgetId)]?.focus();
	}

	function remove(widget: Widget) {
		if (selectedId === widget.id) selectedId = undefined;
		const index = ordered.findIndex((candidate) => candidate.id === widget.id);
		const next = list.filter((candidate) => candidate.id !== widget.id);
		commit(next, { removed: [widget] });
		announcement = fill(texts.removed, { title: titleOf(widget) });
		const neighbour = readingOrder(next)[Math.min(index, next.length - 1)];
		if (neighbour) focusGrip(neighbour.id);
	}

	function move(widget: Widget, place: Place, swap?: Widget) {
		const result = placeWidget(list, widget.id, place, swap);
		if (!result.changed.length) return;
		commit(result.widgets, { changed: result.changed });
		announcement = fill(texts.moved, { title: titleOf(widget), row: place.top, column: place.left });
	}

	function resize(widget: Widget, size: DashboardWidgetSize) {
		if (sameSize(widget, size)) return;
		const result = resizeWidget(list, widget.id, size);
		commit(result.widgets, { changed: result.changed });
		announcement = fill(texts.resized, { title: titleOf(widget), ...size });
	}

	function sizesFor(widget: Widget) {
		return fittingSizes(list, byName.get(widget.name)?.sizes ?? [], widget, columns, rows, [widget.id]);
	}

	function canResizeWidget(widget: Widget) {
		return canResize && (byName.get(widget.name)?.sizes.length ?? 0) > 1;
	}

	function arrange(event: KeyboardEvent, widget: Widget) {
		if (event.key === 'Delete' || event.key === 'Backspace') {
			event.preventDefault();
			remove(widget);
			return;
		}
		const direction = DIRECTIONS[event.key];
		if (!direction || event.altKey || event.ctrlKey || event.metaKey) return;
		if (event.shiftKey) {
			if (!canResizeWidget(widget)) return;
			event.preventDefault();
			const size = stepSize(sizesFor(widget), widget, direction);
			if (size) resize(widget, size);
		} else {
			if (!canMove) return;
			event.preventDefault();
			step(widget, direction);
		}
		focusGrip(widget.id);
	}

	function step(widget: Widget, direction: Direction) {
		const target = stepTarget(list, widget, direction, columns, shownRows);
		if (target) move(widget, target.place, target.swap);
	}

	let catalogOpen = $state(false);
	let catalogPlace = $state<Place>();

	let catalogEntries = $derived.by(() => {
		if (!catalogOpen) return [];
		const present = new Set(list.map((widget) => widget.name));
		return catalog
			.filter((item) => !(item.unique && present.has(item.name)))
			.map((item) => ({
				item,
				sizes: catalogPlace ? fittingSizes(list, item.sizes, catalogPlace, columns, rows) : []
			}))
			.filter((entry) => entry.sizes.length);
	});

	function openCatalog(place: Place) {
		catalogPlace = place;
		catalogOpen = true;
	}

	function add(item: Item, size: DashboardWidgetSize) {
		const place = catalogPlace;
		if (!place) return;
		const widget = { id: newWidgetId(), name: item.name, ...size, ...place } as Widget;
		catalogOpen = false;
		commit([...list, widget], { added: [widget] });
		announcement = fill(texts.added, { title: item.title });
	}

	type Drag = {
		kind: 'move' | 'resize';
		widget: Widget;
		pointerId: number;
		startX: number;
		startY: number;
		x: number;
		y: number;
		originX: number;
		originY: number;
		offsetX: number;
		offsetY: number;
		grabColumn: number;
		grabRow: number;
		started: boolean;
		holding: boolean;
		touch: boolean;
		target: Area;
		valid: boolean;
		swap?: Widget;
		fromGrip: boolean;
	};
	let drag = $state<Drag | null>(null);
	let frame = 0;
	let holdTimer: ReturnType<typeof setTimeout> | undefined;
	let suppressClick = false;

	function metrics() {
		const rect = gridNode!.getBoundingClientRect();
		const style = getComputedStyle(gridNode!);
		const columnGap = parseFloat(style.columnGap) || 0;
		const rowGap = parseFloat(style.rowGap) || 0;
		const columnWidth = (rect.width - columnGap * (columns - 1)) / columns;
		const rowHeight = parseFloat(style.gridTemplateRows) || parseFloat(style.gridAutoRows) || 1;
		return { rect, columnPitch: columnWidth + columnGap, rowPitch: rowHeight + rowGap };
	}

	function cellAt(x: number, y: number) {
		const { rect, columnPitch, rowPitch } = metrics();
		return {
			left: Math.floor((x - rect.left) / columnPitch) + 1,
			top: Math.floor((y - rect.top) / rowPitch) + 1
		};
	}

	function clamp(value: number, min: number, max: number) {
		return Math.max(min, Math.min(max, value));
	}

	function startDrag(event: PointerEvent, widget: Widget, kind: 'move' | 'resize') {
		if (event.button !== 0 || !gridNode) return;
		const element = event.target as Element;
		const fromGrip = !!element.closest('.aurora-dashboard-shaper-grip');
		const touch = event.pointerType !== 'mouse';
		if (kind === 'move') {
			if (!canMove || element.closest('.aurora-dashboard-shaper-remove, .aurora-dashboard-shaper-resize')) return;
		}
		const holding = kind === 'move' && touch && !fromGrip && !(schema && selected?.id === widget.id);
		if (!holding) event.preventDefault();
		event.stopPropagation();
		const cell = cellAt(event.clientX, event.clientY);
		const rect = gridNode.getBoundingClientRect();
		drag = {
			kind,
			widget,
			pointerId: event.pointerId,
			startX: event.clientX,
			startY: event.clientY,
			x: event.clientX,
			y: event.clientY,
			originX: event.clientX - rect.left,
			originY: event.clientY - rect.top,
			offsetX: 0,
			offsetY: 0,
			grabColumn: clamp(cell.left - widget.left, 0, widget.width - 1),
			grabRow: clamp(cell.top - widget.top, 0, widget.height - 1),
			started: kind === 'resize',
			holding,
			touch,
			target: { left: widget.left, top: widget.top, width: widget.width, height: widget.height },
			valid: true,
			fromGrip
		};
		clearTimeout(holdTimer);
		if (holding) holdTimer = setTimeout(startHeldDrag, HOLD_MS);
	}

	function startHeldDrag() {
		if (!drag?.holding) return;
		drag.holding = false;
		drag.started = true;
		navigator.vibrate?.(10);
		dragTo(drag.x, drag.y);
	}

	function dragTo(x: number, y: number) {
		if (!drag || !gridNode) return;
		drag.x = x;
		drag.y = y;
		if (drag.holding) {
			if (Math.hypot(x - drag.startX, y - drag.startY) > 8) {
				clearTimeout(holdTimer);
				drag = null;
			}
			return;
		}
		if (!drag.started) {
			if (Math.hypot(x - drag.startX, y - drag.startY) < 4) return;
			drag.started = true;
		}
		const rect = gridNode.getBoundingClientRect();
		drag.offsetX = x - rect.left - drag.originX;
		drag.offsetY = y - rect.top - drag.originY;
		const widget = drag.widget;
		const cell = cellAt(x, y);
		if (drag.kind === 'resize') {
			const wanted = {
				width: clamp(cell.left - widget.left + 1, 1, columns),
				height: Math.max(1, cell.top - widget.top + 1)
			};
			const size = nearestSize(sizesFor(widget), wanted) ?? widget;
			drag.target = { left: widget.left, top: widget.top, width: size.width, height: size.height };
			drag.valid = true;
			return;
		}
		const place = {
			left: clamp(cell.left - drag.grabColumn, 1, columns - widget.width + 1),
			top: clamp(cell.top - drag.grabRow, 1, Math.max(1, shownRows - widget.height + 1))
		};
		const area = { ...place, width: widget.width, height: widget.height };
		if (fits(list, area, columns, rows, [widget.id])) {
			drag.target = area;
			drag.valid = true;
			drag.swap = undefined;
			return;
		}
		const under = list.find(
			(other) =>
				other.id !== widget.id &&
				sameSize(other, widget) &&
				cell.left >= other.left &&
				cell.left < other.left + other.width &&
				cell.top >= other.top &&
				cell.top < other.top + other.height
		);
		drag.target = under ? { left: under.left, top: under.top, width: widget.width, height: widget.height } : area;
		drag.valid = !!under;
		drag.swap = under;
	}

	function scroller() {
		for (let node = gridNode?.parentElement; node; node = node.parentElement) {
			const { overflowY } = getComputedStyle(node);
			if ((overflowY === 'auto' || overflowY === 'scroll') && node.scrollHeight > node.clientHeight) return node;
		}
		return document.scrollingElement ?? document.documentElement;
	}

	function autoScroll() {
		frame = 0;
		if (!drag?.started) return;
		const container = scroller();
		const page = container === document.scrollingElement || container === document.documentElement;
		const rect = page ? { top: 0, bottom: window.innerHeight } : container.getBoundingClientRect();
		const edge = Math.min(48, (rect.bottom - rect.top) / 4);
		const above = rect.top + edge - drag.y;
		const below = drag.y - (rect.bottom - edge);
		const speed = above > 0 ? -above : below > 0 ? below : 0;
		if (!speed) return;
		const before = container.scrollTop;
		container.scrollTop += (Math.min(Math.abs(speed), edge) / edge) * 14 * Math.sign(speed);
		if (container.scrollTop === before) return;
		dragTo(drag.x, drag.y);
		frame = requestAnimationFrame(autoScroll);
	}

	function followScroll() {
		if (drag?.started) dragTo(drag.x, drag.y);
	}

	function moveDrag(event: PointerEvent) {
		if (!drag || event.pointerId !== drag.pointerId) return;
		dragTo(event.clientX, event.clientY);
		if (!frame) frame = requestAnimationFrame(autoScroll);
	}

	function endDrag(event: PointerEvent) {
		if (!drag || event.pointerId !== drag.pointerId) return;
		const { kind, widget, started, valid, target, swap, fromGrip } = drag;
		clearTimeout(holdTimer);
		drag = null;
		if (started) {
			suppressClick = true;
			setTimeout(() => (suppressClick = false));
		}
		if (!started) {
			if (fromGrip) gripNodes[String(widget.id)]?.focus();
			return;
		}
		if (event.type === 'pointercancel' || !valid) return;
		if (kind === 'resize') resize(widget, target);
		else if (target.left !== widget.left || target.top !== widget.top) move(widget, target, swap);
	}

	function cancelDrag(event: KeyboardEvent) {
		if (event.key !== 'Escape' || !drag) return;
		event.preventDefault();
		event.stopPropagation();
		clearTimeout(holdTimer);
		drag = null;
	}

	function preventScroll(event: TouchEvent) {
		if (drag?.started && drag.touch) event.preventDefault();
	}

	function preventMenu(event: Event) {
		if (drag?.touch) event.preventDefault();
	}

	let dragging = $derived(drag !== null);

	$effect(() => {
		if (!dragging) return;
		window.addEventListener('pointermove', moveDrag);
		window.addEventListener('pointerup', endDrag);
		window.addEventListener('pointercancel', endDrag);
		window.addEventListener('keydown', cancelDrag, true);
		window.addEventListener('scroll', followScroll, { capture: true, passive: true });
		window.addEventListener('touchmove', preventScroll, { passive: false });
		window.addEventListener('contextmenu', preventMenu, true);
		return () => {
			clearTimeout(holdTimer);
			cancelAnimationFrame(frame);
			frame = 0;
			window.removeEventListener('pointermove', moveDrag);
			window.removeEventListener('pointerup', endDrag);
			window.removeEventListener('pointercancel', endDrag);
			window.removeEventListener('keydown', cancelDrag, true);
			window.removeEventListener('scroll', followScroll, { capture: true });
			window.removeEventListener('touchmove', preventScroll);
			window.removeEventListener('contextmenu', preventMenu, true);
		};
	});

	function reorder(node: Element, rects: { from: DOMRect; to: DOMRect }) {
		if (reducedMotion.current) return { duration: 0 };
		return flip(node, rects, { duration: 180 });
	}

	let measure = $derived(preview || stackBelow === false ? undefined : observeWidth((next) => (width = next)));
</script>

<div
	{...rest}
	class={['aurora-dashboard-shaper', clazz.container]}
	data-editing={edit || undefined}
	data-stacked={stacked || undefined}
	data-schema={schema || undefined}
	data-preview={preview || undefined}
	data-dragging={drag?.started || undefined}
	{@attach measure}
>
	<div class="aurora-dashboard-shaper-grid" style:--_columns={columns} style:--_rows={shownRows} bind:this={gridNode}>
		{#each ordered as widget (widget.id)}
			{@const item = byName.get(widget.name)}
			{@const title = titleOf(widget)}
			{@const label = fill(texts.widget, { title, width: widget.width, height: widget.height })}
			{@const active = drag?.started && drag.widget.id === widget.id}
			{@const resizableWidget = canResizeWidget(widget)}
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				class={['aurora-dashboard-shaper-widget', clazz.widget]}
				style:grid-area={stacked ? undefined : gridArea(widget)}
				style:--_span={widget.height}
				style:translate={active && drag?.kind === 'move' ? `${drag.offsetX}px ${drag.offsetY}px` : undefined}
				data-movable={(canMove && !schema) || undefined}
				data-dragging={(active && drag?.kind === 'move') || undefined}
				data-resizing={(active && drag?.kind === 'resize') || undefined}
				data-selected={selected?.id === widget.id || undefined}
				role={edit && !schema ? 'group' : undefined}
				aria-label={edit && !schema ? label : undefined}
				onpointerdown={canMove ? (event) => startDrag(event, widget, 'move') : undefined}
				animate:reorder
			>
				{#if preview}
					<div class="aurora-dashboard-shaper-preview"></div>
				{:else if schema}
					<button
						type="button"
						class="aurora-dashboard-shaper-block"
						aria-label={label}
						aria-pressed={selected?.id === widget.id}
						aria-describedby="{id}-{resizableWidget ? 'resize' : 'fixed'}"
						bind:this={() => gripNodes[String(widget.id)], (node) => (gripNodes[String(widget.id)] = node)}
						onclick={() => {
							if (!suppressClick) selectedId = selected?.id === widget.id ? undefined : widget.id;
						}}
						onkeydown={(event) => arrange(event, widget)}
					>
						<span class="aurora-dashboard-shaper-block-head">
							{#if item?.icon}<span class="aurora-dashboard-shaper-block-icon"><Icon path={item.icon} /></span>{/if}
							<span class="aurora-dashboard-shaper-block-title">{title}</span>
						</span>
						<span class="aurora-dashboard-shaper-block-size">{fill(texts.size, { width: widget.width, height: widget.height })}</span>
					</button>
					{#if selected?.id === widget.id}
						<button
							type="button"
							class="aurora-dashboard-shaper-remove aurora-dashboard-shaper-block-remove"
							aria-label={fill(texts.remove, { title })}
							onclick={() => remove(widget)}
						>
							<Icon path={CLOSE_ICON} />
						</button>
						{#if resizableWidget}
							<span
								class="aurora-dashboard-shaper-resize"
								aria-hidden="true"
								title={fill(texts.resize, { title })}
								onpointerdown={(event) => startDrag(event, widget, 'resize')}
							></span>
						{/if}
					{/if}
				{:else}
					<div class="aurora-dashboard-shaper-content" inert={edit}>
						{#if widgetSnippet}
							{@render widgetSnippet({ widget, item, editing: edit, remove: () => remove(widget) })}
						{:else}
							<span class="aurora-dashboard-shaper-name">{title}</span>
						{/if}
					</div>
					{#if edit}
						{#if canMove || resizableWidget}
							<button
								type="button"
								class="aurora-dashboard-shaper-grip aurora-dashboard-shaper-control"
								aria-label={fill(texts.move, { title })}
								aria-describedby="{id}-{resizableWidget ? 'resize' : 'fixed'}"
								bind:this={() => gripNodes[String(widget.id)], (node) => (gripNodes[String(widget.id)] = node)}
								onkeydown={(event) => arrange(event, widget)}
							>
								<Icon path={GRIP_ICON} />
							</button>
						{/if}
						<button
							type="button"
							class="aurora-dashboard-shaper-remove aurora-dashboard-shaper-control"
							aria-label={fill(texts.remove, { title })}
							onclick={() => remove(widget)}
						>
							<Icon path={CLOSE_ICON} />
						</button>
						{#if resizableWidget}
							<span
								class="aurora-dashboard-shaper-resize"
								aria-hidden="true"
								title={fill(texts.resize, { title })}
								onpointerdown={(event) => startDrag(event, widget, 'resize')}
							></span>
						{/if}
					{/if}
				{/if}
			</div>
		{/each}

		{#each slots as slot (`${slot.left}:${slot.top}:${slot.width}:${slot.height}`)}
			<div class={['aurora-dashboard-shaper-slot', clazz.slot]} style:grid-area={gridArea(slot)}>
				{#if slotSnippet}
					{@render slotSnippet({ width: slot.width, height: slot.height, add: () => openCatalog(slot) })}
				{:else}
					<button
						type="button"
						class="aurora-dashboard-shaper-add"
						aria-label={texts.add}
						onclick={() => openCatalog({ left: slot.left, top: slot.top })}
					>
						<Icon path={PLUS_ICON} />
						{#if slot.width > 1}<span class="aurora-dashboard-shaper-add-text">{texts.add}</span>{/if}
					</button>
				{/if}
			</div>
		{/each}

		{#if drag?.started}
			<div
				class="aurora-dashboard-shaper-target"
				style:grid-area={gridArea(drag.target)}
				data-invalid={!drag.valid || undefined}
				aria-hidden="true"
			></div>
		{/if}
	</div>

	{#if schema}
		<p class="aurora-dashboard-shaper-hint">{texts.schemaHint}</p>
	{/if}

	{#if edit}
		<span id="{id}-resize" class="aurora-dashboard-shaper-visually-hidden">{hint(true)}</span>
		<span id="{id}-fixed" class="aurora-dashboard-shaper-visually-hidden">{hint(false)}</span>
		<div class="aurora-dashboard-shaper-visually-hidden" aria-live="polite">{announcement}</div>
	{/if}
</div>

{#if edit && catalog.length}
	<Catalog
		bind:open={catalogOpen}
		entries={catalogEntries}
		drawer={breakpoints.mAndDown}
		texts={texts}
		{locale}
		className={clazz.catalog}
		onadd={add}
		headerSnippet={catalogHeaderSnippet}
		itemSnippet={catalogItemSnippet}
	/>
{/if}

<style>
	@layer reset, theme, base, global.base, global.theme, global.components, components, utilities;

	@layer global.components {
		.aurora-dashboard-shaper {
			--_row-height: var(--dashboard-shaper-row-height, var(--dashboard-shaper-default-row-height));
			--_gap: var(--dashboard-shaper-gap, var(--dashboard-shaper-default-gap));
			--_radius: var(--dashboard-shaper-widget-border-radius, var(--dashboard-shaper-default-widget-border-radius));
			--_ring: var(--dashboard-shaper-focus-ring-width, var(--dashboard-shaper-default-focus-ring-width)) solid
				var(--dashboard-shaper-focus-ring-color, var(--dashboard-shaper-default-focus-ring-color));
			--_ring-offset: var(--dashboard-shaper-focus-ring-offset, var(--dashboard-shaper-default-focus-ring-offset));

			position: relative;
			display: flex;
			box-sizing: border-box;
			width: 100%;
			flex-direction: column;
			gap: 12px;
		}

		.aurora-dashboard-shaper[data-schema] {
			--_row-height: var(--dashboard-shaper-schema-row-height, var(--dashboard-shaper-default-schema-row-height));
			--_gap: var(--dashboard-shaper-schema-gap, var(--dashboard-shaper-default-schema-gap));
		}

		.aurora-dashboard-shaper-grid {
			position: relative;
			display: grid;
			box-sizing: border-box;
			width: 100%;
			min-height: var(--dashboard-shaper-min-height, var(--dashboard-shaper-default-min-height));
			grid-template-columns: repeat(var(--_columns), minmax(0, 1fr));
			grid-template-rows: repeat(var(--_rows), var(--_row-height));
			grid-auto-rows: var(--_row-height);
			gap: var(--_gap);
		}

		.aurora-dashboard-shaper[data-stacked] .aurora-dashboard-shaper-grid {
			display: flex;
			flex-direction: column;
		}

		.aurora-dashboard-shaper[data-stacked] .aurora-dashboard-shaper-widget {
			flex: none;
			height: calc(var(--_span) * var(--_row-height) + (var(--_span) - 1) * var(--_gap));
		}

		.aurora-dashboard-shaper[data-dragging] {
			cursor: grabbing;
			user-select: none;
			overflow-anchor: none;
		}

		.aurora-dashboard-shaper-widget {
			position: relative;
			min-width: 0;
			min-height: 0;
			border-radius: var(--_radius);
		}

		.aurora-dashboard-shaper-content {
			width: 100%;
			height: 100%;
		}

		.aurora-dashboard-shaper[data-editing] .aurora-dashboard-shaper-content {
			pointer-events: none;
			user-select: none;
		}

		.aurora-dashboard-shaper[data-editing] .aurora-dashboard-shaper-widget {
			-webkit-touch-callout: none;
			user-select: none;
		}

		.aurora-dashboard-shaper-name {
			display: grid;
			width: 100%;
			height: 100%;
			box-sizing: border-box;
			place-items: center;
			padding: 12px;
			border: var(--global-border-width) solid var(--global-color-border);
			border-radius: var(--_radius);
			background: var(--global-color-surface-solid);
			color: var(--dashboard-shaper-name-color, var(--dashboard-shaper-default-name-color));
			font-size: var(--dashboard-shaper-name-font-size, var(--dashboard-shaper-default-name-font-size));
			text-align: center;
		}

		.aurora-dashboard-shaper-preview {
			width: 100%;
			height: 100%;
			border-radius: var(
				--dashboard-shaper-preview-border-radius,
				var(--dashboard-shaper-default-preview-border-radius)
			);
			background: var(--dashboard-shaper-preview-background, var(--dashboard-shaper-default-preview-background));
		}

		.aurora-dashboard-shaper-widget[data-movable] {
			cursor: grab;
		}

		.aurora-dashboard-shaper[data-editing] .aurora-dashboard-shaper-widget::after {
			position: absolute;
			inset: 0;
			border-radius: var(--_radius);
			content: '';
			pointer-events: none;
			transition: box-shadow var(--global-duration-fast) var(--global-ease);
		}

		.aurora-dashboard-shaper[data-editing] .aurora-dashboard-shaper-widget:focus-within::after,
		.aurora-dashboard-shaper-widget[data-dragging]::after,
		.aurora-dashboard-shaper-widget[data-resizing]::after {
			box-shadow:
				inset 0 0 0 1px var(--dashboard-shaper-hover-outline-color, var(--dashboard-shaper-default-hover-outline-color)),
				0 0 0 3px var(--dashboard-shaper-hover-ring-color, var(--dashboard-shaper-default-hover-ring-color));
		}

		@media (hover: hover) {
			.aurora-dashboard-shaper[data-editing]:not([data-dragging]) .aurora-dashboard-shaper-widget:hover::after {
				box-shadow:
					inset 0 0 0 1px
						var(--dashboard-shaper-hover-outline-color, var(--dashboard-shaper-default-hover-outline-color)),
					0 0 0 3px var(--dashboard-shaper-hover-ring-color, var(--dashboard-shaper-default-hover-ring-color));
			}
		}

		.aurora-dashboard-shaper-widget[data-dragging] {
			z-index: 3;
			opacity: var(--dashboard-shaper-dragging-opacity, var(--dashboard-shaper-default-dragging-opacity));
			box-shadow: var(--dashboard-shaper-dragging-box-shadow, var(--dashboard-shaper-default-dragging-box-shadow));
			cursor: grabbing;
		}

		.aurora-dashboard-shaper-control {
			--icon-default-size: var(
				--dashboard-shaper-control-icon-size,
				var(--dashboard-shaper-default-control-icon-size)
			);

			position: absolute;
			z-index: 2;
			top: 8px;
			display: grid;
			width: var(--dashboard-shaper-control-size, var(--dashboard-shaper-default-control-size));
			height: var(--dashboard-shaper-control-size, var(--dashboard-shaper-default-control-size));
			place-items: center;
			padding: 0;
			border: 0;
			border-radius: var(
				--dashboard-shaper-control-border-radius,
				var(--dashboard-shaper-default-control-border-radius)
			);
			opacity: 0;
			cursor: pointer;
			transition: opacity var(--global-duration-fast) var(--global-ease);
		}

		.aurora-dashboard-shaper-control:focus-visible {
			outline: var(--_ring);
			outline-offset: var(--_ring-offset);
		}

		.aurora-dashboard-shaper-widget:focus-within .aurora-dashboard-shaper-control,
		.aurora-dashboard-shaper-widget[data-dragging] .aurora-dashboard-shaper-control,
		.aurora-dashboard-shaper-widget[data-resizing] .aurora-dashboard-shaper-control {
			opacity: 1;
		}

		@media (hover: hover) {
			.aurora-dashboard-shaper-widget:hover .aurora-dashboard-shaper-control {
				opacity: 1;
			}
		}

		@media (hover: none) {
			.aurora-dashboard-shaper-control {
				opacity: 1;
			}
		}

		.aurora-dashboard-shaper-grip {
			right: calc(12px + var(--dashboard-shaper-control-size, var(--dashboard-shaper-default-control-size)));
			background: var(--dashboard-shaper-grip-background, var(--dashboard-shaper-default-grip-background));
			box-shadow: var(--global-shadow-sm);
			color: var(--dashboard-shaper-grip-color, var(--dashboard-shaper-default-grip-color));
			cursor: grab;
			touch-action: none;
		}

		.aurora-dashboard-shaper-remove {
			right: 8px;
			background: var(--dashboard-shaper-remove-background, var(--dashboard-shaper-default-remove-background));
			color: var(--dashboard-shaper-remove-color, var(--dashboard-shaper-default-remove-color));
		}

		.aurora-dashboard-shaper-resize {
			position: absolute;
			z-index: 2;
			right: 0;
			bottom: 0;
			width: var(--dashboard-shaper-resize-size, var(--dashboard-shaper-default-resize-size));
			height: var(--dashboard-shaper-resize-size, var(--dashboard-shaper-default-resize-size));
			border-bottom-right-radius: var(--_radius);
			background: linear-gradient(
				135deg,
				transparent 0 50%,
				var(--dashboard-shaper-resize-color, var(--dashboard-shaper-default-resize-color)) 50% 100%
			);
			cursor: nwse-resize;
			opacity: 0;
			touch-action: none;
			transition: opacity var(--global-duration-fast) var(--global-ease);
		}

		.aurora-dashboard-shaper-widget:focus-within .aurora-dashboard-shaper-resize,
		.aurora-dashboard-shaper-widget[data-resizing] .aurora-dashboard-shaper-resize {
			opacity: 0.8;
		}

		@media (hover: hover) {
			.aurora-dashboard-shaper-widget:hover .aurora-dashboard-shaper-resize {
				opacity: 0.8;
			}
		}

		@media (hover: none) {
			.aurora-dashboard-shaper-resize {
				opacity: 0.8;
			}
		}

		.aurora-dashboard-shaper-slot {
			min-width: 0;
			min-height: 0;
		}


		.aurora-dashboard-shaper-add {
			display: flex;
			width: 100%;
			height: 100%;
			box-sizing: border-box;
			align-items: center;
			justify-content: center;
			gap: 8px;
			padding: 8px;
			border: var(--dashboard-shaper-slot-border-width, var(--dashboard-shaper-default-slot-border-width)) dashed
				var(--dashboard-shaper-slot-border-color, var(--dashboard-shaper-default-slot-border-color));
			border-radius: var(--_radius);
			background: var(--dashboard-shaper-slot-background, var(--dashboard-shaper-default-slot-background));
			color: var(--dashboard-shaper-slot-color, var(--dashboard-shaper-default-slot-color));
			font: inherit;
			font-size: var(--dashboard-shaper-slot-font-size, var(--dashboard-shaper-default-slot-font-size));
			font-weight: var(--dashboard-shaper-slot-font-weight, var(--dashboard-shaper-default-slot-font-weight));
			cursor: pointer;
			transition:
				background var(--global-duration-fast) var(--global-ease),
				border-color var(--global-duration-fast) var(--global-ease),
				color var(--global-duration-fast) var(--global-ease);
		}

		.aurora-dashboard-shaper-add:focus-visible {
			outline: var(--_ring);
			outline-offset: var(--_ring-offset);
		}

		@media (hover: hover) {
			.aurora-dashboard-shaper-add:hover {
				border-color: var(
					--dashboard-shaper-slot-hover-border-color,
					var(--dashboard-shaper-default-slot-hover-border-color)
				);
				background: var(
					--dashboard-shaper-slot-hover-background,
					var(--dashboard-shaper-default-slot-hover-background)
				);
				color: var(--dashboard-shaper-slot-hover-color, var(--dashboard-shaper-default-slot-hover-color));
			}
		}

		.aurora-dashboard-shaper[data-dragging] .aurora-dashboard-shaper-slot {
			pointer-events: none;
		}

		.aurora-dashboard-shaper-target {
			z-index: 1;
			box-sizing: border-box;
			border: 2px dashed
				var(--dashboard-shaper-target-border-color, var(--dashboard-shaper-default-target-border-color));
			border-radius: var(--_radius);
			background: var(--dashboard-shaper-target-background, var(--dashboard-shaper-default-target-background));
			pointer-events: none;
		}

		.aurora-dashboard-shaper-target[data-invalid] {
			border-color: var(
				--dashboard-shaper-invalid-target-border-color,
				var(--dashboard-shaper-default-invalid-target-border-color)
			);
			background: var(
				--dashboard-shaper-invalid-target-background,
				var(--dashboard-shaper-default-invalid-target-background)
			);
		}

		.aurora-dashboard-shaper-block {
			--icon-default-size: 16px;

			display: flex;
			width: 100%;
			height: 100%;
			box-sizing: border-box;
			flex-direction: column;
			align-items: flex-start;
			justify-content: center;
			gap: 2px;
			min-width: 0;
			padding: 4px 8px;
			overflow: hidden;
			border: var(--global-border-width) solid
				var(--dashboard-shaper-block-border-color, var(--dashboard-shaper-default-block-border-color));
			border-radius: var(--_radius);
			background: var(--dashboard-shaper-block-background, var(--dashboard-shaper-default-block-background));
			color: var(--dashboard-shaper-block-color, var(--dashboard-shaper-default-block-color));
			font: inherit;
			text-align: start;
			cursor: pointer;
			container-type: inline-size;
			transition:
				border-color var(--global-duration-fast) var(--global-ease),
				box-shadow var(--global-duration-fast) var(--global-ease),
				background var(--global-duration-fast) var(--global-ease);
		}

		.aurora-dashboard-shaper-widget[data-selected] .aurora-dashboard-shaper-block {
			cursor: grab;
			touch-action: none;
		}

		.aurora-dashboard-shaper-block:focus-visible {
			outline: var(--_ring);
			outline-offset: var(--_ring-offset);
		}

		.aurora-dashboard-shaper-block[aria-pressed='true'] {
			border-color: var(
				--dashboard-shaper-block-selected-border-color,
				var(--dashboard-shaper-default-block-selected-border-color)
			);
			background: var(
				--dashboard-shaper-block-selected-background,
				var(--dashboard-shaper-default-block-selected-background)
			);
			box-shadow: 0 0 0 3px var(--dashboard-shaper-hover-ring-color, var(--dashboard-shaper-default-hover-ring-color));
		}

		.aurora-dashboard-shaper-block-head {
			display: flex;
			max-width: 100%;
			align-items: center;
			gap: 6px;
			min-width: 0;
		}

		.aurora-dashboard-shaper-block-icon {
			display: inline-flex;
			flex: none;
			color: var(--dashboard-shaper-block-icon-color, var(--dashboard-shaper-default-block-icon-color));
		}

		.aurora-dashboard-shaper-block-title {
			max-width: 100%;
			overflow: hidden;
			font-size: var(--dashboard-shaper-block-font-size, var(--dashboard-shaper-default-block-font-size));
			font-weight: 600;
			line-height: 1.25;
			text-overflow: ellipsis;
			white-space: nowrap;
		}

		.aurora-dashboard-shaper-block-size {
			color: var(--dashboard-shaper-block-size-color, var(--dashboard-shaper-default-block-size-color));
			font-family: var(--global-font-family-mono);
			font-size: 11px;
			white-space: nowrap;
		}

		@container (max-width: 72px) {
			.aurora-dashboard-shaper-block {
				align-items: center;
			}

			.aurora-dashboard-shaper-block .aurora-dashboard-shaper-block-title {
				display: none;
			}

			.aurora-dashboard-shaper-block:has(.aurora-dashboard-shaper-block-icon) .aurora-dashboard-shaper-block-size {
				display: none;
			}
		}

		.aurora-dashboard-shaper-hint {
			margin: 0;
			color: var(--dashboard-shaper-hint-color, var(--dashboard-shaper-default-hint-color));
			font-size: 12.5px;
			text-align: center;
		}

		.aurora-dashboard-shaper-block-remove {
			--icon-default-size: 14px;

			position: absolute;
			z-index: 2;
			top: -8px;
			right: -8px;
			display: grid;
			width: var(--dashboard-shaper-control-size, var(--dashboard-shaper-default-control-size));
			height: var(--dashboard-shaper-control-size, var(--dashboard-shaper-default-control-size));
			place-items: center;
			padding: 0;
			border: 2px solid var(--global-color-surface-solid);
			border-radius: var(--global-radius-full);
			background: var(--dashboard-shaper-block-remove-background, var(--dashboard-shaper-default-block-remove-background));
			color: var(--dashboard-shaper-block-remove-color, var(--dashboard-shaper-default-block-remove-color));
			cursor: pointer;
		}

		.aurora-dashboard-shaper-block-remove:focus-visible {
			outline: var(--_ring);
			outline-offset: var(--_ring-offset);
		}

		.aurora-dashboard-shaper[data-schema] .aurora-dashboard-shaper-resize {
			width: 26px;
			height: 26px;
			opacity: 1;
		}

		.aurora-dashboard-shaper-visually-hidden {
			position: absolute;
			width: 1px;
			height: 1px;
			margin: -1px;
			padding: 0;
			overflow: hidden;
			clip-path: inset(50%);
			border: 0;
			white-space: nowrap;
		}
	}
</style>
