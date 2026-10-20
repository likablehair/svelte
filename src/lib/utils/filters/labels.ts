import { parseISODate } from '../dates.js';
import { languageOf } from '../locale.js';
import {
	holdsMany,
	operatorOf,
	type FilterCondition,
	type FilterField,
	type FilterItem,
	type FilterPeriod,
	type FilterRelative,
	type FilterTimeUnit
} from './model.js';

/** Every text of the filters, to translate them. Pass the ones to change: the others keep the English default. */
export interface FilterLabels {
	filters: string;
	addFilter: string;
	addNestedFilter: string;
	clear: string;
	clearAll: string;
	clearGroup: string;
	where: string;
	and: string;
	or: string;
	searchFields: string;
	noFields: string;
	field: string;
	operator: string;
	value: string;
	apply: string;
	cancel: string;
	remove: string;
	close: string;
	showResults: string;
	editFilter: string;
	removeFilter: string;
	from: string;
	to: string;
	days: string;
	yes: string;
	no: string;
	more: string;
	conditions: string;
	anyOf: string;
	allOf: string;
	addValue: string;
	choose: string;
	search: string;
	amount: string;
	showLess: string;
	/** Text of the list while options load. */
	loading: string;
	/** Text of the list when no option matches. */
	noResults: string;
	/** Text of the list when a search fails. */
	searchError: string;
	/** Text of the list before a search starts; `{count}` is the number of characters. */
	typeMore: string;
	/** Error of a date field with a date that does not exist. */
	invalidDate: string;
	/** Accessible name of the calendar button of a date field. */
	chooseDate: string;
	previousMonth: string;
	nextMonth: string;
	previousYear: string;
	nextYear: string;
	/** Letters of day, month and year in the format hint of date fields: `dmy` shows `dd/mm/yyyy`, `gma` shows `gg/mm/aaaa`. */
	dateLetters: string;
	/** Error of a date and time field with a date or a time that does not exist. */
	invalidDateTime: string;
	/** Accessible name of the calendar button of a date and time field. */
	chooseDateTime: string;
	/** Accessible name of the hours column of a date and time field. */
	hours: string;
	/** Accessible name of the minutes column of a date and time field. */
	minutes: string;
	/** Accessible name of the AM/PM column of a date and time field on a 12-hour clock. */
	amPm: string;
	compareWith: string;
	savedFilters: string;
	saveFilters: string;
	saveAs: string;
	save: string;
	deleteSaved: string;
	noSaved: string;
	unit: string;
	units: Record<FilterTimeUnit, string>;
	operators: Record<string, string>;
	periods: Record<FilterPeriod, string>;
}

/** Texts to change: any of `FilterLabels`, with `operators`, `periods` and `units` partial too. */
export type FilterLabelsInput = Partial<Omit<FilterLabels, 'operators' | 'periods' | 'units'>> & {
	operators?: Partial<Record<string, string>>;
	periods?: Partial<Record<FilterPeriod, string>>;
	units?: Partial<Record<FilterTimeUnit, string>>;
};

