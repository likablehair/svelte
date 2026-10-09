import { createRawSnippet } from 'svelte';
import { describe, expect, expectTypeOf, test } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import type { ProgressItem as Exported } from '#lib';
import HorizontalStackedProgress, {
	type ProgressItem
} from '#lib/components/composed/progress/HorizontalStackedProgress.svelte';
import { snippet } from '../helpers.js';

type Shared = { item: ProgressItem & { color: string }; percentage: number };

const bookings: ProgressItem[] = [
	{ label: 'Colour', value: 44, valueLabel: '44%' },
	{ label: 'Cut', value: 24, valueLabel: '24%' },
	{ label: 'Treatments', value: 18, valueLabel: '18%' }
];

function resolve(property: string, value: string) {
	const probe = document.createElement('div');
	probe.style.setProperty(property, value);
	document.body.append(probe);
	const result = getComputedStyle(probe).getPropertyValue(property);
	probe.remove();
	return result;
}

function host(width = '406px') {
	const element = document.createElement('div');
	element.style.width = width;
	document.body.append(element);
	return element;
}

function parts(root: Element, name: string) {
	return [...root.querySelectorAll(`.aurora-horizontal-stacked-progress-${name}`)] as HTMLElement[];
}

function widths(elements: Element[]) {
	return elements.map((element) => element.getBoundingClientRect().width);
}

