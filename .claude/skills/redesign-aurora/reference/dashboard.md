# Dashboard: v4, prototipo, uso nelle app

Analisi del 2026-10-14 (uso nelle app raccolto da un subagente sulle cartelle `frontend`). Le proposte P128–P141 (sotto) sono state **approvate il 2026-10-14** (voce in `decisions.md`), con spostamento solo su celle libere e `movable`/`resizable` per tornare al comportamento v4.

## Comportamento v4

**`composed/dashboard/DashboardShaper.svelte`** (551 righe + `.css` con 9 token `--dashboard-shaper-default-*`), generics `<Data, WidgetName extends string>`, `status: 'beta'` nelle docs.
- `Widget` = `{ id, name, height, width, left, top, data? }`, `left`/`top` da 1. `AvailableWidget` = `{ name, title, description?, icon, availableSizes: [altezza, larghezza][] }`.
- Prop: `layoutWidth` 6, `layoutHeight` 4, `bind:widgets`, `availableWidgetCells`, `bind:someRowSlotEmpty` (true se c'è un buco), `preview` (blocchi pieni al posto dei widget, per le miniature), `canAdd` (default **true**), `lang`. Callback `onaddWidgetCell` / `onremoveWidgetCell` con `{ widgetCell }` (la cella interna, non il Widget, anche se le docs dicono "Widget"). Snippet `widgetCellSnippet({ widgetCell & { title }, removeWidgetCell })`, `addWidgetButtonSnippet({ handleAddClick, slot })`, `widgetSelectionDialogHeaderSnippet()`.
- Griglia CSS `repeat(layoutWidth, 1fr)` × `repeat(layoutHeight, 200px)`, gap 4px. All'inizio di ogni sequenza di celle vuote uno slot "Add widget" alto 1 riga; se le righe usate sono meno di `layoutHeight`, una riga "add" a tutta larghezza. Il clic apre un Dialog col catalogo: per ogni voce un Chip "h x w" per ogni taglia che entra; gli id nuovi sono `createId()` di cuid2.
- **Nessun modo di spostare o ridimensionare** un widget: la taglia si sceglie solo all'aggiunta, per cambiarla si toglie e si rimette.
- Bug e stranezze:
  - `availableHeight` guarda solo la colonna dello slot e `availableWidth` solo la riga: il catalogo offre rettangoli che si sovrappongono in diagonale a un altro widget;
  - righe fisse: in sola lettura le righe vuote occupano spazio (stramoniumai e mufasa lo aggirano calcolando l'altezza);
  - sotto 800px della finestra `display: flex; column`: gli span si perdono e l'altezza non segue più le righe;
  - ordinamento del catalogo con `'Placeholder'` scritto in codice; taglie `[altezza, larghezza]` mostrate "h x w";
  - `{#each}` senza chiave, `lodash.isEqual`, import dal barrel `$lib`, dipendenza cuid2.

**`simple/dashboards/DashboardGridShaper.svelte`** (71 righe): demo su `svelte-grid` (trascina e ridimensiona) con due elementi finti, **nessuna prop**, **non esportato** da `index.ts`, 0 app. È "quello che ingrandisce e rimpicciolisce", ma non è mai stato un componente vero.

## Prototipo

Gruppo "14 Charts & dashboard" (`design/components-prototype.html` ~riga 1762, CSS ~riga 723):
- griglia a 4 colonne, righe da 76px, gap 10px; widget = card (`surface-solid`, bordo, `r-lg`, padding 14px) con titolo piccolo e valore grande; variante "hero" a gradiente con sparkline;
- **modalità modifica** (DashboardShaper): slot vuoti tratteggiati con "+" o "Aggiungi widget" (hover primary + `primary-soft`), X rossa in alto a destra che compare al passaggio, widget con bordo primary e anello `primary-soft` al passaggio, cursore `move`, nota "slot tratteggiati, hover per rimuovere, trascinamento per riordinare".

## Uso nelle app

Sette app hanno uno shaper; tutte salvano su backend (`/dashboards`, Adonis), **nessuna** in localStorage.

| App | Origine | Note |
|---|---|---|
| addibox (4.2.5) | libreria | `StandardDashboard` (4 pagine: home in lettura, lista con `preview`, nuova, modifica); overlay "cestino" fatto dall'app; dati per widget da `POST /widgets/:id/calculateWidgetData`; catalogo 7 tipi, taglie alte 2 e larghe 2/3/4/6 |
| stramoniumai (^4.2.5) | libreria | come addibox; `layoutHeight` calcolato (righe usate, + altezza massima di un widget in modifica); catalogo 6 tipi filtrato per permessi |
| cbam (4.3.2) | copia (antenata della libreria, stesso algoritmo riga per riga) | 18 tipi; due usi statici (griglia 3×2 senza modifica) |
| astro (^4.1.6), maya (4.1.2) | copia (Editor identico) | astro solo lettura, layout da un comando backend; maya due usi statici (1×1, 3×1) e `--dashboard-shaper-min-height` |
| ganymede (3.3.32), mufasa (^4.1.1) | copia Svelte 4 / migrata | catalogo con filtri per categoria (ganymede), `layoutHeight` illimitato e ricarica di un widget (mufasa) |

- Le copie hanno breakpoint 600px (mufasa 991.98px), gap 0, campo `componentName` al posto di `name`; ognuna ha un `DashboardEditor` che fa da wrapper (catalogo, dati, overlay di cancellazione).
- **Salvataggio disabilitato se `someRowSlotEmpty`** in tutte le app: i buchi non sono ammessi.
- addibox e stramoniumai: il backend cancella e ricrea i widget con `updateOrCreateMany(..., ['name'])`: due widget con lo stesso `name` si perdono, di fatto ogni tipo una volta sola.
- Forma salvata: `{ id?, name | componentName, height, width, left, top }` (+ `settings`/`options`, `userId`, `active` a seconda dell'app). È il **contratto con i backend**: non si cambia.
- Variabili CSS usate: `widget-height` (miniature `calc(340px/12)`, 188/198px, 250px, 150px), `widget-preview-border-radius` 2px, `gap`, `min-height` (copia di maya).
- Altri "dashboard" (lupette `DashboardView`, epass/new-vigipass `Template`, rex) sono griglie CSS statiche, non shaper.
- Librerie di griglia o drag: gridstack, muuri, interactjs 0; `svelte-grid` e `sortablejs` solo nel `package.json` della libreria (0 app; `svelte-grid` già in `droppedDependencies`).

## Proposte (2026-10-14, approvate)

| # | Proposta | Nota |
|---|---|---|
| P128 | **Un solo componente `DashboardShaper`** (nome tenuto, è il nome usato da 7 app) che mostra, modifica, sposta e ridimensiona; **DashboardGridShaper non si porta** (demo, non esportato, 0 app) | `MIGRATION.md` lo cita in "Not ported" |
| P129 | Forma dei widget **invariata**: `{ id, name, width, height, left, top, data? }` con `left`/`top` da 1; generics `<Data, WidgetName>` tenuti | contratto coi backend di 7 app |
| P130 | `bind:editing` al posto di `canAdd`: acceso = slot "+", X, trascinamento, maniglia; spento = sola lettura. **Default spento** (v4 `canAdd` acceso) | scostamento: le app che contano sul default devono passare `editing`; la migrazione lo aggiunge dove `canAdd` mancava |
| P131 | **Spostare**: trascinamento a puntatore (mouse e touch) sul widget, anteprima tratteggiata della destinazione (rossa se occupata), rilascio solo su celle libere, scambio se il widget di arrivo ha lo stesso ingombro; gli altri non si spostano mai da soli | niente "spinta" alla gridstack: più codice e widget che si muovono a sorpresa; il modello a buchi è quello della v4 |
| P132 | **Ingrandire e rimpicciolire**: maniglia nell'angolo in basso a destra che scatta tra le `sizes` del catalogo che entrano nello spazio libero; niente maniglia se il tipo ha una sola taglia | la funzione che oggi richiede "togli e rimetti" |
| P133 | Tastiera come ColumnManager: in modifica ogni widget è focusabile, frecce = sposta di una cella, Shift+frecce = taglia successiva/precedente, Canc = rimuovi; annunci `aria-live` dal `locale`; slot vuoti = bottoni | la v4 non aveva tastiera |
| P134 | Catalogo `catalog` (ex `availableWidgetCells`): `{ name, title, description?, icon (path SVG), sizes: { width, height }[] }` (ex `availableSizes` `[altezza, larghezza]`), taglie mostrate "L × A"; solo le taglie che entrano davvero (corregge la sovrapposizione in diagonale); ordine quello dato dall'app (tolto l'hack `'Placeholder'`); Dialog su desktop, foglio dal basso su telefono | rinomina + forma delle taglie: regola di migrazione con avviso (le taglie calcolate non si convertono a macchina) |
| P135 | Catalogo, aggiunte opzionali: `category` (schede quando ce ne sono almeno due, dalla copia di ganymede) e `unique` (il tipo sparisce dal catalogo se è già nella dashboard: i backend di addibox e stramoniumai salvano per nome) | nuove |
| P136 | `rows` opzionale (ex `layoutHeight`, v4 4 fisse): **senza limite di default**; in lettura solo le righe usate, in modifica in fondo una fascia libera alta quanto la taglia più alta del catalogo (logica di stramoniumai), fermandosi a `rows` se c'è | scostamento del default; corregge le righe vuote in lettura |
| P137 | Aspetto della modifica dal prototipo **disegnato dalla libreria**: slot tratteggiati con "+", X al passaggio e al focus, bordo primary con anello, maniglia, cursore `move`. La cella del widget resta **nuda** come la v4 (il contenuto è dell'app, che ha già le sue card) | sostituisce gli overlay "cestino" che ogni app disegna; `widgetSnippet` riceve `remove` per chi vuole il suo |
| P138 | Una sola `onchange({ widgets, added, removed, changed })` con i Widget, al posto di `onaddWidgetCell`/`onremoveWidgetCell` (che passavano la cella interna) | come FileInputList |
| P139 | `bind:someRowSlotEmpty` → `bind:hasEmptySlots` (solo lettura) | rinomina; tutte le app lo usano per bloccare il salvataggio |
| P140 | Contenitore stretto: sotto **640px del contenitore** (v4 800px della finestra; prop `stackBelow`) una colonna in ordine riga per riga, ogni widget alto `height` righe (la v4 perdeva le altezze); in modifica solo aggiungi in fondo e rimuovi | scostamento del breakpoint (stesso di tabelle e filtri) |
| P141 | Default visivi e resto: riga 200px tenuta come `--dashboard-shaper-row-height` (ex `widget-height`), gap da 4px al token di spaziatura del prototipo (~10px), `preview` tenuta (miniature), snippet `widgetSnippet({ widget, item, editing, remove })` (ex `widgetCellSnippet`), `slotSnippet({ width, height, add })` (ex `addWidgetButtonSnippet`), `catalogHeaderSnippet` (ex `widgetSelectionDialogHeaderSnippet`) + `catalogItemSnippet`; `locale` (ex `lang`); id nuovi con `crypto.randomUUID` (via cuid2 e lodash) | gap: scostamento d'aspetto |
