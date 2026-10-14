import type { ChartFormat } from './types.js';

export function valueFormatter(format: ChartFormat | undefined, locale: string): (value: number) => string {
	if (typeof format === 'function') return format;
	const intl = new Intl.NumberFormat(locale, format);
	return (value) => intl.format(value);
}

export function axisFormatter(format: ChartFormat | undefined, locale: string): (value: number) => string {
	if (typeof format === 'function') return format;
	const options: Intl.NumberFormatOptions = { ...format, notation: 'compact', maximumFractionDigits: 1 };
	delete options.minimumFractionDigits;
	delete options.minimumSignificantDigits;
	delete options.maximumSignificantDigits;
	const intl = new Intl.NumberFormat(locale, options);
	return (value) => intl.format(value);
}
