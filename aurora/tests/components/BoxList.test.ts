import { mdiCog } from '@mdi/js';
import { createRawSnippet } from 'svelte';
import { describe, expect, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import BoxList, { type BoxListItem } from '#lib/components/simple/lists/BoxList.svelte';

function withArgs<T>(markup: (args: T) => string) {
	return createRawSnippet<[T]>((args) => ({ render: () => markup(args()) }));
}

const root = (container: HTMLElement) => container.querySelector<HTMLUListElement>('.aurora-box-list')!;
const boxElements = (container: HTMLElement) => [
	...container.querySelectorAll<HTMLElement>('.aurora-box-list-box')
];

const sections: BoxListItem[] = [
	{ name: 'team', label: 'Team', description: 'Members and roles', icon: mdiCog, href: '#team' },
	{ name: 'billing', label: 'Billing', description: 'Plan and invoices', href: '#billing', color: 3 },
	{ name: 'help', label: 'Help' }
];

describe('BoxList', () => {
	test('renders a list with one item per box, label and description, attributes on the list', async () => {
		const screen = await render(BoxList, { boxes: sections, id: 'hub', class: 'mine', 'aria-label': 'Settings' });
		const list = root(screen.container);
		expect(list.tagName).toBe('UL');
		expect(list.id).toBe('hub');
		expect(list.classList.contains('mine')).toBe(true);
		await expect.element(screen.getByRole('list', { name: 'Settings' })).toBeInTheDocument();
		expect(screen.getByRole('listitem').all()).toHaveLength(3);
		await expect.element(screen.getByText('Members and roles')).toHaveClass('aurora-box-list-description');
		await expect.element(screen.getByText('Team')).toHaveClass('aurora-box-list-label');
		expect(boxElements(screen.container)[2].querySelector('.aurora-box-list-description')).toBeNull();
	});

	test('v4 bug: the list is a list of links, not a listbox without options', async () => {
		const screen = await render(BoxList, { boxes: sections });
		expect(screen.container.querySelector('[role="listbox"]')).toBeNull();
		expect(screen.getByRole('listitem').all()).toHaveLength(3);
		const link = screen.getByRole('link', { name: 'Team' });
		await expect.element(link).toHaveAttribute('href', '#team');
		expect(link.element().parentElement?.tagName).toBe('LI');
	});

	test('the label names a box and the description describes it', async () => {
		const screen = await render(BoxList, { boxes: sections });
		const link = screen.getByRole('link', { name: 'Team' });
		await expect.element(link).toHaveAccessibleName('Team');
		await expect.element(link).toHaveAccessibleDescription('Members and roles');
	});

	test('the icon is shown in a tile only when the box has one', async () => {
		const screen = await render(BoxList, { boxes: sections });
		const [team, billing] = boxElements(screen.container);
		const tile = team.querySelector('.aurora-box-list-icon')!;
		expect(tile.querySelector('svg path')?.getAttribute('d')).toBe(mdiCog);
		expect(tile.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
		expect(billing.querySelector('.aurora-box-list-icon')).toBeNull();
	});

	test('a box without href is a button with onboxClick and a plain card without it', async () => {
		const plain = await render(BoxList, { boxes: [{ name: 'help', label: 'Help' }] });
		const card = boxElements(plain.container)[0];
		expect(card.tagName).toBe('DIV');
		expect(card.hasAttribute('data-interactive')).toBe(false);
		expect(card.hasAttribute('aria-labelledby')).toBe(false);
		plain.unmount();

		const screen = await render(BoxList, { boxes: [{ name: 'help', label: 'Help' }], onboxClick: () => {} });
		const button = screen.getByRole('button', { name: 'Help' });
		await expect.element(button).toHaveAttribute('type', 'button');
		await expect.element(button).toHaveAttribute('data-interactive', 'true');
	});

	test('onboxClick receives the box and the event, for buttons and links', async () => {
		const onboxClick = vi.fn();
		const screen = await render(BoxList, { boxes: sections, onboxClick });
		await screen.getByRole('button', { name: 'Help' }).click();
		expect(onboxClick).toHaveBeenCalledTimes(1);
		expect(onboxClick.mock.calls[0][0].box).toBe(sections[2]);
		expect(onboxClick.mock.calls[0][0].event).toBeInstanceOf(MouseEvent);
		await screen.getByRole('link', { name: 'Billing' }).click();
		expect(onboxClick).toHaveBeenCalledTimes(2);
		expect(onboxClick.mock.calls[1][0].box).toBe(sections[1]);
	});

	test('a disabled box is not clickable: the button gets disabled, the link loses href', async () => {
		const onboxClick = vi.fn();
		const screen = await render(BoxList, {
			boxes: [
				{ name: 'a', label: 'Archive', disabled: true },
				{ name: 'b', label: 'Backup', href: '#backup', disabled: true }
			],
			onboxClick
		});
		const button = screen.getByRole('button', { name: 'Archive' });
		await expect.element(button).toBeDisabled();
		const link = screen.getByRole('link', { name: 'Backup' });
		await expect.element(link).toHaveAttribute('aria-disabled', 'true');
		expect(link.element().hasAttribute('href')).toBe(false);
		link.element().dispatchEvent(new MouseEvent('click', { bubbles: true }));
		expect(onboxClick).not.toHaveBeenCalled();
	});

	test('keyboard: Tab moves between the boxes, Enter activates a button, disabled ones are skipped', async () => {
		const onboxClick = vi.fn();
		const screen = await render(BoxList, {
			boxes: [
				{ name: 'a', label: 'Archive' },
				{ name: 'b', label: 'Backup', disabled: true },
				{ name: 'c', label: 'Cleanup' }
			],
			onboxClick
		});
		await userEvent.keyboard('{Tab}');
		await expect.element(screen.getByRole('button', { name: 'Archive' })).toHaveFocus();
		await userEvent.keyboard('{Tab}');
		await expect.element(screen.getByRole('button', { name: 'Cleanup' })).toHaveFocus();
		await userEvent.keyboard('{Enter}');
		expect(onboxClick).toHaveBeenCalledTimes(1);
		expect(onboxClick.mock.calls[0][0].box.name).toBe('c');
	});

	test('color sets data-color on the box, primary by default, with its own icon tone', async () => {
		const screen = await render(BoxList, { boxes: sections });
		const [team, billing] = boxElements(screen.container);
		expect(team.getAttribute('data-color')).toBe('primary');
		expect(billing.getAttribute('data-color')).toBe('3');
		const icon = (box: HTMLElement) => getComputedStyle(box).getPropertyValue('--_icon-color').trim();
		expect(icon(team)).not.toBe(icon(billing));
	});

	test('hover glows in the tone of the box, which follows --box-list-icon-color', async () => {
		const screen = await render(BoxList, { boxes: sections });
		const [team, billing] = boxElements(screen.container);
		const glow = (box: HTMLElement) => getComputedStyle(box, '::after');
		expect(glow(billing).opacity).toBe('0');
		expect(glow(team).backgroundImage).not.toBe(glow(billing).backgroundImage);
		await userEvent.hover(billing);
		await expect.poll(() => glow(billing).opacity).toBe('1');
		expect(glow(team).opacity).toBe('0');
		const before = glow(team).backgroundImage;
		team.style.setProperty('--box-list-icon-color', 'rgb(255, 0, 0)');
		expect(glow(team).backgroundImage).not.toBe(before);
		expect(getComputedStyle(team.querySelector('.aurora-box-list-icon')!).color).toBe('rgb(255, 0, 0)');
	});

	test('class on a box goes on its element', async () => {
		const screen = await render(BoxList, { boxes: [{ name: 'a', label: 'Archive', href: '#a', class: 'special' }] });
		await expect.element(screen.getByRole('link', { name: 'Archive' })).toHaveClass('special');
	});

	test('v4 bug: boxSnippet renders inside the link, which keeps its href and focus', async () => {
		const onboxClick = vi.fn();
		const screen = await render(BoxList, {
			boxes: sections.slice(0, 1),
			onboxClick,
			boxSnippet: withArgs<{ box: BoxListItem; index: number }>(
				({ box, index }) => `<span class="custom">${index}: ${box.label}</span>`
			)
		});
		const link = boxElements(screen.container)[0];
		expect(link.tagName).toBe('A');
		expect(link.getAttribute('href')).toBe('#team');
		expect(link.querySelector('.custom')?.textContent).toBe('0: Team');
		expect(link.querySelector('.aurora-box-list-label')).toBeNull();
		expect(link.hasAttribute('aria-labelledby')).toBe(false);
		await userEvent.keyboard('{Tab}');
		expect(document.activeElement).toBe(link);
		link.click();
		expect(onboxClick).toHaveBeenCalledTimes(1);
	});

	test('icon, label, description, prepend and append snippets', async () => {
		const screen = await render(BoxList, {
			boxes: sections.slice(1),
			iconSnippet: withArgs<{ box: BoxListItem }>(({ box }) => `<b class="icon">${box.name}</b>`),
			labelSnippet: withArgs<{ box: BoxListItem }>(({ box }) => `<em>${box.label.toUpperCase()}</em>`),
			descriptionSnippet: withArgs<{ box: BoxListItem }>(({ box }) => `<i>${box.description ?? ''}</i>`),
			prependSnippet: withArgs<{ box: BoxListItem; index: number }>(({ index }) => `<span class="before">${index}</span>`),
			appendSnippet: withArgs<{ box: BoxListItem; index: number }>(({ index }) => `<span class="after">${index}</span>`)
		});
		const [billing, help] = boxElements(screen.container);
		expect(billing.querySelector('.aurora-box-list-icon .icon')?.textContent).toBe('billing');
		expect(help.querySelector('.aurora-box-list-icon .icon')?.textContent).toBe('help');
		expect(billing.querySelector('.aurora-box-list-label em')?.textContent).toBe('BILLING');
		expect(billing.querySelector('.aurora-box-list-description i')?.textContent).toBe('Plan and invoices');
		expect(help.querySelector('.aurora-box-list-prepend .before')?.textContent).toBe('1');
		expect(help.querySelector('.aurora-box-list-append .after')?.textContent).toBe('1');
		expect(billing.firstElementChild?.classList.contains('aurora-box-list-prepend')).toBe(true);
		expect(billing.lastElementChild?.classList.contains('aurora-box-list-append')).toBe(true);
		await expect.element(screen.getByRole('link', { name: 'BILLING' })).toHaveAccessibleDescription('Plan and invoices');
	});

	test('the grid fills the width with columns of --box-list-min-width, one column when narrow', async () => {
		const host = document.createElement('div');
		host.style.width = '800px';
		document.body.append(host);
		const screen = await render(BoxList, {
			target: host,
			props: { boxes: sections, style: '--box-list-min-width: 200px; --box-list-gap: 20px' }
		});
		const list = root(screen.container);
		const columns = () => getComputedStyle(list).gridTemplateColumns.split(' ').length;
		expect(getComputedStyle(list).columnGap).toBe('20px');
		expect(columns()).toBe(3);
		host.style.width = '300px';
		await expect.poll(columns).toBe(1);
		const box = boxElements(screen.container)[0];
		expect(box.getBoundingClientRect().width).toBeLessThanOrEqual(300);
		host.remove();
	});

	test('instance CSS variables restyle the boxes and their parts', async () => {
		const screen = await render(BoxList, {
			boxes: sections,
			style:
				'--box-list-box-background: rgb(1, 2, 3); --box-list-box-border-radius: 3px; --box-list-icon-color: rgb(255, 0, 0); --box-list-label-font-size: 20px; --box-list-description-color: rgb(0, 128, 0)'
		});
		const team = boxElements(screen.container)[0];
		expect(getComputedStyle(team).backgroundColor).toBe('rgb(1, 2, 3)');
		expect(getComputedStyle(team).borderTopLeftRadius).toBe('3px');
		expect(getComputedStyle(team.querySelector('.aurora-box-list-icon')!).color).toBe('rgb(255, 0, 0)');
		expect(getComputedStyle(team.querySelector('.aurora-box-list-label')!).fontSize).toBe('20px');
		expect(getComputedStyle(team.querySelector('.aurora-box-list-description')!).color).toBe('rgb(0, 128, 0)');
	});

	test('bind:boxListElement exposes the list', async () => {
		let element: HTMLUListElement | undefined;
		const screen = await render(BoxList, {
			boxes: sections,
			get boxListElement() {
				return element;
			},
			set boxListElement(value) {
				element = value;
			}
		});
		expect(element).toBe(root(screen.container));
	});
});
