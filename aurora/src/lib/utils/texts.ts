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
	avatar: { online: string; away: string; busy: string; offline: string };
	avatarGroup: { more: string };
	chart: { resetZoom: string };
	chip: { remove: string };
	circularLoader: { label: string };
	columnManager: {
		title: string;
		count: string;
		search: string;
		visible: string;
		reorderHint: string;
		available: string;
		availableCount: string;
		availableCountOne: string;
		results: string;
		resultsOne: string;
		noMatch: string;
		allVisible: string;
		reset: string;
		save: string;
		close: string;
		move: string;
		moveHint: string;
		moved: string;
		pin: string;
		pinTip: string;
		unpinTip: string;
		pinned: string;
		hide: string;
		hideTip: string;
		required: string;
		lastVisible: string;
		add: string;
		typeText: string;
		typeNumber: string;
		typeCurrency: string;
		typePercent: string;
		typeDate: string;
		typeDatetime: string;
		typeBoolean: string;
	};
	confirmOrCancelButtons: { confirm: string; cancel: string };
	dashboardShaper: {
		add: string;
		catalog: string;
		all: string;
		noFit: string;
		size: string;
		addSize: string;
		widget: string;
		move: string;
		moveHint: string;
		resizeHint: string;
		removeHint: string;
		resize: string;
		remove: string;
		schemaHint: string;
		close: string;
		moved: string;
		resized: string;
		removed: string;
		added: string;
	};
	dataTable: {
		search: string;
		columns: string;
		rowsPerPage: string;
		range: string;
		rangeOpen: string;
		loaded: string;
		results: string;
		result: string;
		selected: string;
		selectedOne: string;
		allSelected: string;
		selectAll: string;
		clearSelection: string;
		selectionActions: string;
		moreActions: string;
		loadError: string;
		retry: string;
		loadingMore: string;
	};
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
	fileInput: {
		title: string;
		titleSingle: string;
		or: string;
		browse: string;
		rejectedType: string;
		rejectedSize: string;
		rejectedCount: string;
		rejectedDuplicate: string;
	};
	fileInputList: {
		list: string;
		empty: string;
		remove: string;
		removeFile: string;
		uploading: string;
		done: string;
		error: string;
	};
	globalSearch: {
		label: string;
		placeholder: string;
		dialog: string;
		results: string;
		loading: string;
		noResults: string;
		error: string;
		navigate: string;
		open: string;
		close: string;
		cancel: string;
	};
	hierarchyMenu: { label: string; submenu: string };
	menuOrDrawerOptions: { label: string };
	monthSelector: { label: string };
	noData: { title: string };
	paginator: {
		label: string;
		first: string;
		previous: string;
		next: string;
		last: string;
		page: string;
		status: string;
	};
	period: {
		presets: Record<'today' | 'this-week' | 'this-month' | 'last-3month' | 'last-6month' | 'this-year' | 'total', string>;
		presetsLabel: string;
		rolling: string;
		pickDates: string;
		placeholder: string;
		start: string;
		end: string;
		since: string;
		until: string;
		pickEnd: string;
		pickStart: string;
		invalid: string;
		previousMonth: string;
		nextMonth: string;
		direction: string;
		past: string;
		future: string;
		amount: string;
		unit: string;
		units: Record<'days' | 'weeks' | 'months' | 'years', string>;
		last: Record<'days' | 'weeks' | 'months' | 'years', string>;
		lastOne: Record<'days' | 'weeks' | 'months' | 'years', string>;
		next: Record<'days' | 'weeks' | 'months' | 'years', string>;
		nextOne: Record<'days' | 'weeks' | 'months' | 'years', string>;
		previousPeriod: string;
		nextPeriod: string;
		open: string;
		cancel: string;
		apply: string;
	};
	searchBar: { clear: string };
	sidebarLayout: { menu: string; sidebar: string; skip: string };
	table: {
		selectAll: string;
		selectAllShort: string;
		selectRow: string;
		row: string;
		expand: string;
		collapse: string;
		actions: string;
		resize: string;
		info: string;
		open: string;
		loading: string;
		yes: string;
		no: string;
		sortBy: string;
		unsorted: string;
		moreFields: string;
		fewerFields: string;
		ascending: string;
		descending: string;
	};
	timePicker: { hours: string; minutes: string; period: string };
	timePickerTextField: { invalid: string; clear: string; close: string; open: string };
	timeline: { empty: string; done: string; current: string; upcoming: string };
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
	avatar: { online: 'Online', away: 'Away', busy: 'Busy', offline: 'Offline' },
	avatarGroup: { more: '{count} more' },
	chart: { resetZoom: 'Reset zoom' },
	chip: { remove: 'Remove' },
	circularLoader: { label: 'Loading' },
	columnManager: {
		title: 'Table columns',
		count: '{visible} of {total} columns visible',
		search: 'Search by name, type or description…',
		visible: 'Visible',
		reorderHint: 'drag to reorder',
		available: 'Available',
		availableCount: '{count} available',
		availableCountOne: '1 available',
		results: '{count} results',
		resultsOne: '1 result',
		noMatch: 'No column matches “{query}”',
		allVisible: 'Every column is visible',
		reset: 'Reset',
		save: 'Save view',
		close: 'Close',
		move: 'Move {column}',
		moveHint: 'Up and down arrows to move it',
		moved: '{column}, position {position} of {count}',
		pin: 'Pin {column}',
		pinTip: 'Pin to the left',
		unpinTip: 'Unpin',
		pinned: 'Pinned',
		hide: 'Hide {column}',
		hideTip: 'Hide',
		required: 'Always visible',
		lastVisible: 'At least one column stays visible',
		add: 'Add {column}',
		typeText: 'Text',
		typeNumber: 'Number',
		typeCurrency: 'Currency',
		typePercent: 'Percentage',
		typeDate: 'Date',
		typeDatetime: 'Date and time',
		typeBoolean: 'Yes/No'
	},
	confirmOrCancelButtons: { confirm: 'Save', cancel: 'Cancel' },
	dashboardShaper: {
		add: 'Add widget',
		catalog: 'Add widget',
		all: 'All',
		noFit: 'No widget fits this space',
		size: '{width} × {height}',
		addSize: 'Add {title}, {width} × {height}',
		widget: '{title}, {width} × {height}',
		move: 'Arrange {title}',
		moveHint: 'Arrow keys move the widget.',
		resizeHint: 'Shift and arrow keys change its size.',
		removeHint: 'Delete removes it.',
		resize: 'Resize {title}',
		remove: 'Remove {title}',
		schemaHint: 'Tap a widget to select it, then drag it, resize it from its corner or remove it. Holding it drags it too.',
		close: 'Close',
		moved: '{title} moved to row {row}, column {column}',
		resized: '{title} resized to {width} × {height}',
		removed: '{title} removed',
		added: '{title} added'
	},
	dataTable: {
		search: 'Search…',
		columns: 'Columns',
		rowsPerPage: 'Rows per page',
		range: '{from}–{to} of {total}',
		rangeOpen: '{from}–{to}',
		loaded: '{count} of {total}',
		results: '{count} results',
		result: '1 result',
		selected: 'selected',
		selectedOne: 'selected',
		allSelected: 'All selected',
		selectAll: 'Select all {total}',
		clearSelection: 'Clear selection',
		selectionActions: 'Actions on the selected rows',
		moreActions: 'More actions',
		loadError: "Couldn't load the rows",
		retry: 'Retry',
		loadingMore: 'Loading more rows…'
	},
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
	fileInput: {
		title: 'Drop files here',
		titleSingle: 'Drop a file here',
		or: 'or',
		browse: 'browse your files',
		rejectedType: '{name}: file type not allowed',
		rejectedSize: '{name}: larger than {size}',
		rejectedCount: '{name}: no more than {count} files',
		rejectedDuplicate: '{name}: already added'
	},
	fileInputList: {
		list: 'Files',
		empty: 'No files',
		remove: 'Remove',
		removeFile: 'Remove {name}',
		uploading: 'Uploading {name}',
		done: 'Uploaded',
		error: 'Upload failed'
	},
	globalSearch: {
		label: 'Search',
		placeholder: 'Search…',
		dialog: 'Search',
		results: 'Results',
		loading: 'Searching…',
		noResults: 'No results for “{text}”',
		error: 'The search failed. Try again.',
		navigate: 'navigate',
		open: 'open',
		close: 'close',
		cancel: 'Cancel'
	},
	hierarchyMenu: { label: 'Menu', submenu: '{label} submenu' },
	menuOrDrawerOptions: { label: 'Actions' },
	monthSelector: { label: 'Month' },
	noData: { title: 'No data available' },
	paginator: {
		label: 'Pagination',
		first: 'First page',
		previous: 'Previous page',
		next: 'Next page',
		last: 'Last page',
		page: 'Page {page}',
		status: 'Page {page} of {count}'
	},
	period: {
		presets: {
			today: 'Today',
			'this-week': 'This week',
			'this-month': 'This month',
			'last-3month': 'Last 3 months',
			'last-6month': 'Last 6 months',
			'this-year': 'This year',
			total: 'All time'
		},
		presetsLabel: 'Periods',
		rolling: 'Relative period',
		pickDates: 'Choose dates on the calendar',
		placeholder: 'Select a period',
		start: 'Start',
		end: 'End',
		since: 'From {date}',
		until: 'Until {date}',
		pickEnd: 'Pick the end date',
		pickStart: 'Pick the start date',
		invalid: 'Enter a valid date',
		previousMonth: 'Previous month',
		nextMonth: 'Next month',
		direction: 'Direction',
		past: 'In the past',
		future: 'In the future',
		amount: 'How many',
		unit: 'Unit',
		units: { days: 'Days', weeks: 'Weeks', months: 'Months', years: 'Years' },
		last: { days: 'Last {n} days', weeks: 'Last {n} weeks', months: 'Last {n} months', years: 'Last {n} years' },
		lastOne: { days: 'Last day', weeks: 'Last week', months: 'Last month', years: 'Last year' },
		next: { days: 'Next {n} days', weeks: 'Next {n} weeks', months: 'Next {n} months', years: 'Next {n} years' },
		nextOne: { days: 'Next day', weeks: 'Next week', months: 'Next month', years: 'Next year' },
		previousPeriod: 'Previous period',
		nextPeriod: 'Next period',
		open: 'Choose period',
		cancel: 'Cancel',
		apply: 'Apply'
	},
	searchBar: { clear: 'Clear search' },
	sidebarLayout: { menu: 'Menu', sidebar: 'Sidebar', skip: 'Skip to content' },
	table: {
		selectAll: 'Select all rows',
		selectAllShort: 'Select all',
		selectRow: 'Select {row}',
		row: 'row {index}',
		expand: 'Show details',
		collapse: 'Hide details',
		actions: 'Actions',
		resize: 'Resize {column}',
		info: 'About {column}',
		open: 'Open',
		loading: 'Loading',
		yes: 'Yes',
		no: 'No',
		sortBy: 'Sort by',
		unsorted: 'Not sorted',
		moreFields: 'Show {count} more fields',
		fewerFields: 'Show fewer fields',
		ascending: '{column}, ascending',
		descending: '{column}, descending'
	},
	timePicker: { hours: 'Hours', minutes: 'Minutes', period: 'AM/PM' },
	timePickerTextField: { invalid: 'Enter a valid time', clear: 'Clear', close: 'Close', open: 'Choose time' },
	timeline: { empty: 'No events yet', done: 'Completed', current: 'In progress', upcoming: 'Upcoming' },
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
	avatar: { online: 'Online', away: 'Assente', busy: 'Occupato', offline: 'Offline' },
	avatarGroup: { more: 'Altri {count}' },
	chart: { resetZoom: 'Reimposta zoom' },
	chip: { remove: 'Rimuovi' },
	circularLoader: { label: 'Caricamento' },
	columnManager: {
		title: 'Colonne della tabella',
		count: '{visible} di {total} colonne visibili',
		search: 'Cerca per nome, tipo o descrizione…',
		visible: 'Visibili',
		reorderHint: 'trascina per riordinare',
		available: 'Da aggiungere',
		availableCount: '{count} disponibili',
		availableCountOne: '1 disponibile',
		results: '{count} risultati',
		resultsOne: '1 risultato',
		noMatch: 'Nessuna colonna corrisponde a “{query}”',
		allVisible: 'Tutte le colonne sono visibili',
		reset: 'Ripristina',
		save: 'Salva vista',
		close: 'Chiudi',
		move: 'Sposta {column}',
		moveHint: 'Frecce su e giù per spostarla',
		moved: '{column}, posizione {position} di {count}',
		pin: 'Fissa {column}',
		pinTip: 'Fissa a sinistra',
		unpinTip: 'Non fissare',
		pinned: 'Fissata',
		hide: 'Nascondi {column}',
		hideTip: 'Nascondi',
		required: 'Sempre visibile',
		lastVisible: 'Resta visibile almeno una colonna',
		add: 'Aggiungi {column}',
		typeText: 'Testo',
		typeNumber: 'Numero',
		typeCurrency: 'Valuta',
		typePercent: 'Percentuale',
		typeDate: 'Data',
		typeDatetime: 'Data e ora',
		typeBoolean: 'Sì/No'
	},
	confirmOrCancelButtons: { confirm: 'Salva', cancel: 'Annulla' },
	dashboardShaper: {
		add: 'Aggiungi widget',
		catalog: 'Aggiungi widget',
		all: 'Tutti',
		noFit: 'Nessun widget entra in questo spazio',
		size: '{width} × {height}',
		addSize: 'Aggiungi {title}, {width} × {height}',
		widget: '{title}, {width} × {height}',
		move: 'Disponi {title}',
		moveHint: 'Le frecce spostano il widget.',
		resizeHint: 'Maiusc e frecce ne cambiano la dimensione.',
		removeHint: 'Canc lo rimuove.',
		resize: 'Ridimensiona {title}',
		remove: 'Rimuovi {title}',
		schemaHint: "Tocca un widget per selezionarlo, poi trascinalo, allargalo dall'angolo o rimuovilo. Anche tenendolo premuto si trascina.",
		close: 'Chiudi',
		moved: '{title} spostato alla riga {row}, colonna {column}',
		resized: '{title} ridimensionato a {width} × {height}',
		removed: '{title} rimosso',
		added: '{title} aggiunto'
	},
	dataTable: {
		search: 'Cerca…',
		columns: 'Colonne',
		rowsPerPage: 'Righe per pagina',
		range: '{from}–{to} di {total}',
		rangeOpen: '{from}–{to}',
		loaded: '{count} di {total}',
		results: '{count} risultati',
		result: '1 risultato',
		selected: 'selezionati',
		selectedOne: 'selezionato',
		allSelected: 'Tutti selezionati',
		selectAll: 'Seleziona tutti i {total}',
		clearSelection: 'Deseleziona tutto',
		selectionActions: 'Azioni sulle righe selezionate',
		moreActions: 'Altre azioni',
		loadError: 'Impossibile caricare le righe',
		retry: 'Riprova',
		loadingMore: 'Caricamento di altre righe…'
	},
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
	fileInput: {
		title: 'Trascina qui i file',
		titleSingle: 'Trascina qui un file',
		or: 'oppure',
		browse: 'sfoglia i file',
		rejectedType: '{name}: tipo di file non ammesso',
		rejectedSize: '{name}: più grande di {size}',
		rejectedCount: '{name}: massimo {count} file',
		rejectedDuplicate: '{name}: già aggiunto'
	},
	fileInputList: {
		list: 'File',
		empty: 'Nessun file',
		remove: 'Rimuovi',
		removeFile: 'Rimuovi {name}',
		uploading: 'Caricamento di {name}',
		done: 'Caricato',
		error: 'Caricamento non riuscito'
	},
	globalSearch: {
		label: 'Cerca',
		placeholder: 'Cerca…',
		dialog: 'Ricerca',
		results: 'Risultati',
		loading: 'Ricerca in corso…',
		noResults: 'Nessun risultato per “{text}”',
		error: 'La ricerca non è riuscita. Riprova.',
		navigate: 'naviga',
		open: 'apri',
		close: 'chiudi',
		cancel: 'Annulla'
	},
	hierarchyMenu: { label: 'Menu', submenu: 'Sottomenu di {label}' },
	menuOrDrawerOptions: { label: 'Azioni' },
	monthSelector: { label: 'Mese' },
	noData: { title: 'Nessun dato disponibile' },
	paginator: {
		label: 'Paginazione',
		first: 'Prima pagina',
		previous: 'Pagina precedente',
		next: 'Pagina successiva',
		last: 'Ultima pagina',
		page: 'Pagina {page}',
		status: 'Pagina {page} di {count}'
	},
	period: {
		presets: {
			today: 'Oggi',
			'this-week': 'Questa settimana',
			'this-month': 'Questo mese',
			'last-3month': 'Ultimi 3 mesi',
			'last-6month': 'Ultimi 6 mesi',
			'this-year': "Quest'anno",
			total: 'Sempre'
		},
		presetsLabel: 'Periodi',
		rolling: 'Periodo dinamico',
		pickDates: 'Scegli le date sul calendario',
		placeholder: 'Seleziona un periodo',
		start: 'Inizio',
		end: 'Fine',
		since: 'Dal {date}',
		until: 'Fino al {date}',
		pickEnd: 'Scegli la data di fine',
		pickStart: 'Scegli la data di inizio',
		invalid: 'Inserisci una data valida',
		previousMonth: 'Mese precedente',
		nextMonth: 'Mese successivo',
		direction: 'Direzione',
		past: 'Nel passato',
		future: 'Nel futuro',
		amount: 'Quanti',
		unit: 'Unità',
		units: { days: 'Giorni', weeks: 'Settimane', months: 'Mesi', years: 'Anni' },
		last: { days: 'Ultimi {n} giorni', weeks: 'Ultime {n} settimane', months: 'Ultimi {n} mesi', years: 'Ultimi {n} anni' },
		lastOne: { days: 'Ultimo giorno', weeks: 'Ultima settimana', months: 'Ultimo mese', years: 'Ultimo anno' },
		next: { days: 'Prossimi {n} giorni', weeks: 'Prossime {n} settimane', months: 'Prossimi {n} mesi', years: 'Prossimi {n} anni' },
		nextOne: { days: 'Prossimo giorno', weeks: 'Prossima settimana', months: 'Prossimo mese', years: 'Prossimo anno' },
		previousPeriod: 'Periodo precedente',
		nextPeriod: 'Periodo successivo',
		open: 'Scegli il periodo',
		cancel: 'Annulla',
		apply: 'Applica'
	},
	searchBar: { clear: 'Cancella la ricerca' },
	sidebarLayout: { menu: 'Menu', sidebar: 'Barra laterale', skip: 'Vai al contenuto' },
	table: {
		selectAll: 'Seleziona tutte le righe',
		selectAllShort: 'Seleziona tutto',
		selectRow: 'Seleziona {row}',
		row: 'riga {index}',
		expand: 'Mostra dettagli',
		collapse: 'Nascondi dettagli',
		actions: 'Azioni',
		resize: 'Ridimensiona {column}',
		info: 'Informazioni su {column}',
		open: 'Apri',
		loading: 'Caricamento',
		yes: 'Sì',
		no: 'No',
		sortBy: 'Ordina per',
		unsorted: 'Nessun ordinamento',
		moreFields: 'Mostra altri {count} campi',
		fewerFields: 'Mostra meno campi',
		ascending: '{column}, crescente',
		descending: '{column}, decrescente'
	},
	timePicker: { hours: 'Ore', minutes: 'Minuti', period: 'AM/PM' },
	timePickerTextField: {
		invalid: "Inserisci un'ora valida",
		clear: 'Cancella',
		close: 'Chiudi',
		open: "Scegli l'ora"
	},
	timeline: {
		empty: 'Nessun evento',
		done: 'Completato',
		current: 'In corso',
		upcoming: 'In programma'
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
