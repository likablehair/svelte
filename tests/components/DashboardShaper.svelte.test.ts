import { createRawSnippet, tick, type Component } from 'svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import DashboardShaperComponent from '#lib/components/composed/dashboard/DashboardShaper.svelte';
import type { DashboardCatalogItem, DashboardWidget } from '#lib/utils/dashboard/types.js';
import { renderWithDefaultLocale } from '../helpers.js';

const DashboardShaper = DashboardShaperComponent as Component<any>;

const catalog: DashboardCatalogItem[] = [
	{
		name: 'revenue',
		title: 'Revenue',
		sizes: [
			{ width: 1, height: 1 },
			{ width: 2, height: 1 },
			{ width: 2, height: 2 }
		]
	},
	{ name: 'clients', title: 'Clients', sizes: [{ width: 1, height: 1 }] },
	{ name: 'rating', title: 'Rating', sizes: [{ width: 1, height: 1 }] },
	{
		name: 'monthly',
		title: 'Monthly',
		sizes: [
			{ width: 2, height: 2 },
			{ width: 4, height: 2 }
		]
	}
];

const start: DashboardWidget[] = [
	{ id: 1, name: 'revenue', left: 1, top: 1, width: 2, height: 1 },
	{ id: 2, name: 'clients', left: 3, top: 1, width: 1, height: 1 },
	{ id: 3, name: 'rating', left: 4, top: 2, width: 1, height: 1 }
];

function bound<T>(initial?: T) {
	let value = $state(initial);
	return {
		get value() {
			return value;
		},
		set value(next) {
			value = next;
		}
	};
}

function mount(props: Record<string, unknown> = {}) {
	const widgets = bound<DashboardWidget[] | undefined>(structuredClone((props.widgets as DashboardWidget[]) ?? start));
	const holes = bound<boolean | undefined>();
	const result = render(DashboardShaper, {
		catalog,
		columns: 4,
		...props,
		get widgets() {
			return widgets.value;
		},
		set widgets(next) {
			widgets.value = next;
		},
		get hasEmptySlots() {
			return holes.value;
		},
		set hasEmptySlots(next) {
			holes.value = next;
		}
	});
	return { result, widgets, holes };
}

const root = () => document.querySelector<HTMLElement>('.aurora-dashboard-shaper')!;
const grid = () => document.querySelector<HTMLElement>('.aurora-dashboard-shaper-grid')!;
const place = (widgets: DashboardWidget[] | undefined, name: string) => {
	const widget = widgets?.find((candidate) => candidate.name === name);
	return widget && [widget.left, widget.top, widget.width, widget.height];
};
const rowCount = () => getComputedStyle(grid()).gridTemplateRows.split(' ').filter(Boolean).length;

function cellCenter(column: number, row: number) {
	const rect = grid().getBoundingClientRect();
	const style = getComputedStyle(grid());
	const columnGap = parseFloat(style.columnGap);
	const rowGap = parseFloat(style.rowGap);
	const width = (rect.width - columnGap * 3) / 4;
	const height = parseFloat(style.gridTemplateRows);
	return {
		x: rect.left + (column - 1) * (width + columnGap) + width / 2,
		y: rect.top + (row - 1) * (height + rowGap) + height / 2
	};
}

function pointer(type: string, target: EventTarget, point: { x: number; y: number }, pointerType = 'mouse') {
	target.dispatchEvent(
		new PointerEvent(type, {
			clientX: point.x,
			clientY: point.y,
			button: 0,
			pointerId: 7,
			pointerType,
			bubbles: true,
			cancelable: true
		})
	);
}

async function drag(from: Element, to: { x: number; y: number }, release = true) {
	const rect = from.getBoundingClientRect();
	const origin = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
	pointer('pointerdown', from, origin);
	await tick();
	pointer('pointermove', window, { x: (origin.x + to.x) / 2, y: (origin.y + to.y) / 2 });
	pointer('pointermove', window, to);
	await tick();
	if (release) {
		pointer('pointerup', window, to);
		await tick();
	}
}

const widgetBox = (name: string) => page.getByRole('group', { name, exact: true }).element();

