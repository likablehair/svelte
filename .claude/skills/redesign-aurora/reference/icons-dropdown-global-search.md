# IconsDropdown e GlobalSearchTextField: v4, prototipo, uso nelle app (analisi del 2026-10-14)

## v4

- **IconsDropdown** (`composed/forms/`, 142 righe): involucro di Dropdown. Prop `items`, `values` (`$bindable([])`), `clearable` (false; Dropdown true), `disabled`, `placeholder` (''), `width`/`minWidth` (`auto`), `menuWidth` (60px), `onchange({ detail: { select, unselect, selection } })`. Tipo `IconItem<Data> = { value, icon: 'mdi-…', data? }`, **non esportato**. Nessuno snippet né variabile propria (valgono `--dropdown-button-*`, `--button-*`, `--autocomplete-*`). Solo scelta singola, `mandatory` forzato; il bottone mostra il placeholder (vuoto: solo la freccia) o l'icona scelta; la X di `clearable` è un `<Icon onclick>` dentro il `<button>` e svuota anche da `disabled`; menu = colonna di 60px di icone da 20px.
  - **Bug**: voci e bottone senza testo (screen reader muti, niente type-ahead); `values` copiato in stato con `$effect`, quindi in SSR e fino all'idratazione il bottone è vuoto.
- **GlobalSearchTextField** (`composed/search/`, 271 righe) = bottone "finto campo" + Dialog + SearchBar + **SearchResults** (interno con pagina docs, 171 righe, che disegna una SelectableVerticalList).
  - Prop `searchButtonText` ("Search"), `searchDialogOpened` (`$bindable(false)`), `transitionDuration` (".8s"), `class {container, button, shortcut}`, `searcher({ searchText }) => Promise<Result[]>`, `onselect({ detail: { element } })`, `ontoggleSearchDialog({ detail: { opened } })`; snippet `searchButtonSnippet`, `searchButtonIconSnippet`, `searchButtonTextSnippet`, `searchButtonShortcutSnippet`, `searchBarSnippet`, `searchResultsSnippet`. Variabili `--global-search-text-field-{ring-color, hover-ring-color, color, width 100%, max-width 28rem, height 2rem, background-color, padding, font-size .875rem, border-radius 9999px}`; SearchResults `--search-results-*`, testi solo inglesi ("Sorry, nothing found", piede "Search with ❤️" sempre acceso).
  - Comportamento: Ctrl/⌘+K apre e chiude via singleton `keyboarder`; dialog 600×500 con scale .8s e blur; una ricerca per tasto senza debounce né annullamento; frecce e Invio dal keyboarder globale.
  - **Bug**: Ctrl+K senza `preventDefault` (il browser porta il fuoco sulla sua barra), scatta dentro qualunque input, non con Maiusc, etichetta "⌘ K" anche su Windows/Linux; risposte fuori ordine sovrascrivono le nuove; `searcher` che lancia lascia `loading` per sempre; `Result.url` ignorato; `onselect` riceve l'`Element` della lista, non il risultato; il dialog non si chiude dopo la scelta; nessuna riga evidenziata all'apertura; lista senza scroll (risultati fuori schermo irraggiungibili); `searchBarSnippet` inutilizzabile; `ontoggleSearchDialog` solo dal toggle; riquadro `role="button"` che chiude al clic, dialog senza nome, niente ARIA combobox; style prop che non arrivano al dialog.

## Prototipo

