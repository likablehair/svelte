import { mdiCheck } from '@mdi/js';
import { createRawSnippet } from 'svelte';
import { describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Timeline, { type TimelineItem } from '#lib/components/simple/timeline/Timeline.svelte';
import { renderWithDefaultLocale, snippet } from '../helpers.js';

function withArgs<T>(markup: (args: T) => string) {
	return createRawSnippet<[T]>((args) => ({ render: () => markup(args()) }));
}

const root = (container: HTMLElement) => container.querySelector<HTMLElement>('.aurora-timeline')!;
const rows = (container: HTMLElement) => [
	...container.querySelectorAll<HTMLLIElement>('.aurora-timeline-item')
];
const timeOf = (row: Element) => row.querySelector('.aurora-timeline-time')?.textContent?.trim();

const DATE: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
const DATE_TIME: Intl.DateTimeFormatOptions = { ...DATE, hour: '2-digit', minute: '2-digit' };

const steps: TimelineItem[] = [
	{ title: 'Check-in', description: 'Arrived', from: new Date(2026, 8, 24, 9, 30), status: 'done' },
	{ title: 'Processing', time: 'Now', status: 'current' },
	{ title: 'Payment', from: new Date(2026, 8, 24, 10, 30), status: 'upcoming' }
];

function inBox(width: number) {
	const box = document.createElement('div');
	box.style.width = `${width}px`;
	document.body.append(box);
	return box;
}

describe('Timeline', () => {
	test('renders an ordered list with one item per event, title and description', async () => {
		const screen = await render(Timeline, { items: steps, id: 'log', class: 'mine' });
		const element = root(screen.container);
		expect(element.id).toBe('log');
		expect(element.classList.contains('mine')).toBe(true);
		expect(element.getAttribute('data-variant')).toBe('plain');
		expect(element.getAttribute('data-layout')).toBe('single');
		expect(element.getAttribute('data-marker-alignment')).toBe('top');
		const list = element.querySelector('ol.aurora-timeline-list')!;
		expect(list.children.length).toBe(3);
		expect([...list.children].every((child) => child.tagName === 'LI')).toBe(true);
		await expect.element(screen.getByText('Check-in')).toHaveClass('aurora-timeline-title');
		await expect.element(screen.getByText('Arrived')).toHaveClass('aurora-timeline-description');
		expect(rows(screen.container)[2].querySelector('.aurora-timeline-description')).toBeNull();
	});

	test('v4 bug: the title is shown (v4 required `name` and never displayed it)', async () => {
		const screen = await render(Timeline, { items: [{ title: 'Contract signed' }] });
		await expect.element(screen.getByText('Contract signed')).toBeVisible();
	});

	test('dates follow locale, with the time only when it is not midnight', async () => {
		const day = new Date(2026, 8, 1);
		const timed = new Date(2026, 8, 7, 15, 0);
		const screen = await render(Timeline, {
			locale: 'it',
			items: [
				{ title: 'Day', from: day },
				{ title: 'Timed', from: timed },
				{ title: 'Text', from: '2026-09-07T15:00:00' }
			]
		});
		const [first, second, third] = rows(screen.container);
		expect(timeOf(first)).toBe(new Intl.DateTimeFormat('it', DATE).format(day));
		expect(timeOf(second)).toBe(new Intl.DateTimeFormat('it', DATE_TIME).format(timed));
		expect(timeOf(third)).toBe(timeOf(second));
		expect(first.querySelector('time')?.getAttribute('datetime')).toBe('2026-09-01');
		expect(second.querySelector('time')?.getAttribute('datetime')).toBe('2026-09-07T15:00');
	});

	test('v4 bug: dates are not always Italian (v4 ignored the locale and dropped the time)', async () => {
		const timed = new Date(2026, 8, 7, 15, 0);
		const screen = await render(Timeline, { locale: 'en-US', items: [{ title: 'x', from: timed }] });
		expect(timeOf(rows(screen.container)[0])).toBe(
			new Intl.DateTimeFormat('en-US', DATE_TIME).format(timed)
		);
	});

	test('from and to make a range on one line; dateFormat changes the format', async () => {
		const from = new Date(2026, 8, 14);
		const to = new Date(2026, 8, 25);
		const screen = await render(Timeline, { locale: 'it', items: [{ title: 'Works', from, to }] });
		expect(timeOf(rows(screen.container)[0])).toBe(
			new Intl.DateTimeFormat('it', DATE).formatRange(from, to)
		);
		await screen.rerender({ dateFormat: { month: 'long', year: 'numeric' } });
		expect(timeOf(rows(screen.container)[0])).toBe(
			new Intl.DateTimeFormat('it', { month: 'long', year: 'numeric' }).formatRange(from, to)
		);
	});

	test('time replaces the dates', async () => {
		const screen = await render(Timeline, {
			items: [{ title: 'Now', time: 'Ora', from: new Date(2026, 8, 1) }]
		});
		expect(timeOf(rows(screen.container)[0])).toBe('Ora');
		expect(rows(screen.container)[0].querySelector('time')).toBeNull();
	});

	test('status: data-status, aria-current on the current item and text for screen readers', async () => {
		const screen = await render(Timeline, { items: steps });
		const [done, current, upcoming] = rows(screen.container);
		expect(done.getAttribute('data-status')).toBe('done');
		expect(done.getAttribute('aria-current')).toBeNull();
		expect(current.getAttribute('aria-current')).toBe('step');
		expect(done.querySelector('.aurora-timeline-status')?.textContent).toBe('Completed');
		expect(current.querySelector('.aurora-timeline-status')?.textContent).toBe('In progress');
		expect(upcoming.querySelector('.aurora-timeline-status')?.textContent).toBe('Upcoming');
		const hidden = getComputedStyle(done.querySelector('.aurora-timeline-status')!);
		expect(hidden.position).toBe('absolute');
		expect(hidden.width).toBe('1px');
	});

	test('done markers are filled, upcoming ones empty, the current one uses the accent color', async () => {
		const screen = await render(Timeline, { items: steps });
		const marker = (row: Element) =>
			getComputedStyle(row.querySelector('.aurora-timeline-marker')!);
		const [done, current, upcoming] = rows(screen.container);
		expect(marker(done).backgroundColor).toBe(marker(done).borderTopColor);
		expect(marker(done).boxShadow).not.toBe('none');
		expect(marker(upcoming).backgroundColor).not.toBe(marker(upcoming).borderTopColor);
		expect(marker(current).borderTopColor).not.toBe(marker(done).borderTopColor);
		expect(marker(current).animationName).toContain('aurora-timeline-pulse');
		expect(done.querySelector('.aurora-timeline-marker')?.getAttribute('aria-hidden')).toBe('true');
	});

	test('icon goes in a bigger marker; variant colors it', async () => {
		const screen = await render(Timeline, {
			items: [
				{ title: 'Paid', icon: mdiCheck, variant: 'success', status: 'done' },
				{ title: 'Plain' }
			]
		});
		const [paid, plain] = rows(screen.container);
		const icon = paid.querySelector('.aurora-timeline-marker');
		expect(icon?.querySelector('svg path')?.getAttribute('d')).toBe(mdiCheck);
		expect(paid.getAttribute('data-variant')).toBe('success');
		expect(getComputedStyle(icon!).width).toBe('24px');
		const dot = getComputedStyle(plain.querySelector('.aurora-timeline-marker')!);
		expect(dot.width).toBe('12px');
		expect(getComputedStyle(icon!).borderTopColor).not.toBe(dot.borderTopColor);
	});

	test('the line runs from the first to the last marker and is hidden with one item', async () => {
		const screen = await render(Timeline, {
			items: [
				{ title: 'One', description: 'Long description\nwith more text' },
				{ title: 'Two', description: 'Another description' }
			]
		});
		const list = root(screen.container).querySelector('ol')!;
		const markers = [...list.querySelectorAll('.aurora-timeline-marker')];
		const center = (node: Element) => {
			const box = node.getBoundingClientRect();
			return box.top + box.height / 2;
		};
		await expect
			.poll(() => {
				const box = list.getBoundingClientRect();
				const line = getComputedStyle(list, '::before');
				return [
					Math.round(box.top + parseFloat(line.top)),
					Math.round(box.bottom - parseFloat(line.bottom))
				];
			})
			.toEqual([Math.round(center(markers[0])), Math.round(center(markers[1]))]);

		const single = await render(Timeline, { items: [{ title: 'Alone' }] });
		const alone = root(single.container).querySelector('ol')!;
		expect(getComputedStyle(alone, '::before').display).toBe('none');
	});

	test('markerAlignment moves the marker to the middle or the last line', async () => {
		const items: TimelineItem[] = [
			{ title: 'Tall', description: 'one\ntwo\nthree\nfour' },
			{ title: 'Next' }
		];
		const screen = await render(Timeline, { items, markerAlignment: 'top' });
		const row = () => rows(screen.container)[0];
		const marker = () => row().querySelector('.aurora-timeline-marker')!.getBoundingClientRect();
		const body = () => row().querySelector('.aurora-timeline-body')!.getBoundingClientRect();
		expect(marker().top - body().top).toBeLessThan(8);

		await screen.rerender({ markerAlignment: 'center' });
		expect(Math.abs(marker().top + marker().height / 2 - (body().top + body().height / 2))).toBeLessThan(2);

		await screen.rerender({ markerAlignment: 'bottom' });
		expect(body().bottom - marker().bottom).toBeLessThan(8);
		expect(root(screen.container).getAttribute('data-marker-alignment')).toBe('bottom');
	});

	test('v4 bug: markerAlignment="bottom" moves the marker (v4 wrote an invalid align-items)', async () => {
		const screen = await render(Timeline, {
			items: [{ title: 'Tall', description: 'one\ntwo\nthree\nfour' }],
			markerAlignment: 'bottom'
		});
		const row = rows(screen.container)[0];
		const marker = row.querySelector('.aurora-timeline-marker')!.getBoundingClientRect();
		expect(marker.top - row.getBoundingClientRect().top).toBeGreaterThan(20);
	});

	test('alternate puts items on both sides with the dates opposite; narrow falls back to one column', async () => {
		const items: TimelineItem[] = [
			{ title: 'First', from: new Date(2026, 8, 1) },
			{ title: 'Second', from: new Date(2026, 8, 2) }
		];
		const wide = await render(Timeline, { target: inBox(800), props: { items, alternate: true } });
		const element = root(wide.container);
		await expect.poll(() => element.getAttribute('data-layout')).toBe('alternate');
		const [first, second] = rows(wide.container);
		expect(first.getAttribute('data-side')).toBe('end');
		expect(second.getAttribute('data-side')).toBe('start');
		expect(first.querySelector('.aurora-timeline-opposite .aurora-timeline-time')).not.toBeNull();
		expect(first.querySelector('.aurora-timeline-body .aurora-timeline-time')).toBeNull();
		const marker = first.querySelector('.aurora-timeline-marker')!.getBoundingClientRect();
		const firstBody = first.querySelector('.aurora-timeline-body')!.getBoundingClientRect();
		const secondBody = second.querySelector('.aurora-timeline-body')!.getBoundingClientRect();
		expect(firstBody.left).toBeGreaterThan(marker.right);
		expect(secondBody.right).toBeLessThan(marker.left);

		const narrow = await render(Timeline, { target: inBox(400), props: { items, alternate: true } });
		await expect.poll(() => root(narrow.container).getAttribute('data-layout')).toBe('single');
		expect(rows(narrow.container)[1].getAttribute('data-side')).toBe('end');
		expect(rows(narrow.container)[1].querySelector('.aurora-timeline-body .aurora-timeline-time')).not.toBeNull();
	});

	test('groupBy="day" adds a heading for each day and shows only the times', async () => {
		const items: TimelineItem[] = [
			{ title: 'A', from: new Date(2026, 8, 22, 9, 12) },
			{ title: 'B', from: new Date(2026, 8, 22, 9, 40) },
			{ title: 'C', from: new Date(2026, 8, 23) }
		];
		const screen = await render(Timeline, { items, groupBy: 'day', locale: 'en-GB' });
		const headings = [...screen.container.querySelectorAll('.aurora-timeline-group')];
		const full = new Intl.DateTimeFormat('en-GB', { dateStyle: 'full' });
		expect(headings.map((node) => node.textContent?.trim())).toEqual([
			full.format(items[0].from as Date),
			full.format(items[2].from as Date)
		]);
		expect(screen.container.querySelectorAll('ol').length).toBe(2);
		const [a, , c] = rows(screen.container);
		expect(timeOf(a)).toBe(
			new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' }).format(
				items[0].from as Date
			)
		);
		expect(timeOf(c)).toBeUndefined();
	});

	test('a groupBy function groups consecutive items with the same heading; groupSnippet replaces it', async () => {
		const items: TimelineItem<{ team: string }>[] = [
			{ title: 'A', data: { team: 'Sales' } },
			{ title: 'B', data: { team: 'Sales' } },
			{ title: 'C', data: { team: 'Support' } },
			{ title: 'D', data: { team: 'Sales' } }
		];
		const screen = await render(Timeline<{ team: string }>, {
			items,
			groupBy: (item) => item.data!.team,
			groupSnippet: withArgs<{ label: string; items: TimelineItem[] }>(
				({ label, items }) => `<h4>${label} (${items.length})</h4>`
			)
		});
		const headings = [...screen.container.querySelectorAll('h4')].map((node) => node.textContent);
		expect(headings).toEqual(['Sales (2)', 'Support (1)', 'Sales (1)']);
	});

	test('variant="card" puts the content in a card', async () => {
		const screen = await render(Timeline, { items: steps, variant: 'card' });
		expect(root(screen.container).getAttribute('data-variant')).toBe('card');
		const body = getComputedStyle(rows(screen.container)[0].querySelector('.aurora-timeline-body')!);
		expect(body.borderTopStyle).toBe('solid');
		expect(body.paddingTop).toBe('12px');
	});

	test('empty state: default text, empty prop and emptySnippet', async () => {
		const screen = await render(Timeline, { items: [] });
		await expect.element(screen.getByText('No events yet')).toBeVisible();
		expect(screen.container.querySelector('ol')).toBeNull();

		const custom = await render(Timeline, { items: [], empty: 'Nothing here' });
		await expect.element(custom.getByText('Nothing here')).toBeVisible();

		const own = await render(Timeline, { items: [], emptySnippet: snippet('<p>Custom empty</p>') });
		await expect.element(own.getByText('Custom empty')).toBeVisible();
		expect(own.container.querySelector('.aurora-no-data')).toBeNull();
	});

	test('texts follow locale, or the default locale of the app', async () => {
		const own = await render(Timeline, { items: [], locale: 'it' });
		await expect.element(own.getByText('Nessun evento')).toBeVisible();
		await own.unmount();
		const inherited = await renderWithDefaultLocale('it', Timeline, { items: steps.slice(0, 1) });
		expect(inherited.container.querySelector('.aurora-timeline-status')?.textContent).toBe('Completato');
		await inherited.unmount();
		const overridden = await renderWithDefaultLocale('it', Timeline, { items: [], locale: 'en' });
		await expect.element(overridden.getByText('No events yet')).toBeVisible();
	});

	test('snippets replace their parts and receive the item', async () => {
		const screen = await render(Timeline, {
			items: [{ title: 'Deposit', description: 'Bank', from: new Date(2026, 8, 3), key: 'd' }],
			locale: 'it',
			markerSnippet: withArgs<{ item: TimelineItem; index: number }>(
				({ item, index }) => `<b class="m">${item.title}-${index}</b>`
			),
			timeSnippet: withArgs<{ item: TimelineItem; text: string }>(({ text }) => `<i>[${text}]</i>`),
			titleSnippet: withArgs<{ item: TimelineItem }>(({ item }) => `<u>${item.title}!</u>`),
			descriptionSnippet: withArgs<{ item: TimelineItem }>(({ item }) => `<em>${item.description}?</em>`),
			asideSnippet: withArgs<{ item: TimelineItem }>(() => '<span>€ 1.200</span>'),
			appendSnippet: withArgs<{ item: TimelineItem; index: number }>(() => '<button>Edit</button>')
		});
		const row = rows(screen.container)[0];
		expect(row.querySelector('.aurora-timeline-marker .m')?.textContent).toBe('Deposit-0');
		expect(row.querySelector('.aurora-timeline-marker')?.classList).toContain('aurora-timeline-marker-custom');
		expect(timeOf(row)).toBe(`[${new Intl.DateTimeFormat('it', DATE).format(new Date(2026, 8, 3))}]`);
		await expect.element(screen.getByText('Deposit!')).toBeVisible();
		await expect.element(screen.getByText('Bank?')).toBeVisible();
		expect(row.querySelector('.aurora-timeline-aside')?.textContent).toBe('€ 1.200');
		await expect.element(screen.getByRole('button', { name: 'Edit' })).toBeVisible();
	});

	test('contentSnippet keeps dates and append; itemSnippet replaces everything but the marker', async () => {
		const items: TimelineItem[] = [{ title: 'Deposit', time: '09:30' }];
		const content = await render(Timeline, {
			items,
			contentSnippet: withArgs<{ item: TimelineItem; side: string }>(
				({ item, side }) => `<p class="c">${item.title} ${side}</p>`
			),
			appendSnippet: snippet('<span class="a">after</span>')
		});
		const row = rows(content.container)[0];
		expect(timeOf(row)).toBe('09:30');
		expect(row.querySelector('.c')?.textContent).toBe('Deposit end');
		expect(row.querySelector('.aurora-timeline-title')).toBeNull();
		expect(row.querySelector('.a')).not.toBeNull();

		const whole = await render(Timeline, {
			items,
			itemSnippet: withArgs<{ item: TimelineItem; index: number }>(
				({ item, index }) => `<p class="w">${index}: ${item.title}</p>`
			)
		});
		const replaced = rows(whole.container)[0];
		expect(replaced.querySelector('.w')?.textContent).toBe('0: Deposit');
		expect(replaced.querySelector('.aurora-timeline-time')).toBeNull();
		expect(replaced.querySelector('.aurora-timeline-marker')).not.toBeNull();
	});

	test('CSS variables per instance', async () => {
		const screen = await render(Timeline, {
			items: steps,
			style: '--timeline-marker-color: rgb(255, 0, 0); --timeline-width: 300px; --timeline-marker-size: 20px'
		});
		const element = root(screen.container);
		expect(element.getBoundingClientRect().width).toBe(300);
		const upcoming = getComputedStyle(rows(screen.container)[2].querySelector('.aurora-timeline-marker')!);
		expect(upcoming.borderTopColor).toBe('rgb(255, 0, 0)');
		expect(upcoming.width).toBe('20px');
	});

	test('bind:timelineElement exposes the root', async () => {
		let element: HTMLDivElement | undefined;
		const screen = await render(Timeline, {
			items: steps,
			get timelineElement() {
				return element;
			},
			set timelineElement(value) {
				element = value;
			}
		});
		expect(element).toBe(root(screen.container));
	});
});
