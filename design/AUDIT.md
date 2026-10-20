# Audit `@likable-hair/svelte` 4.3.2

Data: 2026-10-07. Audit in sola lettura, fatto prima del redesign "Aurora" (`design/components-prototype.html`).

Legenda: ✓ = verificato a mano nel codice. Le altre voci vengono dall'analisi automatica dei sorgenti e vanno ricontrollate prima di intervenire. Righe e percorsi sono relativi a `src/lib/` dove non indicato.

## 1. Quadro generale

| | |
|---|---|
| Componenti | 88 file `.svelte`, ~70 esportati da `index.ts` |
| Codice | ~29k righe in `src/lib`; DynamicTable da sola 2941 |
| Storia | 618 commit dal 2022; un autore ne ha circa l'85% |
| Svelte | 5, runes ovunque: nessun `export let`, `$:`, `<slot>` o `createEventDispatcher` |
| Type check | `svelte-check`: 0 errori, 24 warning |
| Test | 0 |
| Variabili CSS | ~1000 distinte, di cui ~790 a livello componente e 512 `--*-default-*` |

## 2. Capacità

| Area | Componenti e funzionalità |
|---|---|
| Bottoni | Button (`default`, `text`, `icon`, loading), LinkButton, ActivableButton, ConfirmOrCancelButtons |
| Campi testo | SimpleTextField (anche come range, con prepend/append), Textarea, LabelAndTextField e LabelAndSelect (interni, non esportati) |
| Selezione | Checkbox (con shift), RadioButton, Switch, VerticalSwitch, VerticalTextSwitch, Select nativo, ToggleList |
| Picker | Autocomplete (multi, chip, ricerca, Menu o Drawer), AsyncAutocomplete (searcher con debounce), Dropdown, Countries/Icons/AvatarDropdown |
| File | FileInput (drop, maxFiles), FileInputList (tabella o anteprime) |
| Date | Calendar (data singola o range), DatePicker (vista anno/mese/giorno), Month/YearSelector, DatePickerTextField e YearPickerTextField (IMask + luxon), PeriodSelector e PeriodPicker (preset quick, rolling, custom) |
| Tabelle | SimpleTable → PaginatedTable → EnhancedPaginatedTable; DynamicTable: colonne pinned, resize, larghezza automatica, header sticky, selezione singola/multipla con shift e select-all lato server, righe espandibili, edit inline (popover o drawer), scroll infinito a finestra |
| Filtri | Filters (one-edit e multi-edit), FilterEditor e MobileFilterEditor, QuickFilters, DynamicFilters, `FilterBuilder` in stile Knex/Lucid serializzato in JSON |
| Ricerca | GlobalSearchTextField (⌘K), SearchBar, SearchResults |
| Overlay | Menu (8 ancoraggi, flip, gruppi), Dialog, Drawer (4 lati), ToolTip, MenuOrDrawer(+Options) |
| Navigazione | TabSwitcher, Breadcrumb, Navigator, HeaderMenu, Chip |
| Liste | SidebarMenuList (usa `$app/state`), HierarchyMenu, SelectableVerticalList, SelectableMenuList, ColorInvertedSelector, BoxList, VerticalDraggableList, InfiniteScroll |
| Layout | Stable-, Unstable- e CollapsibleSideBarLayout |
| Altro | Line/Bar/PieChart (Chart.js con zoom), DashboardShaper, Avatar, DescriptiveAvatar, Icon, FlagIcon, AlertBanner, ProgressBar, HorizontalStackedProgress, CircularLoader, Skeleton, SimpleTimeLine, NoData, Divider, CollapsibleDivider, MediaQuery |

## 3. Punti di forza

- **Migrazione a Svelte 5 completa**, TypeScript in tutti i file, nessun errore di tipo.
- **Copertura da gestionale**: tabelle, filtri, builder di query e periodi coprono casi reali e complessi.
- **Personalizzabile**: snippet ovunque e override per istanza con variabili CSS a due livelli (`--x` con fallback su `--x-default`).
- **Responsive di serie**: diversi componenti passano da Menu a Drawer o da Dialog a Drawer su mobile.
- **Docs con esempi live** per quasi tutti i componenti, con ricerca. `publint` passa e `dist/` non è versionato.
- Nessun accesso a `window` o `document` a livello di modulo: l'SSR non si rompe all'import.