- **IconsDropdown** (r. ~1251): bottone con padding 5px, raggio 8px, `surface-solid` + `border-strong`, tessere da 34px (scelta col gradiente) + freccia; menu 220px a **griglia di 5 colonne** di tessere da 36px (scelta `--grad` + glow, evidenziata `primary-soft`, altre `surface-2` + bordo con alzata di 3px all'hover). Icone forbici, tavolozza, phon, spa: un "scegli l'icona". Niente etichette.
- **GlobalSearch** (r. ~1550, "Command-palette"): campo 44px `r-lg` con lente `primary`, anello `primary-soft` + glow, `<kbd>ESC</kbd>`; pannello staccato di 8px (`surface-pop`, `shadow-lg`); gruppi ("Clienti", "Pagine") 10.5px maiuscolo `text-3`; righe con tessera icona 28px (`primary` sull'attiva), titolo con `<mark>` del testo trovato, sottotitolo 12px, "↵" sulla riga attiva; piede "↑↓ naviga · ↵ apri · esc chiudi". Stato chiuso (card HeaderMenu, r. ~1366): campo di 30px "Cerca ⌘K", max 220px, nascosto su mobile.

## Aurora oggi

- **Dropdown** copre quasi tutto IconsDropdown: `Item { value, label?, icon, data? }`, `valueSnippet`, `itemSnippet`, `multiple`, `clearable`, `mandatory`, type-ahead sul `label`, combobox ARIA, `mobileDrawer`. Mancano: bottone con la sola icona senza snippet, griglia con frecce 2D, tooltip sulle voci.
- **Per GlobalSearch** ci sono i pezzi: Dialog (`<dialog>`, Esc, `aria-label`), SearchBar (debounce 300ms), **AsyncAutocomplete** (`searcher({ searchText, signal })` con annullamento, errori, prima riga evidenziata, combobox; la modalità drawer è già la struttura di una palette), `highlightParts`/`foldText` in `utils/table/manager.ts` per il `<mark>`, `headerSnippet` di SidebarLayout. Mancano una scorciatoia globale (niente singleton) e la ricerca nelle docs Aurora (la v4 la faceva con questo componente e Orama).
- Tutti e due sono in `MIGRATION.md` "Not available yet" e in `migrations/v4-to-v5/global.ts` `pending`.

## Uso nelle app (conteggio del 2026-10-14)

- **IconsDropdown**: 23 tag + 6 riferimenti di tipo, 12 app. **22 tag stanno in `TipTapEditor.svelte` copiato in 11 app**: livello del titolo (`p`, `h1…h5`) e allineamento (left/center/right); 1 in ermes (vista card/lista). 11 icone distinte, **nessun uso come "scegli un'icona"** (quello del prototipo). v3 in 3 app (5 tag), v4 in 9 (18 tag, copie identiche).
  - Prop: `items` 23, `values` 23 (`bind` 11, a senso unico 12 riscritto dall'editor), `disabled` 22 (20 sempre false), `onchange` 22; `placeholder`, `clearable`, `width`, `minWidth`, `menuWidth` 0. Variabili: `--button-width="auto"` 22, `--button-padding` 22, `--autocomplete-selected-item-color` 20.
  - La callback legge solo `e.detail.selection[0].value` e lancia un comando dell'editor; `select`/`unselect` mai usati. Un'app ridichiara il tipo (`IconItem` non esportato). In tutti gli usi i comandi della barra **non hanno un nome accessibile**.
- **GlobalSearchTextField**: 3 tag (emarket, lupette, mufasa) + 1 tipo; import inutilizzati in 3 app. emarket e lupette su v3, mufasa su v4. Variabili identiche nei 3 usi (`width 200px`, `border-radius 5px`, anelli `transparent`, sfondo `background-200`). `bind:searchDialogOpened` 2, `searcher` 2, `on:select` 2, `searchButtonText` 1; snippet e altro 0. `onselect` fa sempre `goto(...)` e chiude a mano; tutte e 3 lo **nascondono su mobile**.
  - **Bug**: mufasa senza `searcher` (sempre "nothing found", Ctrl+K preso lo stesso); lupette in 3 lingue con testi interni inglesi, riconosce il tipo di risultato confrontando il sottotitolo tradotto; `%` e `_` non escapati negli `ilike`.

## Proposte (P157–P171, 2026-10-14)

| # | Proposta | Tipo |
|---|---|---|
| P157 | IconsDropdown **tiene il nome**, involucro sottile di Dropdown: `items`/`values` `Item[]`, `disabled`, `clearable` (false come v4), `placeholder`, `mandatory`, `placement`, `mobileDrawer`, `variant`, `size`; `onchange({ select, unselect, selection })` | cambio API |
| P158 | In alternativa a P157, **non portarlo**: Dropdown guadagna `iconOnly` e `columns` (griglia); in MIGRATION `<IconsDropdown>` → `<Dropdown iconOnly>` | cambio (componente tolto) |
| P159 | `IconItem` → `Item` esportato, `icon` come path SVG | cambio |
| P160 | `label` per voce come nome accessibile + Tooltip; `label` del componente come nome del bottone, non visibile | aggiunta |
| P161 | Aspetto del prototipo: tessera dell'icona scelta + freccia, menu a griglia di tessere 36px (`columns`, default = n. voci fino a 5) con frecce 2D, scelta col gradiente (v4: colonna di 60px) | cambio di aspetto |
| P162 | `width`, `minWidth`, `menuWidth` → variabili CSS (0 usi) | cambio |
| P163 | `multiple`, come nel prototipo (0 usi; Dropdown lo ha già) | aggiunta |
| P164 | GlobalSearch: un solo componente pubblico (SearchResults resta interno), motore di AsyncAutocomplete (debounce 300ms, annullamento, errori, soglia 1) | cambio di comportamento (v4: una richiesta per tasto) |
| P165 | Risultati `{ value, label, description, icon, href, group, data }`: `href` naviga, `group` dà i titoli di sezione | cambio API + aggiunte |
| P166 | Chiusura dopo la scelta con fuoco che torna al bottone; `onselect({ item, event })` col risultato originale | cambio di comportamento |
| P167 | Combobox ARIA, prima riga evidenziata e Invio la apre, lista che scorre sulla riga attiva, `<mark>` sul testo trovato, piede con i tasti dal `locale` al posto di "Search with ❤️" | cambio + aggiunte |
| P168 | `shortcut` (default Ctrl/⌘+K, `false` la spegne) con `preventDefault`, etichetta per piattaforma, `aria-keyshortcuts`, ascoltatore locale | cambio |
| P169 | Aspetto del prototipo: bottone-campo sulla base `--global-input-*` (v4: pillola), palette in alto invece che al centro, `ESC` nel campo; `transitionDuration` → `--dialog-duration` | cambio di aspetto |
| P170 | Su telefono il bottone diventa la sola lente e la palette va a tutto schermo (oggi le 3 app la nascondono) | aggiunta |
| P171 | Rinomine: `searchDialogOpened` → `bind:open`, `ontoggleSearchDialog` → `onclose` a ogni chiusura, `searchButtonText` → `label` dal `locale`; snippet `triggerSnippet`, `itemSnippet`, `groupSnippet`, `emptySnippet`, `footerSnippet`, `searchBarSnippet` tolto | cambio |

Domande aperte dell'analisi: `label` per voce obbligatorio nel tipo? griglia anche per 3–6 voci reali (titolo, allineamento) o colonna icona + etichetta? GlobalSearch (2 app vere, entrambe v3) si porta ora, anche per la ricerca delle docs? nome (`GlobalSearch`/`CommandPalette`) e prefisso CSS (`--global-search-text-field-*` cade nello spazio `--global-*`)? `TipTapEditor` copiato in 11 app: un editor nella libreria in un altro giro?
