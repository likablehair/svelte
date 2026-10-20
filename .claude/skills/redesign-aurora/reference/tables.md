# Tabelle: analisi della v4 e dell'uso nelle app (2026-10-13)

Fonte per il piano delle tabelle (decisioni ex P47–P55 e vista a card del 2026-10-13 in `decisions.md`). Raccolto da due subagenti: lettura completa di SimpleTable, Paginator, PaginatedTable, EnhancedPaginatedTable, DynamicTable, HeadersDrawer e delle loro pagine docs; analisi statica di 28 progetti in 22 app (11 con lib v4, 10 con v3, evote con v1; sintassi v3 normalizzata). Script nello scratchpad della sessione (non conservato).

## Gerarchia v4

```
SimpleTable (<table>, sort solo come stato, resize, larghezza automatica, sticky, append/prepend)
└─ PaginatedTable = Simple + toolbar (QuickActions, SearchBar, Filters, QuickFilters) + selezione + footer (per pagina, range, Paginator) + builder
   └─ EnhancedPaginatedTable = Paginated + HeadersDrawer + "+" in stickyAppendSnippet + effetto organizedHeaders (122 righe)
DynamicTable (standalone, 2941 righe: copia Simple e la parte filtri/selezione di Paginated; in più quick filter inline, righe espandibili, edit di cella, finestra di scroll, HeadersDrawer)
HeadersDrawer (usato da Enhanced e Dynamic; ciclo di import con Enhanced; importa dal barrel)
```

Duplicati tra DynamicTable e Simple/Paginated, spesso divergenti: celle per tipo (null: vuoto contro "-"), ordinamento (subito contro debounce 800 ms), ricerca (visibile/300 ms contro nascosta/800 ms), quick filter (due modelli incompatibili), selezione (multiple contro single di default; "seleziona tutto" senza esclusioni contro `selectedAll` + `unselectedItems`; Paginated azzera la selezione a ogni query, anche cambiando pagina), resize (identico, stesso bug), sticky (NaN in Dynamic), gestione colonne (`organizedHeaders` copiato), nomi diversi per la stessa cosa (`items`/`rows`, `totalElements`/`totalRows`, `showSelection`/`showSelect`, `customSnippet({item})`/`customRowSnippet({row})`, `appendSnippet` = riga in Simple, toolbar in Dynamic).

## Uso nelle app

| Componente | Usi effettivi | App | Note |
|---|---|---|---|
| PaginatedTable | 129 | 20 | 101 wrapper per entità (`<Entità>PaginatedTable.svelte`), usati una volta ciascuno |
| SimpleTable | 74 | 11 | |
| DynamicTable | 68 | 8 | 33 wrapper per entità; famiglia doganale (astro, maya, cbam, quantum) e addibox |
| EnhancedPaginatedTable | 26 | 2 | solo tramite wrapper: stramoniumai 24, addibox 2 |
| Paginator | 17 | 5 | più `StandardPaginator` copiato in 6 progetti |

- Tutte le 22 app usano una tabella; 296 route ne mostrano una.
- Wrapper generici: `StandardPaginatedTable` (stramoniumai su Enhanced 24 consumer, ganymede 13, addibox 13), `StandardTable` su SimpleTable (epass, new-vigipass, evote), `StandardSimpleTable` di stramoniumai (selezione fatta a mano). Copie: `PaginatedTable` con `fetcher({page, perPage, filters})` (evote 10, epass 1), `LocalPaginatedTable` di lupette (311 righe), drawer delle colonne fatto a mano sopra PaginatedTable (ganymede 8, cbam 6, quantum 3).
- **Paginazione sempre lato server**: 142 tabelle paginate su 155 hanno `onpaginationChange`, nessuno slicing lato client. Prima pagina dal `load` (243 route su 296), poi `service.list({page, perPage, filtersBuilder})` nelle callback (153 file) e `maxPage = meta.lastPage` (107). `handlePaginationChange` (128) e `handleFilterChange` hanno corpi quasi identici. Solo 17 pagine leggono pagina o filtri dall'URL.
- **Il builder arriva sempre al backend** (171 file, 20 app); anche l'ordinamento passa dal builder (`onsort` esplicito 18 volte contro 967 header `sortable: true`).
- **Scroll infinito**: DynamicTable con `onfetchData` 48 volte in 7 app; 27 file ripetono l'accodamento `rows = [...rows, ...batch]` più un flag `filtersChanged`. addibox affianca un Paginator esterno a DynamicTable (16 pagine).
- Perché DynamicTable (64 usi su 68 usano qualcosa che Paginated non ha): scroll infinito 48, selezione con azioni di massa 25, scelta colonne salvata ~21, quick filter 20, righe espandibili / sotto-righe 12, edit di cella 4 (attivo solo in cbam e addibox/admin; in epass e new-vigipass configurazione morta). Mappatura `{ item, subItems: [] }` 62 volte.
- **Colonne salvate sempre sul backend** (0 localStorage): `UserSettingsService.set({ key: 'xxxTableHeaders', setting: { value: [{ name, order }] } })` e `populateHeaders($user.settings)` (53 definizioni in 7 app, ~45 chiavi); addibox salva anche `width` (debounce) e `perPage`. `pinned` mai salvato; `headerDrawer*` mai usati.

