import { createRawSnippet } from 'svelte';
import { describe, expect, test, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import YearPickerTextField from '#lib/components/composed/forms/YearPickerTextField.svelte';
import { snippet } from '../helpers.js';

const CHEVRON_ICON = 'M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z';

function bound<T>(initial?: T) {
	let value = $state(initial);
	return {
		get value() {
			return value;
		},
		set value(next) {
			value = next;
		}
	};
}

function withBound<T extends object>(props: T, bindings: Record<string, { value: unknown }>) {
	for (const [key, state] of Object.entries(bindings))
		Object.defineProperty(props, key, {
			enumerable: true,
			configurable: true,
			get: () => state.value,
			set: (value) => (state.value = value)
		});
	return props;
}

function snippetOf<T>(markup: (params: T) => string) {
	return createRawSnippet<[T]>((params) => ({ render: () => markup(params()) }));
}

function rootOf(container: HTMLElement) {
	return container.querySelector<HTMLElement>('.aurora-year-picker-text-field')!;
}

function makeForm() {
	const form = document.createElement('form');
	const onsubmit = vi.fn((event: SubmitEvent) => event.preventDefault());
	form.addEventListener('submit', onsubmit);
	document.body.append(form);
	return { form, onsubmit };
}

const optionYears = () =>
	[...document.querySelectorAll('[role="option"]')].map((option) => Number(option.textContent));

describe('YearPickerTextField', () => {
	test('is a labelled combobox that opens a listbox, with a chevron at the end', async () => {
		const screen = await render(YearPickerTextField, { label: 'Model year' });
		const input = screen.getByRole('combobox', { name: 'Model year' });
		await expect.element(input).toHaveAttribute('type', 'text');
		await expect.element(input).toHaveAttribute('inputmode', 'numeric');
		await expect.element(input).toHaveAttribute('maxlength', '4');
		await expect.element(input).toHaveAttribute('aria-haspopup', 'listbox');
		await expect.element(input).toHaveAttribute('aria-expanded', 'false');
		await expect.element(input).not.toHaveAttribute('aria-controls');
		await expect.element(input).not.toHaveAttribute('name');
		expect(screen.getByLabelText('Model year').element()).toBe(input.element());
		const chevron = rootOf(screen.container).querySelector('.aurora-year-picker-text-field-chevron');
		expect(chevron?.querySelector('path')?.getAttribute('d')).toBe(CHEVRON_ICON);
		expect(chevron).toHaveAttribute('aria-hidden', 'true');
	});

	test('typing keeps four digits, sets selectedYear and calls onchange({ year })', async () => {
		const onchange = vi.fn();
		const year = bound<number>();
		const screen = await render(
			YearPickerTextField,
			withBound({ label: 'Year', onchange }, { selectedYear: year })
		);
		const input = screen.getByRole('combobox');
		await input.click();
		await userEvent.keyboard('2a0b2');
		await expect.element(input).toHaveValue('202');
		expect(onchange).not.toHaveBeenCalled();
		await userEvent.keyboard('c6');
		await expect.element(input).toHaveValue('2026');
		expect(year.value).toBe(2026);
		expect(onchange).toHaveBeenCalledExactlyOnceWith({ year: 2026 });
		expect(onchange.mock.calls[0][0]).not.toHaveProperty('detail');
		await expect
			.element(screen.getByRole('option', { name: '2026' }))
			.toHaveAttribute('aria-selected', 'true');

		await userEvent.keyboard('{Backspace}');
		await expect.element(input).toHaveValue('202');
		expect(year.value).toBeUndefined();
		expect(onchange).toHaveBeenLastCalledWith({ year: undefined });
	});

	test('pasted text keeps its digits', async () => {
		const year = bound<number>();
		const screen = await render(YearPickerTextField, withBound({ label: 'Year' }, { selectedYear: year }));
		const input = screen.getByRole('combobox');
		const element = input.element() as HTMLInputElement;
		element.value = 'y 1985';
		element.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertFromPaste' }));
		await expect.element(input).toHaveValue('1985');
		expect(year.value).toBe(1985);
	});

	test('a year outside min and max is an error with invalidText and a custom validity', async () => {
		const { form, onsubmit } = makeForm();
		const year = bound<number>();
		const screen = await render(YearPickerTextField, {
			target: form,
			props: withBound({ label: 'Year', hint: 'Year of the model' }, { selectedYear: year })
		});
		const input = screen.getByRole('combobox');
		const root = rootOf(screen.container);
		await expect.element(input).toHaveAccessibleDescription('Year of the model');
		for (const text of ['1899', '2101']) {
			await userEvent.fill(input, text);
			await expect.element(input).toHaveAttribute('aria-invalid', 'true');
			expect(root).toHaveAttribute('data-state', 'error');
			expect(year.value).toBeUndefined();
			await expect.element(input).toHaveAccessibleDescription('Enter a valid year');
		}
		const element = input.element() as HTMLInputElement;
		expect(element.validationMessage).toBe('Enter a valid year');
		const oninvalid = vi.fn((event: Event) => event.preventDefault());
		form.addEventListener('invalid', oninvalid, true);
		form.requestSubmit();
		expect(onsubmit).not.toHaveBeenCalled();
		expect(oninvalid).toHaveBeenCalledOnce();

		await userEvent.fill(input, '1900');
		await expect.element(input).not.toHaveAttribute('aria-invalid');
		expect(root).not.toHaveAttribute('data-state');
		expect(year.value).toBe(1900);
		expect(element.validity.valid).toBe(true);
		form.requestSubmit();
		expect(onsubmit).toHaveBeenCalledOnce();
		form.remove();
	});

	test('min and max limit the typed year and the grid; invalidText changes the message', async () => {
		const screen = await render(YearPickerTextField, {
			label: 'Year',
			min: 2000,
			max: 2030,
			invalidText: 'From 2000 to 2030'
		});
		const input = screen.getByRole('combobox');
		await userEvent.fill(input, '2031');
		await expect.element(input).toHaveAttribute('aria-invalid', 'true');
		await expect.element(screen.getByText('From 2000 to 2030')).toBeVisible();
		await userEvent.fill(input, '1999');
		await expect.element(input).toHaveAttribute('aria-invalid', 'true');
		await userEvent.fill(input, '2030');
		await expect.element(input).not.toHaveAttribute('aria-invalid');
		await expect.poll(optionYears).toHaveLength(31);
		expect(optionYears()[0]).toBe(2000);
		expect(optionYears().at(-1)).toBe(2030);
	});

	test('an unfinished year is an error only after the field loses focus', async () => {
		const screen = await render(YearPickerTextField, { label: 'Year' });
		const input = screen.getByRole('combobox');
		await input.click();
		await userEvent.keyboard('20');
		await expect.element(input).not.toHaveAttribute('aria-invalid');
		expect(rootOf(screen.container)).not.toHaveAttribute('data-state');
		(input.element() as HTMLInputElement).blur();
		await expect.element(input).toHaveAttribute('aria-invalid', 'true');
		expect(rootOf(screen.container)).toHaveAttribute('data-state', 'error');
		await expect.element(screen.getByText('Enter a valid year')).toBeVisible();
	});

	test('the state prop overrides the computed state', async () => {
		const screen = await render(YearPickerTextField, {
			label: 'Year',
			hint: 'Checked',
			state: 'success'
		});
		const input = screen.getByRole('combobox');
		const root = rootOf(screen.container);
		await userEvent.fill(input, '1800');
		expect(root).toHaveAttribute('data-state', 'success');
		await expect.element(screen.getByText('Checked')).toBeVisible();
		await expect.element(screen.getByText('Enter a valid year')).not.toBeInTheDocument();
		expect(root.querySelector('.aurora-year-picker-text-field-state-icon')).not.toBeNull();

		await screen.rerender({ state: 'error', hint: 'Required' });
		expect(root).toHaveAttribute('data-state', 'error');
		await expect.element(input).toHaveAttribute('aria-invalid', 'true');
		await expect.element(screen.getByText('Required')).toBeVisible();
	});

	test('selectedYear set from outside updates the text', async () => {
		const year = bound<number | undefined>(2026);
		const screen = await render(YearPickerTextField, withBound({ label: 'Year' }, { selectedYear: year }));
		const input = screen.getByRole('combobox');
		await expect.element(input).toHaveValue('2026');
		year.value = 1999;
		await expect.element(input).toHaveValue('1999');
	});

	test('v4 bug: the text is cleared when selectedYear becomes undefined from outside', async () => {
		const year = bound<number | undefined>(2026);
		const screen = await render(YearPickerTextField, withBound({ label: 'Year' }, { selectedYear: year }));
		const input = screen.getByRole('combobox');
		await expect.element(input).toHaveValue('2026');
		year.value = undefined;
		await expect.element(input).toHaveValue('');

		await userEvent.fill(input, '2024');
		expect(year.value).toBe(2024);
		year.value = undefined;
		await expect.element(input).toHaveValue('');
		await expect.element(input).not.toHaveAttribute('aria-invalid');
	});

	describe('desktop menu', () => {
		test('focus opens a listbox of years controlled by the input', async () => {
			const screen = await render(YearPickerTextField, { label: 'Year', selectedYear: 2026 });
			const input = screen.getByRole('combobox', { name: 'Year' });
			await userEvent.keyboard('{Tab}');
			await expect.element(input).toHaveFocus();
			await expect.element(input).toHaveAttribute('aria-expanded', 'true');
			const listbox = screen.getByRole('listbox', { name: 'Year' });
			await expect.element(listbox).toBeVisible();
			expect(listbox.element().closest('.aurora-menu')?.matches(':popover-open')).toBe(true);
			await expect.element(input).toHaveAttribute('aria-controls', listbox.element().id);
			await expect
				.element(screen.getByRole('option', { name: '2026' }))
				.toHaveAttribute('aria-selected', 'true');
			expect(rootOf(screen.container)).toHaveAttribute('data-open');
			await expect.element(input).toHaveFocus();
		});

		test('a click on the input opens it; without label the listbox is named by openLabel', async () => {
			const screen = await render(YearPickerTextField, { openLabel: 'Pick a year' });
			const input = screen.getByRole('combobox');
			await input.click();
			await expect.element(screen.getByRole('listbox', { name: 'Pick a year' })).toBeVisible();
			await userEvent.keyboard('{Escape}');
			await expect.element(input).toHaveAttribute('aria-expanded', 'false');
			await expect.element(input).toHaveFocus();
			await input.click();
			await expect.element(input).toHaveAttribute('aria-expanded', 'true');
		});

		test('Arrow Down moves the focus to the selected year; Escape closes and returns the focus', async () => {
			const screen = await render(YearPickerTextField, { label: 'Year', selectedYear: 2026 });
			const input = screen.getByRole('combobox');
			await userEvent.keyboard('{Tab}{Escape}');
			await expect.element(input).toHaveAttribute('aria-expanded', 'false');
			await userEvent.keyboard('{ArrowDown}');
			await expect.element(input).toHaveAttribute('aria-expanded', 'true');
			await expect.element(screen.getByRole('option', { name: '2026' })).toHaveFocus();
			await userEvent.keyboard('{Escape}');
			await expect.element(screen.getByRole('listbox')).not.toBeInTheDocument();
			await expect.element(input).toHaveFocus();
			await new Promise((resolve) => setTimeout(resolve, 100));
			await expect.element(input).toHaveAttribute('aria-expanded', 'false');
		});

		test('choosing a year with the keyboard closes and returns the focus to the input', async () => {
			const onchange = vi.fn();
			const screen = await render(YearPickerTextField, { label: 'Year', selectedYear: 2026, onchange });
			const input = screen.getByRole('combobox');
			await input.click();
			await userEvent.keyboard('{ArrowDown}');
			await expect.element(screen.getByRole('option', { name: '2026' })).toHaveFocus();
			await userEvent.keyboard('{ArrowRight}');
			await expect.element(screen.getByRole('option', { name: '2027' })).toHaveFocus();
			await userEvent.keyboard('{Enter}');
			await expect.element(input).toHaveValue('2027');
			await expect.element(input).toHaveFocus();
			await expect.element(input).toHaveAttribute('aria-expanded', 'false');
			expect(onchange).toHaveBeenCalledExactlyOnceWith({ year: 2027 });
		});

		test('a click on a year chooses it, closes the menu and keeps the focus', async () => {
			const year = bound<number>(2026);
			const screen = await render(YearPickerTextField, withBound({ label: 'Year' }, { selectedYear: year }));
			const input = screen.getByRole('combobox');
			await input.click();
			await screen.getByRole('option', { name: '2028' }).click();
			await expect.element(input).toHaveValue('2028');
			expect(year.value).toBe(2028);
			await expect.element(screen.getByRole('listbox')).not.toBeInTheDocument();
			await expect.element(input).toHaveFocus();
		});

		test('choosing a year replaces an invalid typed text', async () => {
			const screen = await render(YearPickerTextField, { label: 'Year', selectedYear: 2026 });
			const input = screen.getByRole('combobox');
			await userEvent.fill(input, '2');
			await screen.getByRole('option', { name: '2026' }).click();
			await expect.element(input).toHaveValue('2026');
			await expect.element(input).not.toHaveAttribute('aria-invalid');
		});

		test('closeOnSelect={false} keeps the menu open', async () => {
			const screen = await render(YearPickerTextField, {
				label: 'Year',
				selectedYear: 2026,
				closeOnSelect: false
			});
			const input = screen.getByRole('combobox');
			await input.click();
			await screen.getByRole('option', { name: '2028' }).click();
			await expect.element(input).toHaveValue('2028');
			await new Promise((resolve) => setTimeout(resolve, 100));
			await expect.element(input).toHaveAttribute('aria-expanded', 'true');
		});

		test('Enter in the input closes the menu without submitting the form', async () => {
			const { form, onsubmit } = makeForm();
			form.append(document.createElement('button'));
			const screen = await render(YearPickerTextField, { target: form, props: { label: 'Year' } });
			const input = screen.getByRole('combobox');
			await input.click();
			await expect.element(input).toHaveAttribute('aria-expanded', 'true');
			await userEvent.keyboard('{Enter}');
			await expect.element(input).toHaveAttribute('aria-expanded', 'false');
			expect(onsubmit).not.toHaveBeenCalled();
			form.remove();
		});

		test('Tab closes the menu and moves on', async () => {
			const screen = await render(YearPickerTextField, { label: 'Year', selectedYear: 2026 });
			const after = document.createElement('button');
			after.textContent = 'After';
			screen.container.append(after);
			const input = screen.getByRole('combobox');
			await input.click();
			await expect.element(input).toHaveAttribute('aria-expanded', 'true');
			await userEvent.keyboard('{Tab}');
			await expect.element(screen.getByRole('button', { name: 'After' })).toHaveFocus();
			await expect.element(input).toHaveAttribute('aria-expanded', 'false');
			await expect.element(screen.getByRole('listbox')).not.toBeInTheDocument();
		});

		test('reopening while the menu is closing leaves it usable', async () => {
			const target = document.createElement('div');
			target.style.setProperty('--menu-duration', '1s');
			document.body.append(target);
			const screen = await render(YearPickerTextField, {
				target,
				props: { label: 'Year', selectedYear: 2026 }
			});
			const input = screen.getByRole('combobox');
			await input.click();
			await expect.element(screen.getByRole('listbox')).toBeVisible();
			await userEvent.keyboard('{Enter}');
			await expect.element(input).toHaveAttribute('aria-expanded', 'false');
			await userEvent.keyboard('{ArrowDown}');
			await expect.element(screen.getByRole('option', { name: '2026' })).toHaveFocus();
			expect(target.querySelector('.aurora-menu')).not.toHaveAttribute('inert');
			target.remove();
		});

		test('the calendar button toggles the menu and keeps the focus on the input', async () => {
			const screen = await render(YearPickerTextField, { label: 'Year' });
			const input = screen.getByRole('combobox');
			const toggle = screen.getByRole('button', { name: 'Choose year' });
			await expect.element(toggle).toHaveAttribute('type', 'button');
			await expect.element(toggle).toHaveAttribute('tabindex', '-1');
			await expect.element(toggle).toHaveAttribute('aria-haspopup', 'listbox');
			await toggle.click();
			await expect.element(input).toHaveAttribute('aria-expanded', 'true');
			const listbox = screen.getByRole('listbox', { name: 'Year' });
			await expect.element(toggle).toHaveAttribute('aria-controls', listbox.element().id);
			await expect.element(input).toHaveFocus();
			await toggle.click();
			await expect.element(input).toHaveAttribute('aria-expanded', 'false');
			await expect.element(listbox).not.toBeInTheDocument();
		});

		test('bind:open follows the menu and opens it from outside', async () => {
			const open = bound(false);
			const screen = await render(YearPickerTextField, withBound({ label: 'Year' }, { open }));
			const input = screen.getByRole('combobox');
			await input.click();
			await expect.poll(() => open.value).toBe(true);
			await userEvent.keyboard('{Escape}');
			await expect.poll(() => open.value).toBe(false);
			open.value = true;
			await expect.element(screen.getByRole('listbox')).toBeVisible();
			open.value = false;
			await expect.element(screen.getByRole('listbox')).not.toBeInTheDocument();
		});

		test('v4 bug: openingId is gone; every field has its own ids and menu', async () => {
			const first = await render(YearPickerTextField, { label: 'First' });
			const second = await render(YearPickerTextField, { label: 'Second' });
			const ids = [first, second].flatMap((screen) =>
				[...screen.container.querySelectorAll('[id]')].map((element) => element.id)
			);
			expect(new Set(ids).size).toBe(ids.length);
			const a = first.getByRole('combobox', { name: 'First' });
			const b = second.getByRole('combobox', { name: 'Second' });
			await a.click();
			await expect.element(first.getByRole('listbox', { name: 'First' })).toBeVisible();
			const controls = a.element().getAttribute('aria-controls');
			(b.element() as HTMLInputElement).focus();
			await expect.element(b).toHaveAttribute('aria-expanded', 'true');
			await expect.element(second.getByRole('listbox', { name: 'Second' })).toBeVisible();
			expect(b.element().getAttribute('aria-controls')).not.toBe(controls);
			expect(b.element().getAttribute('aria-controls')).toBe(
				second.getByRole('listbox', { name: 'Second' }).element().id
			);
		});
	});

	describe('mobile', () => {
		test('the calendar button opens a modal bottom drawer; choosing a year closes it', async () => {
			await page.viewport(800, 700);
			try {
				const onchange = vi.fn();
				const screen = await render(YearPickerTextField, {
					label: 'Year',
					selectedYear: 2026,
					onchange
				});
				const input = screen.getByRole('combobox', { name: 'Year' });
				await input.click();
				await new Promise((resolve) => setTimeout(resolve, 100));
				await expect.element(input).toHaveAttribute('aria-expanded', 'false');
				await expect.element(screen.getByRole('dialog')).not.toBeInTheDocument();

				await screen.getByRole('button', { name: 'Choose year' }).click();
				const drawer = screen.getByRole('dialog', { name: 'Year' });
				await expect.element(drawer).toBeVisible();
				expect(drawer.element().tagName).toBe('DIALOG');
				expect(drawer.element().matches(':modal')).toBe(true);
				expect(drawer.element()).toHaveAttribute('data-position', 'bottom');
				await expect.element(drawer.getByRole('option', { name: '2026' })).toHaveFocus();

				await userEvent.keyboard('{ArrowRight}{Enter}');
				await expect.element(drawer).not.toBeInTheDocument();
				await expect.element(input).toHaveValue('2027');
				expect(onchange).toHaveBeenCalledExactlyOnceWith({ year: 2027 });
			} finally {
				await page.viewport(1280, 800);
			}
		});

		test('drawerTitle names the drawer, whose close button closes it without a change', async () => {
			await page.viewport(800, 700);
			try {
				const onchange = vi.fn();
				const screen = await render(YearPickerTextField, {
					label: 'Year',
					drawerTitle: 'Model year',
					closeLabel: 'Done',
					selectedYear: 2026,
					onchange
				});
				await screen.getByRole('button', { name: 'Choose year' }).click();
				const drawer = screen.getByRole('dialog', { name: 'Model year' });
				await expect.element(drawer).toBeVisible();
				await drawer.getByRole('button', { name: 'Done' }).click();
				await expect.element(drawer).not.toBeInTheDocument();
				await expect.element(screen.getByRole('combobox')).toHaveValue('2026');
				expect(onchange).not.toHaveBeenCalled();
			} finally {
				await page.viewport(1280, 800);
			}
		});

		test('v4 bug: the drawer respects min and max', async () => {
			await page.viewport(800, 700);
			try {
				const screen = await render(YearPickerTextField, {
					label: 'Year',
					min: 1990,
					max: 2030,
					selectedYear: 2000
				});
				await screen.getByRole('button', { name: 'Choose year' }).click();
				const drawer = screen.getByRole('dialog', { name: 'Year' });
				await expect.element(drawer.getByRole('option', { name: '2000' })).toHaveFocus();
				const years = optionYears();
				expect(years).toHaveLength(41);
				expect(years[0]).toBe(1990);
				expect(years.at(-1)).toBe(2030);
			} finally {
				await page.viewport(1280, 800);
			}
		});
	});

	test('clearable shows a Clear button that empties the year and calls onchange', async () => {
		const onchange = vi.fn();
		const year = bound<number>(2026);
		const screen = await render(
			YearPickerTextField,
			withBound({ label: 'Year', clearable: true, clearLabel: 'Remove year', onchange }, { selectedYear: year })
		);
		const input = screen.getByRole('combobox');
		const clear = screen.getByRole('button', { name: 'Remove year' });
		await expect.element(clear).toHaveAttribute('type', 'button');
		await clear.click();
		await expect.element(input).toHaveValue('');
		expect(year.value).toBeUndefined();
		expect(onchange).toHaveBeenCalledExactlyOnceWith({ year: undefined });
		await expect.element(input).toHaveFocus();
		await expect.element(clear).not.toBeInTheDocument();

		await userEvent.keyboard('20');
		await screen.getByRole('button', { name: 'Remove year' }).click();
		await expect.element(input).toHaveValue('');
		expect(onchange).toHaveBeenCalledOnce();
	});

	test('disabled blocks opening and editing', async () => {
		const screen = await render(YearPickerTextField, {
			label: 'Year',
			disabled: true,
			clearable: true,
			selectedYear: 2026
		});
		const input = screen.getByRole('combobox');
		const root = rootOf(screen.container);
		await expect.element(input).toBeDisabled();
		await expect.element(screen.getByRole('button', { name: 'Choose year' })).toBeDisabled();
		await expect.element(screen.getByRole('button', { name: 'Clear' })).not.toBeInTheDocument();
		expect(root).toHaveAttribute('data-disabled');
		await userEvent.click(root.querySelector('.aurora-year-picker-text-field-control')!);
		await screen.getByRole('button', { name: 'Choose year' }).click({ force: true });
		await userEvent.keyboard('{Tab}');
		await expect.element(input).not.toHaveFocus();
		await expect.element(input).toHaveAttribute('aria-expanded', 'false');
		await expect.element(screen.getByRole('listbox')).not.toBeInTheDocument();
	});

	test('readonly shows the year but blocks opening and editing', async () => {
		const onchange = vi.fn();
		const screen = await render(YearPickerTextField, {
			label: 'Year',
			readonly: true,
			clearable: true,
			selectedYear: 2026,
			onchange
		});
		const input = screen.getByRole('combobox');
		await expect.element(input).toHaveAttribute('readonly');
		expect(rootOf(screen.container)).toHaveAttribute('data-readonly');
		await expect.element(screen.getByRole('button', { name: 'Choose year' })).toBeDisabled();
		await expect.element(screen.getByRole('button', { name: 'Clear' })).not.toBeInTheDocument();
		await input.click();
		await userEvent.keyboard('{ArrowDown}1');
		await expect.element(input).toHaveValue('2026');
		await expect.element(input).toHaveAttribute('aria-expanded', 'false');
		await expect.element(screen.getByRole('listbox')).not.toBeInTheDocument();
		expect(onchange).not.toHaveBeenCalled();
	});

	test('name submits the year in a hidden input, empty without a year; required reaches the input', async () => {
		const { form } = makeForm();
		const screen = await render(YearPickerTextField, {
			target: form,
			props: { label: 'Year', name: 'year', required: true }
		});
		const input = screen.getByRole('combobox');
		await expect.element(input).toBeRequired();
		expect([...new FormData(form).entries()]).toEqual([['year', '']]);
		await userEvent.fill(input, '2026');
		expect([...new FormData(form).entries()]).toEqual([['year', '2026']]);
		form.remove();
	});

	test('id sets the input id, which the label points to', async () => {
		const screen = await render(YearPickerTextField, { label: 'Year', id: 'model-year' });
		await expect.element(screen.getByRole('combobox', { name: 'Year' })).toHaveAttribute('id', 'model-year');
		expect(screen.container.querySelector('label')).toHaveAttribute('for', 'model-year');
	});

	test('native attributes and events reach the input', async () => {
		const handlers = {
			oninput: vi.fn(),
			onfocus: vi.fn(),
			onblur: vi.fn(),
			onclick: vi.fn(),
			onkeydown: vi.fn()
		};
		const screen = await render(YearPickerTextField, {
			label: 'Year',
			title: 'Model year',
			placeholder: 'yyyy',
			'data-testid': 'year',
			'aria-describedby': 'external',
			...handlers
		});
		const input = screen.getByTestId('year');
		await expect.element(input).toHaveAttribute('title', 'Model year');
		await expect.element(input).toHaveAttribute('placeholder', 'yyyy');
		await expect.element(input).toHaveAttribute('aria-describedby', 'external');
		await input.click();
		expect(handlers.onfocus.mock.calls[0][0]).toBeInstanceOf(FocusEvent);
		expect(handlers.onclick.mock.calls[0][0]).toBeInstanceOf(MouseEvent);
		await userEvent.keyboard('1');
		expect(handlers.onkeydown.mock.calls[0][0]).toBeInstanceOf(KeyboardEvent);
		expect(handlers.oninput.mock.calls[0][0]).toBeInstanceOf(Event);
		input.element().blur();
		expect(handlers.onblur.mock.calls[0][0]).toBeInstanceOf(FocusEvent);
	});

	test('the snippets render in their parts', async () => {
		const screen = await render(YearPickerTextField, {
			label: 'Year',
			hint: 'Model year',
			state: 'success',
			selectedYear: 2026,
			clearable: true,
			labelSnippet: snippetOf<{ label: string | undefined }>(({ label }) => `<b>${label} *</b>`),
			hintSnippet: snippetOf<{ hint: string | undefined }>(({ hint }) => `<i>${hint}!</i>`),
			stateIconSnippet: snippetOf<{ state: string }>(({ state }) => `<i data-testid="state">${state}</i>`),
			iconSnippet: snippet('<i data-testid="icon"></i>'),
			chevronSnippet: snippet('<i data-testid="chevron"></i>'),
			prependSnippet: snippet('<i data-testid="prepend"></i>'),
			appendInnerSnippet: snippet('<i data-testid="append-inner"></i>'),
			appendSnippet: snippet('<i data-testid="append"></i>'),
			clearSnippet: snippet('<i data-testid="clear"></i>')
		});
		const root = rootOf(screen.container);
		await expect.element(screen.getByRole('combobox', { name: 'Year *' })).toBeVisible();
		expect(root.querySelector('.aurora-year-picker-text-field-hint')?.textContent?.trim()).toBe('Model year!');
		await expect.element(screen.getByTestId('state')).toHaveTextContent('success');
		expect(screen.getByRole('button', { name: 'Choose year' }).element().querySelector('[data-testid="icon"]')).not.toBeNull();
		expect(root.querySelector('.aurora-year-picker-text-field-chevron')).toBeNull();
		const control = root.querySelector('.aurora-year-picker-text-field-control')!;
		expect(control.querySelector('[data-testid="chevron"]')).not.toBeNull();
		expect(control.querySelector('.aurora-year-picker-text-field-end [data-testid="append-inner"]')).not.toBeNull();
		expect(control.contains(screen.getByTestId('prepend').element())).toBe(false);
		expect(control.contains(screen.getByTestId('append').element())).toBe(false);
		expect(screen.getByRole('button', { name: 'Clear' }).element().querySelector('[data-testid="clear"]')).not.toBeNull();
	});

	test('binds the input element', async () => {
		let input: HTMLInputElement | undefined;
		const screen = await render(YearPickerTextField, {
			label: 'Year',
			get input() {
				return input as HTMLInputElement;
			},
			set input(value) {
				input = value;
			}
		});
		expect(input).toBe(screen.getByRole('combobox').element());
	});

	test('class parts go on their elements', async () => {
		const screen = await render(YearPickerTextField, {
			label: 'Year',
			hint: 'Hint',
			class: {
				container: 'app-container',
				label: 'app-label',
				row: 'app-row',
				field: 'app-field',
				input: 'app-input',
				hint: 'app-hint',
				picker: 'app-picker'
			}
		});
		const root = rootOf(screen.container);
		expect(root).toHaveClass('app-container');
		expect(root.querySelector('label')).toHaveClass('aurora-year-picker-text-field-label', 'app-label');
		expect(root.querySelector('.aurora-year-picker-text-field-row')).toHaveClass('app-row');
		expect(root.querySelector('.aurora-year-picker-text-field-control')).toHaveClass('app-field');
		expect(root.querySelector('.aurora-year-picker-text-field-hint')).toHaveClass('app-hint');
		const input = screen.getByRole('combobox');
		await expect.element(input).toHaveClass('app-input');
		await input.click();
		await expect.element(screen.getByRole('listbox')).toHaveClass('aurora-year-selector', 'app-picker');
	});

	test('exposes its state as data attributes', async () => {
		const screen = await render(YearPickerTextField, { label: 'Year' });
		const root = rootOf(screen.container);
		for (const name of ['data-state', 'data-disabled', 'data-readonly', 'data-open'])
			expect(root).not.toHaveAttribute(name);
		await screen.getByRole('combobox').click();
		await expect.poll(() => root.hasAttribute('data-open')).toBe(true);
		await screen.rerender({ state: 'success', disabled: true });
		expect(root).toHaveAttribute('data-state', 'success');
		expect(root).toHaveAttribute('data-disabled');
	});

	test('instance CSS variables override the defaults', async () => {
		const target = document.createElement('div');
		target.style.cssText = [
			'--global-duration: 0s',
			'--year-picker-text-field-border-color: rgb(1, 2, 3)',
			'--year-picker-text-field-height: 50px',
			'--year-picker-text-field-menu-width: 250px'
		].join(';');
		document.body.append(target);
		const screen = await render(YearPickerTextField, { target, props: { label: 'Year' } });
		const control = target.querySelector('.aurora-year-picker-text-field-control')!;
		expect(getComputedStyle(control).borderTopColor).toBe('rgb(1, 2, 3)');
		expect(getComputedStyle(control).height).toBe('50px');
		await screen.getByRole('combobox').click();
		await expect.element(screen.getByRole('listbox')).toBeVisible();
		const menu = target.querySelector('.aurora-year-picker-text-field-menu')!;
		expect(getComputedStyle(menu).width).toBe('250px');
		target.remove();
	});
});
