# SimpleTimeLine: v4, prototipo, uso nelle app (analisi del 2026-10-14)

## v4 (`src/lib/components/simple/timeline/SimpleTimeLine.svelte`, 248 righe + `SimpleTimeLine.css`)

- **Prop** (nessuna `$bindable`, nessuna callback): `items: TimeLineItem<Data>[]` (`{ name, title?, description?, imageUrl?, from?, to?, data? }`, tipo dichiarato nel modulo ma **non esportato**; generico `Data`), `singleSided` (false = alternata), `circleAlignment` `top|center|bottom` (default `top`). **Snippet**: `itemSnippet({ item, alignment })` (sostituisce tutto il corpo), `timesSnippet({ item, dateToString })`, `infosSnippet({ item, alignment })`, `infosAppendSnippet({ item, alignment })`, `circleSnippet({ item })`. `alignment` = lato del contenuto ('right' per gli indici pari in alternata, sempre 'left' con `singleSided`).
- **Variabili**: `--simple-time-line-{gap 16px, line-background background-200, line-width 2px, circle-width/height 12px, circle-background-color primary-500, height, width}`. Le docs elencano anche `divider-width` (48px), `central-line-left`, `body-width`, ma sono inline sul root: **non sovrascrivibili**. `default-height`/`default-width` non definite.
- **Aspetto**: linea grigia piena su tutta l'altezza (oltre primo e ultimo pallino), pallino pieno primary con `z-index: 5`. Titolo 16pt/700, descrizione 10pt, date 9pt/200 in una colonna a sinistra su due righe (from e to senza separatore).
- **Bug**: `name` obbligatorio ma mai mostrato; `imageUrl` mai letto; `{#each}` senza chiave; `circleAlignment` finisce in `align-items: top|bottom` (valori non validi: con `bottom` il pallino resta in alto); `dateToString` senza locale (sempre italiano con maiuscola, **senza ora**, nessuna prop per cambiarla); solo `<div>` (niente `<ol>`, `<time>`); alternata 50/50 anche su mobile; `timesSnippet` riceve la utility invece del testo.

## Prototipo (gruppo "15 Common & utility", riga ~1806)

- Una colonna, `max-width` 420px, `padding-left` 30px. Linea a `left: 10px`, 2px, gradiente `primary → accent → border`, si ferma ai pallini (`top`/`bottom` 6px).
- Pallino 12px vuoto (`bg-2` + bordo 2px primary). **Stati**: `done` = pieno primary + anello 4px `primary-soft` + glow; `now` = accent pieno + `pulse` 1.8s; futuro = vuoto.
- Item con `padding-bottom` 22px. `<time>` mono 11px `text-3` **sopra** il titolo ("09:30", "ORA"); titolo 600; descrizione 13px `text-2` opzionale.

## Aurora oggi

- Utili: `Icon`, `Chip`, `Divider` con `label`, `NoData`, `Tooltip`, `observeWidth`, `inheritedLocale` + `libraryTexts`, formattazione `Intl` con `toDate` (accetta luxon) in `utils/table/values.ts` (non esportata). Token `primary-soft`, `primary-glow`, `accent`, `font-family-mono`, `duration` già presenti.

## Uso nelle app (conteggio del 2026-10-14)

