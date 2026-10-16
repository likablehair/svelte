# Migrazione delle app v4 → v5: studio del 2026-10-15

Richiesta dell'utente (2026-10-15): "va studiato un metodo per fare la migrazione in maniera semplice senza che uno conosca tutto quanto". Questo file raccoglie i dati misurati e la proposta P211–P219, **approvata il 2026-10-15** con due modifiche (wrapper `Standard*` sciolti, P217 confermata). Sostituisce P42.

## Dati: come le app usano la v4 (misurati il 2026-10-15)

23 frontend in `~/Documents/progetti/*/frontend`; **metanalysis** e **rex** non usano la libreria; **biblio-smart-folder** è un secondo checkout di biblio. Restano **20 progetti**.

| app | lib | svelte | kit | pm | TW | file | comp. | `.detail` | `mdi-` | token v4 | style prop |
|---|---|---|---|---|---|---|---|---|---|---|---|
| addibox | 4.2.5 | 5.19 | 2.25 | npm | 3 | 324 | 43 | 336 | 707 | 965 | 609 |
| astro | 4.1.6 | 5.0 | 2.5 | npm | 3 | 155 | 36 | 99 | 272 | 454 | 350 |
| biblio | 4.3.1 | 5.56 | 2.68 | pnpm | 4 | 52 | 27 | 23 | 128 | 338 | 163 |
| billboards | 3.0.44 | 4.2 | 2.0 | npm | 3 | 35 | 20 | 21 | 47 | 70 | 87 |
| cbam | 4.3.2 | 5.0 | 2.5 | npm | 3 | 182 | 34 | 123 | 467 | 865 | 626 |
| contattorapido | 4.3.1 | 5.55 | 2.59 | pnpm | 4 | 66 | 26 | 29 | 171 | 402 | 210 |
| emarket | 3.2.6 | 4.2 | 2.0 | npm | 3 | 35 | 21 | 61 | 46 | 69 | 109 |
| epass | 3.3.18 (installata 4.1.2) | 4.2 | 2.5 | npm | 3 | 169 | 27 | 133 | 230 | 353 | 234 |
| ermes | 3.3.15 | 4.2 | 2.0 | npm | 3 | 34 | 24 | 27 | 41 | 58 | 102 |
| forlimusica | 3.1.42 | 4.2 | 2.0 | npm | 3 | 9 | 7 | 2 | 19 | 7 | 32 |
| ganymede | 3.3.32 | 4.2 | 2.0 | npm | 3 | 226 | 35 | 227 | 388 | 557 | 543 |
| h24 | 3.3.5 | 4.2 | 2.0 | npm | 3 | 43 | 22 | 50 | 64 | 121 | 114 |
| likable-tools | 3.3.32 | 4.2 | 1.5 | npm | 3 | 31 | 21 | 10 | 56 | 76 | 51 |
| lupette | 3.3.10 | 4.2 | 2.48 | npm | 3 | 112 | 35 | 65 | 192 | 605 | 223 |
| maya | 4.1.2 | 5.0 | 2.5 | npm | 3 | 224 | 44 | 168 | 444 | 804 | 513 |
| mufasa | 4.1.1 | 5.0 | 2.5 | npm | 3 | 145 | 34 | 94 | 266 | 249 | 215 |
| new-vigipass | 4.1.2 | 5.0 | 2.5 | npm | 3 | 169 | 31 | 100 | 208 | 300 | 233 |
| quantum | 3.3.25 | 4.2 | 2.0 | npm | 3 | 47 | 25 | 53 | 106 | 180 | 183 |
| stramoniumai | 4.2.5 | 5.41 | 2.50 | npm | 3 | 340 | 43 | 270 | 1179 | 2997 | 1185 |
| tatum | 4.3.1 | 5.56 | 2.68 | pnpm | 4 | 28 | 23 | 22 | 37 | 69 | 74 |

Totali: 2.426 file che importano la libreria, 6.053 tag; `.detail` 1.913; stringhe `mdi-` 5.068 (3.040 negli attributi, 1.188 in oggetti dati `icon: 'mdi-…'`, 451 `<Icon name={espressione}>`); token colore v4 9.539 + override `--global-color-light/dark-*` 1.949 (ganymede 936); style prop 5.856 (742 con valore `{…}`; icon 2.290, button 897, simple-textfield 798); `theme` in 19 app (`$theme.dark` 208 volte, funziona ancora in v5); **FilterBuilder in 19 app, 727 file** (stessa API e stesso `toJson()` in v5: nessun cambio); `Converter`/`FilterConverter` 12 app.