describe('HorizontalStackedProgress', () => {
	test('is a group named by label; the bars are hidden from screen readers', async () => {
		const screen = await render(HorizontalStackedProgress, {
			progresses: bookings,
			label: 'Agenda occupancy'
		});
		const group = screen.getByRole('group', { name: 'Agenda occupancy' });
		await expect.element(group).toBeVisible();
		expect(parts(group.element(), 'bars')[0].getAttribute('aria-hidden')).toBe('true');

		const unlabelled = await render(HorizontalStackedProgress, {
			progresses: [1, 2],
			'aria-label': 'Ratings'
		});
		await expect.element(unlabelled.getByRole('group', { name: 'Ratings' })).toBeVisible();
	});

	test('segments are as wide as their share of the sum', async () => {
		const target = host();
		const screen = await render(HorizontalStackedProgress, {
			target,
			props: { progresses: [1, 2, 3] }
		});
		const [one, two, three] = widths(parts(screen.container, 'segment'));
		expect(one + two + three).toBeCloseTo(400, 1);
		expect(two / one).toBeCloseTo(2, 2);
		expect(three / one).toBeCloseTo(3, 2);
		expect(parts(screen.container, 'rest')).toHaveLength(0);
		target.remove();
	});

	test('with total the rest of the bar stays empty', async () => {
		const target = host();
		const screen = await render(HorizontalStackedProgress, {
			target,
			props: {
				progresses: [20, 30],
				total: 100,
				style: '--horizontal-stacked-progress-rest-background: rgb(1, 2, 3)'
			}
		});
		const [rest] = parts(screen.container, 'rest');
		expect(widths(parts(screen.container, 'segment'))).toEqual([
			expect.closeTo(80, 1),
			expect.closeTo(120, 1)
		]);
		expect(rest.getBoundingClientRect().width).toBeCloseTo(200, 1);
		expect(getComputedStyle(rest).backgroundColor).toBe('rgb(1, 2, 3)');
		target.remove();
	});

	test('a total smaller than the sum is ignored', async () => {
		const target = host();
		const screen = await render(HorizontalStackedProgress, {
			target,
			props: { progresses: [20, 30], total: 10, showValue: true, 'aria-label': 'Over' }
		});
		expect(parts(screen.container, 'rest')).toHaveLength(0);
		expect(parts(screen.container, 'value')[0].textContent?.trim()).toBe('100%');
		target.remove();
	});

	test('entries of 0 or less are left out', async () => {
		const screen = await render(HorizontalStackedProgress, {
			progresses: [0, { label: 'Cut', value: 5 }, -2, { label: 'Colour', value: 5 }]
		});
		expect(parts(screen.container, 'segment')).toHaveLength(2);
		await expect.element(screen.getByRole('listitem')).toHaveLength(2);
	});

	test('the legend lists every entry with label and value', async () => {
		const screen = await render(HorizontalStackedProgress, { progresses: bookings });
		const items = screen.getByRole('listitem');
		await expect.element(items).toHaveLength(3);
		await expect.element(items.nth(0)).toHaveTextContent(/Colour\s*44%/);
		await expect.element(items.nth(2)).toHaveTextContent(/Treatments\s*18%/);
		await expect.element(screen.getByRole('list')).toBeVisible();

		const numbers = await render(HorizontalStackedProgress, { progresses: [5, 3] });
		const plain = numbers.container.querySelectorAll('li');
		expect([...plain].map((item) => item.textContent?.trim())).toEqual(['5', '3']);
	});

	test('legend={false} hides the legend visually but keeps it for screen readers', async () => {
		const screen = await render(HorizontalStackedProgress, { progresses: bookings, legend: false });
		const list = screen.getByRole('list');
		await expect.element(list).toBeInTheDocument();
		await expect.element(screen.getByRole('listitem')).toHaveLength(3);
		const rect = list.element().getBoundingClientRect();
		expect(rect.width).toBeLessThanOrEqual(1);
		expect(rect.height).toBeLessThanOrEqual(1);
	});

	test('segmentLabels writes label and value under each segment, aligned with it', async () => {
		const target = host();
		const screen = await render(HorizontalStackedProgress, {
			target,
			props: { progresses: bookings, segmentLabels: true }
		});
		const segments = parts(screen.container, 'segment');
		const labels = parts(screen.container, 'segment-label');
		expect(labels.map((label) => label.textContent?.replace(/\s+/g, ' ').trim())).toEqual([
			'Colour 44%',
			'Cut 24%',
			'Treatments 18%'
		]);
		labels.forEach((label, index) => {
			const segment = segments[index].getBoundingClientRect();
			expect(label.getBoundingClientRect().left).toBeCloseTo(segment.left, 1);
			expect(label.getBoundingClientRect().top).toBeGreaterThan(segment.bottom);
		});
		target.remove();
	});

	test('segment labels are off by default', async () => {
		const screen = await render(HorizontalStackedProgress, { progresses: bookings });
		expect(parts(screen.container, 'segment-label')).toHaveLength(0);
	});

	test('minLabelPercentage hides the labels of narrow segments', async () => {
		const screen = await render(HorizontalStackedProgress, {
			progresses: [
				{ label: 'Booked', value: 31 },
				{ label: 'Walk-in', value: 9 },
				{ label: 'Blocked', value: 2 }
			],
			segmentLabels: true,
			minLabelPercentage: 8
		});
		const labels = parts(screen.container, 'segment-label');
		expect(labels.map((label) => label.textContent?.replace(/\s+/g, ' ').trim())).toEqual([
			'Booked 31',
			'Walk-in 9',
			''
		]);
	});

	test('colors come from the data palette in order, unless an entry sets its own', async () => {
		const screen = await render(HorizontalStackedProgress, {
			progresses: [1, 1, 1, 1, 1, 1, 1, { value: 1, color: 'rgb(1, 2, 3)' }]
		});
		const colors = parts(screen.container, 'segment').map(
			(segment) => getComputedStyle(segment).backgroundColor
		);
		const palette = [1, 2, 3, 4, 5, 6, 1].map((index) =>
			resolve('background-color', `var(--global-color-data-${index})`)
		);
		expect(colors).toEqual([...palette, 'rgb(1, 2, 3)']);
		expect(new Set(palette.slice(0, 6)).size).toBe(6);
		const dots = parts(screen.container, 'legend-item').map((item) => parts(item, 'dot')[0]);
		expect(dots.map((dot) => getComputedStyle(dot).backgroundColor)).toEqual(colors);
	});

	test('label and showValue add a header with the share of total', async () => {
		const screen = await render(HorizontalStackedProgress, {
			progresses: bookings,
			total: 100,
			label: 'Agenda occupancy',
			showValue: true
		});
		const group = screen.getByRole('group', { name: 'Agenda occupancy' }).element();
		expect(parts(group, 'value')[0].textContent?.trim()).toBe('86%');
	});

	test('snippets receive the entry and its percentage', async () => {
		const shared = (prefix: string) =>
			createRawSnippet((args: () => Shared) => ({
				render: () => `<i>${prefix} ${args().item.label ?? ''} ${args().percentage}</i>`
			}));
		const valueSnippet = createRawSnippet(
			(args: () => { value: number; total: number; percent: number }) => ({
				render: () => `<i>${args().value}/${args().total}/${args().percent}</i>`
			})
		);
		const screen = await render(HorizontalStackedProgress, {
			progresses: [
				{ label: 'A', value: 10 },
				{ label: 'B', value: 30 }
			],
			total: 80,
			segmentLabels: true,
			showValue: true,
			labelSnippet: snippet('<b>Custom title</b>'),
			legendItemSnippet: shared('legend'),
			segmentLabelSnippet: shared('segment'),
			valueSnippet
		});
		await expect.element(screen.getByRole('group', { name: 'Custom title' })).toBeVisible();
		await expect.element(screen.getByText('legend A 12.5')).toBeInTheDocument();
		await expect.element(screen.getByText('legend B 37.5')).toBeInTheDocument();
		await expect.element(screen.getByText('segment B 37.5')).toBeInTheDocument();
		await expect.element(screen.getByText('40/80/50')).toBeVisible();
		expect(parts(screen.container, 'dot')).toHaveLength(2);
	});

	test('hovering a segment shows "label: value" in a tooltip', async () => {
		const screen = await render(HorizontalStackedProgress, { progresses: bookings });
		const [colour] = parts(screen.container, 'segment');
		await userEvent.hover(colour);
		await expect.element(screen.getByRole('tooltip')).toHaveTextContent('Colour: 44%');
	});

	test('valueTooltip={false} renders no tooltip', async () => {
		const screen = await render(HorizontalStackedProgress, {
			progresses: bookings,
			valueTooltip: false
		});
		await userEvent.hover(parts(screen.container, 'segment')[0]);
		expect(screen.container.querySelector('[role="tooltip"]')).toBeNull();
	});

	test('ProgressItem is exported and accepts label, color, value and valueLabel', async () => {
		expectTypeOf<Exported>().toEqualTypeOf<ProgressItem>();
		expectTypeOf<ProgressItem>().toEqualTypeOf<{
			label?: string;
			color?: string;
			value: number;
			valueLabel?: string | number;
		}>();
		const items: Exported[] = [{ label: 'Cut', value: 2, valueLabel: '2h', color: 'rgb(1, 2, 3)' }];
		const screen = await render(HorizontalStackedProgress, { progresses: items });
		await expect.element(screen.getByRole('listitem')).toHaveTextContent(/Cut\s*2h/);
	});

	test('instance CSS variables set height, gap and segment radius', async () => {
		const target = host('410px');
		const screen = await render(HorizontalStackedProgress, {
			target,
			props: {
				progresses: [1, 1],
				style:
					'--horizontal-stacked-progress-height: 6px; --horizontal-stacked-progress-gap: 10px; --horizontal-stacked-progress-segment-border-radius: 0px'
			}
		});
		const [first, second] = parts(screen.container, 'segment');
		expect(first.getBoundingClientRect().height).toBe(6);
		const gap = second.getBoundingClientRect().left - first.getBoundingClientRect().right;
		expect(gap).toBeCloseTo(10, 1);
		expect(getComputedStyle(first).borderTopLeftRadius).toBe('0px');
		target.remove();
	});

	test('v4 bug: the gaps do not push the last segment out of the bar', async () => {
		const target = host('300px');
		const screen = await render(HorizontalStackedProgress, {
			target,
			props: { progresses: [1, 1, 1, 1, 1], style: '--horizontal-stacked-progress-gap: 8px' }
		});
		const track = parts(screen.container, 'track')[0].getBoundingClientRect();
		const segments = parts(screen.container, 'segment');
		const last = segments.at(-1)!.getBoundingClientRect();
		expect(last.right).toBeCloseTo(track.right, 1);
		expect(widths(segments).reduce((sum, width) => sum + width, 0) + 4 * 8).toBeCloseTo(300, 1);
		target.remove();
	});
});