/** The English texts of the filters. */
export const DEFAULT_FILTER_LABELS: FilterLabels = {
	filters: 'Filters',
	addFilter: 'Add filter',
	addNestedFilter: 'Add nested filter',
	clear: 'Clear',
	clearAll: 'Clear all',
	clearGroup: 'Clear group',
	where: 'Where',
	and: 'and',
	or: 'or',
	searchFields: 'Search fields',
	noFields: 'No fields',
	field: 'Field',
	operator: 'Operator',
	value: 'Value',
	apply: 'Apply',
	cancel: 'Cancel',
	remove: 'Remove',
	close: 'Close',
	showResults: 'Show results',
	editFilter: 'Edit filter',
	removeFilter: 'Remove filter',
	from: 'From',
	to: 'To',
	days: 'days',
	yes: 'Yes',
	no: 'No',
	more: 'more',
	conditions: 'filters',
	anyOf: 'Any of',
	allOf: 'All of',
	addValue: 'Type and press Enter',
	choose: 'Choose…',
	search: 'Search…',
	amount: 'Amount',
	showLess: 'Show less',
	loading: 'Loading…',
	noResults: 'No results',
	searchError: "Couldn't load results",
	typeMore: 'Type at least {count} characters',
	invalidDate: 'Enter a valid date',
	chooseDate: 'Choose date',
	previousMonth: 'Previous month',
	nextMonth: 'Next month',
	previousYear: 'Previous year',
	nextYear: 'Next year',
	dateLetters: 'dmy',
	invalidDateTime: 'Enter a valid date and time',
	chooseDateTime: 'Choose date and time',
	hours: 'Hours',
	minutes: 'Minutes',
	amPm: 'AM/PM',
	compareWith: 'Column',
	savedFilters: 'Saved filters',
	saveFilters: 'Save current filters',
	saveAs: 'Name',
	save: 'Save',
	deleteSaved: 'Delete saved filters',
	noSaved: 'No saved filters',
	unit: 'Unit',
	units: { minutes: 'minutes', hours: 'hours', days: 'days', weeks: 'weeks', months: 'months', years: 'years' },
	operators: {
		contains: 'contains',
		notContains: "doesn't contain",
		is: 'is',
		isNot: 'is not',
		like: 'like',
		ilike: 'like',
		empty: 'is empty',
		notEmpty: 'is not empty',
		eq: '=',
		ne: '≠',
		gt: '>',
		gte: '≥',
		lt: '<',
		lte: '≤',
		between: 'between',
		before: 'before',
		after: 'after',
		onOrBefore: 'on or before',
		onOrAfter: 'on or after',
		period: 'in',
		inLast: 'in the last',
		inNext: 'in the next',
		in: 'is',
		notIn: 'is not',
		all: 'has all of',
		hasAnyOf: 'has any of',
		hasNoneOf: 'has none of',
		isTrue: 'is',
		isFalse: 'is',
		custom: '',
		startsWith: 'starts with',
		endsWith: 'ends with',
		anyOf: 'is any of',
		noneOf: 'is none of',
		match: 'is',
		notBetween: 'not between',
		olderThan: 'more than … ago',
		laterThan: 'more than … ahead',
		columnEq: '= column',
		columnNe: '≠ column',
		columnGt: '> column',
		columnGte: '≥ column',
		columnLt: '< column',
		columnLte: '≤ column'
	},
	periods: {
		today: 'Today',
		yesterday: 'Yesterday',
		tomorrow: 'Tomorrow',
		thisWeek: 'This week',
		lastWeek: 'Last week',
		nextWeek: 'Next week',
		thisMonth: 'This month',
		lastMonth: 'Last month',
		nextMonth: 'Next month',
		thisQuarter: 'This quarter',
		lastQuarter: 'Last quarter',
		thisYear: 'This year',
		lastYear: 'Last year',
		nextQuarter: 'Next quarter',
		nextYear: 'Next year',
		monthToDate: 'Month to date',
		quarterToDate: 'Quarter to date',
		yearToDate: 'Year to date'
	}
};

