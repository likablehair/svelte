import { describe, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Avatar from '#lib/components/simple/media/Avatar.svelte';
import { renderWithDefaultLocale, snippet } from '../helpers.js';

const IMAGE = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect width="8" height="8" fill="red"/></svg>')}`;
const BROKEN = 'data:image/png;base64,broken';

const root = (container: HTMLElement) => container.querySelector<HTMLElement>('.aurora-avatar')!;
const content = (container: HTMLElement) => root(container).querySelector('.aurora-avatar-content')!;

function host(style = '') {
	const element = document.createElement('div');
	element.style.cssText = style;
	document.body.append(element);
	return element;
}

describe('Avatar', () => {
	test('shows the initials of the first and last word of name', async () => {
		const cases: [string, string][] = [
			['Mario Rossi', 'MR'],
			['Mario', 'M'],
			['  maria  de luca ', 'ML'],
			['Anna Maria Bianchi', 'AB'],
			["(Luca) D'Amico", 'LD'],
			['élodie durand', 'ÉD']
		];
		for (const [name, expected] of cases) {
			const screen = await render(Avatar, { name });
			expect(content(screen.container).textContent).toBe(expected);
			screen.unmount();
		}
	});

	test('text replaces the initials', async () => {
		const screen = await render(Avatar, { name: 'Acme S.p.A.', text: 'ACM' });
		expect(content(screen.container).textContent).toBe('ACM');
	});

	test('v4 bug: without image, name or text it shows a person icon, not an empty circle', async () => {
		const screen = await render(Avatar, {});
		const avatar = root(screen.container);
		expect(avatar.querySelector('.aurora-avatar-content svg')).not.toBeNull();
		expect(avatar).toHaveAttribute('aria-hidden', 'true');
		expect(avatar).toHaveAttribute('data-color', 'neutral');
	});

	test('icon replaces the person icon', async () => {
		const screen = await render(Avatar, { icon: 'M1,1H2V2H1Z' });
		expect(root(screen.container).querySelector('path')).toHaveAttribute('d', 'M1,1H2V2H1Z');
	});

	test('name is the accessible name; alt changes it and an empty alt makes the avatar decorative', async () => {
		const named = await render(Avatar, { name: 'Mario Rossi' });
		await expect.element(named.getByRole('img', { name: 'Mario Rossi' })).toBeInTheDocument();
		named.unmount();

		const alt = await render(Avatar, { name: 'Mario Rossi', alt: 'Profile of Mario' });
		await expect.element(alt.getByRole('img', { name: 'Profile of Mario' })).toBeInTheDocument();
		alt.unmount();

		const decorative = await render(Avatar, { name: 'Mario Rossi', alt: '' });
		const avatar = root(decorative.container);
		expect(avatar).toHaveAttribute('aria-hidden', 'true');
		expect(avatar).not.toHaveAttribute('role');
		decorative.unmount();

		const textOnly = await render(Avatar, { text: 'MR' });
		expect(root(textOnly.container)).toHaveAttribute('aria-hidden', 'true');
	});

	test('status draws a dot and adds its meaning to the accessible name', async () => {
		const screen = await render(Avatar, { name: 'Mario Rossi', status: 'online' });
		const avatar = root(screen.container);
		expect(avatar).toHaveAttribute('data-status', 'online');
		expect(avatar.querySelector('.aurora-avatar-status')).not.toBeNull();
		await expect.element(screen.getByRole('img', { name: 'Mario Rossi, Online' })).toBeInTheDocument();
		screen.unmount();

		const label = await render(Avatar, { name: 'Mario Rossi', status: 'busy', statusLabel: 'In a meeting' });
		await expect.element(label.getByRole('img', { name: 'Mario Rossi, In a meeting' })).toBeInTheDocument();
	});

	test('status texts follow locale, from the prop or from setDefaultLocale', async () => {
		const own = await render(Avatar, { name: 'Mario Rossi', status: 'away', locale: 'it' });
		await expect.element(own.getByRole('img', { name: 'Mario Rossi, Assente' })).toBeInTheDocument();
		own.unmount();

		const inherited = await renderWithDefaultLocale('it', Avatar, { name: 'Mario Rossi', status: 'busy' });
		await expect.element(inherited.getByRole('img', { name: 'Mario Rossi, Occupato' })).toBeInTheDocument();
		inherited.unmount();

		const wins = await renderWithDefaultLocale('it', Avatar, { name: 'Mario Rossi', status: 'busy', locale: 'en' });
		await expect.element(wins.getByRole('img', { name: 'Mario Rossi, Busy' })).toBeInTheDocument();
	});

	test('the color is picked from the name, the same for the same person, and colorKey or color change it', async () => {
		const colorOf = async (props: Record<string, unknown>) => {
			const screen = await render(Avatar, props);
			const color = root(screen.container).getAttribute('data-color');
			screen.unmount();
			return color;
		};
		const names = ['Mario Rossi', 'Giulia Marini', 'Sara Bianchi', 'Luca Ferri', 'Anna Greco', 'Paolo Russo', 'Chiara Costa', 'Marco Gallo'];
		const colors = await Promise.all(names.map((name) => colorOf({ name })));
		for (const color of colors) expect(['1', '2', '3', '4', '5', '6']).toContain(color);
		expect(new Set(colors).size).toBeGreaterThan(2);
		expect(await colorOf({ name: 'mario rossi' })).toBe(colors[0]);
		expect(await colorOf({ name: 'Mario Rossi', colorKey: 42 })).toBe(await colorOf({ name: 'Someone else', colorKey: 42 }));
		expect(await colorOf({ name: 'Mario Rossi', color: 3 })).toBe('3');
		expect(await colorOf({ name: 'Mario Rossi', color: 'primary' })).toBe('primary');
		expect(await colorOf({ text: 'AC' })).toMatch(/^[1-6]$/);
	});

	test('the palette colors have a background gradient and --avatar-background overrides it', async () => {
		const screen = await render(Avatar, { name: 'Mario Rossi', color: 2 });
		expect(getComputedStyle(root(screen.container)).backgroundImage).toContain('linear-gradient');
		screen.unmount();

		const target = host('--avatar-background: rgb(1, 2, 3); --avatar-color: rgb(4, 5, 6)');
		const custom = await render(Avatar, { target, props: { name: 'Mario Rossi' } });
		const style = getComputedStyle(root(custom.container));
		expect(style.backgroundColor).toBe('rgb(1, 2, 3)');
		expect(style.color).toBe('rgb(4, 5, 6)');
		target.remove();
	});

	test('size sets a square box from 24 to 80px, --avatar-size any other, and the text scales', async () => {
		const sizes = { xs: 24, sm: 32, md: 40, lg: 56, xl: 80 } as const;
		for (const [size, px] of Object.entries(sizes)) {
			const screen = await render(Avatar, { name: 'Mario Rossi', size: size as keyof typeof sizes });
			const rect = root(screen.container).getBoundingClientRect();
			expect(rect.width).toBeCloseTo(px, 0);
			expect(rect.height).toBeCloseTo(px, 0);
			screen.unmount();
		}
		const target = host('--avatar-size: 100px');
		const custom = await render(Avatar, { target, props: { name: 'Mario Rossi' } });
		const avatar = root(custom.container);
		expect(avatar.getBoundingClientRect().width).toBeCloseTo(100, 0);
		expect(parseFloat(getComputedStyle(avatar).fontSize)).toBeCloseTo(38, 0);
		target.remove();
	});

	test('v4 bug: the avatar is not squashed in a narrow flex row', async () => {
		const target = host('display: flex; width: 60px');
		const screen = await render(Avatar, { target, props: { name: 'Mario Rossi' } });
		const sibling = document.createElement('span');
		sibling.textContent = 'A very long text that wants all the space in the row';
		target.append(sibling);
		expect(root(screen.container).getBoundingClientRect().width).toBeCloseTo(40, 0);
		target.remove();
	});

	test('shape rounds the corners and ring draws a ring with a gap', async () => {
		const square = await render(Avatar, { name: 'Mario Rossi', shape: 'square' });
		const avatar = root(square.container);
		expect(avatar).toHaveAttribute('data-shape', 'square');
		expect(getComputedStyle(avatar).borderTopLeftRadius).toBe('30%');
		square.unmount();

		const ring = await render(Avatar, { name: 'Mario Rossi', ring: true });
		const ringed = root(ring.container);
		expect(ringed).toHaveAttribute('data-ring');
		expect(getComputedStyle(ringed).boxShadow).toMatch(/0px 0px 0px 2px, .*0px 0px 0px 4px$/);
	});

	test('shows the image over the initials and reports success', async () => {
		let status: string | undefined;
		const screen = await render(Avatar, {
			name: 'Mario Rossi',
			src: IMAGE,
			get imageLoadingStatus() {
				return status as 'success' | undefined;
			},
			set imageLoadingStatus(value) {
				status = value;
			}
		});
		const image = root(screen.container).querySelector('img')!;
		expect(image).toHaveAttribute('alt', '');
		expect(image).toHaveAttribute('referrerpolicy', 'no-referrer');
		expect(content(screen.container).textContent).toBe('MR');
		await expect.poll(() => status).toBe('success');
		expect(root(screen.container)).toHaveAttribute('data-image', 'success');
	});

	test('v4 bug: a broken image leaves the initials and no broken image', async () => {
		let status: string | undefined;
		const screen = await render(Avatar, {
			name: 'Mario Rossi',
			src: BROKEN,
			get imageLoadingStatus() {
				return status as 'error' | undefined;
			},
			set imageLoadingStatus(value) {
				status = value;
			}
		});
		await expect.poll(() => status).toBe('error');
		expect(root(screen.container).querySelector('img')).toBeNull();
		expect(content(screen.container).textContent).toBe('MR');
	});

	test('a new src after an error loads again', async () => {
		const screen = await render(Avatar, { name: 'Mario Rossi', src: BROKEN });
		await expect.poll(() => root(screen.container).getAttribute('data-image')).toBe('error');
		await screen.rerender({ src: IMAGE });
		await expect.poll(() => root(screen.container).getAttribute('data-image')).toBe('success');
		expect(root(screen.container).querySelector('img')).not.toBeNull();
	});

	test('an empty src counts as no image', async () => {
		const screen = await render(Avatar, { name: 'Mario Rossi', src: '' });
		expect(root(screen.container).querySelector('img')).toBeNull();
		expect(root(screen.container)).not.toHaveAttribute('data-image');
	});

	test('a Blob becomes an object URL, revoked when the avatar goes away', async () => {
		const revoke = vi.spyOn(URL, 'revokeObjectURL');
		const blob = new Blob(['<svg xmlns="http://www.w3.org/2000/svg" width="4" height="4"/>'], { type: 'image/svg+xml' });
		const screen = await render(Avatar, { name: 'Mario Rossi', src: blob });
		await expect.poll(() => root(screen.container).querySelector('img')?.getAttribute('src')).toMatch(/^blob:/);
		const url = root(screen.container).querySelector('img')!.getAttribute('src');
		screen.unmount();
		expect(revoke).toHaveBeenCalledWith(url);
		revoke.mockRestore();
	});

	test('v4 bug: children replace only the content inside the circle, which keeps its color', async () => {
		const screen = await render(Avatar, { name: 'Mario Rossi', color: 4, children: snippet('<b class="inside">€</b>') });
		const avatar = root(screen.container);
		expect(avatar.querySelector('.aurora-avatar-content .inside')).not.toBeNull();
		expect(getComputedStyle(avatar).backgroundImage).toContain('linear-gradient');
	});

	test('badgeSnippet replaces the status dot', async () => {
		const screen = await render(Avatar, { name: 'Mario Rossi', status: 'online', badgeSnippet: snippet('<i class="badge">3</i>') });
		const avatar = root(screen.container);
		expect(avatar.querySelector('.aurora-avatar-badge .badge')).not.toBeNull();
		expect(avatar.querySelector('.aurora-avatar-status')).toBeNull();
	});

	test('forwards native attributes and class to the root and binds it', async () => {
		let element: HTMLSpanElement | undefined;
		const screen = await render(Avatar, {
			name: 'Mario Rossi',
			id: 'me',
			class: 'app-class',
			'data-testid': 'avatar',
			get avatarElement() {
				return element;
			},
			set avatarElement(value) {
				element = value;
			}
		});
		const avatar = root(screen.container);
		expect(avatar).toHaveAttribute('id', 'me');
		expect(avatar).toHaveAttribute('data-testid', 'avatar');
		expect(avatar).toHaveClass('aurora-avatar', 'app-class');
		expect(element).toBe(avatar);
	});
});
