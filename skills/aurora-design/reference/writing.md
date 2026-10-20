# Writing (UX copy)

The app's texts are part of the design. Write them in the app's language (most apps are Italian; `setDefaultLocale('it')` already translates the library's own texts: do not override them by hand).

## Principles

- **The user's words**, not the system's: "Clients", "Booking", "Opening hours", not "Entities", "Records", "Config".
- **One term per concept** across the app: pick "Delete" or "Remove", "Create" or "Add", "Settings" or "Preferences" and keep it.
- **Short and specific**: every word earns its place; no intro that repeats the title, no hint that repeats the label.
- **Sentence case** ("Opening hours"), active voice, plain verbs. No exclamation marks in normal UI, no jokes in errors.
- Periods at the end of sentences (descriptions, messages), not on labels, buttons or titles.
- Write whole sentences with the number inside as one translatable string, and use proper plural forms (`Intl.PluralRules` or the app's i18n), never `count === 1 ? '' : 's'`.

## Patterns

| Text | Do | Don't |
|---|---|---|
| Button | "Save changes" · "Salva modifiche" | "OK", "Submit", "Conferma" alone when it is unclear what |
| Bulk action | "Delete 3 bookings" · "Elimina 3 prenotazioni" | "Delete selected" |
| Error on a field | "Enter a date as DD/MM/YYYY" · "Inserisci una data nel formato GG/MM/AAAA" | "Invalid input" · "Errore" |
| Error from the server | "We couldn't save the booking. Check your connection and try again." · "Non è stato possibile salvare la prenotazione. Controlla la connessione e riprova." | "Error 500" · "Qualcosa è andato storto" |
| Permission | "Only owners can change prices." · "Solo i titolari possono modificare i prezzi." | a disabled button with no reason |
| Empty, first use | "No clients yet. Add the first one to start booking." + "Add client" | "No data" · "Nessun dato" |
| Empty, no results | "No bookings match these filters." + "Clear filters" | "0 results" |
| Confirmation | "Delete Mario Rossi? His 12 bookings are deleted too. This can't be undone." | "Are you sure?" · "Sei sicuro?" |
| Success | "Booking created" · "Prenotazione creata" | "Operation completed successfully" |
| Loading | "Saving booking…" · "Salvataggio in corso…" | "Please wait" |
| Link | "View invoice" · "Vedi fattura" | "Click here" · "Clicca qui" |

## Errors: the formula

What happened + why (if useful) + how to fix it. Never blame the user ("You entered…"), never show codes, keep their input.

## Tone by moment

Success: brief. Errors: calm and helpful. Destructive confirmations: serious and explicit. Loading: reassuring and specific. Empty first use: inviting, with the action.
