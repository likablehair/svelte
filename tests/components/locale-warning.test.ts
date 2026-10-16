import { afterEach, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import DatePickerTextField from '#lib/components/composed/forms/DatePickerTextField.svelte';
import { renderWithDefaultLocale } from '../helpers.js';

afterEach(() => vi.restoreAllMocks());

test('a date field without a locale warns once in development, with setDefaultLocale or locale it does not', async () => {
	const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
	await renderWithDefaultLocale('it', DatePickerTextField, {});
	await render(DatePickerTextField, { locale: 'en' });
	expect(warn).not.toHaveBeenCalled();
	await render(DatePickerTextField, {});
	await render(DatePickerTextField, {});
	expect(warn).toHaveBeenCalledTimes(1);
	expect(String(warn.mock.calls[0][0])).toContain("setDefaultLocale('it')");
});