### Prop più usate

- PaginatedTable (129): `headers` 129, `items` 123, `filters` 119, `page` 117, `onfiltersChange` 116, `onpaginationChange` 116, `rowsPerPage` 115, `customSnippet` 84, `maxPage` 74, `searchBarVisible` 72 (64 a `false`), `filterAppendSnippet` 71, `onrowClick` 66, `rowActionsSnippet` 61 (tolto in 4.1.7, usato ancora da mufasa e new-vigipass), `lang` 60 (quasi sempre `it`), `searchBarColumns` 58, `editFilterMode` 34 (sempre `multi-edit`), `onsort` 18, `totalElements` 6, `loading` 2.
- SimpleTable (74): `items`/`headers` 74, `customSnippet` 66, variabili CSS 26, `rowActionsSnippet` 20, `onrowClick` 14, `appendSnippet` 12, `calculateRowStyles` 5, `resizableColumns` 3.
- DynamicTable (68): `rows` 65, `customRowSnippet` 62, `loading` 54, `onfetchData` 48, `totalRows` 46, `headersToShowInTable` 42, `rowAppendSnippet` 34, `filtersVisible` 33, `customizeHeaders` 27, `showSelect` 21, `numberOfResultsVisible` 20, `quickFilters` 19, `actionsForSelectedItems` 17, `cellEdit` 17, `unselectedItems` 15, `showExpand` 11, `customSubRowSnippet` 11, `subHeaders` 10.

### Header (2198 oggetti, 308 file, 21 app)

- Tipi: `custom` 1232 (56%), `string` 873, `number` 56, `date` 37 (36 con `dd/MM/yyyy`); `boolean`, `icon`, `checkbox` 0.
- Campi: `sortable` 1482, `width` 417 (quasi sempre in %, `'10%'` ×100), `minWidth` 235, `sortModify` 51, `maxWidth` 34, `cellEditorInfo` 9, `icon` 9, `pinned` 2, `info` 1, `locked`/`data` 0. `string.nullText` 71 (`'-'` 54, `'N/A'` 17).

### Pattern ripetuti nelle app

1. Salvataggio di colonne, ordine e larghezze: `populateHeaders` 53 volte, drawer rifatto a mano in 17 file.
2. Fetch e paginazione: stesso corpo in ~128 handler.
3. Celle custom con catene `{#if header.value == ...}`: 944 rami in 234 snippet (massimo 27 in uno).
4. Date formattate a mano in 96 celle custom su 234 (contro 37 `type: date`); valuta `€ …toFixed(2)` 23, booleano con `mdi-check` 31, chip di stato 33, bandiera/paese 53.
5. Colonna azioni: 160 snippet (bottoni icona, elimina 34, modifica 22).
6. Bottone "+ Nuovo" in `filterAppendSnippet`: 45 su 66.
7. Clic sulla riga che porta a una pagina (`goto`): ~53 degli 87 `onrowClick`.
8. Default ripetuti: `lang="it"` ~57, `editFilterMode="multi-edit"` ~25; variabili CSS ripetute (`--simple-table-default-header-background-color` 36).
9. Accodamento per lo scroll infinito: 27 file.
10. Export Excel generato dal backend da `XlsxHeader[]` mappati dagli header: 51 file in 5 app.