- **10 tag in 10 file / 9 app, solo 4 usi vivi**: 8 file sono copie di un wrapper `StandardSimpleTimeline.svelte` (una tutta commentata, 6 non importate da nessuno, solo evote usata 2 volte), più stramoniumai 2.
- **Prop**: `items` 10; `singleSided` 10 (nei 4 vivi sempre `true`: l'alternata non la usa nessuno); `circleAlignment` 1 (`center`).
- **Snippet**: `itemSnippet`/`slot="item"` **10/10**; `circleSnippet` 1; gli altri 0. **Variabili CSS: 0.** Il contenuto di default non lo usa nessuno.
- **Campi**: `name` 10 (sempre usato come titolo visibile, fallback 'N/A'), `from` 10, `to` 8, `data` 10, `description` 2, `title` 0, `imageUrl` 0. 6 copie passano prop della v1 tolte (`circleColor`, `circleDiameter`, `timesWidth`, `firstItemMarginTop`), ignorate in silenzio.
- Versioni: slot e `on:` in 6 copie; Svelte 5 in cbam, new-vigipass, stramoniumai.
- **Pattern fatti a mano**: date sempre riformattate (luxon `it` giorno + mese corto + ora, "from - to" in colonna di 190px; `Intl` `it-IT` con icona calendario); titolo = prefisso + `name` in grassetto; azioni sotto il contenuto (Elimina/Modifica, anteprima, "N campi modificati" espandibile); badge colorato per tipo a destra del titolo; **contenuto in card** (2/2 in stramoniumai); **separatori di giorno** con item sentinella `name: '__separator__'` e `circleSnippet` vuoto; ordinamento a mano; stato vuoto a mano.
- **Bug trovati**: evote stampa "Invalid DateTime" se manca `data.officialDate`, comparatore che restituisce 0 senza data; stramoniumai usa `--global-text-color-500/600` (inesistenti), separatori con colori scuri fissi, `Icon` cliccabile senza tastiera, wrapper `isolation: isolate` per contenere lo `z-index: 5` dei pallini.

## Proposte (P142–P156, 2026-10-14)

- **P142** Nome `Timeline` (come `ToolTip` → `Tooltip`), con regola di migrazione. Cambio (rinomina).
- **P143** Aspetto del prototipo: una colonna, linea che si ferma ai pallini con gradiente `primary → accent → border`, pallino vuoto, ora/data mono sopra il titolo, titolo 600, descrizione 13px, niente `z-index`. Cambio di aspetto (si perdono linea grigia, pallino pieno, titolo 16pt, colonna delle date a sinistra).
- **P144** Default a una colonna; `alternate` per la vista alternata, che sotto 640px del contenitore torna a una colonna; `singleSided` tolta (la migrazione la toglie e aggiunge `alternate` dove mancava). Cambio di default (0 usi vivi dell'alternata).
- **P145** Item `{ key?, title, description?, from?, to?, time?, status?, icon?, variant?, data? }`: `title` è il testo mostrato, `name` → `title` nella migrazione, `key` facoltativa per l'`{#each}`, `imageUrl` tolto, `time` etichetta libera che vince sulla data ("ORA"). Cambio.
- **P146** Date dal `locale` via `Intl`: giorno + mese corto + anno, ora solo se non è mezzanotte; `dateFormat` per forzarlo; `from`–`to` su una riga con `formatRange`. Cambio (oggi italiano fisso, senza ora, due righe).
- **P147** `status: 'done' | 'current' | 'upcoming'` con i tre aspetti del prototipo; `pulse` spento con reduced-motion, `aria-current="step"`, stato letto dal `locale`. Aggiunta.
- **P148** Pallino per item: `icon` (path SVG) e `variant` (`primary`/`success`/`warning`/`error`/`neutral`). Aggiunta.
- **P149** `circleAlignment` → `markerAlignment`, con `bottom` corretto. Cambio (rinomina + bug).
- **P150** Snippet: `itemSnippet({ item, index, side })`, `markerSnippet` (ex `circleSnippet`), `timeSnippet({ item, text })` (ex `timesSnippet`), `contentSnippet` (ex `infosSnippet`), `titleSnippet`, `descriptionSnippet`, `appendSnippet` (ex `infosAppendSnippet`), `asideSnippet` a destra del titolo. Cambio per le rinomine, aggiunta per i nuovi.
- **P151** `groupBy` (`'day'` o funzione) con intestazione `Divider label` e `groupSnippet`, al posto degli item sentinella. Aggiunta.
- **P152** `variant="card"`: contenuto di ogni item in una card. Aggiunta.
- **P153** Stato vuoto: `empty` dal `locale` + `emptySnippet`, con NoData. Aggiunta.
- **P154** Semantica `<ol>`/`<li>`, `<time datetime>`, pallino `aria-hidden`. Aggiunta.
- **P155** Variabili `--timeline-*` (`gap`, `line-color`, `line-width`, `marker-size` unica, `marker-color`, stati, `time-*`, `title-*`, `description-*`); tolte `height`/`width` (si usa `class`) e le tre interne. Cambio (0 usi, basta la regola).
- **P156** Esportare `TimelineItem`. Aggiunta.