## 4. Punti deboli

### 4.1 Token e theming
- I colori sono scale 50–950 scritte come triplette RGB, consumate con `rgb(var(...))`. Il formato non accetta hex né `color-mix`.
- La palette è copiata 3 volte in `css/main.css` (light, `prefers-color-scheme`, `.dark`). In dark primary, secondary, error, warning e success sono identiche alla versione light, e grey è identico in entrambi.
- Non esistono scale per spacing, tipografia, radius, ombre, z-index o breakpoint.
  - Ci sono circa 9 breakpoint diversi (450, 768, 769, 800, 1024, 1024.1, 1440).
  - Gli z-index vanno da -250 a 50.
  - Ci sono 84 `border-radius` hardcoded nei `<style>`, e i default dei componenti sono incoerenti: 2, 4, 5, 6px, .5rem, 9999px.
- Le ~790 variabili a livello componente sono **un'API pubblica non documentata**: le app le usano come style props.
- ✓ **L'API colori dello store è un no-op**: il subscriber esegue `value.colors[value.active] = { dark: {}, light: {} }` a ogni update (`stores/theme.ts:162`).
- La doc del theming mostra colori hex, incompatibili con le triplette.
- `COLOR_TYPES` non include `grey` e `success`, e `COLOR_SHADES` non include 950.
- Il subscriber esegue circa 120 `getComputedStyle` a ogni update e riscrive un tag `<style>`.
- I default `:root { --x-default-* }` hanno la stessa specificità delle override delle app, quindi vince chi viene caricato per ultimo. Le override delle app possono perdersi in base all'ordine dei CSS.

### 4.2 Accessibilità
- Non c'è nessuno stile `:focus-visible` in tutta la libreria. Spesso c'è `outline: 0/none`, e i fallback `--*-default-focus-box-shadow` di SimpleTextField, Autocomplete e Textarea non sono mai definiti: i campi di testo non mostrano il focus.
- ✓ `Icon` ha sempre `role="button"` (`media/Icon.svelte:25`), è attivabile con qualsiasi tasto e non ha label. Icone decorative, separatori della breadcrumb e frecce di sort vengono annunciati come pulsanti senza nome.
- ✓ Dialog e Drawer non hanno `role="dialog"` né `aria-modal`. Mancano anche focus trap e ritorno del focus.
- Calendar: le celle sono `div role=presentation` senza tabindex, quindi la data non si sceglie da tastiera.
- Switch: l'input nativo è in `display:none`, quindi non è focusabile e non ha ruolo switch.
- FileInput: non c'è un modo da tastiera per caricare file.
- Autocomplete: è un `role=button` che contiene l'`<input>` (due tab stop, elementi interattivi annidati); le opzioni sono div `role=button`; mancano combobox e listbox.
- Tabelle: mancano `aria-sort` e `scope`; le checkbox di selezione non hanno label e hanno id duplicati (`select-all`).
- TabSwitcher non ha i ruoli tablist/tab. Breadcrumb non usa link (ignora `item.url`). Paginator non è dentro un `<nav>`.
- Le label sono associate correttamente solo in Textarea. RadioButton ha `for={id}` anche quando l'id è indefinito; LabelAnd* usano `for={name}`, ma l'input non ha id.
- In tutta la libreria ci sono solo 42 occorrenze di `aria-*`, in 17 file.

### 4.3 Overlay
- Menu è posizionato a mano con circa 240 righe di `getBoundingClientRect` (`common/Menu.svelte:98-337`). Non viene spostato in `<body>`, quindi gli antenati con `overflow` lo tagliano.
- Lo z-index parte da 50 e cresce di 2 a ogni riapertura, perché il menu conta anche se stesso.
- ✓ **Esc chiude tutti i Dialog e i Drawer aperti e ignora `persistent`** (`dialogs/Dialog.svelte:51`, Keyboarder globale).
- I Dialog chiusi restano nel DOM con opacità 0: raggiungibili con Tab, letti dagli screen reader, e i figli pesanti vengono montati subito.
- Montare un Dialog chiuso rimette `body.overflow = auto` anche se un altro Dialog è aperto.
- Lo spostamento in `<body>` rompe le style props `--x` di Dialog e Drawer: c'è un workaround commentato in `navigation/Drawer.svelte:60-67`.
- ✓ Menu aggiunge listener di scroll a tutti gli antenati a ogni apertura e non li rimuove mai (`common/Menu.svelte:365-371`).
- ToolTip: l'`$effect` non ha cleanup, e il tooltip risponde solo al mouse (né focus né touch).
- Menu dipende dal layout Unstable tramite lo store globale `sidebarOpened` e un timeout di 300 ms.
- Esistono due implementazioni di click-outside; `utils/clickOutside.ts:7` passa `node` come init del CustomEvent.
- Si potrebbero usare le API native: `<dialog>.showModal()`, l'attributo `popover` e CSS anchor positioning.

