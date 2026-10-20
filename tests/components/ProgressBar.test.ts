import { createRawSnippet } from 'svelte';
import { describe, expect, test } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import ProgressBar from '#lib/components/simple/progress/ProgressBar.svelte';
import { snippet } from '../helpers.js';

const still = '--progress-bar-duration: 0s';

function resolve(property: string, value: string) {
	const probe = document.createElement('div');
	probe.style.setProperty(property, value);
	document.body.append(probe);
	const result = getComputedStyle(probe).getPropertyValue(property);
	probe.remove();
	return result;
}

function part(root: Element, name: string) {
	return root.querySelector(`.aurora-progress-bar-${name}`) as HTMLElement;
}

describe('ProgressBar', () => {
	test('v4 bug: is a progressbar with aria-valuenow, -min and -max (v4 had no role)', async () => {
		const screen = await render(ProgressBar, { value: 36, total: 50, 'aria-label': 'Seats' });
		const bar = screen.getByRole('progressbar', { name: 'Seats' });
		await expect.element(bar).toHaveAttribute('aria-valuenow', '36');
		await expect.element(bar).toHaveAttribute('aria-valuemin', '0');
		await expect.element(bar).toHaveAttribute('aria-valuemax', '50');
		await expect.element(bar).not.toHaveAttribute('aria-valuetext');
		await expect.element(bar).toHaveAttribute('data-variant', 'primary');
		await expect.element(bar).not.toHaveAttribute('data-indeterminate');
	});

	test('defaults to 0 of 100', async () => {
		const screen = await render(ProgressBar, { 'aria-label': 'Empty', style: still });
		const bar = screen.getByRole('progressbar', { name: 'Empty' });
		await expect.element(bar).toHaveAttribute('aria-valuenow', '0');
		await expect.element(bar).toHaveAttribute('aria-valuemax', '100');
		expect(part(bar.element(), 'fill').getBoundingClientRect().width).toBe(0);
	});

	test('label is shown above the bar and names it', async () => {
		const screen = await render(ProgressBar, { value: 72, label: 'Monthly goal' });
		const bar = screen.getByRole('progressbar', { name: 'Monthly goal' });
		await expect.element(bar).toBeVisible();
		const label = part(bar.element(), 'label');
		expect(label.textContent?.trim()).toBe('Monthly goal');
		expect(bar.element().getAttribute('aria-labelledby')).toBe(label.id);
		expect(label.getBoundingClientRect().bottom).toBeLessThanOrEqual(
			part(bar.element(), 'track').getBoundingClientRect().top
		);
	});

	test('labelSnippet replaces the label text and still names the bar', async () => {
		const screen = await render(ProgressBar, {
			value: 10,
			label: 'Plain',
			labelSnippet: snippet('<strong>Custom goal</strong>')
		});
		await expect.element(screen.getByRole('progressbar', { name: 'Custom goal' })).toBeVisible();
		await expect.element(screen.getByText('Plain')).not.toBeInTheDocument();
	});

	test('the fill takes value / total of the track', async () => {
		const screen = await render(ProgressBar, {
			value: 30,
			total: 120,
			'aria-label': 'Quota',
			style: still
		});
		const bar = screen.getByRole('progressbar').element();
		const track = part(bar, 'track').getBoundingClientRect();
		expect(part(bar, 'fill').getBoundingClientRect().width).toBeCloseTo(track.width / 4, 1);

		await screen.rerender({ value: 90 });
		await expect.element(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '90');
		expect(part(bar, 'fill').getBoundingClientRect().width).toBeCloseTo((track.width * 3) / 4, 1);
	});

	test('the fill is clamped to the track and a total of 0 means full', async () => {
		const screen = await render(ProgressBar, { value: 150, 'aria-label': 'Over', style: still });
		const bar = screen.getByRole('progressbar').element();
		const width = part(bar, 'track').getBoundingClientRect().width;
		expect(part(bar, 'fill').getBoundingClientRect().width).toBe(width);
		await screen.rerender({ value: -20 });
		expect(part(bar, 'fill').getBoundingClientRect().width).toBe(0);
		await screen.rerender({ value: 3, total: 0 });
		expect(part(bar, 'fill').getBoundingClientRect().width).toBe(width);
	});

	test('aria-valuenow stays within aria-valuemin and aria-valuemax', async () => {
		const screen = await render(ProgressBar, { value: 150, total: 100, 'aria-label': 'Over' });
		await expect.element(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
	});

	test('showValue shows the rounded percentage on the right', async () => {
		const screen = await render(ProgressBar, { value: 1, total: 3, label: 'Third', showValue: true });
		const bar = screen.getByRole('progressbar', { name: 'Third' }).element();
		const value = part(bar, 'value');
		expect(value.textContent?.trim()).toBe('33%');
		expect(value.getBoundingClientRect().right).toBeCloseTo(bar.getBoundingClientRect().right, 1);
	});

	test('valueSnippet receives value, total and percent', async () => {
		const valueSnippet = createRawSnippet(
			(args: () => { value: number; total: number; percent: number }) => ({
				render: () => `<span>${args().value} of ${args().total} (${args().percent})</span>`
			})
		);
		const screen = await render(ProgressBar, {
			value: 380,
			total: 1000,
			showValue: true,
			'aria-label': 'SMS',
			valueSnippet
		});
		await expect.element(screen.getByText('380 of 1000 (38)')).toBeVisible();
	});

	test('indeterminate drops the value and slides a bar', async () => {
		const screen = await render(ProgressBar, {
			value: 40,
			label: 'Syncing',
			showValue: true,
			indeterminate: true
		});
		const bar = screen.getByRole('progressbar', { name: 'Syncing' });
		await expect.element(bar).toHaveAttribute('data-indeterminate');
		await expect.element(bar).not.toHaveAttribute('aria-valuenow');
		expect(part(bar.element(), 'value')).toBeNull();
		const fill = part(bar.element(), 'fill');
		expect(fill.getBoundingClientRect().width).toBe(
			part(bar.element(), 'track').getBoundingClientRect().width
		);
		expect(getComputedStyle(fill).animationName).toContain('slide');
	});

	test('variants switch the fill color', async () => {
		const screen = await render(ProgressBar, { value: 50, 'aria-label': 'Primary' });
		const fill = () => getComputedStyle(part(screen.getByRole('progressbar').element(), 'fill'));
		expect(fill().backgroundImage).toContain('gradient');
		for (const variant of ['success', 'warning', 'error'] as const) {
			await screen.rerender({ variant });
			await expect.element(screen.getByRole('progressbar')).toHaveAttribute('data-variant', variant);
			expect(fill().backgroundImage).toBe('none');
			expect(fill().backgroundColor).toBe(
				resolve('background-color', `var(--global-color-${variant})`)
			);
		}
	});

	test('valueTooltip shows the value over the track; valueTooltipLabel replaces it', async () => {
		const screen = await render(ProgressBar, {
			value: 36,
			total: 50,
			'aria-label': 'Seats',
			valueTooltip: true
		});
		const bar = screen.getByRole('progressbar', { name: 'Seats' });
		await userEvent.hover(part(bar.element(), 'track'));
		await expect.element(screen.getByRole('tooltip')).toHaveTextContent('36');
		expect(part(bar.element(), 'track').getAttribute('aria-describedby')).toBe(
			screen.getByRole('tooltip').element().id
		);

		await screen.rerender({ valueTooltipLabel: '36 of 50 seats booked' });
		await expect.element(screen.getByRole('tooltip')).toHaveTextContent('36 of 50 seats booked');
		await expect.element(bar).toHaveAttribute('aria-valuetext', '36 of 50 seats booked');
	});

	test('without valueTooltip there is no tooltip and no aria-valuetext', async () => {
		const screen = await render(ProgressBar, {
			value: 36,
			'aria-label': 'Seats',
			valueTooltipLabel: 'Hidden'
		});
		const bar = screen.getByRole('progressbar', { name: 'Seats' });
		await userEvent.hover(part(bar.element(), 'track'));
		expect(document.querySelector('[role="tooltip"]')).toBeNull();
		await expect.element(bar).not.toHaveAttribute('aria-valuetext');
	});

	test('an explicit aria-valuetext wins over valueTooltipLabel', async () => {
		const screen = await render(ProgressBar, {
			value: 3,
			'aria-label': 'Steps',
			valueTooltip: true,
			valueTooltipLabel: 'Tooltip text',
			'aria-valuetext': 'Step 3 of 100'
		});
		await expect
			.element(screen.getByRole('progressbar'))
			.toHaveAttribute('aria-valuetext', 'Step 3 of 100');
	});

	test('forwards native attributes and class to the root', async () => {
		const screen = await render(ProgressBar, {
			id: 'upload',
			title: 'Upload',
			class: 'app-progress',
			'aria-label': 'Upload'
		});
		const bar = screen.getByRole('progressbar', { name: 'Upload' });
		await expect.element(bar).toHaveAttribute('id', 'upload');
		await expect.element(bar).toHaveAttribute('title', 'Upload');
		await expect.element(bar).toHaveClass('aurora-progress-bar', 'app-progress');
	});

	test('instance CSS variables style the track and the fill', async () => {
		const screen = await render(ProgressBar, {
			value: 50,
			'aria-label': 'Styled',
			style:
				'--progress-bar-height: 5px; --progress-bar-border-radius: 2px; --progress-bar-background: rgb(1, 2, 3); --progress-bar-fill-background: rgb(4, 5, 6); --progress-bar-width: 200px'
		});
		const bar = screen.getByRole('progressbar').element();
		const track = getComputedStyle(part(bar, 'track'));
		expect(track.height).toBe('5px');
		expect(track.borderTopLeftRadius).toBe('2px');
		expect(track.backgroundColor).toBe('rgb(1, 2, 3)');
		expect(getComputedStyle(part(bar, 'fill')).backgroundColor).toBe('rgb(4, 5, 6)');
		expect(bar.getBoundingClientRect().width).toBe(200);
	});

	test('v4 bug: the tooltip opens over the whole track, also at value 0', async () => {
		const screen = await render(ProgressBar, {
			value: 0,
			'aria-label': 'Nothing yet',
			valueTooltip: true
		});
		await userEvent.hover(part(screen.getByRole('progressbar').element(), 'track'));
		await expect.element(screen.getByRole('tooltip')).toHaveTextContent('0');
	});

	test('v4 bug: valueTooltipLabel={0} is shown instead of falling back to value', async () => {
		const screen = await render(ProgressBar, {
			value: 7,
			'aria-label': 'Zero label',
			valueTooltip: true,
			valueTooltipLabel: 0
		});
		await userEvent.hover(part(screen.getByRole('progressbar').element(), 'track'));
		await expect.element(screen.getByRole('tooltip')).toHaveTextContent(/^0$/);
	});
});