- **10 progetti su 20 sono su lib v3 + Svelte 4** (billboards, emarket, epass, ermes, forlimusica, ganymede, h24, likable-tools con Kit 1.5, lupette, quantum): sui tag della libreria 573 `on:`, 577 `slot="`, 29 `let:`; importano nomi che la v4 non ha più (`Card` 4 app/33 file, `Ganymede*Chart` 3 app, `TreeEditor`).
- **Wrapper locali `Standard*`**: 297 file in tutte le 20 app, importati da **1.365 file**; stesso insieme ovunque (dal template): StandardTextfield/Autocomplete (20 app), Button, Dialog, Select, Chip, Checkbox, Switch, Textarea (19), TabSwitcher (18). Fissano style prop e token, inoltrano `{...rest}` (140 spread). Sono il punto con più leva: migrati loro, gran parte dell'app non vede la libreria.
- `ComponentProps<typeof X>`: 807 usi (PaginatedTable 244, DynamicTable 178).
- Import profondi: 81 (55 percorsi relativi in `node_modules`, 26 `@likable-hair/svelte/dist/…`), per tipi interni (Filter, Header, Column…).
- `activator=` con riferimenti a elementi: 183. `$theme.colors` (rotto): 12 usi in cbam.
- Nessuna app ha test dei componenti: la rete di sicurezza sono `svelte-check` e l'occhio.
- Componenti v4 mai usati in nessuna app: MonthSelector, YearPickerTextField, FileInput, VerticalSwitch, VerticalTextSwitch, Breadcrumb, Navigator, DynamicFilters, QuickActions, InfiniteScroll, CollapsibleDivider, PeriodSelector.

## Dati: cosa coprono le regole scritte

- 61 file, 65 componenti. Prop: removed 219, renamed 109, changed 70, types 41, defaults 38, toCssVar 31, icons 12, inverted 9, values 9. Eventi: changed 112, removed 31. Snippet: parameters 68, removed 60, renamed 36. Variabili CSS: removed 792, renamed 408, changed 70.
- **Nessun componente è solo meccanico**: tutti hanno almeno un passo `manual` (2–17, mediana 4); 336 passi manuali (37 per app), più 21 in `global.ts`.
- Meccaniche davvero: rinomine di prop/snippet/variabili (molte con `note` che può dire "solo in certi casi", e il dato non lo distingue), `inverted`, `defaults` con `keepV4`, `.detail` nei gestori inline, icone letterali, `rgb(var())`. Solo segnalabili: `removed`, `changed`, `types`, token per ruolo (7 su 16 con più destinazioni).
- Buchi del formato (tutti ancora presenti): `when` solo in OR (niente AND né "prop assente"), `replacement` è testo libero, regole ereditate con `forwarded()` (servono TS a runtime, id rinominati), valori dentro prop oggetto, "non più bindable" solo in prosa, 10 fusioni molti→uno (es. tre eventi di FileInput → `onchange`) che generano attributi duplicati, forme dei dati (`headers` → `columns`) solo in prosa, nessuna fase (i passi globali presumono la v4 già tolta).
- `MIGRATION.md`: 1.927 righe, scritto a mano, sezioni col nome v5 (PaginatedTable si trova solo dentro DataTable), nessun id dei passi, nessun test di allineamento con le regole. Per sapere cosa tocca un'app bisogna leggerlo quasi tutto.
- Test `migrations.test.ts`: controlla nomi v5 esistenti, file per componente, id unici; non controlla nomi v4, `when`, `values`, `defaults`, allineamento con MIGRATION.md.

## Dati: coesistenza v4 + v5 nella stessa app (alias npm lato app)

Possibile ma con costi: 102 variabili `--*-default-*` dichiarate da entrambe (la v4 senza layer vince: i componenti v5 prendono i valori v4), 39 variabili di istanza in comune; Esc in un Dialog v5 chiude anche un Dialog v4 aperto (keyboarder v4 su `document`); Dialog/Drawer v4 inerti e sotto un modale v5; toggle del modo non sincronizzati (`.dark` v4, `data-mode` v5; stessa chiave `theme` in localStorage); SSR mobile in v4, desktop in v5; le dipendenze della v4 restano e nascondono il passo "aggiungi luxon, lodash…". Servirebbe una 4.x di manutenzione (default con scope, Esc) più un ponte per il tema. La decisione del 2026-10-08 (P10) scartava l'alias per la **pubblicazione**; un alias lato app va comunque chiesto.

## Decisione (ex P211–P219, approvata il 2026-10-15)