/** Italian texts of the filters, ready to pass as `labels` (they are not the default: the library defaults to English). */
export const FILTER_LABELS_IT: FilterLabels = {
	filters: 'Filtri',
	addFilter: 'Aggiungi filtro',
	addNestedFilter: 'Aggiungi filtro nel gruppo',
	clear: 'Azzera',
	clearAll: 'Azzera tutto',
	clearGroup: 'Elimina gruppo',
	where: 'Dove',
	and: 'e',
	or: 'o',
	searchFields: 'Cerca campi',
	noFields: 'Nessun campo',
	field: 'Campo',
	operator: 'Operatore',
	value: 'Valore',
	apply: 'Applica',
	cancel: 'Annulla',
	remove: 'Rimuovi',
	close: 'Chiudi',
	showResults: 'Mostra risultati',
	editFilter: 'Modifica filtro',
	removeFilter: 'Rimuovi filtro',
	from: 'Da',
	to: 'A',
	days: 'giorni',
	yes: 'Sì',
	no: 'No',
	more: 'altri',
	conditions: 'filtri',
	anyOf: 'Almeno uno di',
	allOf: 'Tutti i',
	addValue: 'Scrivi e premi Invio',
	choose: 'Scegli…',
	search: 'Cerca…',
	amount: 'Quantità',
	showLess: 'Mostra meno',
	loading: 'Caricamento…',
	noResults: 'Nessun risultato',
	searchError: 'Impossibile caricare i risultati',
	typeMore: 'Scrivi almeno {count} caratteri',
	invalidDate: 'Inserisci una data valida',
	chooseDate: 'Scegli la data',
	previousMonth: 'Mese precedente',
	nextMonth: 'Mese successivo',
	previousYear: 'Anno precedente',
	nextYear: 'Anno successivo',
	dateLetters: 'gma',
	invalidDateTime: "Inserisci una data e un'ora valide",
	chooseDateTime: 'Scegli data e ora',
	hours: 'Ore',
	minutes: 'Minuti',
	amPm: 'Prima o dopo mezzogiorno',
	compareWith: 'Colonna',
	savedFilters: 'Filtri salvati',
	saveFilters: 'Salva i filtri attuali',
	saveAs: 'Nome',
	save: 'Salva',
	deleteSaved: 'Elimina filtri salvati',
	noSaved: 'Nessun filtro salvato',
	unit: 'Unità',
	units: { minutes: 'minuti', hours: 'ore', days: 'giorni', weeks: 'settimane', months: 'mesi', years: 'anni' },
	operators: {
		contains: 'contiene',
		notContains: 'non contiene',
		is: 'è',
		isNot: 'non è',
		like: 'simile a',
		ilike: 'simile a',
		empty: 'è vuoto',
		notEmpty: 'non è vuoto',
		eq: '=',
		ne: '≠',
		gt: '>',
		gte: '≥',
		lt: '<',
		lte: '≤',
		between: 'tra',
		before: 'prima del',
		after: 'dopo il',
		onOrBefore: 'fino al',
		onOrAfter: 'dal',
		period: 'nel periodo',
		inLast: 'negli ultimi',
		inNext: 'nei prossimi',
		in: 'è',
		notIn: 'non è',
		all: 'li ha tutti',
		hasAnyOf: 'ne ha almeno uno tra',
		hasNoneOf: 'non ne ha nessuno tra',
		isTrue: 'è',
		isFalse: 'è',
		custom: '',
		startsWith: 'inizia con',
		endsWith: 'finisce con',
		anyOf: 'è uno di',
		noneOf: 'non è nessuno di',
		match: 'è',
		notBetween: 'non tra',
		olderThan: 'più di … fa',
		laterThan: 'oltre … da oggi',
		columnEq: '= colonna',
		columnNe: '≠ colonna',
		columnGt: '> colonna',
		columnGte: '≥ colonna',
		columnLt: '< colonna',
		columnLte: '≤ colonna'
	},
	periods: {
		today: 'Oggi',
		yesterday: 'Ieri',
		tomorrow: 'Domani',
		thisWeek: 'Questa settimana',
		lastWeek: 'Settimana scorsa',
		nextWeek: 'Prossima settimana',
		thisMonth: 'Questo mese',
		lastMonth: 'Mese scorso',
		nextMonth: 'Prossimo mese',
		thisQuarter: 'Questo trimestre',
		lastQuarter: 'Trimestre scorso',
		thisYear: "Quest'anno",
		lastYear: 'Anno scorso',
		nextQuarter: 'Prossimo trimestre',
		nextYear: 'Prossimo anno',
		monthToDate: 'Da inizio mese',
		quarterToDate: 'Da inizio trimestre',
		yearToDate: 'Da inizio anno'
	}
};

const BY_LANGUAGE: Record<string, FilterLabels> = { en: DEFAULT_FILTER_LABELS, it: FILTER_LABELS_IT };

/** Every text: those of the language of `locale` (English when the library does not have it), with `labels` on top. */
export function filterLabels(labels: FilterLabelsInput = {}, locale?: string): FilterLabels {
	const base = BY_LANGUAGE[languageOf(locale ?? 'en')] ?? DEFAULT_FILTER_LABELS;
	return {
		...base,
		...labels,
		operators: { ...base.operators, ...labels.operators } as Record<string, string>,
		periods: { ...base.periods, ...labels.periods },
		units: { ...base.units, ...labels.units }
	};
}

const MANY: Record<string, string> = { in: 'hasAnyOf', notIn: 'hasNoneOf' };

