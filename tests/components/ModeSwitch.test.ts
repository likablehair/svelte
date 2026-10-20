import { mdiWeatherNight } from '@mdi/js';
import { createRawSnippet } from 'svelte';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import ModeSwitch from '#lib/components/composed/forms/ModeSwitch.svelte';
import { setMode, theme } from '#lib/theme.svelte.js';
import { renderWithDefaultLocale } from '../helpers.js';

const html = document.documentElement;
const root = (container: HTMLElement) =>
	container.querySelector<HTMLElement>('.aurora-mode-switch')!;
const option = (container: HTMLElement, mode: string) =>
	container.querySelector<HTMLElement>(`.aurora-mode-switch-option[data-option='${mode}']`)!;

afterEach(() => {
	setMode('system');
});

describe('ModeSwitch', () => {
	test('renders a radio group with light, system and dark in this order', async () => {
		const screen = await render(ModeSwitch);
		const group = screen.getByRole('radiogroup', { name: 'Theme' });
		await expect.element(group).toBeVisible();
		const radios = [...root(screen.container).querySelectorAll('input')];
		expect(radios.map((radio) => radio.type)).toEqual(['radio', 'radio', 'radio']);
		expect(radios.map((radio) => radio.getAttribute('aria-label'))).toEqual([
			'Light',
			'System',
			'Dark'
		]);
		expect(new Set(radios.map((radio) => radio.name)).size).toBe(1);
		expect(root(screen.container).dataset.size).toBe('md');
	});

	test('the option of the current mode is checked', async () => {
		setMode('dark');
		const screen = await render(ModeSwitch);
		await expect.element(screen.getByRole('radio', { name: 'Dark' })).toBeChecked();
		expect(option(screen.container, 'dark').hasAttribute('data-selected')).toBe(true);
		expect(option(screen.container, 'system').hasAttribute('data-selected')).toBe(false);
	});

	test('follows a mode set from code', async () => {
		const screen = await render(ModeSwitch);
		await expect.element(screen.getByRole('radio', { name: 'System' })).toBeChecked();
		setMode('light');
		await expect.element(screen.getByRole('radio', { name: 'Light' })).toBeChecked();
		html.removeAttribute('data-mode');
		await expect.element(screen.getByRole('radio', { name: 'System' })).toBeChecked();
	});

	test('a click applies the mode and calls onchange after it', async () => {
		const modes: (string | undefined)[] = [];
		const onchange = vi.fn(() => modes.push(html.dataset.mode));
		const screen = await render(ModeSwitch, { onchange });
		await screen.getByRole('radio', { name: 'Dark' }).click();
		expect(html.dataset.mode).toBe('dark');
		expect(theme.mode).toBe('dark');
		expect(onchange).toHaveBeenCalledExactlyOnceWith({ mode: 'dark' });
		await screen.getByRole('radio', { name: 'System' }).click();
		expect(html.dataset.mode).toBeUndefined();
		expect(theme.mode).toBe('system');
		expect(onchange).toHaveBeenLastCalledWith({ mode: 'system' });
		expect(modes).toEqual(['dark', undefined]);
	});

	test('a click on the icon around the radio selects it', async () => {
		const screen = await render(ModeSwitch);
		await userEvent.click(option(screen.container, 'light'));
		expect(html.dataset.mode).toBe('light');
	});

	test('Tab enters on the checked option and the arrows move the mode', async () => {
		setMode('light');
		const screen = await render(ModeSwitch);
		await userEvent.keyboard('{Tab}');
		await expect.element(screen.getByRole('radio', { name: 'Light' })).toHaveFocus();
		await userEvent.keyboard('{ArrowRight}');
		await expect.element(screen.getByRole('radio', { name: 'System' })).toHaveFocus();
		expect(theme.mode).toBe('system');
		await userEvent.keyboard('{ArrowRight}');
		expect(theme.mode).toBe('dark');
		await userEvent.keyboard('{ArrowLeft}');
		expect(theme.mode).toBe('system');
	});

	test('the focused option shows its tooltip', async () => {
		setMode('dark');
		const screen = await render(ModeSwitch);
		await userEvent.keyboard('{Tab}');
		await expect.element(screen.getByRole('radio', { name: 'Dark' })).toHaveFocus();
		await expect
			.poll(() =>
				[...document.querySelectorAll('[popover]:popover-open')].map((p) => p.textContent?.trim())
			)
			.toContain('Dark');
	});

	test('system={false} offers only light and dark', async () => {
		const screen = await render(ModeSwitch, { system: false });
		const element = root(screen.container);
		expect(element.hasAttribute('data-no-system')).toBe(true);
		expect([...element.querySelectorAll('input')].map((radio) => radio.value)).toEqual([
			'light',
			'dark'
		]);
		expect(option(screen.container, 'system')).toBeNull();
	});

	test('system={false} selects the mode the system shows, and a click on it fixes it', async () => {
		const shown = matchMedia('(prefers-color-scheme: dark)').matches ? 'Dark' : 'Light';
		const other = shown === 'Dark' ? 'Light' : 'Dark';
		const onchange = vi.fn();
		const screen = await render(ModeSwitch, { system: false, onchange });
		await expect.element(screen.getByRole('radio', { name: shown })).toBeChecked();
		expect(getComputedStyle(option(screen.container, shown.toLowerCase())).boxShadow).not.toBe(
			'none'
		);
		await screen.getByRole('radio', { name: shown }).click();
		expect(theme.mode).toBe(shown.toLowerCase());
		expect(onchange).toHaveBeenCalledExactlyOnceWith({ mode: shown.toLowerCase() });
		await screen.getByRole('radio', { name: other }).click();
		expect(theme.mode).toBe(other.toLowerCase());
		expect(onchange).toHaveBeenCalledTimes(2);
	});

	test('a click on the option already chosen does nothing', async () => {
		setMode('dark');
		const onchange = vi.fn();
		const screen = await render(ModeSwitch, { onchange });
		await screen.getByRole('radio', { name: 'Dark' }).click();
		expect(onchange).not.toHaveBeenCalled();
	});

	test('disabled disables every option', async () => {
		const onchange = vi.fn();
		const screen = await render(ModeSwitch, { disabled: true, onchange });
		const element = root(screen.container);
		expect(element.getAttribute('aria-disabled')).toBe('true');
		expect(element.hasAttribute('data-disabled')).toBe(true);
		for (const radio of element.querySelectorAll('input')) expect(radio.disabled).toBe(true);
		option(screen.container, 'dark').click();
		expect(theme.mode).toBe('system');
		expect(onchange).not.toHaveBeenCalled();
	});

	test('texts follow locale and the props win', async () => {
		const screen = await render(ModeSwitch, { locale: 'it', darkLabel: 'Notte' });
		await expect.element(screen.getByRole('radiogroup', { name: 'Tema' })).toBeVisible();
		await expect.element(screen.getByRole('radio', { name: 'Chiaro' })).toBeVisible();
		await expect.element(screen.getByRole('radio', { name: 'Sistema' })).toBeVisible();
		await expect.element(screen.getByRole('radio', { name: 'Notte' })).toBeVisible();
	});

	test('the default locale of the app applies and locale wins over it', async () => {
		const italian = await renderWithDefaultLocale('it', ModeSwitch);
		await expect.element(italian.getByRole('radio', { name: 'Scuro' })).toBeVisible();
		const english = await renderWithDefaultLocale('it', ModeSwitch, { locale: 'en', label: 'Mode' });
		await expect.element(english.getByRole('radiogroup', { name: 'Mode' })).toBeVisible();
		await expect.element(english.getByRole('radio', { name: 'Dark' })).toBeVisible();
	});

	test('aria-labelledby replaces the default name', async () => {
		const screen = await render(ModeSwitch, { 'aria-labelledby': 'appearance-label' });
		const element = root(screen.container);
		expect(element.getAttribute('aria-labelledby')).toBe('appearance-label');
		expect(element.hasAttribute('aria-label')).toBe(false);
	});

	test('size, class per part, native attributes and icons', async () => {
		const screen = await render(ModeSwitch, {
			size: 'sm',
			id: 'mode',
			'data-testid': 'mode-switch',
			class: { container: 'pill', option: 'choice' },
			darkIcon: mdiWeatherNight
		});
		const element = root(screen.container);
		expect(element.id).toBe('mode');
		expect(element.dataset.testid).toBe('mode-switch');
		expect(element.dataset.size).toBe('sm');
		expect(element.classList.contains('pill')).toBe(true);
		expect(element.querySelectorAll('.choice')).toHaveLength(3);
		expect(option(screen.container, 'dark').querySelector('path')!.getAttribute('d')).toBe(
			mdiWeatherNight
		);
	});

	test('optionSnippet replaces the icon and keeps the radio', async () => {
		const optionSnippet = createRawSnippet<
			[{ mode: string; label: string; icon: string; selected: boolean }]
		>((args) => ({
			render: () => `<span class="text">${args().label}${args().selected ? ' ✓' : ''}</span>`
		}));
		setMode('light');
		const screen = await render(ModeSwitch, { optionSnippet });
		expect(option(screen.container, 'light').querySelector('.text')!.textContent).toBe('Light ✓');
		expect(option(screen.container, 'dark').querySelector('svg')).toBeNull();
		await expect.element(screen.getByRole('radio', { name: 'Dark' })).toBeVisible();
	});

	test('the selected look comes from the mode of the page and per-instance variables', async () => {
		setMode('dark');
		const screen = await render(ModeSwitch, {
			style: '--mode-switch-selected-background: rgb(255, 0, 0); --mode-switch-color: rgb(0, 0, 255)'
		});
		await expect.element(screen.getByRole('radio', { name: 'Dark' })).toBeChecked();
		expect(getComputedStyle(option(screen.container, 'dark')).backgroundColor).toBe('rgb(255, 0, 0)');
		expect(getComputedStyle(option(screen.container, 'light')).color).toBe('rgb(0, 0, 255)');
		html.dataset.mode = 'light';
		await expect.poll(() => getComputedStyle(option(screen.container, 'light')).backgroundColor).toBe(
			'rgb(255, 0, 0)'
		);
	});
});
