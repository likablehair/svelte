# Grafici: v4, prototipo, uso nelle app, scelta della libreria

Analisi del 2026-10-14 (uso nelle app raccolto da un subagente su 23 cartelle `frontend`). Le proposte che ne derivano sono in `SKILL.md` (P115–P119; le P105–P114, grafici SVG della libreria, sono state ritirate il 2026-10-14) e, una volta confermate, in `decisions.md`.

## Comportamento v4

`simple/charts/{BarChart,LineChart,PieChart}.svelte` (176, 163, 63 righe): wrapper sottili su chart.js 4 (`chart.js/auto` registra tutto) + `chartjs-adapter-date-fns` + `chartjs-plugin-zoom` (import dinamico) + `lodash`.
- Prop: `data` (`ChartData` di chart.js, passato tale e quale), `options` (`ChartOptions`, fuso con `lodash.merge` sui default), `resetZoom` (bindable, Bar/Line), `chart` (bindable, Pie), `...rest` sul `<canvas>`. Niente variabili CSS, niente callback.
- Default: tick di **entrambi gli assi nascosti**, legenda accesa, zoom a trascinamento su x acceso (pan con Ctrl), griglia y tratteggiata, `maintainAspectRatio: true` (Pie `false`), barre `categoryPercentage: 0.3`.
- Bug e stranezze:
  - l'`$effect` che crea il grafico legge `data` e `options`: ogni cambio ricrea il canvas (animazione da capo, zoom perso), poi un secondo `$effect` rifà `update()`;
  - `lodash.merge(defaultOptions, userOptions)` muta i default dell'istanza: un'opzione tolta dall'app resta;
  - i dati devono passare da `$state.snapshot()` (35/43 usi), altrimenti chart.js si rompe sui proxy di Svelte;
  - colori non tematizzati: il canvas non legge le variabili CSS, quindi dark mode e temi li gestisce ogni widget a mano;
  - `update`/`resize` patchati per non esplodere a canvas smontato; `setTimeout(40)` per il reset dello zoom;
  - `options` di LineChart obbligatoria ma `$bindable`;
  - niente SSR (canvas vuoto fino all'idratazione), niente accessibilità (canvas muto per gli screen reader, nessuna tastiera).
- Peso: chart.js ~70 KB gzip con `auto`, più lodash intero, l'adapter date-fns (0 usi) e il plugin zoom con hammerjs.

## Prototipo

Gruppo "14 Charts & dashboard" (`design/components-prototype.html` ~riga 1723), tutto in **SVG**:
- LineChart: card con KPI (`€ 48.920`, delta `▲ 12,4%` verde), sottotitolo, segmented 7g/30g/12m; linea a gradiente (primary → indigo → accent) con glow, area sfumata sotto, seconda serie tratteggiata grigia (anno prima), griglia orizzontale tratteggiata, linea verticale e punto sull'indice attivo, tooltip a card (`AGO 2026` / `€ 5.240`), etichette x in mono maiuscolo, legenda HTML sotto.
- BarChart: KPI + sottotitolo, barre verticali a gradiente (primary → accent), hover con opacità e glow.
- PieChart: **donut** con totale al centro (`1.284 servizi`), legenda a destra con colore, nome e percentuale.
- DashboardGridShaper / DashboardShaper: griglia di widget, modalità modifica con slot tratteggiati (fuori dal tema grafici, vedi sotto).

## Uso nelle app

21 app dipendono dalla libreria (11 v4, 10 v3); **11 disegnano grafici**.

| Componente | Tag/file | App |
|---|---|---|
| v4 `BarChart` | 32 | 6: addibox 4, astro 6, cbam 8, maya 8, mufasa 5, new-vigipass 1 |
| v4 `LineChart` | 6 | 2: cbam 2, mufasa 4 |
| v4 `PieChart` | 5 | 3: addibox 1, cbam 3, maya 1 |
| v3 `GanymedeBarChart` / `LineChart` / `PieChart` | 7 / 4 / 1 | emarket, lupette, ganymede |
| v4 `DashboardShaper` | 2 | addibox, stramoniumai (dentro un `StandardDashboard` usato da 4 pagine); altre 5 app hanno un loro DashboardShaper riscritto |

**Prop** (43 tag v4): `data` 43, `options` 34, `bind:resetZoom` 21 (5 app, sempre un bottone "reset zoom" nel titolo del widget), `width`/`height` 1. Mai: `bind:chart`, callback, `class`/`style`. mufasa (bloccata a 4.1.1) passa ancora le prop piatte v3 (`showXTicks`, `enableZoom`, ...), che finiscono sul `<canvas>`: i suoi 9 grafici sono rotti.

**Dati**: etichette sempre stringhe su asse a categorie (date già formattate dall'app), **nessun asse temporale**, un asse logaritmico. Chiavi: `backgroundColor` 43, `borderColor` 42, `tension` 29 e `fill:false` 23 (quasi sempre inutili su barre, li impone un tipo condiviso), `borderWidth` 18, `borderRadius` 6, `type:'line'` + `yAxisID` 2 (misti). Serie per grafico 1–4; in 13 file il trucco "una serie per riga con un solo valore + `stacked`" per avere un colore per barra. Punti: 4–24 di solito; righe illimitate (codici NC, paesi) in barre orizzontali dentro un div che scorre alto `labels.length * 40px` (14 file); fino a ~1.440 punti in una serie al minuto (lupette).

**Options**: `maintainAspectRatio:false` 31 (il grafico riempie il widget), `indexAxis:'y'` 17, `stacked` 12, tick riaccesi 29 (`ticks.callback` ridondante 27), tooltip `callbacks` 16, formato valuta/compatto 16, legenda quasi sempre spenta (posizione 5, `usePointStyle` 4), zoom personalizzato 7 (spento 1), `interaction: { intersect:false }` 13. Mai `onClick`/`onHover`, datalabels, annotation. Due hack globali (`Chart.defaults.resizeDelay`, plugin per l'hover delle barre orizzontali).

**Dark mode a mano ovunque**: 32/43 reagiscono a `$theme.dark`, 31/43 leggono le triplette `--global-color-*` con `getComputedStyle` per costruire stringhe `rgb()`, 22 generano palette `hsl(i*N, …)` che ignorano il tema, alcuni hex fissi.

**Librerie usate direttamente**: stramoniumai solo ApexCharts (3 donut con totale al centro, 3 barre impilate, area+area+linea su asse datetime con gradiente, previsione tratteggiata e linee di annotazione); addibox 1 grafico ApexCharts; ganymede svelte-chartjs (4 donut con clic → drill-down con `goto`). metanalysis e rex (non usano la libreria) hanno linee SVG fatte a mano.

**Tipi necessari** (istanze, libreria + dirette): barre 45 (18 orizzontali, ~15 impilate, ~5 affiancate), torta/donut 13 (8 donut), linee 13, barre+linea con secondo asse y 2, area+linea con annotazioni 1. Nessun radar, scatter, heatmap, gauge, sparkline. Export/stampa: 0. SSR: nessun `{#if browser}` attorno ai grafici.

## Alternative per la v5

| | SVG della libreria (nessuna dipendenza) | chart.js (come v4) | LayerChart | ApexCharts |
|---|---|---|---|---|
| Temi, light/dark | `fill`/`stroke` = `var(--…)`: cambiano da soli, anche a runtime | canvas: i token vanno risolti in JS e il grafico ridisegnato a ogni cambio | SVG: sì | SVG: sì |
| Aspetto del prototipo | esatto (gradienti, glow, tooltip a card, legenda HTML) | in parte (gradienti con opzioni scriptabili, tooltip HTML esterno) | sì, con lavoro | in parte, stile suo |
| SSR | disegnato sul server, niente salto | canvas vuoto fino all'idratazione | sì | no |
| Accessibilità | `role="img"`, tastiera, tabella per screen reader | canvas muto | parziale | parziale |
| API | convenzioni della libreria (prop, `locale`, `Intl`, callback) | `options` di chart.js, estranea al resto | composizione di componenti, molto ampia | oggetto `options` suo |
| Peso | solo il codice usato | ~70 KB gzip (+ zoom) | molti pacchetti d3 | ~130 KB gzip |
| Migrazione | `data` quasi uguale, `options` → prop (a giudizio, ma ogni widget oggi riscrive colori/dark a mano e quel codice sparisce) | quasi nulla | riscrittura | riscrittura |
| Costo per noi | il più alto: scale e tick, tooltip, legenda, zoom da scrivere | basso | medio | basso |
| Limite | ~migliaia di punti per serie (una serie è un solo `path`: 1.440 punti vanno bene) | decine di migliaia | come SVG | come SVG |

Raccomandazione iniziale (P105, ritirata): **SVG della libreria**. È l'unica che rispetta insieme temi a runtime solo con CSS, SSR, accessibilità, zero dipendenze e il prototipo; i tipi da coprire sono pochi (barre, linee/aree, torta/donut, misto barre+linea).

**2026-10-14, l'utente non vuole cambiare pacchetto** ("un gran bel lavorone"). Confronto rivisto: nessuna alternativa offre alle app qualcosa che serve e che chart.js non fa, tranne leggere le variabili CSS (vantaggio dell'SVG), che la libreria può risolvere una volta sola per tutti (P116). ApexCharts ha di serie donut con totale, annotazioni, toolbar dello zoom, aree a gradiente, ma pesa circa il doppio e obbliga a riscrivere 43 widget; ECharts fa tutto ma è il più pesante e ha un'API enorme; LayerChart è nativa Svelte ma è una riscrittura con molte dipendenze d3; uPlot è minuscola ma solo serie temporali. Nuovo piano: tenere chart.js (P115–P119).

## DashboardShaper

Fuori dai grafici: 2 app con quello della libreria, 5 con il loro. Analisi e proposte in `dashboard.md`.