export function operatorLabel(field: FilterField, name: string, labels: FilterLabels): string {
	const defined = operatorOf(field, name)?.definition?.label;
	if (defined) return defined;
	const many = holdsMany(field) ? MANY[name] : undefined;
	if (many && labels.operators[many] !== undefined) return labels.operators[many];
	return labels.operators[name] ?? name;
}

export function valueText(
	condition: FilterCondition,
	field: FilterField,
	labels: FilterLabels,
	locale: string
): string {
	if (field.format) return field.format(condition);
	const operator = operatorOf(field, condition.operator);
	const value = condition.value;
	if (!operator) return '';
	const number = (input: unknown) => {
		if (typeof input !== 'number') return '';
		const text = new Intl.NumberFormat(locale).format(input);
		return field.type === 'number' && field.unit ? `${text} ${field.unit}` : text;
	};
	const date = (input: unknown) => {
		const parsed = typeof input === 'string' ? parseISODate(input) : undefined;
		return parsed ? new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(parsed) : '';
	};
	const datetime = (input: unknown) => {
		if (typeof input !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(input)) return '';
		const parsed = parseISODate(input.slice(0, 10));
		if (!parsed) return '';
		parsed.setHours(Number(input.slice(11, 13)), Number(input.slice(14, 16)));
		return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(parsed);
	};
	const list = (format: (input: unknown) => string) => {
		const entries = Array.isArray(value) ? value.map(format).filter(Boolean) : [];
		if (!entries.length) return '';
		return entries.length > 2 ? `${entries.slice(0, 2).join(', ')} +${entries.length - 2}` : entries.join(', ');
	};
	const range = (format: (input: unknown) => string) => {
		const { from, to } = (value ?? {}) as { from?: unknown; to?: unknown };
		const start = format(from);
		const end = format(to);
		if (start && end) return `${start} – ${end}`;
		if (start) return `${labels.from.toLowerCase()} ${start}`;
		return end ? `${labels.to.toLowerCase()} ${end}` : '';
	};
	switch (operator.input) {
		case 'none':
			if (field.type === 'bool')
				return condition.operator === 'isTrue'
					? (field.trueLabel ?? labels.yes)
					: (field.falseLabel ?? labels.no);
			return '';
		case 'text':
			return typeof value === 'string' ? value : '';
		case 'number':
			return number(value);
		case 'numberRange':
			return range(number);
		case 'date':
			return date(value);
		case 'dateRange':
			return range(date);
		case 'days':
			return typeof value === 'number' ? `${value} ${labels.days}` : '';
		case 'texts':
			return list((input) => (typeof input === 'string' ? input : ''));
		case 'numbers':
			return list(number);
		case 'datetime':
			return datetime(value);
		case 'datetimeRange':
			return range(datetime);
		case 'relative': {
			const relative: FilterRelative | undefined =
				typeof value === 'number' ? { amount: value, unit: 'days' } : (value as FilterRelative | undefined);
			return relative && typeof relative.amount === 'number'
				? `${relative.amount} ${labels.units[relative.unit] ?? relative.unit}`
				: '';
		}
		case 'column': {
			const other =
				(field.type === 'number' || field.type === 'date') &&
				field.compareWith?.find((entry) => entry.column === value);
			return other ? other.label : String(value ?? '');
		}
		case 'suggest':
			if (value && typeof value === 'object') return String((value as FilterItem).label ?? (value as FilterItem).value);
			return typeof value === 'string' ? value : '';
		case 'period':
			return labels.periods[value as FilterPeriod] ?? String(value ?? '');
		case 'items': {
			const items = Array.isArray(value) ? (value as FilterItem[]) : [];
			if (!items.length) return '';
			const first = String(items[0].label ?? items[0].value);
			return items.length > 1 ? `${first} +${items.length - 1}` : first;
		}
		case 'custom': {
			if (value === undefined || value === null) return '';
			if (Array.isArray(value))
				return value
					.map((item) => (item && typeof item === 'object' ? ((item as FilterItem).label ?? (item as FilterItem).value) : item))
					.join(', ');
			return typeof value === 'object' ? '' : String(value);
		}
	}
}