Idea guida: **nessuno deve conoscere tutto**. Le regole le sa lo strumento; lo sviluppatore (o Claude) vede solo il prossimo punto, nel file in cui si trova, con cosa fare, perché, un esempio prima/dopo e il link alla pagina v5. L'app torna verificabile (`svelte-check`) a ogni fase.

| # | Proposta | Nota |
|---|---|---|
| P211 | **Un comando a fasi**: `npx @likable-hair/svelte-migrate` (pacchetto separato in `aurora/migrate/`, legge le regole compilate). Fasi (**nessun commit**: decisione del 2026-10-15, i commit li fa l'utente): (0) controllo (git pulito, versioni; app su Svelte 4 → P216); (1) **setup** automatico: v5 al posto della v4, riga dei layer, `setDefaultLocale`, tema, `v4-compat.css`, `@mdi/js`, le dipendenze che arrivavano dalla v4; (2) **codemod meccanico**; (3) **lista dei punti rimasti** per file; (4) pulizia facoltativa (token v4 → v5, via il compat). Comandi: `analyze` (solo lettura: rapporto e stima per l'app), `run`, `status`/`next` | parser di Svelte + magic-string; deterministico e **rigiocabile**: rilanciato sugli stessi file dà lo stesso risultato e non tocca ciò che ha già cambiato |
| P212 | **Il grosso lo fa la macchina**: `.detail` nei gestori, tutte le stringhe `'mdi-*'` del codice (anche nei dati, → import da `@mdi/js`) con `name` → prop v5 su Icon, rinomine di componenti/prop/snippet/variabili CSS, prop invertite, default v4 dove servono (`keepV4`), `rgb(var(--x))`. FilterBuilder (727 file) e `$theme.dark` non cambiano | i token colore (11.500 usi) li copre il compat (P213): zero modifiche obbligatorie al CSS dell'app |
| P213 | **`v4-compat.css` nei due sensi** (estende P40, approvata): i nomi v4 continuano a funzionare nel CSS dell'app, e i token di brand e di stato della v5 (`primary`, `secondary`, `error`…) si prendono dagli override `--global-color-light/dark-*` dell'app, così ogni app tiene i suoi colori senza toccare nulla | le superfici e i testi restano quelli del tema v5 |
| P214 | **Lista dei punti rimasti = `svelte-check` + regole**: dopo il codemod i tipi stretti della v5 segnalano ogni uso sbagliato; lo strumento abbina ogni errore e ogni passo `manual` alla regola che lo spiega e mostra solo quelli del file, più un elenco delle **pagine da guardare** (route che usano i file toccati), visto che le app non hanno test. **Wrapper `Standard*` (modifica dell'utente)**: non servono più salvo casi estremi; si **sciolgono**: ogni uso diventa il componente della libreria, del suo stile fisso si tengono solo le misure di layout, il resto (colori, padding, raggi, ombre) si toglie e si elenca nel rapporto (decisione "Stile dei wrapper sciolti", 2026-10-15), le prop del wrapper si traducono in quelle del componente; un wrapper con logica vera (che la libreria non ha) si segnala e resta solo se strettamente necessario | sostituisce la lettura di MIGRATION.md; i wrapper sono 297 file importati da 1.365 |
| P215 | **Due modi, stesso motore**: a mano con `next`; con Claude Code tramite un **server MCP** sottile (analizza, applica, prossimo punto, spiega la regola, docs v5 del componente, svelte-check) e un **prompt** versionato che lo usa. Chi migra rivede i diff e guarda le pagine | è P42 rivista: codemod e lista sono il centro, MCP e prompt uno strato sopra |
| P216 | **App su lib v3 + Svelte 4** (10 su 20): prima `npx sv migrate svelte-5` (strumento ufficiale, per il codice dell'app), poi il nostro strumento capisce anche la sintassi v3 sui componenti della libreria (`on:x`, `slot="x"`, `let:`) e salta la v4; `Card`, `Ganymede*Chart`, `TreeEditor` finiscono nella lista | senza questo servirebbe una migrazione v3 → v4 che nessuno ha scritto |
| P217 | **Niente coesistenza v4 + v5**: ogni app si migra tutta su un branch, poi si ritesta tutto (confermato dall'utente) | niente alias né 4.x di manutenzione |
| P218 | **Regole leggibili dalla macchina dove oggi sono prosa**: `when` con AND e "prop assente", `replacement` strutturato, fusioni molti→uno, valori in prop oggetto, "non più bindable", fasi; regole compilate in JSON (niente `forwarded()` a runtime); la parte per componente di MIGRATION.md **generata** dalle regole, con gli id dei passi e un test di allineamento | lavoro sui 61 file esistenti, guidato dal pilota |
| P219 | **Pilota prima di tutto**: `analyze` sulle 20 app (solo lettura, dà il costo vero per app), poi una app piccola su v4 (tatum: 28 file, Svelte 5.56), poi una media (contattorapido o biblio), poi le grandi; si automatizza di più ciò che il pilota mostra frequente | ordine di costruzione: `analyze` → codemod → lista → MCP e prompt; pipeline di rilascio dopo |

## Piano (dopo l'approvazione)

Regola: **commit prima di ogni lavoro di migrazione** nel repo della libreria; nelle app si tocca qualcosa solo con il loro repo tutto committato e con l'ok dell'utente per quell'app, e **non si committa mai** (lo fa l'utente). Gli strumenti in sola lettura (`analyze`) si possono lanciare su tutte le app senza chiedere.

Stato: passi 1–4 fatti il 2026-10-15 (sezione sotto); passo 5 in corso su tatum: setup fatto, codemod meccanico fatto (prima parte, `history.md`), default v4 decisi (solo comportamento); scioglimento dei wrapper fatto e applicato su tatum, anche dei `LabelAnd*` (2026-10-16); lista dei punti rimasti fatta (`next`/`status`, `migration_next`/`migration_status`, 2026-10-16); restano la rimozione degli altri componenti locali resi inutili dalla v5 (decisione del 2026-10-16, indagine in corso) e la prova a mano su tatum con `next`.

1. **Pacchetto** `aurora/migrate/` (`@likable-hair/svelte-migrate`): `package.json` suo, `bin`, dipendenze `svelte` (parser) e `magic-string`; test nel progetto node di aurora o suo.
2. **Regole compilate** (prima parte di P218): uno script che importa `migrations/v4-to-v5/*.ts` e scrive un JSON unico (con i `forwarded()` risolti), che il pacchetto legge.
3. **`analyze <cartella app>`** (sola lettura): versioni (lib, Svelte, Kit, pm), fase 0 necessaria (v3/Svelte 4), componenti v4 usati con i file, per ogni uso le regole che scattano davvero (prop rinominate/tolte, passi `manual` con `when`), wrapper `Standard*` (sottili o con logica, quanti file li importano), icone (letterali, nei dati, dinamiche), `.detail`, token v4, style prop, import profondi, `ComponentProps<typeof X>`; stima meccanico/manuale. Uscita Markdown + JSON.
4. **`analyze` su tutte le 20 app** e tabella riassuntiva da mostrare all'utente, che conferma il pilota.
5. Poi, con l'ok: setup + codemod meccanico + scioglimento dei wrapper sul pilota (tatum), lista dei punti rimasti, prova a mano; poi MCP e prompt.

## Analisi del 2026-10-15 (`npm run migrate -- analyze`, sola lettura)

`auto` = lo farà il codemod; `check` = meccanico con avvertenza (svelte-check ne indica gran parte); punti manuali = coppie file × passo che chiedono giudizio; generali = cambi di comportamento o aspetto, uno per componente usato; passi app = rilevati come necessari (+ da guardare).

| app | lib | Svelte | fase 0 | file | usi (diretti + wrapper) | wrapper (con logica) | auto | check | punti man. | generali | passi app |
|---|---|---|---|---|---|---|---|---|---|---|---|
| addibox | 4.1.2 | 5.36 | no | 324 | 821 + 266 | 27 (22) | 841 | 1174 | 610 | 67 | 14 (+25) |
| astro | 4.1.6 | 5.25 | no | 155 | 314 + 142 | 36 (25) | 336 | 720 | 347 | 55 | 14 (+22) |
| biblio | 4.3.1 | 5.56 | no | 52 | 120 + 29 | 14 (7) | 113 | 184 | 69 | 43 | 10 (+14) |
| billboards | 3.2.3 | 4.2 | Svelte 4 + v3 | 35 | 98 + 34 | 12 (6) | 111 | 134 | 71 | 31 | 10 (+13) |
| cbam | 4.3.2 | 5.40 | no | 182 | 492 + 245 | 27 (24) | 511 | 982 | 475 | 56 | 12 (+22) |
| contattorapido | 4.3.1 | 5.55 | no | 66 | 163 + 74 | 15 (9) | 183 | 207 | 119 | 42 | 10 (+18) |
| emarket | 3.2.6 | 4.2 | Svelte 4 + v3 | 35 | 73 + 50 | 15 (10) | 104 | 164 | 112 | 41 | 10 (+16) |
| epass | 4.1.2 | 5.43 | no | 169 | 375 + 379 | 28 (18) | 500 | 629 | 574 | 43 | 14 (+15) |
| ermes | 3.3.5 | 4.2 | Svelte 4 + v3 | 34 | 66 + 42 | 13 (8) | 73 | 137 | 103 | 35 | 11 (+14) |
| forlimusica | 3.1 | 4.2 | Svelte 4 + v3 | 9 | 27 + 2 | 2 (2) | 29 | 44 | 18 | 11 | 8 (+9) |
| ganymede | 3.3.32 | 4.2 | Svelte 4 + v3 | 223 | 511 + 372 | 23 (15) | 610 | 910 | 550 | 50 | 15 (+19) |
| h24 | 3.3.5 | 4.2 | Svelte 4 + v3 | 43 | 88 + 52 | 15 (10) | 114 | 172 | 118 | 36 | 12 (+13) |
| likable-tools | 3.3.32 | 4.2 | Svelte 4 + v3 | 31 | 69 + 23 | 13 (6) | 75 | 122 | 55 | 33 | 12 (+13) |
| lupette | 3.3.12 | 4.2 | Svelte 4 + v3 | 112 | 224 + 138 | 18 (12) | 231 | 338 | 200 | 57 | 12 (+19) |
| maya | 4.1.2 | 5.38 | no | 224 | 506 + 267 | 54 (42) | 529 | 1032 | 527 | 67 | 14 (+25) |
| mufasa | 4.1 | 5.0 | no | 145 | 262 + 89 | 31 (21) | 256 | 305 | 184 | 53 | 12 (+18) |
| new-vigipass | 4.1.2 | 5.0 | no | 169 | 269 + 361 | 34 (25) | 603 | 669 | 398 | 47 | 14 (+17) |
| quantum | 3.3.25 | 4.2 | Svelte 4 + v3 | 47 | 127 + 64 | 11 (7) | 141 | 216 | 152 | 41 | 12 (+16) |
| stramoniumai | 4.2.5 | 5.41 | no | 340 | 1160 + 401 | 33 (20) | 1217 | 1262 | 784 | 65 | 13 (+25) |
| tatum | 4.3.1 | 5.55 | no | 28 | 49 + 16 | 14 (7) | 55 | 151 | 55 | 35 | 10 (+14) |

Totali: auto 6.632, check 9.552, punti manuali 5.521, generali 908; wrapper 435 (296 con logica) importati da 2.017 file. Git: biblio 3 modifiche non committate, lupette 16; epass dichiara la lib 3.3.18 ma ha installata la 4.1.2 (e Svelte 5.43): si segue l'installata. mufasa, new-vigipass e forlimusica senza `node_modules`: versioni dal `package.json`.

Cosa si vede:
- **I punti manuali sono per lo più "guarda", non "scrivi"**: i più frequenti (file × passo) sono `button-loading` 370, `button-disabled` 345, `autocomplete-strict-equality` 199, `autocomplete-onchange-unselect` 125, `dialog-content-lifecycle` 84: comportamenti cambiati che si guardano, senza codice da cambiare quasi mai. Quelli da scrivere: `data-table-columns` 210, `data-table-query`/`loader` 187, `data-table-filters` 183, `tooltip-surface` 156, `icon-clickable` 154. Alcuni sono già meccanizzabili (`autocomplete-item-icon` 199 = trasformazione delle icone nei dati; `checkbox-shift-key` duplica l'evento `onchange`). → P220.
- **App v3**: le prop note solo alla v3 non sono nelle regole (le più frequenti: Icon `click` 86, figli di MediaQuery 28, `rowActionsSnippet` 28, prop di stile di Textarea `paddingTop`… ~70, prop di BarChart/LineChart, SimpleTimeLine). `analyze` le elenca in "Unknown props". → P221.
- I wrapper "con logica" sono la maggioranza per l'euristica (blocchi `{#if}`, più nodi radice, funzioni): lo scioglimento va guardato wrapper per wrapper; il pilota dirà quanti si sciolgono davvero.

## Componenti locali resi inutili dalla v5 (indagine del 2026-10-16)

Decisione dell'utente (2026-10-16): via dalle app tutto ciò che la v5 rende inutile. Indagine su 23 cartelle `*/frontend`: metanalysis e rex non usano la libreria (kit proprio), esclusi; tatum è già sulla 5.0.0; restano 21 app, 2.391 file `.svelte`. "File" = file che importano la copia locale (somma sulle app). Dati grezzi nello scratchpad della sessione (non durano), comandi per rifarli: inventario `find */frontend/src/lib/components -name '*.svelte'`, poi per ogni nome `grep -rlE "(from|import)[[:space:]]+['\"][^'\"]*/<Nome>\.svelte['\"]"` nelle `src` delle app che lo hanno.

**Sostituibili dalla libreria, quasi senza perdite** (gruppo A):

| componente locale | app | file | sostituto v5 | note |
|---|---|---|---|---|
| Toaster (copia melt-ui, stessa API ovunque) | 17 | 637 | `Toaster` + `addToast`/`addSuccessToast`/… | ~2.060 chiamate `addXToast({ data: { title, description } })`: togliere `data`; `closeDelay` → `duration`, `showLoading` → `loading`, `action.handler` → `action.onclick`; `color` → `variant` (`#0CF574` success, `#FFC857` warning, `error-500` error, altri a mano); id da stringa a numero. Perso: `action.urlToPreload`/`usePreloadData` (3 toast in astro, cbam, maya). Con DateRangePicker e MeltDatePicker toglie `@melt-ui/svelte` da 15 app su 17 |
| ConfirmOrCancelButtons (copia v4) | 19 | 193 | ConfirmOrCancelButtons | 4 stili di callback (`on:confirm-click` Svelte 4 in 10 app, `confirm=` con `{nativeEvent}`, `onConfirmClick`, `onconfirmClick`); testi en `Save/Back` contro v5 `Save/Cancel` (passare `cancelText`); lupette usa paraglide; `columnDirection` (5 app) senza prop v5 (si impila da container query) |
| UserAvatar (wrapper) | 16 | 37 | DescriptiveAvatar (`title`, `subtitle`, `src`, `direction`, `reverse`, `onclick`, `compact`) | `compact` aggiunge un Tooltip; copie Svelte 4 con `cursor`, `on:click`; mufasa stampa una riga in più |
| BoxList (copia, 10 varianti) | 13 | 30 | BoxList (già deciso, ex P172–P179) | `redirectUrl`/`url` → `href`, `gap` → `--box-list-gap`, `onboxClick({ box, event })`; astro/maya hanno `animateOnMount`, snippet e preload; lupette è un'altra lista |
| WidgetNoData / WidgetError | 2 / 1 | 19 / 7 | NoData; errore → AlertBanner `variant="error"` | |
| Spinner / CircularProgressIndicator | 2 / 2 | 4 / 2 | CircularLoader (`value` per il progresso) | |
| InfoBox | 1 | 2 | AlertBanner | |
| ToolTipTextField | 1 | 5 | SimpleTextField `state="error"` + `hint` | il messaggio passa da tooltip a testo sotto |
| IndeterminateCheckbox | 1 | 1 | Checkbox `indeterminate` | |
| RadioGroup / RadioButton (copie) | 2 | 6 / 4 | RadioGroup | `legend` → `label`, `options` → `items`, `checkedValue` → `value`; padding persi |
| MeltDatePicker | 4 | 9 | DatePickerTextField | `date` → `selectedDate`, `minValue`/`maxValue` → `min`/`max` |
| StackedBarChart / SimpleBarChart / BarChart (wrapper chart.js) | 3 | 7 | BarChart (`stacked`, `horizontal`) | colori dei dataset → `color`, flag di tick e griglia → `options` |
| file morti (0 import) | | 0 | cancellare | Loader (15 app), NotAuthorized (15), SideCreator (5), JobHeader (3), HeaderMenu (2), Tooltip (2), HeadersSelectorDrawer (2), AlertBanner (1), InfiniteTable (1), LocalFilterEditor; e le copie non usate di Divider (5 app), Subtitle (13), UserAvatar (3), LinkButton (3), BoxMenu (2) |

**Sostituibili con una perdita** (gruppo B, da chiedere): ConfirmOrCancelDialog (9 app, 89 file), AlertDialog (4, 25), ConfirmDialog (1, 4) → Dialog + ConfirmOrCancelButtons `confirmVariant="danger"`: si perdono la grande icona di allerta e i bottoni a tutta larghezza impilati; default da scrivere (`Sei sicuro?`, `Elimina`, `Annulla`); extra `persistent`, `disableConfirm`, `maxWidth`, `description: string[]`. Divider (10 app, 46 file): **trappola**, il default locale `rgb(var(--global-background-color-500))` punta a una variabile che nessuna app definisce, quindi i 16 `<Divider />` senza colore oggi sono spaziatori invisibili e con la v5 diventerebbero linee. ThemeSwitch (9 app, 12 file) → Switch + `toggleMode` + `rememberAppearance`: si perdono la maniglia sole/luna e il tooltip "Tema"; in **tutte le 20 app** c'è anche `/api/setTheme` (cookie) + `%theme%` in `app.html` + sostituzione in `hooks.server.ts`, che `appearanceScript` rende inutili (stessa chiave `theme` di localStorage). DateRangePicker (6, 6) → DatePickerTextField `range`: in ganymede e h24 si perdono Applica/Cancella e i due mesi. TabToggleSwitch (3, 4) → TabSwitcher con `href` (perso il preload al passaggio). ButtonGroup (1 uso) → ToggleList o TabSwitcher `segmented`. BoxMenu (4, 8) → BoxList (callback per voce → una sola). OptionMenu/OptionSelector/SimpleOptionMenu (3 app) → MenuOrDrawerOptions. LinkButton (copia con `<div>` cliccabile, 3 app) → Button `buttonType="text"`. HoverableTooltip (2, 4) → Tooltip, che non è interattivo (dove il contenuto si clicca, Menu). PasswordTextfield (1) → SimpleTextField `type="password"` senza occhio. TimePickerTextField (stramoniumai) → TimePickerTextField.

**Senza equivalente v5** (gruppo C): **PageTitle** (21 app, **594 file**, 19 varianti: `title`/`subtitle`/`description`, link "Indietro" con `prependVisible`/`prependRoute`, snippet in coda, `titleSize`): il pezzo più grande non coperto, candidato a un `PageHeader` della libreria. Card (3 app, 35 file, ~20 prop di stile + snippet), Subtitle (usato solo da epass e new-vigipass, 31 file), VerticalDraggableList (3 app, 17; "solo su richiesta"), ColorInvertedSelector (5, 6; "solo su richiesta"), Expandible/CollapsableDivider (2+2), Code (astro).

**Contratto diverso, restano** (gruppo D): PeriodPicker (4 app, 77 file, JSON diverso, già deciso), DashboardShaper copiato in 5 app (`componentName`, `widgetCells`; DashboardAddButton e WidgetAddButton assorbiti dal catalogo, DashboardEditor tiene dati e permessi), fork di lupette con paraglide (LocalPaginatedTable, LocalFilters, LocalSearchBar, LocalMobileFilterEditor: modello `Filter[]` della v4), PaginatedTable copiata in epass (fetcher diverso).

**Logica dell'app, restano**: ApplicationLogo (17 app), WidgetTitle/WidgetSettings/Widget (il reset zoom di WidgetTitle diventa inutile: i grafici v5 lo hanno), TipTapEditor (11), JobStatusViewer (7), ColoredChip (3, colori arbitrari: Chip v5 ha varianti fisse), form/tabelle/autocomplete di dominio (fetch e FilterBuilder), media e documenti, schermate di job e import, UI una tantum (AnimatedCheck, SuggestionDialog…), utility (CopyTextButton, ClampedSpan, Stepper, NumberPicker…), campi del form builder di epass/new-vigipass.

### Piano dei componenti locali (2026-10-16, dopo le risposte dell'utente)

Regola (decisione "Funzioni delle copie locali"): nessuna funzione si perde; si porta nella libreria ciò che ha senso, il resto resta come wrapper locale della libreria, riusato nell'app. Scelte di Claude (delegate dall'utente: "portare nella libreria ciò che ha più senso"), da elencare a fine lavoro:

**Componenti nuovi nella libreria** (decisi): `PageHeader` (PageTitle, 21 app), `ConfirmDialog` (ConfirmOrCancelDialog, AlertDialog, ConfirmDialog, 14 app), `ModeSwitch` (ThemeSwitch e toggle nei layout, 20 app). Prima di progettarli: le varianti delle copie nelle app (19 di PageTitle), con un subagente.

**Funzioni nuove nella libreria** (non esistevano nella v4 della libreria: senza domanda, da elencare):
1. DatePickerTextField `range`: due mesi (`months`) e piè con Applica/Cancella, per DateRangePicker di ganymede e h24.
2. SimpleTextField: bottone a occhio per mostrare la password (`type="password"`), per PasswordTextfield (quantum) e i login.
3. Tooltip interattivo (resta aperto con puntatore o focus sopra, contenuto cliccabile), per HoverableTooltip (maya, stramoniumai).
4. Azione del toast con `href` (link, che SvelteKit precarica), per `action.urlToPreload` del Toaster locale (astro, cbam, maya).
5. `onclick` per voce in `BoxListItem`, per BoxMenu (4 app; oggi BoxList ha solo `onboxClick`).
6. ConfirmOrCancelButtons `direction` (`row`/`column`, default automatico da container query), per `columnDirection` (5 app).
Da valutare quando si fa BoxList: `animateOnMount` di astro/maya (animazione d'ingresso: aspetto o funzione?).

**Sostituzioni senza perdite** (codemod): TabToggleSwitch → TabSwitcher con `href` (link: il precaricamento al passaggio c'è già se il `<body>` ha `data-sveltekit-preload-data`, default del template); ButtonGroup → ToggleList; LinkButton copiato (`<div>` cliccabile) → Button `buttonType="text"` o LinkButton con `href` se naviga; OptionMenu/OptionSelector/SimpleOptionMenu → MenuOrDrawerOptions (se aggiungono un attivatore fisso usato in più punti, wrapper locale); TimePickerTextField copiato → quello della libreria; più tutto il gruppo A.

**Restano nell'app** (nessun equivalente o contratto diverso): Card, Subtitle (epass, new-vigipass), VerticalDraggableList, ColorInvertedSelector, Expandible/CollapsableDivider, Code, e il gruppo D; mufasa: la riga in più di UserAvatar diventa un wrapper di DescriptiveAvatar se lo snippet non basta.

**Meccanismo del codemod** (da progettare): regole per componenti **locali** (abbinati per nome del file, con le varianti delle copie: callback Svelte 4, `{ detail }`, prop rinominate), nello stesso formato delle regole dei componenti dove si può; `setup` toglie `/api/setTheme`, `%theme%` e la sostituzione in `hooks.server.ts`.

**Ordine**: (1) commit; (2) PageHeader, ConfirmDialog, ModeSwitch con il processo dei componenti; (3) funzioni 1–6; (4) regole e codemod dei componenti locali, gruppo A compreso; (5) prova a mano su tatum con `next` (tatum ha PageTitle, ConfirmOrCancelButtons, ConfirmOrCancelDialog, ThemeSwitch, Toaster, BoxMenu, UserAvatar).

## Proposte nate dall'analisi (non confermate)

| # | Proposta | Nota |
|---|---|---|
| P220 | `ManualStep` con un campo `kind`: `review` (comportamento o aspetto cambiato: si guarda, di solito nulla da scrivere) o `edit` (codice da cambiare); la lista dei punti rimasti mostra prima gli `edit` per file e raggruppa le `review` per componente, con le pagine da guardare | parte di P218 (regole leggibili dalla macchina), si classificano i 228 passi esistenti |
| P221 | Regole **v3 → v4** minime, solo per i nomi v3 trovati da `analyze` nelle 10 app v3 (elenco "Unknown props"), così lo strumento porta una app v3 direttamente alla v5 | completa P216; senza, quelle prop restano errori di svelte-check da risolvere a mano |
| P223 | **Gruppo A** dell'indagine del 2026-10-16: il codemod sostituisce le copie locali con la libreria (Toaster e le sue ~2.060 chiamate, ConfirmOrCancelButtons, UserAvatar, BoxList, WidgetNoData/WidgetError, Spinner, InfoBox, ToolTipTextField, IndeterminateCheckbox, RadioGroup, MeltDatePicker, wrapper dei grafici) e cancella i file morti; le piccole perdite si elencano | rientra nella decisione dell'utente del 2026-10-16, da mostrare |
| P224 | Divider: i `<Divider />` locali senza colore oggi sono invisibili (variabile mai definita); con la v5 diventano linee | **approvata il 2026-10-16**: diventano linee |
| P225 | Dialog di conferma (ConfirmOrCancelDialog, AlertDialog, ConfirmDialog: 14 app, ~118 file): un componente **`ConfirmDialog`** nella libreria (titolo, testo, icona, conferma `danger`) invece di Dialog + bottoni riscritti in ogni app | **approvata il 2026-10-16** (decisione "ConfirmDialog nella libreria") |
| P226 | PageTitle (21 app, 594 file): un componente **`PageHeader`** nella libreria (titolo, sottotitolo, link indietro, azioni) su cui il codemod porta PageTitle | **approvata il 2026-10-16** (decisione "PageHeader nella libreria") |
| P227 | Tema: ThemeSwitch (9 app) e `/api/setTheme` + `%theme%` + `hooks.server.ts` (20 app) → `appearanceScript` + `rememberAppearance` + uno switch della libreria | **approvata il 2026-10-16**: `ModeSwitch` nella libreria (sole/luna) |
| P228 | **Gruppo B** restante (DateRangePicker, TabToggleSwitch, ButtonGroup, BoxMenu, Option*, LinkButton copiato, HoverableTooltip, PasswordTextfield, TimePickerTextField copiato): si sostituiscono con la libreria e le perdite si elencano | **non approvata**: sostituita dalla decisione "Funzioni delle copie locali" del 2026-10-16 (niente perdite: libreria o wrapper locale) |

