import { describe, expect, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import CountriesAutocomplete from '#lib/components/composed/forms/CountriesAutocomplete.svelte';
import { countryItems } from '#lib/utils/countries.js';
import BoundValues from '../fixtures/countries-autocomplete/BoundValues.svelte';

const france = { value: 'FR', label: 'Francia', data: { dialCode: '+33' } };
const italy = { value: 'IT', label: 'Italia', data: { dialCode: '+39' } };

const optionLabels = () =>
	[...document.querySelectorAll('[role="option"]')].map((option) => option.textContent?.trim());

describe('CountriesAutocomplete', () => {
	test('v4 bug: lists every country named in English and sorted by name, not by code', async () => {
		const screen = await render(CountriesAutocomplete, { label: 'Country' });
		await screen.getByRole('combobox', { name: 'Country' }).click();
		await expect.poll(() => optionLabels().length).toBe(249);
		const labels = optionLabels() as string[];
		expect(labels[0]).toBe('Afghanistan');
		expect(labels).toContain('Italy');
		expect(labels).toEqual([...labels].sort(new Intl.Collator('en').compare));
		expect(labels).toEqual(countryItems('en').map((item) => item.label));
	});

	test('v4 bug: locale names and sorts the countries in that language', async () => {
		const screen = await render(CountriesAutocomplete, { label: 'Paese', locale: 'it' });
		await screen.getByRole('combobox').click();
		await expect.poll(() => optionLabels().length).toBe(249);
		const labels = optionLabels() as string[];
		expect(labels).toEqual(expect.arrayContaining(['Italia', 'Germania', 'Stati Uniti']));
		expect(labels).not.toContain('Italy');
		expect(labels).toEqual([...labels].sort(new Intl.Collator('it').compare));
	});

	test('v4 bug: the search ignores accents and case', async () => {
		const screen = await render(CountriesAutocomplete, { label: 'Country' });
		const input = screen.getByRole('combobox');
		await input.click();
		await userEvent.keyboard('CURACAO');
		await expect.poll(optionLabels).toEqual(['Curaçao']);
		await screen.unmount();

		const french = await render(CountriesAutocomplete, { label: 'Pays', locale: 'fr' });
		await french.getByRole('combobox').click();
		await userEvent.keyboard('equa');
		await expect.poll(optionLabels).toContain('Équateur');
	});

	test('v4 bug: the search matches the ISO code', async () => {
		const screen = await render(CountriesAutocomplete, { label: 'Country' });
		const input = screen.getByRole('combobox');
		await input.click();
		await userEvent.keyboard('us');
		await expect.poll(() => optionLabels()[0]).toBe('United States');
		const first = screen.getByRole('option', { name: 'United States' });
		await expect.element(first).toHaveAttribute('data-highlighted');
		await userEvent.keyboard('{Enter}');
		await expect
			.element(screen.getByRole('button', { name: 'Remove United States' }))
			.toBeInTheDocument();
	});

	test('ranks name starts first, then the ISO code, then word starts, then the rest', async () => {
		const screen = await render(CountriesAutocomplete, { label: 'Country' });
		await screen.getByRole('combobox').click();
		await userEvent.keyboard('ma');
		await expect.poll(optionLabels).toContain('Morocco');
		const labels = optionLabels() as string[];
		const code = labels.indexOf('Morocco');
		expect(code).toBeGreaterThan(0);
		expect(labels.slice(0, code).every((label) => label.startsWith('Ma'))).toBe(true);
		const word = labels.indexOf('Isle of Man');
		expect(word).toBeGreaterThan(code);
		expect(labels.indexOf('Denmark')).toBeGreaterThan(word);
		expect(labels.indexOf('Panama')).toBeGreaterThan(word);
	});

	test('values can be set with the code alone and take the name in locale', async () => {
		const screen = await render(CountriesAutocomplete, {
			label: 'Country',
			values: [{ value: 'IT' }]
		});
		const chip = screen.getByRole('button', { name: 'Remove Italy' });
		await expect.element(chip).toBeInTheDocument();
		expect(chip.element().closest('.aurora-chip')?.querySelector('.fi.fi-it')).not.toBeNull();
		await screen.rerender({ locale: 'it' });
		await expect
			.element(screen.getByRole('button', { name: 'Remove Italia' }))
			.toBeInTheDocument();
	});

	test('onchange gets items with the localized name and the dialing code', async () => {
		const onchange = vi.fn();
		const screen = await render(CountriesAutocomplete, {
			label: 'Paesi',
			locale: 'it',
			multiple: true,
			values: [{ value: 'FR' }],
			onchange
		});
		await screen.getByRole('combobox').click();
		await userEvent.keyboard('ital{Enter}');
		expect(onchange).toHaveBeenCalledExactlyOnceWith({
			select: italy,
			unselect: undefined,
			selection: [france, italy]
		});
	});

	test('bind:values gets items with the localized name and the dialing code', async () => {
		const screen = await render(BoundValues, {
			label: 'Paesi',
			locale: 'it',
			multiple: true,
			initial: [{ value: 'FR' }]
		});
		await screen.getByRole('combobox').click();
		await userEvent.keyboard('ital{Enter}');
		const output = screen.container.querySelector('output')!;
		await expect.poll(() => JSON.parse(output.textContent!)).toEqual([france, italy]);
	});

	test('dialCode shows the dialing code at the end of each option', async () => {
		const screen = await render(CountriesAutocomplete, { label: 'Prefix', dialCode: true });
		await screen.getByRole('combobox').click();
		await userEvent.keyboard('italy');
		const option = screen.getByRole('option', { name: /Italy/ });
		await expect.element(option).toHaveTextContent('+39');
		const code = option.element().querySelector('.aurora-countries-autocomplete-dial-code');
		expect(option.element().lastElementChild).toBe(code);
		await screen.unmount();

		const plain = await render(CountriesAutocomplete, { label: 'Country' });
		await plain.getByRole('combobox').click();
		await userEvent.keyboard('italy');
		await expect.element(plain.getByRole('option', { name: 'Italy' })).toBeInTheDocument();
		expect(document.querySelector('.aurora-countries-autocomplete-dial-code')).toBeNull();
	});

	test('items restricts the list to some countries', async () => {
		const screen = await render(CountriesAutocomplete, {
			label: 'Market',
			items: countryItems('en', ['IT', 'FR', 'DE'])
		});
		await screen.getByRole('combobox').click();
		await expect.poll(optionLabels).toEqual(['France', 'Germany', 'Italy']);
		await userEvent.keyboard('de');
		await expect.poll(optionLabels).toEqual(['Germany']);
	});

	test('v4 bug: flags in options and chips take --flag-icon-size', async () => {
		const container = document.createElement('div');
		container.style.setProperty('--flag-icon-size', '30px');
		document.body.append(container);
		const screen = await render(CountriesAutocomplete, {
			target: container,
			props: { label: 'Country', values: [{ value: 'IT' }] }
		});
		await screen.getByRole('combobox').click();
		await userEvent.keyboard('fran');
		const option = screen.getByRole('option', { name: 'France' });
		const flag = option.element().querySelector('.fi.fi-fr')!;
		expect(flag).toHaveAttribute('aria-hidden', 'true');
		expect(getComputedStyle(flag).fontSize).toBe('30px');
		const chipFlag = container.querySelector('.aurora-chip .fi.fi-it')!;
		expect(getComputedStyle(chipFlag).fontSize).toBe('30px');
		container.remove();
	});

	test('with name and multiple, every code is submitted with the form', async () => {
		const form = document.createElement('form');
		let data: FormData | undefined;
		form.addEventListener('submit', (event) => {
			event.preventDefault();
			data = new FormData(form);
		});
		document.body.append(form);
		const screen = await render(CountriesAutocomplete, {
			target: form,
			props: { label: 'Markets', multiple: true, name: 'markets', values: [{ value: 'IT' }] }
		});
		await screen.getByRole('combobox').click();
		await userEvent.keyboard('germ{Enter}');
		form.requestSubmit();
		expect(data?.getAll('markets')).toEqual(['IT', 'DE']);
		form.remove();
	});

	test('v4 bug: Autocomplete props and callbacks are direct props and none is lost', async () => {
		const onfocus = vi.fn();
		const onkeydown = vi.fn();
		const onchange = vi.fn();
		const onclose = vi.fn();
		const onblur = vi.fn();
		const container = document.createElement('div');
		document.body.append(container);
		const screen = await render(CountriesAutocomplete, {
			target: container,
			props: {
				label: 'Countries',
				placeholder: 'Search a country',
				multiple: true,
				maxVisibleChips: 1,
				values: [{ value: 'IT' }, { value: 'FR' }],
				onfocus,
				onkeydown,
				onchange,
				onclose,
				onblur
			}
		});
		container.append(document.createElement('button'));
		const input = screen.getByRole('combobox');
		await expect.element(input).toHaveAttribute('placeholder', 'Search a country');
		await expect.element(screen.getByText('+1')).toHaveAttribute('title', 'France');
		await input.click();
		expect(onfocus.mock.calls[0][0]).toBeInstanceOf(FocusEvent);
		await userEvent.keyboard('spa{Enter}');
		expect(onkeydown.mock.calls[0][0]).toBeInstanceOf(KeyboardEvent);
		expect(onchange).toHaveBeenCalledOnce();
		await userEvent.keyboard('{Escape}');
		expect(onclose).toHaveBeenCalledOnce();
		await userEvent.keyboard('{Tab}');
		expect(onblur).toHaveBeenCalledOnce();
		expect(onblur.mock.calls[0][0]).toBeInstanceOf(FocusEvent);
		container.remove();
	});
});
