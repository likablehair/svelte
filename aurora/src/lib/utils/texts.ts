import { languageOf } from './locale.js';

export interface LibraryTexts {
	dateLetters: string;
	alertBanner: { close: string };
	asyncAutocomplete: {
		searchError: string;
		typeMoreOne: string;
		typeMore: string;
	};
	autocomplete: { loading: string; noResults: string; remove: string; close: string };
	chip: { remove: string };
	circularLoader: { label: string };
	confirmOrCancelButtons: { confirm: string; cancel: string };
	datePicker: { previousMonth: string; nextMonth: string; previousYear: string; nextYear: string };
	datePickerTextField: {
		invalid: string;
		clear: string;
		close: string;
		open: string;
		start: string;
		end: string;
	};
	dateTimePickerTextField: { invalid: string; clear: string; close: string; open: string };
	dialog: { close: string };
	dotsLoader: { label: string };
	drawer: { close: string };
	dropdown: {
		placeholder: string;
		selected: string;
		clear: string;
		close: string;
		noResults: string;
	};
	monthSelector: { label: string };
	noData: { title: string };
	searchBar: { clear: string };
	timePicker: { hours: string; minutes: string; period: string };
	timePickerTextField: { invalid: string; clear: string; close: string; open: string };
	toaster: { close: string; label: string; loading: string; progress: string };
	yearPickerTextField: { invalid: string; clear: string; close: string; open: string };
	yearSelector: { label: string };
}

export const TEXTS_EN: LibraryTexts = {
	dateLetters: 'dmy',
	alertBanner: { close: 'Dismiss' },
	asyncAutocomplete: {
		searchError: "Couldn't load results",
		typeMoreOne: 'Type at least 1 character',
		typeMore: 'Type at least {count} characters'
	},
	autocomplete: { loading: 'Loading…', noResults: 'No results', remove: 'Remove', close: 'Close' },
	chip: { remove: 'Remove' },
	circularLoader: { label: 'Loading' },
	confirmOrCancelButtons: { confirm: 'Save', cancel: 'Cancel' },
	datePicker: {
		previousMonth: 'Previous month',
		nextMonth: 'Next month',
		previousYear: 'Previous year',
		nextYear: 'Next year'
	},
	datePickerTextField: {
		invalid: 'Enter a valid date',
		clear: 'Clear',
		close: 'Close',
		open: 'Choose date',
		start: 'Start date',
		end: 'End date'
	},
	dateTimePickerTextField: {
		invalid: 'Enter a valid date and time',
		clear: 'Clear',
		close: 'Close',
		open: 'Choose date and time'
	},
	dialog: { close: 'Close' },
	dotsLoader: { label: 'Loading' },
	drawer: { close: 'Close' },
	dropdown: {
		placeholder: 'Select',
		selected: '{count} selected',
		clear: 'Clear selection',
		close: 'Close',
		noResults: 'No options'
	},
	monthSelector: { label: 'Month' },
	noData: { title: 'No data available' },
	searchBar: { clear: 'Clear search' },
	timePicker: { hours: 'Hours', minutes: 'Minutes', period: 'AM/PM' },
	timePickerTextField: { invalid: 'Enter a valid time', clear: 'Clear', close: 'Close', open: 'Choose time' },
	toaster: { close: 'Dismiss', label: 'Notifications', loading: 'Loading', progress: 'Progress' },
	yearPickerTextField: { invalid: 'Enter a valid year', clear: 'Clear', close: 'Close', open: 'Choose year' },
	yearSelector: { label: 'Year' }
};

export const TEXTS_IT: LibraryTexts = {
	dateLetters: 'gma',
	alertBanner: { close: 'Chiudi' },
	asyncAutocomplete: {
		searchError: 'Impossibile caricare i risultati',
		typeMoreOne: 'Scrivi almeno 1 carattere',
		typeMore: 'Scrivi almeno {count} caratteri'
	},
	autocomplete: { loading: 'Caricamento…', noResults: 'Nessun risultato', remove: 'Rimuovi', close: 'Chiudi' },
	chip: { remove: 'Rimuovi' },
	circularLoader: { label: 'Caricamento' },
	confirmOrCancelButtons: { confirm: 'Salva', cancel: 'Annulla' },
	datePicker: {
		previousMonth: 'Mese precedente',
		nextMonth: 'Mese successivo',
		previousYear: 'Anno precedente',
		nextYear: 'Anno successivo'
	},
	datePickerTextField: {
		invalid: 'Inserisci una data valida',
		clear: 'Cancella',
		close: 'Chiudi',
		open: 'Scegli la data',
		start: 'Data di inizio',
		end: 'Data di fine'
	},
	dateTimePickerTextField: {
		invalid: "Inserisci una data e un'ora valide",
		clear: 'Cancella',
		close: 'Chiudi',
		open: 'Scegli data e ora'
	},
	dialog: { close: 'Chiudi' },
	dotsLoader: { label: 'Caricamento' },
	drawer: { close: 'Chiudi' },
	dropdown: {
		placeholder: 'Seleziona',
		selected: '{count} selezionati',
		clear: 'Cancella la selezione',
		close: 'Chiudi',
		noResults: 'Nessuna opzione'
	},
	monthSelector: { label: 'Mese' },
	noData: { title: 'Nessun dato disponibile' },
	searchBar: { clear: 'Cancella la ricerca' },
	timePicker: { hours: 'Ore', minutes: 'Minuti', period: 'AM/PM' },
	timePickerTextField: {
		invalid: "Inserisci un'ora valida",
		clear: 'Cancella',
		close: 'Chiudi',
		open: "Scegli l'ora"
	},
	toaster: { close: 'Chiudi', label: 'Notifiche', loading: 'Caricamento', progress: 'Avanzamento' },
	yearPickerTextField: {
		invalid: 'Inserisci un anno valido',
		clear: 'Cancella',
		close: 'Chiudi',
		open: "Scegli l'anno"
	},
	yearSelector: { label: 'Anno' }
};

const BY_LANGUAGE: Record<string, LibraryTexts> = { en: TEXTS_EN, it: TEXTS_IT };

export function libraryTexts(locale: string): LibraryTexts {
	return BY_LANGUAGE[languageOf(locale)] ?? TEXTS_EN;
}

export function formatLetters(format: string, letters: string): string {
	return format.toLowerCase().replace(/[dmy]/g, (letter) => letters['dmy'.indexOf(letter)] ?? letter);
}
