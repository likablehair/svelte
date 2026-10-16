import { createRawSnippet } from 'svelte';
import { describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-svelte';
import AvatarGroup from '#lib/components/simple/media/AvatarGroup.svelte';
import { renderWithDefaultLocale, tooltipText } from '../helpers.js';

const team = ['Mario Rossi', 'Giulia Marini', 'Sara Bianchi', 'Luca Ferri', 'Anna Greco', 'Paolo Russo'].map((name) => ({ name }));

const avatars = (container: HTMLElement) => [...container.querySelectorAll<HTMLElement>('.aurora-avatar')];

describe('AvatarGroup', () => {
	test('is a group with every avatar named', async () => {
		const screen = await render(AvatarGroup, { avatars: team.slice(0, 3), 'aria-label': 'Assigned people' });
		await expect.element(screen.getByRole('group', { name: 'Assigned people' })).toBeInTheDocument();
		await expect.element(screen.getByRole('img', { name: 'Giulia Marini' })).toBeInTheDocument();
		expect(avatars(screen.container).map((a) => a.textContent?.trim())).toEqual(['MR', 'GM', 'SB']);
	});

	test('maxVisible shows that many avatars and a +N counter that lists the others', async () => {
		const screen = await render(AvatarGroup, { avatars: team, maxVisible: 3 });
		const all = avatars(screen.container);
		expect(all).toHaveLength(4);
		const counter = all[3];
		expect(counter).toHaveClass('aurora-avatar-group-counter');
		expect(counter.textContent?.trim()).toBe('+3');
		expect(counter).toHaveAttribute('data-color', 'neutral');
		await expect.element(screen.getByRole('img', { name: '3 more' })).toBeInTheDocument();
		await expect.poll(() => tooltipText(counter)).toBe('Luca Ferri, Anna Greco, Paolo Russo');
	});

	test('no counter when the avatars fit', async () => {
		const screen = await render(AvatarGroup, { avatars: team.slice(0, 3), maxVisible: 3 });
		expect(screen.container.querySelector('.aurora-avatar-group-counter')).toBeNull();
	});

	test('every avatar has a Tooltip with its name, unless tooltips is false', async () => {
		const screen = await render(AvatarGroup, { avatars: team.slice(0, 2) });
		await expect.poll(() => tooltipText(avatars(screen.container)[1])).toBe('Giulia Marini');
		screen.unmount();

		const plain = await render(AvatarGroup, { avatars: team.slice(0, 2), tooltips: false });
		expect(plain.container.querySelector('.aurora-tooltip')).toBeNull();
	});

	test('the counter label follows locale, and moreLabel wins', async () => {
		const own = await render(AvatarGroup, { avatars: team, maxVisible: 2, locale: 'it' });
		await expect.element(own.getByRole('img', { name: 'Altri 4' })).toBeInTheDocument();
		own.unmount();

		const inherited = await renderWithDefaultLocale('it', AvatarGroup, { avatars: team, maxVisible: 4 });
		await expect.element(inherited.getByRole('img', { name: 'Altri 2' })).toBeInTheDocument();
		inherited.unmount();

		const label = await render(AvatarGroup, { avatars: team, maxVisible: 2, moreLabel: '{count} other people' });
		await expect.element(label.getByRole('img', { name: '4 other people' })).toBeInTheDocument();
	});

	test('size and shape reach every avatar, and the avatars overlap', async () => {
		const screen = await render(AvatarGroup, { avatars: team.slice(0, 3), maxVisible: 2, size: 'lg', shape: 'square' });
		const all = avatars(screen.container);
		for (const avatar of all) {
			expect(avatar).toHaveAttribute('data-size', 'lg');
			expect(avatar).toHaveAttribute('data-shape', 'square');
		}
		const [first, second] = all.map((a) => a.getBoundingClientRect());
		expect(second.left).toBeCloseTo(first.right - 9, 0);
	});

	test('--avatar-group-overlap and --avatar-group-gap-width change the overlap and the gap', async () => {
		const target = document.createElement('div');
		target.style.cssText = '--avatar-group-overlap: 20px; --avatar-group-gap-width: 4px';
		document.body.append(target);
		const screen = await render(AvatarGroup, { target, props: { avatars: team.slice(0, 2) } });
		const [first, second] = avatars(screen.container);
		expect(second.getBoundingClientRect().left).toBeCloseTo(first.getBoundingClientRect().right - 20, 0);
		expect(getComputedStyle(second).boxShadow).toMatch(/0px 0px 0px 4px/);
		target.remove();
	});

	test('avatarSnippet and counterSnippet replace the avatars and the counter', async () => {
		const screen = await render(AvatarGroup, {
			avatars: team,
			maxVisible: 2,
			avatarSnippet: createRawSnippet((args: () => { avatar: { name?: string }; index: number }) => ({
				render: () => `<a href="#${args().index}">${args().avatar.name}</a>`
			})),
			counterSnippet: createRawSnippet((args: () => { count: number }) => ({
				render: () => `<button>and ${args().count} more</button>`
			}))
		});
		await expect.element(screen.getByRole('link', { name: 'Giulia Marini' })).toBeInTheDocument();
		await expect.element(screen.getByRole('button', { name: 'and 4 more' })).toBeInTheDocument();
		expect(avatars(screen.container)).toHaveLength(0);
	});

	test('forwards native attributes, class and the role can be changed', async () => {
		const screen = await render(AvatarGroup, { avatars: team.slice(0, 2), id: 'team', class: 'app-class', role: 'list' });
		const group = screen.container.querySelector('.aurora-avatar-group')!;
		expect(group).toHaveAttribute('id', 'team');
		expect(group).toHaveAttribute('role', 'list');
		expect(group).toHaveClass('app-class');
	});
});
