import { describe, expect, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import DescriptiveAvatar from '#lib/components/simple/media/DescriptiveAvatar.svelte';
import { snippet, tooltipText } from '../helpers.js';

const root = (container: HTMLElement) => container.querySelector<HTMLElement>('.aurora-descriptive-avatar')!;
const avatar = (container: HTMLElement) => container.querySelector<HTMLElement>('.aurora-avatar')!;

describe('DescriptiveAvatar', () => {
	test('shows the title and subtitle next to a decorative avatar', async () => {
		const screen = await render(DescriptiveAvatar, { title: 'Giulia Marini', subtitle: 'Senior Colorist' });
		const element = root(screen.container);
		expect(element.tagName).toBe('DIV');
		expect(element.querySelector('.aurora-descriptive-avatar-title')).toHaveTextContent('Giulia Marini');
		expect(element.querySelector('.aurora-descriptive-avatar-subtitle')).toHaveTextContent('Senior Colorist');
		expect(avatar(screen.container)).toHaveAttribute('aria-hidden', 'true');
	});

	test('v4 bug: the initials are the first letters of the first and last word of the title', async () => {
		const screen = await render(DescriptiveAvatar, { title: 'Mario Rossi' });
		expect(avatar(screen.container).textContent?.trim()).toBe('MR');
		screen.unmount();

		const text = await render(DescriptiveAvatar, { title: 'Mario Rossi', avatarText: 'MA' });
		expect(avatar(text.container).textContent?.trim()).toBe('MA');
		text.unmount();

		const name = await render(DescriptiveAvatar, { title: 'Profile', name: 'Luca Ferri' });
		expect(avatar(name.container).textContent?.trim()).toBe('LF');
	});

	test('v4 bug: without onclick or href there is no pointer cursor and no hover background', async () => {
		const screen = await render(DescriptiveAvatar, { title: 'Giulia Marini' });
		const element = root(screen.container);
		expect(getComputedStyle(element).cursor).toBe('auto');
		expect(element).not.toHaveAttribute('data-interactive');
		expect(element).not.toHaveAttribute('role');
	});

	test('v4 bug: with onclick it is a button that works with the keyboard', async () => {
		const onclick = vi.fn();
		const screen = await render(DescriptiveAvatar, { title: 'Giulia Marini', subtitle: 'Profile', onclick });
		const button = screen.getByRole('button', { name: 'Giulia Marini Profile' });
		await expect.element(button).toHaveAttribute('type', 'button');
		expect(getComputedStyle(root(screen.container)).cursor).toBe('pointer');
		await userEvent.keyboard('{Tab}');
		await expect.element(button).toHaveFocus();
		await userEvent.keyboard('{Enter}');
		expect(onclick).toHaveBeenCalledTimes(1);
		await button.click();
		expect(onclick).toHaveBeenCalledTimes(2);
		expect(onclick.mock.calls[1][0]).toBeInstanceOf(MouseEvent);
	});

	test('with href it is a link; target _blank adds rel', async () => {
		const screen = await render(DescriptiveAvatar, { props: { title: 'Giulia Marini', href: '/people/1', target: '_blank' } });
		const link = screen.getByRole('link', { name: 'Giulia Marini' });
		await expect.element(link).toHaveAttribute('href', '/people/1');
		await expect.element(link).toHaveAttribute('rel', 'noopener noreferrer');
		expect(root(screen.container)).toHaveAttribute('data-interactive');
	});

	test('disabled turns off the button and the link', async () => {
		const onclick = vi.fn();
		const button = await render(DescriptiveAvatar, { title: 'Giulia Marini', onclick, disabled: true });
		await expect.element(button.getByRole('button')).toBeDisabled();
		button.unmount();

		const link = await render(DescriptiveAvatar, { title: 'Giulia Marini', href: '/people/1', onclick, disabled: true });
		const element = root(link.container);
		expect(element).not.toHaveAttribute('href');
		expect(element).toHaveAttribute('aria-disabled', 'true');
		element.click();
		expect(onclick).not.toHaveBeenCalled();
	});

	test('v4 bug: children replace the texts even without title or subtitle', async () => {
		const screen = await render(DescriptiveAvatar, { name: 'Giulia Marini', children: snippet('<b class="custom">Giulia · Admin</b>') });
		expect(root(screen.container).querySelector('.aurora-descriptive-avatar-text .custom')).not.toBeNull();
	});

	test('avatarSnippet replaces the avatar', async () => {
		const screen = await render(DescriptiveAvatar, { title: 'Giulia Marini', avatarSnippet: snippet('<i class="logo"></i>') });
		expect(root(screen.container).querySelector('.logo')).not.toBeNull();
		expect(screen.container.querySelector('.aurora-avatar')).toBeNull();
	});

	test('direction and reverse; v4 bug: in a reversed row the texts are aligned to the end', async () => {
		const column = await render(DescriptiveAvatar, { title: 'Giulia Marini', direction: 'column' });
		const columnStyle = getComputedStyle(root(column.container));
		expect(columnStyle.flexDirection).toBe('column');
		expect(columnStyle.textAlign).toBe('center');
		column.unmount();

		const reversed = await render(DescriptiveAvatar, { title: 'Giulia Marini', reverse: true });
		const reversedStyle = getComputedStyle(root(reversed.container));
		expect(reversedStyle.flexDirection).toBe('row-reverse');
		expect(reversedStyle.textAlign).toBe('end');
	});

	test('compact shows only the avatar, with the title in a Tooltip and as the accessible name', async () => {
		const screen = await render(DescriptiveAvatar, { title: 'Giulia Marini', subtitle: 'Senior Colorist', compact: true, onclick: () => {} });
		expect(screen.container.querySelector('.aurora-descriptive-avatar-text')).toBeNull();
		const button = screen.getByRole('button', { name: 'Giulia Marini' });
		await expect.element(button).toBeInTheDocument();
		await expect.poll(() => tooltipText(button.element())).toBe('Giulia Marini Senior Colorist');
		screen.unmount();

		const plain = await render(DescriptiveAvatar, { title: 'Giulia Marini', compact: true });
		await expect.element(plain.getByRole('img', { name: 'Giulia Marini' })).toBeInTheDocument();
	});

	test('passes the Avatar props on and binds imageLoadingStatus', async () => {
		let status: string | undefined;
		const screen = await render(DescriptiveAvatar, {
			title: 'Giulia Marini',
			size: 'lg',
			status: 'online',
			color: 5,
			src: 'data:image/png;base64,broken',
			get imageLoadingStatus() {
				return status as 'error' | undefined;
			},
			set imageLoadingStatus(value) {
				status = value;
			}
		});
		const inner = avatar(screen.container);
		expect(inner).toHaveAttribute('data-size', 'lg');
		expect(inner).toHaveAttribute('data-status', 'online');
		expect(inner).toHaveAttribute('data-color', '5');
		await expect.poll(() => status).toBe('error');
	});

	test('forwards native attributes and class to the root and binds it', async () => {
		let element: HTMLElement | undefined;
		const screen = await render(DescriptiveAvatar, {
			title: 'Giulia Marini',
			id: 'me',
			class: 'app-class',
			get descriptiveAvatarElement() {
				return element;
			},
			set descriptiveAvatarElement(value) {
				element = value;
			}
		});
		const node = root(screen.container);
		expect(node).toHaveAttribute('id', 'me');
		expect(node).toHaveClass('aurora-descriptive-avatar', 'app-class');
		expect(element).toBe(node);
	});

	test('the --descriptive-avatar-* variables reach the parts', async () => {
		const target = document.createElement('div');
		target.style.cssText = '--descriptive-avatar-title-font-size: 20px; --descriptive-avatar-image-gap: 30px; --descriptive-avatar-subtitle-color: rgb(1, 2, 3)';
		document.body.append(target);
		const screen = await render(DescriptiveAvatar, { target, props: { title: 'Giulia Marini', subtitle: 'Colorist' } });
		const node = root(screen.container);
		expect(getComputedStyle(node.querySelector('.aurora-descriptive-avatar-title')!).fontSize).toBe('20px');
		expect(getComputedStyle(node).columnGap).toBe('30px');
		expect(getComputedStyle(node.querySelector('.aurora-descriptive-avatar-subtitle')!).color).toBe('rgb(1, 2, 3)');
		target.remove();
	});
});