### 4.4 Form e date
- **Il valore ha nomi diversi**: `value`, `values`, `selected` (Countries), `checked` (Radio), `files`, `selectedDate`/`selectedDateTo`, `timespanSettings`.
- Le opzioni hanno due tipi: `Option{text}` (Select, duplicato in LabelAndSelect) e `Item{label}` (Autocomplete, duplicato in ToggleList).
- La lingua è `locale` (default `it`) in alcuni componenti e `lang` (default `en`) in altri; PeriodSelector li ha entrambi. Ci sono circa 30 ternari it/en inline e testi italiani di default ("Annulla", "Salva", "Selezionati" anche con `lang='en'`).
- Autocomplete, Dropdown, Toggle, Switch, FileInput, DatePickerTextField e PeriodPicker **non partecipano ai form nativi**: niente `name`, input nascosti, `required` o reset.
- FileInput ha sempre `multiple`, non ha `accept` e non azzera il valore, quindi non si può riselezionare lo stesso file.
- `$effect` usati al posto di `$derived` (Autocomplete `filteredItems`, IconsDropdown/AvatarDropdown con due fonti di verità).
- Prop modificate in place (AvatarDropdown `values.splice`, PeriodSelector).
- `{#key searchText}` rimonta il Menu di Autocomplete a ogni tasto premuto.
- Le istanze IMask non vengono mai distrutte, e `URL.createObjectURL` viene chiamato nel template e mai revocato (FileInputList).
- Le date usano tre sistemi insieme: luxon, `Date` con utility scritte a mano, e date-fns (solo per l'adapter di Chart.js).

### 4.5 Tabelle e filtri
- **DynamicTable è un componente "dio"**: ~86 prop (23 snippet, 13 callback), 29 `$state`, 6 `$effect`, 7 `setTimeout`.
- DynamicTable **non usa** SimpleTable: ne copia resize, sticky, larghezza automatica e rendering delle celle. Copia anche da PaginatedTable la ricerca → builder e lo shift-select.
- Ci sono due sistemi di quick filter: `QuickFilters.svelte` con `Filter` + Converter, e uno inline in DynamicTable (righe 1026-1191) con `quickFilters.ts`.
- Filters contiene due volte sia la UI multi-edit (righe 657-757 e 863-970) sia il bottone filtro.
- Gli oggetti filtro fanno sia da configurazione sia da stato e vengono modificati in place.
- Le date dei filtri sono gestite in tre modi diversi.
- Il builder è costruito nel browser e include `whereRaw`, `join`, `from` e `select`: il backend deve applicare una allowlist.
- I tipi `multiString` e `choice` sono dichiarati ma ignorati dal Converter.
- Prestazioni:
  - ogni riga fa fino a 6 `find` lineari su selected, unselected ed expanded;
  - pinned e offset si calcolano in O(righe·colonne²);
  - SimpleTable e PaginatedTable renderizzano tutte le righe;
  - DynamicTable usa una finestra di 100 righe, che non è vera virtualizzazione.
- Mancano le chiavi in molti `{#each}`, comprese le righe di DynamicTable.
- DynamicTable scrive `--main-header-height` su `document.documentElement`: con più tabelle nella stessa pagina vanno in conflitto.

### 4.6 Navigazione, layout, media, grafici
- I 3 layout sono duplicati per circa l'85% e hanno la stessa scala di z-index (10/20/30/-100).
  - Il layout Unstable scrive uno store globale, quindi due istanze vanno in conflitto.
  - Il layout Collapsible ha codice morto (`onmenuSelect`, `onpinnedChange`, branch identici).
- Nei layout mancano `<main>` e lo skip link; l'hamburger non ha label.
- Lo store `mediaQuery` lato server parte come mobile, quindi su desktop c'è un flash al momento dell'idratazione. In `MediaQuery.svelte:36`, `sAndUp` include `xs`.
- Grafici:
  - importano `chart.js/auto`, quindi tutto Chart.js;
  - vengono ricreati da zero a ogni cambio dei dati, e lo zoom si perde;
  - `lodash.merge` modifica le opzioni di default;
  - ignorano il tema e il dark mode;
  - il fix di d767020 copre Line e Bar, ma non PieChart;
  - `chartjs-plugin-zoom` viene registrato globalmente.
- DashboardGridShaper è una demo non esportata che usa `svelte-grid` (Svelte 3, abbandonato). DashboardShaper invece ha un proprio algoritmo su CSS grid, senza drag.
- ActivableButton: `{...buttonProps}` sovrascrive il suo `onclick`, quindi il toggle si rompe.
- LinkButton: `disabled` non impedisce la navigazione.
- Navigator: Enter lancia sia `onclick` sia `onkeypress`.

### 4.7 API incoerente
- Più di 20 callback avvolgono il payload in `{ detail: {...} }`, residuo degli eventi Svelte 4; PeriodSelector invece no.
- Lo stesso nome ha forme diverse: `onfileDrop({detail})` in FileInput, `onfileDrop()` in FileInputList.
- Nomi nativi sono usati per payload custom (`oninput` in DatePickerTextField, `onclick` in MonthSelector).
- `class` è a volte una stringa e a volte un oggetto; Select applica il rest dopo `class="select"`.
- Il rest delle prop viene inoltrato solo da 5 componenti di form.
- `labelSnippet` vuol dire cose diverse in Dropdown e in Month/YearSelector.
- Gli argomenti degli snippet espongono dettagli interni (`handleKeyDown`, `mask`).
- `openingId` di Autocomplete è ignorato (hardcoded), quindi `bind:openingId` su Dropdown non fa nulla.
- I tipi pubblici (`Item`, `Option`, `Filter`, `Header`, `TimespanSettings`, ...) **non sono esportati**, e consumarli è impossibile.

### 4.8 Packaging, dipendenze, peso
- `exports` contiene solo `"."`: non ci sono subpath né un export per il CSS.
- ✓ **Il quickstart è rotto**: dice di importare `@likable-hair/svelte/css/main.css`, che non è esportato (`ERR_PACKAGE_PATH_NOT_EXPORTED`).
- ✓ Manca il campo `sideEffects`. Circa 46 componenti importano `main.css` più il proprio `.css`, e ✓ i 3 grafici importano `chart.js/auto`. Importare un solo componente dal barrel probabilmente porta dentro gran parte della libreria; non è stato misurato su un build reale.
- ✓ **Il font MDI viene caricato dalla CDN jsdelivr a runtime** (`common/materialDesign.css`): ~700 KB, non tree-shakeable, problemi di CSP, GDPR e uso offline.
- flag-icons è vendorizzato e modificato in `css/flag-icons` (538 file, 5,6 MB), mentre il pacchetto npm `flag-icons` è installato ma non usato. Pacchetto pubblicato: 1,3 MB, 814 file.
- Dipendenze runtime inutili:
  - `sortablejs` e `svelte-dts` non sono usate;
  - `svelte-grid` serve solo alla demo non esportata;
  - `highlight.js` e `highlightjs-svelte` servono solo a `Code`, non esportato.
- `lodash` è importato intero in versione CommonJS, per usare solo `merge`, `isEqual`, `cloneDeep`, `clone` ed `escape`.
- I tipi luxon finiscono nei `.d.ts` pubblici, ma `@types/luxon` è una devDependency.
- `svelte-dnd-action` è bloccato alla 0.9.69.
- SidebarMenuList importa `$app/state`, quindi funziona solo dentro SvelteKit.

### 4.9 Qualità e processo
- **Zero test**: sia `npm test` sia `npm run test:unit` falliscono con "No tests found".
- La CI (`.github/workflows/test.yml`) usa Node 14/16 ed è disabilitata a mano su GitHub. Fallirebbe comunque, perché vite 8, eslint 10 e vitest 4 richiedono Node ≥ 20 e `.npmrc` ha `engine-strict=true`.
- `npm run lint` fallisce: Prettier 3 ignora `--plugin-search-dir`, 90 file non sono formattati e non c'è un `.prettierrc`.
- ESLint segnala 148 warning e nessun errore, ma la config abbassa molte regole.
- I 24 warning `state_referenced_locally` di svelte-check sono bug di reattività reali (Autocomplete, PeriodSelector, DynamicTable, DatePickerTextField, ...).
- Non ci sono CHANGELOG né tag; 159 commit si chiamano "new version". Il README sul publish non è aggiornato, e c'è un `.babelrc` orfano.
- La doc è scritta a mano (PropsViewer, SlotsViewer ed EventsViewer sono array compilati a mano), quindi si disallinea dal codice.
- Mancano le pagine di doc per InfiniteScroll e per le utility. HeaderMenu ha due pagine, e una è orfana.

## 5. Bug noti

| Bug | Dove |
|---|---|
| ✓ `disabled` viene estratto dalle prop e non arriva mai al `<button>`: un `type="submit"` disabilitato invia comunque il form | `buttons/Button.svelte:40` |
| ✓ `colors` dello store tema azzerato a ogni update | `stores/theme.ts:162` |
| ✓ Esc chiude tutti i dialog e ignora `persistent` | `dialogs/Dialog.svelte:51` |
| ✓ Qualsiasi mouseup sulla pagina lancia `oncolumnResize` su tutte le colonne (il controllo è su `th`, non su `resizingInner`) | `composed/list/DynamicTable.svelte:1375`, `simple/lists/SimpleTable.svelte` ~341 |
| ✓ Cambiando pagina si perde il testo di ricerca (`buildFilters()` senza `searchText`) | `composed/list/PaginatedTable.svelte:211` |
| ✓ Un filtro booleano `false` non è mai valido | `utils/filters/validator.ts:19` |
| ✓ ToggleList: con `values` indefinito un click deseleziona sempre | `composed/forms/ToggleList.svelte:38` |
| ✓ `bind:checked` del RadioButton non si aggiorna (passato in sola lettura) | `simple/forms/RadioButton.svelte:45` |
| ✓ `alert(file.name)` di debug al click su un file | `simple/forms/FileInputList.svelte:72` |
| ✓ `isLeapYear = year % 4 === 0` sbaglia il 1900 e il 2100 | `simple/dates/utils.ts:59` |
| ✓ `align-right` perso quando si passa `class.input` (precedenza di `\|\|`) | `simple/forms/SimpleTextField.svelte:131` |
| ✓ Menu: listener di scroll mai rimossi | `simple/common/Menu.svelte:365-371` |
| DatePicker va in crash al secondo click sull'anno selezionato (`visibleYear` indefinito) | `simple/dates/DatePicker.svelte:73,128` |
| VerticalSwitch non lancia mai `onchange` | `simple/forms/VerticalSwitch.svelte:32,49` |
| PeriodPicker: il campo è sempre `disabled` e si apre solo dal chevron | `composed/forms/PeriodPicker.svelte:44-47` |
| DatePickerTextField usa id fissi `from`/`to`, quindi con due istanze gli id si duplicano | ~313 |
| Il ResizeObserver di SimpleTable non viene mai disconnesso (cleanup dentro un'IIFE async) | `simple/lists/SimpleTable.svelte:177-209` |
| DynamicTable aggiunge listener dopo `await tick()`, con leak in caso di unmount rapido | `composed/list/DynamicTable.svelte:40-82` |
| Ogni Enter nella ricerca di DynamicTable duplica `orderBy` nel builder | ~856-944 |
| QuickActions: lo spinner non compare (l'`onClick` non viene atteso) | `composed/common/QuickActions.svelte:141-145` |
| HeadersDrawer: errore di precedenza in `a \|\| b ? x : y`, e una `)` mancante nel CSS | ~82, ~181 |
| HeaderMenu: hide-on-scroll sposta la barra in basso invece di nasconderla; `100vw` causa scroll orizzontale | `simple/navigation/HeaderMenu.svelte:128,140` |
| Grafici: ricreati a ogni cambio dei dati; PieChart non è protetto dal mount/unmount rapido | `simple/charts/*` |
| 12h: mezzogiorno risulta "am" e mezzanotte "0:xx"; il primo giorno della settimana in inglese è sfasato di 1 | `simple/dates/utils.ts` ~137, ~267-289 |
| PeriodSelector: `setHours(-24*n)` sbaglia con il cambio di ora legale, `setMonth(-n)` va in overflow il 29-31 | `composed/forms/PeriodSelector.svelte` ~247-283 |

## 6. Candidati al consolidamento

| Oggi | Domani |
|---|---|
| Select, Autocomplete, AsyncAutocomplete, Dropdown, Countries/Icons/AvatarDropdown, ToggleList | una primitiva headless combobox/listbox, con ARIA e integrazione nei form |
| SimpleTextField, LabelAndTextField, Textarea | un wrapper `Field` (label, hint, errore, id, `aria-describedby`) |
| Switch, VerticalSwitch, VerticalTextSwitch | un solo toggle con varianti |
| Menu, ToolTip, MenuOrDrawer, Drawer, Dialog | una primitiva overlay sul top layer nativo, con stack per Esc, scroll lock e focus |
| SimpleTable, DynamicTable e catena Paginated | stato headless (sort, selezione, colonne) più un DataTable unico |
| Le 2 implementazioni di quick filter, FilterEditor e MobileFilterEditor | un modello `Filter` serializzabile e un solo editor |
| I 3 layout | un AppShell con `sidebarMode` |
| Avatar e DescriptiveAvatar | un Avatar con label opzionale |
| Teleporter, clickOutside, Keyboarder, cuid2, store `svelte/store` | `{@attach}`, `$props.id()`, `svelte/reactivity` |

## 7. Prototipo Aurora e sistema attuale

- Il prototipo è HTML e JS vanilla, dark-first con tema light opzionale (`data-theme`), e copre tutti gli 88 componenti, inclusi quelli non esportati o morti (`DashboardGridShaper`, `Code`).
- I token sono semantici e piatti: `--bg`, `--surface(-2,-3,-solid,-pop)`, `--border(-strong)`, `--text(-2,-3)`, `--primary(-strong,-soft,-glow)`, `--on-primary`, `--accent`, `--success`/`--warning`/`--error` con variante `-soft`, `--grad`, `--shadow-sm/md/lg`, `--ring`, `--r-xs…--r-full` (4/6/8/10/12/999px).
- I colori sono hex più `rgba()` e `color-mix(in oklab)`. Molte superfici sono traslucide (rgba sopra `--bg`).
- I font sono Bricolage Grotesque (display), Geist (body) e Geist Mono, caricati da Google Fonts.
- **Mancano le scale di spacing e tipografia**: padding e font size sono valori sparsi (13, 12.5, 13.5px, ...).
- La card dei token è intitolata "Palette `--global-color-*`", ma il prototipo non usa mai `--global-color-*` e non definisce variabili per componente.

Modi in cui il prototipo aggiunge qualcosa rispetto all'API attuale:
- varianti di Button (`secondary`, `danger`, `grad`) e taglie `sm`/`lg`;
- spinner affiancato al testo nel loading;
- label sempre visibile e stati `error`/`success` nei campi;
- contatore nella Textarea;
- puntino "evento" nel Calendar.

Il dettaglio su come gestirli è in `REDESIGN-STRATEGY.md`.

## 8. Raccomandazioni

1. Separare i fix dei bug dal restyle e farli in PR dedicate. Le voci ✓ della sezione 5 vanno corrette prima o durante il redesign.
2. Costruire prima i token globali e la palette, poi restilizzare i componenti (vedi `REDESIGN-STRATEGY.md`).
3. Mettere una rete minima prima di toccare 88 componenti: screenshot Playwright delle pagine docs in light e dark, e CI su Node 22.
4. Risolvere la parte di packaging: `sideEffects: ["**/*.css"]`, export del CSS (quickstart), rimozione delle dipendenze morte, icone senza CDN.
5. Misurare quali componenti e variabili CSS usano davvero le app Likablehair prima di decidere cosa eliminare o accorpare.