describe('DashboardShaper', () => {
	beforeEach(() => {
		document.documentElement.style.setProperty('--dialog-duration', '0s');
		document.documentElement.style.setProperty('--drawer-duration', '0s');
	});
	afterEach(() => {
		document.documentElement.style.removeProperty('--dialog-duration');
		document.documentElement.style.removeProperty('--drawer-duration');
	});

	test('places each widget by its left, top, width and height and draws it with widgetSnippet', async () => {
		mount({
			widgetSnippet: createRawSnippet((params: () => { widget: DashboardWidget; item?: DashboardCatalogItem; editing: boolean }) => ({
				render: () =>
					`<p class="w">${params().widget.name}:${params().item?.title}:${params().editing}</p>`
			}))
		});
		await expect.element(page.getByText('revenue:Revenue:false')).toBeInTheDocument();
		const boxes = [...document.querySelectorAll<HTMLElement>('.aurora-dashboard-shaper-widget')];
		expect(boxes.map((box) => box.textContent?.trim())).toEqual([
			'revenue:Revenue:false',
			'clients:Clients:false',
			'rating:Rating:false'
		]);
		expect(boxes.map((box) => box.style.gridArea)).toEqual([
			'1 / 1 / span 1 / span 2',
			'1 / 3 / span 1 / span 1',
			'2 / 4 / span 1 / span 1'
		]);
		expect(root().dataset.editing).toBeUndefined();
		expect(document.querySelectorAll('button')).toHaveLength(0);
	});

	test('without a snippet a widget shows the title of its catalog entry, else its name', async () => {
		mount({ widgets: [...start, { id: 9, name: 'unknown', left: 1, top: 2, width: 1, height: 1 }] });
		await expect.element(page.getByText('Revenue')).toBeInTheDocument();
		await expect.element(page.getByText('unknown')).toBeInTheDocument();
	});

	test('v4 bug: read-only it shows only the rows in use, not a fixed number of rows', async () => {
		mount({ rows: 4 });
		await expect.poll(rowCount).toBe(2);
	});

	test('while editing, a free band as tall as the tallest catalog size stays below, up to rows', async () => {
		mount({ editing: true });
		await expect.poll(rowCount).toBe(4);
	});

	test('rows caps the free band', async () => {
		mount({ editing: true, rows: 3 });
		await expect.poll(rowCount).toBe(3);
	});

	test('the empty spaces become "Add widget" buttons; rows of equal free runs are joined', async () => {
		mount({ editing: true });
		const slots = [...document.querySelectorAll<HTMLElement>('.aurora-dashboard-shaper-slot')];
		expect(slots.map((slot) => slot.style.gridArea)).toEqual([
			'1 / 4 / span 1 / span 1',
			'2 / 1 / span 1 / span 3',
			'3 / 1 / span 2 / span 4'
		]);
		await expect.element(page.getByRole('button', { name: 'Add widget' }).first()).toBeVisible();
		expect(document.querySelectorAll('.aurora-dashboard-shaper-add-text')).toHaveLength(2);
	});

	test('without a catalog there is nothing to add', async () => {
		mount({ editing: true, catalog: [] });
		expect(document.querySelectorAll('.aurora-dashboard-shaper-slot')).toHaveLength(0);
		await expect.element(page.getByRole('button', { name: 'Remove Revenue' })).toBeInTheDocument();
	});

	test('v4 bug: the catalog offers only the sizes whose cells are all free', async () => {
		mount({
			editing: true,
			widgets: [
				{ id: 1, name: 'clients', left: 1, top: 1, width: 1, height: 1 },
				{ id: 2, name: 'rating', left: 2, top: 2, width: 1, height: 1 }
			]
		});
		const slot = [...document.querySelectorAll<HTMLElement>('.aurora-dashboard-shaper-slot')].find(
			(node) => node.style.gridArea === '2 / 1 / span 1 / span 1'
		)!;
		await userEvent.click(slot.querySelector('button')!);
		const dialog = page.getByRole('dialog', { name: 'Add widget' });
		await expect.element(dialog).toBeVisible();
		await expect.element(dialog.getByRole('button', { name: 'Add Revenue, 1 × 1' })).toBeInTheDocument();
		expect(dialog.getByRole('button', { name: 'Add Revenue, 2 × 2' }).query()).toBeNull();
		expect(dialog.getByRole('button', { name: 'Add Revenue, 2 × 1' }).query()).toBeNull();
		expect(dialog.getByRole('button', { name: /Monthly/ }).query()).toBeNull();
	});

	test('choosing a size adds the widget at the space, with a new string id, and calls onchange', async () => {
		const onchange = vi.fn();
		const { widgets } = mount({ editing: true, onchange });
		await userEvent.click(page.getByRole('button', { name: 'Add widget' }).nth(1));
		await userEvent.click(page.getByRole('button', { name: 'Add Revenue, 2 × 2' }));
		await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
		const added = widgets.value!.at(-1)!;
		expect(added).toMatchObject({ name: 'revenue', left: 1, top: 2, width: 2, height: 2 });
		expect(typeof added.id).toBe('string');
		expect(onchange).toHaveBeenCalledWith({ widgets: widgets.value, added: [added], removed: [], changed: [] });
		await expect.element(page.getByText('Revenue added')).toBeInTheDocument();
	});

	test('a unique widget leaves the catalog while it is on the dashboard', async () => {
		mount({ editing: true, catalog: catalog.map((item) => ({ ...item, unique: item.name === 'clients' })) });
		await userEvent.click(page.getByRole('button', { name: 'Add widget' }).first());
		const dialog = page.getByRole('dialog');
		await expect.element(dialog.getByRole('button', { name: 'Add Rating, 1 × 1' })).toBeInTheDocument();
		expect(dialog.getByRole('button', { name: /Clients/ }).query()).toBeNull();
	});

	test('with two or more categories the catalog shows a tab for each, plus All', async () => {
		mount({
			editing: true,
			catalog: catalog.map((item) => ({ ...item, category: item.name === 'monthly' ? 'Charts' : 'Numbers' }))
		});
		await userEvent.click(page.getByRole('button', { name: 'Add widget' }).last());
		const dialog = page.getByRole('dialog');
		await expect.element(dialog.getByRole('tab', { name: 'All', selected: true })).toBeInTheDocument();
		await userEvent.click(dialog.getByRole('tab', { name: 'Charts' }));
		await expect.element(dialog.getByRole('button', { name: 'Add Monthly, 4 × 2' })).toBeInTheDocument();
		expect(dialog.getByRole('button', { name: /Revenue/ }).query()).toBeNull();
	});

	test('when nothing fits, the catalog says so', async () => {
		mount({ editing: true, catalog: [{ name: 'big', title: 'Big', sizes: [{ width: 3, height: 1 }] }] });
		await userEvent.click(page.getByRole('button', { name: 'Add widget' }).first());
		await expect.element(page.getByText('No widget fits this space')).toBeInTheDocument();
	});

	test('the X removes a widget, calls onchange and moves the focus to the next one', async () => {
		const onchange = vi.fn();
		const { widgets } = mount({ editing: true, onchange });
		await userEvent.click(page.getByRole('button', { name: 'Remove Clients' }));
		expect(widgets.value!.map((widget) => widget.name)).toEqual(['revenue', 'rating']);
		expect(onchange).toHaveBeenCalledWith(
			expect.objectContaining({ removed: [start[1]], added: [], changed: [] })
		);
		await expect.element(page.getByText('Clients removed')).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: 'Arrange Rating' })).toHaveFocus();
	});

	test('arrow keys on the handle move the widget to the next free place and swap with one of the same size', async () => {
		const onchange = vi.fn();
		const { widgets } = mount({ editing: true, onchange });
		const grip = page.getByRole('button', { name: 'Arrange Clients' });
		await expect.element(grip).toHaveAccessibleDescription(
			'Arrow keys move the widget. Delete removes it.'
		);
		await userEvent.click(grip);
		await userEvent.keyboard('{ArrowRight}');
		expect(place(widgets.value, 'clients')).toEqual([4, 1, 1, 1]);
		await expect.element(page.getByText('Clients moved to row 1, column 4')).toBeInTheDocument();
		await expect.element(grip).toHaveFocus();
		await userEvent.keyboard('{ArrowDown}');
		expect(place(widgets.value, 'clients')).toEqual([4, 2, 1, 1]);
		expect(place(widgets.value, 'rating')).toEqual([4, 1, 1, 1]);
		expect(onchange).toHaveBeenLastCalledWith(expect.objectContaining({ changed: expect.arrayContaining([expect.objectContaining({ name: 'rating' })]) }));
		expect(onchange.mock.lastCall![0].changed).toHaveLength(2);
		await userEvent.keyboard('{ArrowUp}{ArrowUp}');
		expect(place(widgets.value, 'clients')).toEqual([4, 1, 1, 1]);
	});

	test('Shift and the arrow keys resize among the sizes that fit; Delete removes', async () => {
		const { widgets } = mount({ editing: true });
		const grip = page.getByRole('button', { name: 'Arrange Revenue' });
		await expect.element(grip).toHaveAccessibleDescription(
			'Arrow keys move the widget. Shift and arrow keys change its size. Delete removes it.'
		);
		await userEvent.click(grip);
		await userEvent.keyboard('{Shift>}{ArrowDown}{/Shift}');
		expect(place(widgets.value, 'revenue')).toEqual([1, 1, 2, 2]);
		await expect.element(page.getByText('Revenue resized to 2 × 2')).toBeInTheDocument();
		await userEvent.keyboard('{Shift>}{ArrowLeft}{/Shift}');
		expect(place(widgets.value, 'revenue')).toEqual([1, 1, 1, 1]);
		await userEvent.keyboard('{Shift>}{ArrowLeft}{/Shift}');
		expect(place(widgets.value, 'revenue')).toEqual([1, 1, 1, 1]);
		await userEvent.keyboard('{Delete}');
		expect(place(widgets.value, 'revenue')).toBeUndefined();
	});

	test('movable={false} and resizable={false} keep the v4 behaviour: only add and remove', async () => {
		const { widgets } = mount({ editing: true, movable: false, resizable: false });
		expect(document.querySelectorAll('.aurora-dashboard-shaper-grip')).toHaveLength(0);
		expect(document.querySelectorAll('.aurora-dashboard-shaper-resize')).toHaveLength(0);
		expect(document.querySelector('[data-movable]')).toBeNull();
		await drag(widgetBox('Clients, 1 × 1'), cellCenter(4, 1));
		expect(place(widgets.value, 'clients')).toEqual([3, 1, 1, 1]);
		await expect.element(page.getByRole('button', { name: 'Remove Clients' })).toBeInTheDocument();
	});

	test('with resizable only, the handle resizes from the keyboard and the arrows do nothing', async () => {
		const { widgets } = mount({ editing: true, movable: false });
		expect(document.querySelectorAll('.aurora-dashboard-shaper-grip')).toHaveLength(1);
		await userEvent.click(page.getByRole('button', { name: 'Arrange Revenue' }));
		await userEvent.keyboard('{ArrowDown}{Shift>}{ArrowDown}{/Shift}');
		expect(place(widgets.value, 'revenue')).toEqual([1, 1, 2, 2]);
	});

	test('dragging a widget drops it on free cells, showing where it will go', async () => {
		const onchange = vi.fn();
		const { widgets } = mount({ editing: true, onchange });
		await drag(widgetBox('Clients, 1 × 1'), cellCenter(2, 3), false);
		const target = document.querySelector<HTMLElement>('.aurora-dashboard-shaper-target')!;
		expect(target.style.gridArea).toBe('3 / 2 / span 1 / span 1');
		expect(target.dataset.invalid).toBeUndefined();
		expect(document.querySelector('[data-dragging]')).not.toBeNull();
		pointer('pointerup', window, cellCenter(2, 3));
		await tick();
		expect(place(widgets.value, 'clients')).toEqual([2, 3, 1, 1]);
		expect(onchange).toHaveBeenCalledTimes(1);
		expect(document.querySelector('.aurora-dashboard-shaper-target')).toBeNull();
	});

	test('dropping on a widget of the same size swaps them; on another size nothing happens', async () => {
		const { widgets } = mount({ editing: true });
		await drag(widgetBox('Clients, 1 × 1'), cellCenter(1, 1), false);
		expect(document.querySelector<HTMLElement>('.aurora-dashboard-shaper-target')!.dataset.invalid).toBe('true');
		pointer('pointerup', window, cellCenter(1, 1));
		await tick();
		expect(place(widgets.value, 'clients')).toEqual([3, 1, 1, 1]);
		await drag(widgetBox('Clients, 1 × 1'), cellCenter(4, 2));
		expect(place(widgets.value, 'clients')).toEqual([4, 2, 1, 1]);
		expect(place(widgets.value, 'rating')).toEqual([3, 1, 1, 1]);
	});

	test('while the page scrolls, the dragged widget stays under the pointer and the target follows', async () => {
		const { widgets } = mount({ editing: true, style: '--dashboard-shaper-row-height: 100px; --dashboard-shaper-gap: 10px' });
		const spacer = document.body.appendChild(document.createElement('div'));
		spacer.style.height = '3000px';
		try {
			const point = cellCenter(3, 2);
			await drag(widgetBox('Clients, 1 × 1'), point, false);
			const box = widgetBox('Clients, 1 × 1');
			const grab = point.y - box.getBoundingClientRect().top;
			window.scrollBy(0, 110);
			await expect
				.poll(() => document.querySelector<HTMLElement>('.aurora-dashboard-shaper-target')?.style.gridArea)
				.toBe('3 / 3 / span 1 / span 1');
			window.dispatchEvent(new Event('scroll'));
			await tick();
			expect(Math.round(point.y - box.getBoundingClientRect().top)).toBe(Math.round(grab));
			pointer('pointerup', window, point);
			await tick();
			expect(place(widgets.value, 'clients')).toEqual([3, 3, 1, 1]);
		} finally {
			spacer.remove();
			window.scrollTo(0, 0);
		}
	});

	test('on a wide touch screen, holding a widget drags it too, and the handle drags at once', async () => {
		const { widgets } = mount({ editing: true });
		const box = widgetBox('Clients, 1 × 1');
		const rect = box.getBoundingClientRect();
		const from = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
		pointer('pointerdown', box, from, 'touch');
		await tick();
		await new Promise((resolve) => setTimeout(resolve, 400));
		pointer('pointermove', window, cellCenter(2, 3), 'touch');
		await tick();
		pointer('pointerup', window, cellCenter(2, 3), 'touch');
		await tick();
		expect(place(widgets.value, 'clients')).toEqual([2, 3, 1, 1]);
		const grip = page.getByRole('button', { name: 'Arrange Rating' }).element();
		const gripRect = grip.getBoundingClientRect();
		pointer('pointerdown', grip, { x: gripRect.left + 4, y: gripRect.top + 4 }, 'touch');
		await tick();
		pointer('pointermove', window, cellCenter(4, 1), 'touch');
		await tick();
		pointer('pointerup', window, cellCenter(4, 1), 'touch');
		await tick();
		expect(place(widgets.value, 'rating')).toEqual([4, 1, 1, 1]);
	});

	test('Escape cancels a drag; a click without moving does nothing', async () => {
		const onchange = vi.fn();
		mount({ editing: true, onchange });
		await drag(widgetBox('Clients, 1 × 1'), cellCenter(1, 3), false);
		await userEvent.keyboard('{Escape}');
		pointer('pointerup', window, cellCenter(1, 3));
		const box = widgetBox('Clients, 1 × 1');
		const rect = box.getBoundingClientRect();
		pointer('pointerdown', box, { x: rect.left + 5, y: rect.top + 40 });
		await tick();
		pointer('pointerup', window, { x: rect.left + 6, y: rect.top + 40 });
		await tick();
		expect(onchange).not.toHaveBeenCalled();
	});

	test('the corner handle resizes to the nearest allowed size that fits', async () => {
		const onchange = vi.fn();
		const { widgets } = mount({ editing: true, onchange });
		const handle = widgetBox('Revenue, 2 × 1').querySelector('.aurora-dashboard-shaper-resize')!;
		await drag(handle, cellCenter(2, 3), false);
		const target = document.querySelector<HTMLElement>('.aurora-dashboard-shaper-target')!;
		expect(target.style.gridArea).toBe('1 / 1 / span 2 / span 2');
		expect(document.querySelector('[data-resizing]')).not.toBeNull();
		pointer('pointerup', window, cellCenter(2, 3));
		await tick();
		expect(place(widgets.value, 'revenue')).toEqual([1, 1, 2, 2]);
		expect(onchange.mock.lastCall![0].changed).toEqual([widgets.value![0]]);
		expect(widgetBox('Clients, 1 × 1').querySelector('.aurora-dashboard-shaper-resize')).toBeNull();
	});

	test('the content of a widget is inert while editing', async () => {
		mount({
			editing: true,
			widgetSnippet: createRawSnippet(() => ({ render: () => '<button>Inside</button>' }))
		});
		expect(document.querySelector('.aurora-dashboard-shaper-content')!.hasAttribute('inert')).toBe(true);
	});

	test('hasEmptySlots tells whether the rows in use have holes', async () => {
		const { holes, widgets } = mount();
		await expect.poll(() => holes.value).toBe(true);
		widgets.value = [{ id: 1, name: 'monthly', left: 1, top: 1, width: 4, height: 2 }];
		await expect.poll(() => holes.value).toBe(false);
	});

	test('preview draws plain blocks, keeps the grid when narrow and never edits', async () => {
		mount({ preview: true, editing: true, style: 'width: 200px' });
		expect(document.querySelectorAll('.aurora-dashboard-shaper-preview')).toHaveLength(3);
		expect(document.querySelectorAll('button')).toHaveLength(0);
		await new Promise((resolve) => setTimeout(resolve, 50));
		expect(root().dataset.stacked).toBeUndefined();
	});

	test('v4 bug: narrower than stackBelow the widgets go in one column keeping their height', async () => {
		mount({
			widgets: [
				{ id: 1, name: 'rating', left: 4, top: 2, width: 1, height: 1 },
				{ id: 2, name: 'monthly', left: 1, top: 1, width: 2, height: 2 }
			],
			style: 'width: 400px; --dashboard-shaper-row-height: 50px; --dashboard-shaper-gap: 10px'
		});
		await expect.poll(() => root().dataset.stacked).toBe('true');
		const boxes = [...document.querySelectorAll<HTMLElement>('.aurora-dashboard-shaper-widget')];
		expect(boxes.map((box) => box.textContent?.trim())).toEqual(['Monthly', 'Rating']);
		expect(boxes.map((box) => box.getBoundingClientRect().height)).toEqual([110, 50]);
	});

	test('narrow and editing, the real grid is shown as blocks; a tapped block shows only its remove button and resize handle', async () => {
		const onchange = vi.fn();
		const { widgets } = mount({ editing: true, onchange, style: 'width: 400px' });
		await expect.poll(() => root().dataset.schema).toBe('true');
		expect(root().dataset.stacked).toBeUndefined();
		expect(document.querySelectorAll('.aurora-dashboard-shaper-grip, .aurora-dashboard-shaper-resize, .aurora-dashboard-shaper-remove')).toHaveLength(0);
		expect(document.querySelector<HTMLElement>('.aurora-dashboard-shaper-widget')!.style.gridArea).toBe('1 / 1 / span 1 / span 2');
		await expect.element(page.getByText('Tap a widget to select it, then drag it, resize it from its corner or remove it. Holding it drags it too.')).toBeInTheDocument();
		const block = page.getByRole('button', { name: 'Revenue, 2 × 1' });
		await userEvent.click(block);
		await expect.element(block).toHaveAttribute('aria-pressed', 'true');
		expect(document.querySelectorAll('.aurora-dashboard-shaper-resize')).toHaveLength(1);
		await userEvent.click(page.getByRole('button', { name: 'Clients, 1 × 1' }));
		await expect.element(block).toHaveAttribute('aria-pressed', 'false');
		expect(document.querySelectorAll('.aurora-dashboard-shaper-resize')).toHaveLength(0);
		await userEvent.click(page.getByRole('button', { name: 'Remove Clients' }));
		expect(place(widgets.value, 'clients')).toBeUndefined();
		expect(onchange).toHaveBeenCalledTimes(1);
		expect(document.querySelectorAll('.aurora-dashboard-shaper-remove')).toHaveLength(0);
	});

	test('narrow and editing, the handle of the tapped block resizes it', async () => {
		const { widgets } = mount({ editing: true, style: 'width: 400px' });
		await expect.poll(() => root().dataset.schema).toBe('true');
		await userEvent.click(page.getByRole('button', { name: 'Revenue, 2 × 1' }));
		const handle = document.querySelector('[data-selected] .aurora-dashboard-shaper-resize')!;
		const target = cellCenter(2, 2);
		const rect = handle.getBoundingClientRect();
		const from = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
		pointer('pointerdown', handle, from, 'touch');
		await tick();
		pointer('pointermove', window, target, 'touch');
		await tick();
		pointer('pointerup', window, target, 'touch');
		await tick();
		expect(place(widgets.value, 'revenue')).toEqual([1, 1, 2, 2]);
	});

	test('on touch, holding a widget starts the drag; moving at once leaves the page to scroll', async () => {
		const { widgets } = mount({ editing: true, style: 'width: 400px' });
		await expect.poll(() => root().dataset.schema).toBe('true');
		const block = page.getByRole('button', { name: 'Clients, 1 × 1' }).element();
		const rect = block.getBoundingClientRect();
		const from = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
		pointer('pointerdown', block, from, 'touch');
		await tick();
		pointer('pointermove', window, { x: from.x, y: from.y + 30 }, 'touch');
		await new Promise((resolve) => setTimeout(resolve, 400));
		expect(document.querySelector('[data-dragging]')).toBeNull();
		pointer('pointercancel', window, from, 'touch');
		pointer('pointerdown', block, from, 'touch');
		await tick();
		await new Promise((resolve) => setTimeout(resolve, 400));
		const to = cellCenter(4, 1);
		pointer('pointermove', window, to, 'touch');
		await tick();
		expect(document.querySelector('[data-dragging]')).not.toBeNull();
		const scroll = new Event('touchmove', { cancelable: true, bubbles: true });
		window.dispatchEvent(scroll);
		expect(scroll.defaultPrevented).toBe(true);
		pointer('pointerup', window, to, 'touch');
		await tick();
		expect(place(widgets.value, 'clients')).toEqual([4, 1, 1, 1]);
		await expect.element(page.getByRole('button', { name: 'Clients, 1 × 1' })).toHaveAttribute('aria-pressed', 'false');
	});

	test('on touch, a selected block drags at once, without holding', async () => {
		const { widgets } = mount({ editing: true, style: 'width: 400px' });
		await expect.poll(() => root().dataset.schema).toBe('true');
		await userEvent.click(page.getByRole('button', { name: 'Clients, 1 × 1' }));
		const block = page.getByRole('button', { name: 'Clients, 1 × 1' }).element();
		expect(getComputedStyle(block).touchAction).toBe('none');
		const rect = block.getBoundingClientRect();
		const from = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
		pointer('pointerdown', block, from, 'touch');
		await tick();
		const to = cellCenter(4, 1);
		pointer('pointermove', window, to, 'touch');
		await tick();
		expect(document.querySelector('[data-dragging]')).not.toBeNull();
		pointer('pointerup', window, to, 'touch');
		await tick();
		expect(place(widgets.value, 'clients')).toEqual([4, 1, 1, 1]);
		await expect.element(page.getByRole('button', { name: 'Clients, 1 × 1' })).toHaveAttribute('aria-pressed', 'true');
		expect(getComputedStyle(page.getByRole('button', { name: 'Revenue, 2 × 1' }).element()).touchAction).toBe('auto');
	});

	test('narrow and editing, the blocks take the arrow keys and Delete', async () => {
		const { widgets } = mount({ editing: true, style: 'width: 400px' });
		await expect.poll(() => root().dataset.schema).toBe('true');
		page.getByRole('button', { name: 'Clients, 1 × 1' }).element().focus();
		await userEvent.keyboard('{ArrowRight}');
		expect(place(widgets.value, 'clients')).toEqual([4, 1, 1, 1]);
		await expect.element(page.getByRole('button', { name: 'Clients, 1 × 1' })).toHaveFocus();
		await userEvent.keyboard('{Delete}');
		expect(place(widgets.value, 'clients')).toBeUndefined();
	});

	test('narrow and editing, an empty space opens the catalog for that place', async () => {
		const { widgets } = mount({ editing: true, style: 'width: 400px' });
		await expect.poll(() => root().dataset.schema).toBe('true');
		await userEvent.click(page.getByRole('button', { name: 'Add widget' }).first());
		await userEvent.click(page.getByRole('button', { name: 'Add Rating, 1 × 1' }));
		expect(widgets.value!.at(-1)).toMatchObject({ name: 'rating', left: 4, top: 1 });
	});

	test('stackBelow={false} keeps the grid at every width', async () => {
		mount({ stackBelow: false, style: 'width: 400px' });
		await new Promise((resolve) => setTimeout(resolve, 50));
		expect(root().dataset.stacked).toBeUndefined();
	});

	test('slotSnippet replaces an empty space and opens the catalog for it', async () => {
		mount({
			editing: true,
			rows: 2,
			slotSnippet: createRawSnippet((params: () => { width: number; height: number; add: () => void }) => ({
				render: () => `<button class="mine">${params().width}x${params().height}</button>`,
				setup: (node) => {
					node.addEventListener('click', () => params().add());
				}
			}))
		});
		const mine = [...document.querySelectorAll('.mine')].map((node) => node.textContent);
		expect(mine).toEqual(['1x1', '3x1']);
		await userEvent.click(page.getByRole('button', { name: '3x1' }));
		await expect.element(page.getByRole('button', { name: 'Add Revenue, 2 × 1' })).toBeInTheDocument();
	});

	test('catalogHeaderSnippet and catalogItemSnippet replace the parts of the catalog', async () => {
		const { widgets } = mount({
			editing: true,
			catalogHeaderSnippet: createRawSnippet(() => ({ render: () => '<span>Pick one</span>' })),
			catalogItemSnippet: createRawSnippet(
				(params: () => { item: DashboardCatalogItem; sizes: { width: number; height: number }[]; add: (size: unknown) => void }) => ({
					render: () => `<button class="item">${params().item.title} ${params().sizes.length}</button>`,
					setup: (node) => {
						node.addEventListener('click', () => params().add(params().sizes[0]));
					}
				})
			)
		});
		await userEvent.click(page.getByRole('button', { name: 'Add widget' }).first());
		await expect.element(page.getByText('Pick one')).toBeInTheDocument();
		await userEvent.click(page.getByRole('button', { name: 'Rating 1' }));
		expect(widgets.value!.at(-1)).toMatchObject({ name: 'rating', left: 4, top: 1 });
	});

	test('class goes on each part and the CSS variables reach the grid', async () => {
		mount({
			editing: true,
			class: { container: 'c', widget: 'w', slot: 's' },
			style: '--dashboard-shaper-row-height: 77px'
		});
		expect(root().classList.contains('c')).toBe(true);
		expect(document.querySelectorAll('.aurora-dashboard-shaper-widget.w')).toHaveLength(3);
		expect(document.querySelectorAll('.aurora-dashboard-shaper-slot.s').length).toBeGreaterThan(0);
		expect(parseFloat(getComputedStyle(grid()).gridTemplateRows)).toBe(77);
	});

	test('texts follow locale, labels win', async () => {
		mount({ editing: true, locale: 'it', labels: { remove: 'Togli {title}' } });
		await expect.element(page.getByRole('button', { name: 'Aggiungi widget' }).first()).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: 'Togli Clients' })).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: 'Disponi Clients' })).toBeInTheDocument();
	});

	test('the default locale applies, the locale prop wins', async () => {
		renderWithDefaultLocale('it', DashboardShaper, { widgets: start, catalog, columns: 4, editing: true });
		await expect.element(page.getByRole('button', { name: 'Rimuovi Clients' })).toBeInTheDocument();
		document.body.innerHTML = '';
		renderWithDefaultLocale('it', DashboardShaper, { widgets: start, catalog, columns: 4, editing: true, locale: 'en' });
		await expect.element(page.getByRole('button', { name: 'Remove Clients' })).toBeInTheDocument();
	});
});