### Mai usate (candidate allo scarto)

- SimpleTable: `doubleClickActive`, `doubleClickDelay`, `onrowDoubleClick`, `headerLabelSnippet`, `stickyAppendSnippet`, `noDataSnippet`, `stickyMinContainerWidth`, `loading`.
- PaginatedTable: `filterLabels`, `hideActions`, `hideSelectAll`, `searchTimeoutDelay`, `selectedItemsTextSnippet`, `rowsPerPageOptions`, `footerSnippet`, `prependSnippet`, `multiEditTabs`, `uniqueKey`, `quickFiltersVisible`, `sortedBy`, `sortDirection`.
- Enhanced: `headerDrawerProps` e i tre snippet `headerDrawer*`; `pinnableColumns` 2.
- DynamicTable: `sectionRowsNumber`, `backward/forwardThresholdPixel`, `endLineVisible`, `useSelectedItemsOnly`, `quickActionsDisabled`, `pinnableColumns`, `headerDrawer*`, gli snippet `subHeader*`, `subRow*`, `selectionSnippet`, `itemLabelSnippet`, `chipLabelSnippet`, `searchBarSnippet`, `filterAppendSnippet`, `headerSnippet`, `onsort`.

## Bug e cose senza senso della v4 (da non portare)

- Qualsiasi mouseup nella pagina lancia `oncolumnResize` per tutte le colonne; `newWidthPx` senza padding, mappa bindable con padding.
- Colonne misurate anche senza `resizableColumns` e limitate a 60–400 px (`width` oltre 400 ignorata); layout sempre `fixed`.
- ResizeObserver mai scollegato (cleanup dentro una IIFE async).
- Paginated: selezione azzerata a ogni query (anche cambio pagina) ma `selectedAll` resta; shift-range senza aggiornare l'ancora; range "viewing 0 - 20 of 40" sbagliato di uno e solo in inglese, "Per pagina" solo in italiano; la ricerca non entra nel builder di `onpaginationChange`; nessuno riporta la pagina a 1 cambiando filtri o righe per pagina; una "query cambiata" divisa in tre eventi (`onpaginationChange`, `onfiltersChange`, `onsort`).
- Paginator: l'effetto riporta `page` a `maxPage` senza evento (genitore disallineato); prima/ultima scattano anche se ci sei già; senza `maxPage` "avanti" infinito.
- `date` con `null` va in crash; `icon` ignora il valore; `checkbox`/`number`/`boolean` senza rendering; `pinned` funziona solo se le colonne fissate sono le prime.
- `totalsSnippet` renderizzato sopra la tabella; `onrowDoubleClick` senza `onrowClick` lancia un errore; il doppio clic ritarda il clic di 250 ms.
- Dynamic: indice di riga relativo alla finestra (edit e snippet sulla riga sbagliata dopo lo scroll), `reachedBottom` con `===` sui pixel, ordinamento da sotto-header che ordina la tabella principale, editor `date` dichiarato ma non renderizzato, "Save"/"Cancel" fissi in inglese, `--main-header-height` scritta su `<html>`, `hideScrollbar` al contrario, default delle prop letti una volta sola; finestra di 100 righe che non è virtualizzazione.
- HeadersDrawer: precedenza `a || b ? x : y`, `)` mancante nel CSS, muta la prop `availableHeaders`, modifiche non salvate che restano alla riapertura; `onsaveHeadersToShow` passa `Header` con funzioni (non serializzabili).
- `$effect` + `lodash.isEqual`/`cloneDeep` che rileggono e riscrivono gli header (dovrebbe essere `$derived`); durante il resize un reflow forzato per colonna per mousemove.
- Accessibilità: niente `scope`, `aria-sort`, caption, `aria-busy`; tutti i `th` e `tr` con `tabindex=0`; checkbox di selezione senza label e con id duplicati; resizer solo col mouse; Paginator senza `<nav>`, `aria-label`, `aria-current`; Dynamic senza tastiera.
- Tutte le righe renderizzate, `{#each}` senza chiave; `Header`, `Action` e altri tipi non esportati.
