---
name: redesign-aurora
description: Contesto, decisioni e processo della riscrittura "Aurora" di @likable-hair/svelte nella cartella aurora/ (componenti, token, temi switchabili a runtime, documentazione generata e leggibile da LLM). Usala per qualsiasi lavoro dentro aurora/, quando si porta un componente dalla vecchia libreria, o quando si parla di redesign, temi, token o docs della nuova libreria. Va aggiornata ogni volta che una decisione cambia.
---

# Redesign Aurora

Questa skill è la memoria condivisa del progetto: la leggono tutte le sessioni e tutto il team.

## Come è organizzata la skill

Questo file è corto di proposito (si carica a ogni lavoro su `aurora/`): regole, decisioni in vigore in sintesi, processo, convenzioni e trappole essenziali, stato. I dettagli stanno in `reference/`, accanto, e si leggono **solo quando servono**:

| File | Quando leggerlo |
|---|---|
| `reference/decisions.md` | serve il dettaglio di una decisione (API, nomi, motivazioni, numeri delle app) |
| `reference/history.md` | serve sapere come è stato fatto un componente, quali bug sono stati trovati, come è stato verificato |
| `reference/conventions.md` | **prima di scrivere o modificare** un componente, un test o una regola di migrazione |
| `reference/traps.md` | qualcosa si comporta in modo strano: cercare per parola chiave |
| `reference/filters-backends.md` | lavoro sui filtri, sulle tabelle o su cosa accettano i backend delle app |
| `reference/v4-discarded.md` | si porta un componente e bisogna sapere cosa della v4 è stato scartato |
| `reference/performance.md` | si toccano transizioni, token o si misura il costo degli stili |
| `reference/tables.md` | lavoro sulle tabelle: gerarchia v4, duplicati, bug, uso nelle app con i numeri |
| `reference/layouts.md` | lavoro su SidebarLayout e HierarchyMenu: comportamento v4, bug, uso nelle app con i numeri |
| `reference/file-inputs.md` | lavoro su FileInput e FileInputList: comportamento v4, bug, prototipo, uso nelle app con i numeri |
| `reference/avatars.md` | lavoro su Avatar, DescriptiveAvatar e AvatarGroup: comportamento v4, bug, prototipo, uso nelle app con i numeri |
| `reference/menu-or-drawer.md` | lavoro su MenuOrDrawer e MenuOrDrawerOptions: comportamento v4, bug, prototipo, uso nelle app con i numeri |
| `reference/charts.md` | lavoro sui grafici: comportamento v4, bug, prototipo, uso nelle app con i numeri, confronto delle librerie |
| `reference/dashboard.md` | lavoro su DashboardShaper: comportamento v4, bug, prototipo, uso nelle app con i numeri, proposte P128–P141 |
| `reference/period.md` | lavoro su PeriodPicker e PeriodSelector: comportamento v4, bug, prototipo, contratto JSON coi backend, copie locali nelle app, proposte P192–P205 |
| `reference/lists.md` | lavoro su BoxList, SelectableVerticalList, SelectableMenuList, ToggleList: comportamento v4, bug, prototipo, copie locali nelle app, proposte P172–P191 |
| `reference/icons-dropdown-global-search.md` | lavoro su IconsDropdown e GlobalSearchTextField: comportamento v4, bug, prototipo, uso nelle app, proposte P157–P171 |
| `reference/timeline.md` | lavoro su SimpleTimeLine (Timeline): comportamento v4, bug, prototipo, uso nelle app, proposte P142–P156 |
| `reference/migration.md` | lavoro sulla migrazione delle app: dati misurati sulle 20 app e sulle regole scritte, coesistenza v4+v5, proposta P211–P219 |

## Regola di manutenzione (prima di tutto)

- Quando l'utente prende, cambia o annulla una decisione, aggiorna la skill **nello stesso turno**, con la data: una riga in "Decisioni in vigore" qui sotto e la voce completa in `reference/decisions.md`. Se una decisione ne sostituisce un'altra, riscrivi la voce (in entrambi i posti): niente informazioni contraddittorie.
- Una voce passa da "Proposte" a "Decisioni" **solo** quando l'utente la conferma esplicitamente.
- Quando un componente o un pezzo di infrastruttura è finito: una riga in "Stato" qui sotto, i dettagli (file, verifiche, bug corretti, conteggi) in `reference/history.md`. Questo file non deve tornare a crescere: niente dettagli tecnici qui.
- Dopo ogni aggiornamento, dillo all'utente in una riga: "Skill aggiornata: ...".
- **Niente spazzatura dalla v4**: un comportamento della v4 senza senso o sbagliato si **segnala all'utente** con una proposta migliore, non si porta in silenzio (elenco in `reference/v4-discarded.md`).
- **Componenti inutili o inglobati non si portano, con cautela** (2026-10-14, richiesta dell'utente): un componente v4 assorbito da un altro (es. QuickActions nella barra di DataTable, HeadersDrawer in ColumnManager) o mai usato non si porta. Prima si contano gli usi nelle app e si chiede all'utente: un'app che non è su questo PC potrebbe usarlo. Per quelli usati pochissimo si porta solo su richiesta; in ogni caso `MIGRATION.md` dice cosa usare al loro posto.
- **Ogni scostamento dalla v4 si chiede prima** (2026-10-14, richiesta dell'utente dopo la scoperta che le azioni della barra di selezione avevano perso l'aspetto di default): rimozione di una funzione, cambio di comportamento, di default o di aspetto dei componenti di base si chiede **prima di implementarlo**, spiegando cosa si perde e le conseguenze (es. app che non sono più uguali tra loro), anche quando sembra compreso in una proposta già approvata. Senza domanda solo ciò che nella v4 non esisteva; anche quelle scelte si elencano all'utente a fine giro. I componenti di base devono restare uguali in tutte le app: preferire un default della libreria a uno snippet che ogni app riscrive.
- **Gli usi interni non misurano il bisogno**: la libreria la usano le app, fuori da questo repo; si giudica nel merito, gli usi sono solo un indizio.

## Ripartenza dopo un `/clear`

1. Leggi "Stato" in fondo: l'ultima voce "Prossimo" dice da dove riprendere.
2. Il dev server delle docs gira su http://localhost:5180; se non risponde: `cd aurora && npx vite dev --port 5180` in background.
3. Segui "Processo per un componente" e la "Regola dei test". Per leggere componenti v4 grandi usa un subagente.
4. A componente finito, con la skill aggiornata, sul "procedi" suggerisci `/clear` prima del successivo (non puoi lanciarlo tu). La conversazione lunga rallenta ogni risposta: meglio ripartire spesso.
5. Leggi "Team, account e modo di lavorare": vale per chiunque usi la skill.

## Team, account e modo di lavorare

Cose che non stanno nel codice e che finora sapeva solo l'utente (2026-10-09). Le memorie personali di Claude (`~/.claude/projects/...`) **non sono condivise**: tutto quello che serve al team va scritto qui.

- **Chi lavora**: l'utente e, dal 2026-10-09, anche il suo capo, ciascuno con la sua sessione di Claude Code. Questa skill è il riferimento comune: decisioni, processo e stato valgono per entrambi. "L'utente" in questo file è chi sta usando la sessione; le decisioni si prendono con lui e si scrivono qui con la data.
- **Account Claude del capo: niente Artifact.** Non pubblicare pagine su claude.ai (Artifact o simili): l'account è del capo e l'utente non deve usare la parte web. Un documento da far vedere a qualcuno si consegna come **file locale**: PDF per leggerlo o mandarlo (HTML → PDF con il Chromium headless di Playwright della root, vedi "Trappole note"), Markdown se deve vivere nel repo. I documenti temporanei si cancellano quando l'utente ha finito.
- **Git**: branch, commit e push **solo quando l'utente lo chiede**. Repo di lavoro: **`likablehair/svelte`** (il repo ufficiale, l'utente è admin), deciso il 2026-10-09; il fork personale `vincenzodisieno/svelte` non si usa più (nella cartella locale `origin` punta a `likablehair/svelte` e `aurora-v5` lo segue; il fork resta come remoto `fork`). Il lavoro di Aurora sta sul branch **`aurora-v5`**, partito da `master` `e618d43` (uguale nel fork e nel repo ufficiale): commit `633a9d3` con tutto `aurora/`, skill, `CLAUDE.md`, `.mcp.json`, `design/AUDIT.md`, `design/REDESIGN-STRATEGY.md`. Dal 2026-10-09 il push su `origin aurora-v5` funziona dalla sessione di Claude, ma si fa solo quando l'utente lo chiede.
- **Commit e migrazione** (2026-10-15, richieste dell'utente): **nel repo della libreria** prima di iniziare un lavoro legato alla migrazione (strumento, regole) si fa un commit di quello che c'è, così parte da uno stato salvato; push solo se chiesto. **Nelle app migrate non si committa mai**: né Claude né lo strumento fanno commit (niente commit per fase); si modificano i file e li committa l'utente dopo averli guardati. Prima di toccare un'app il suo repo deve essere pulito (lo strumento lo controlla), così le modifiche non committate sono tutte e solo della migrazione; si lavora su un branch nuovo creato dallo strumento. Gli hook di commit delle app (es. lefthook di tatum, che lancia check e build) quindi non entrano in gioco.
- **Niente riferimenti ad altri progetti** (2026-10-13, richiesta dell'utente): nei file (codice, docs, skill, test) non si citano progetti dell'utente che non sono questa libreria o le app che la usano; se uno serve da spunto, si scrive solo la tecnica.
- **Lingua**: con l'utente si parla italiano e la skill resta in italiano; tutto ciò che sta in `aurora/` è in inglese (vedi Convenzioni).
- **Contesto e costi**: a fine componente, con la skill aggiornata, sul "procedi" suggerisci `/clear` (solo se non si perde niente); le letture pesanti (componenti v4 grandi, giri tra le app) vanno nei subagenti.
- **Le app che usano la libreria** stanno, sulla macchina dell'utente, in `~/Documents/progetti/<app>/frontend` (22 app; `~/Documents/progetti/svelte` è questo repo, da escludere; `test_backup/` dà errori di permesso). Servono a misurare come si usa un componente prima di cambiarne l'API, per esempio: `grep -rlE --include='*.svelte' --exclude-dir=node_modules --exclude-dir=.svelte-kit --exclude-dir=svelte "<Tooltip\b" ~/Documents/progetti | wc -l` (dentro `bash -c`: con zsh i glob non quotati falliscono). I numeri sono un indizio, non il criterio (vedi "Regola di manutenzione").
- **Il capo** ha approvato i cambi di logica e ha chiesto MCP di migrazione, prompt, test e pipeline di rilascio (Requisiti, punto 4). Le richieste vanno trattate come quelle dell'utente.

## Contesto

- Il repo contiene **due progetti separati**:
  - **root**: libreria attuale v4.3.2 (`src/lib`). È il **riferimento per il comportamento** dei componenti; si toccano solo i fix di manutenzione.
  - **`aurora/`**: la nuova libreria, riscritta da zero. Ha il suo `package.json` e il suo `node_modules`.
- In `aurora/` c'è il template library di SvelteKit 3:
  - la config sta in `aurora/vite.config.ts` (non esiste `svelte.config.js`);
  - nome `@likable-hair/svelte`, versione `5.0.0`, `"private": true`;
  - 0 dipendenze runtime, `"sideEffects": ["**/*.css"]`.
- Comandi, **da dentro `aurora/`**: `npm run dev`, `npm run check`, `npm run package`.
- Riferimenti:
  - `design/components-prototype.html`: il target visivo ("Likable Aurora UI"). Ogni card ha il percorso del componente v4 in `<div class="path">simple/buttons/Button.svelte</div>`, quindi un grep sul percorso porta alla sezione giusta.
  - `design/AUDIT.md`: bug e debolezze della v4 da non ripetere.
  - `design/REDESIGN-STRATEGY.md`: proposta sui token (sezioni 2–4) e livelli L0–L3. Le sezioni su fasi e rilascio sono superate.
  - Componenti v4: `src/lib/components/{simple,composed,layouts}/`. Pagine docs v4: `src/routes/docs/components/`. Gli array `props`, `styleProps` e gli snippet sono scritti a mano, ma servono come inventario dell'API.
- Per il confronto visivo con il prototipo c'è Playwright MCP, configurato in `.mcp.json` della root.

## Requisiti (dai brief delle tre task, svolte in parallelo)

1. **Componenti**
   - Avvicinare il più possibile l'aspetto di default al prototipo, prendendolo come ispirazione.
   - Ogni componente deve essere personalizzabile tramite variabili CSS.
   - Nuove tonalità di default, sia light sia dark, vicine al prototipo.
   - Il brief originale chiede di **non cambiare la logica** dei componenti e di chiedere prima se serve farlo. Vale anche nella riscrittura: il comportamento della v4 è la specifica, e ogni scostamento si chiede. Il "solo CSS" chiesto all'inizio dal capo è superato: il 2026-10-09 il capo ha approvato di cambiare anche la logica e le API quando serve, documentate in `aurora/MIGRATION.md`, purché la migrazione sia supportata da strumenti (punto 4).
2. **Documentazione**
   - Redesign ispirato al prototipo, possibilmente costruito con i componenti stessi della libreria.
   - Una pagina dedicata per ogni componente, con: esempio grafico, props, variabili CSS disponibili, snippet disponibili.
   - Le informazioni di ogni pagina devono essere comprensibili per un LLM che le legge dal web.
3. **Temi (plugin)**
   - Plugin che cambiano l'aspetto di default dei componenti **e di tutta l'app**.
   - Switchabili anche a runtime.
   - Cambiano **solo il design**, mai il comportamento o il layout dei componenti.
4. **Migrazione e rilascio** (chiesti dal capo il 2026-10-09, parte del restyling)
   - Un server **MCP** che effettua la migrazione delle app.
   - Un **prompt** per passare da una versione della libreria a un'altra.
   - **Test automatici** con Vitest o Playwright.
   - **Pipeline di rilascio** migliorata: bump della versione, GitHub release, pnpm, changelog.
   - **Da subito, per ogni componente** (deciso il 2026-10-09): i **test** e le **regole di migrazione** si scrivono insieme al componente, perché recuperarli dopo componente per componente costa di più. MCP, prompt e pipeline arrivano dopo e leggono le regole già scritte.

## Decisioni in vigore (sintesi)

Una riga per argomento; la voce completa, con data e motivazioni, è in `reference/decisions.md`.

**Progetto**
- Aurora è la **v5 di `@likable-hair/svelte`** (stesso nome, `5.0.0`, `"private": true` finché non si pubblica), riscritta da zero in `aurora/`; nessuna strategia `next`/alias.
- Partire minimali: dipendenze solo quando servono (runtime: `flag-icons`, dal 2026-10-13 `@tanstack/virtual-core` per la virtualizzazione delle righe, dal 2026-10-14 `chart.js` e `chartjs-plugin-zoom` per i grafici). Le tre task (componenti, docs, temi) procedono insieme.
- **Cambiare logica e API è approvato** (dal capo, 2026-10-09), ma ogni cambio che rompe chi migra va in `aurora/MIGRATION.md` e nelle regole `migrations/v4-to-v5/` (aggiunte opzionali: una riga).
- **Parità con la v4**: ogni capacità v4 ha un equivalente o è scartata con l'ok dell'utente.
- Tutto ciò che sta in `aurora/` è in **inglese**; la skill in italiano. Testi di default dei componenti in inglese (nei filtri la lingua viene da `locale`).

**Stile, token e temi**
- Token su 3 livelli: `--global-*` → `--{comp}-default-*` → `--{comp}-*` per istanza. Precedenza con i **cascade layer** (riga dei layer in testa a ogni CSS): default in `global.base`, temi in `global.theme`, regole dei componenti in `global.components`; il CSS dell'app senza layer vince sempre.
- Colori CSS completi (hex/oklch), ognuno una volta con `light-dark()`; derivati con `color-mix()`; mai le triplette RGB né i nomi v4 (`--global-color-{nome}-{50..950}`).
- Token semantici del prototipo (`bg`, `surface`, `border`, `text`, `primary`, stati con `-soft`), radius con scala, ombre, focus ring (`outline`), motion, font come token (la libreria non carica font). In light più leggibili del prototipo (P17); overlay, `on-*` degli stati, palette dati `data-1…6`, `fill-*` per sfondi con testo.
- Un tema è un file CSS con soli token sotto `[data-theme]` su `<html>`; light/dark dentro ogni tema (`color-scheme`, `data-mode`). Distribuiti: Aurora (default) e `classic` (ispirato alla v4). Galleria di 14 temi **solo nelle docs**. `setTheme()`/`setMode()` mettono in pausa le transizioni.
- `base.css` opzionale per la pagina. Base comune dei campi: `--global-input-*`.
- Classi `aurora-{comp}` / `aurora-{comp}-{parte}`, modificatori con `data-*`, mai classi generiche.
- Tailwind: la libreria non lo usa ma è compatibile (`tailwind.css` per Tailwind 4, `tailwind-preset` per Tailwind 3, preflight in `@layer reset`).

**API e comportamento comuni**
- Callback con l'**evento nativo** (`onclick(event)`), niente `{ detail }`; le callback composte ricevono un oggetto (`onchange({ value })`).
- Icone: **path SVG** (`@mdi/js` solo per docs ed esempi). Icon è solo un'immagine; icone cliccabili = `Button`.
- **Contratto di personalizzazione**: variabile CSS per ogni parte e stato, `class` (sul root o per parte), uno snippet per ogni contenuto visibile, attributi ed eventi nativi inoltrati + elemento `bindable`, stato in `data-*`.
- Accessibilità di base per ogni componente (elementi nativi, focus visibile, ARIA, tastiera completa).
- **Overlay sul top layer**: Dialog e Drawer = `<dialog>` modale, smontati da chiusi (lo stato del contenuto va nel genitore), stessa anatomia (title, closable, children, actionsSnippet), `persistent`; Menu e Tooltip = `popover` con posizione calcolata in JS (`floating.ts`). Il Menu si chiude con clic fuori **un livello alla volta** ed Esc; aprirne uno chiude gli altri, tranne gli annidati.
- **Tooltip della libreria al posto di `title`** nei componenti (es. "+N" delle chip).
- Gruppo date: valore `Date` a mezzanotte locale, `locale` BCP 47 via `Intl` (nomi, primo giorno, formato), `min`/`max`/`isDateDisabled`, `range`; utility `toISODate`/`parseISODate`. Campi con maschera propria, chiusura dopo la scelta, Drawer dal basso su mobile.
- **Campo ora** (2026-10-13): `TimePicker` + `TimePickerTextField`, valore `"HH:mm"`, due colonne (più AM/PM), formato dal `locale` (`it` 24 ore, `en` 12 ore, `hour12` lo forza). Poi `DateTimePickerTextField` (valore `Date`) e i filtri con `withTime` lo usano. Le scelte di dettaglio dei due campi sono confermate (2026-10-13).
- **Chip del formato** dei campi data/ora (2026-10-13): si nasconde da solo quando il campo è troppo stretto per il testo intero più il chip, invece di tagliare il testo.
- **Testi dal `locale`** (2026-10-13): ogni componente con testi di default ha `locale` (BCP 47; `it` ed `en` incorporati, le altre lingue in inglese) che sceglie la lingua dei testi, come nei filtri; le prop dei singoli testi vincono; i componenti composti passano `locale` ai sottocomponenti. **Default per tutta l'app** con `setDefaultLocale('it')` nel `+layout.svelte` radice (contesto Svelte, sicuro con l'SSR; il `locale` del componente vince; senza nessuno dei due `en`). Nome scelto perché `setLocale` collide con paraglide (4 app).

**Docs**
- **Costruite con la libreria** (2026-10-14): layout `SidebarLayout` + `HierarchyMenu`, selettore di tema e modo con `Select` e `TabSwitcher` nella barra; ogni controllo delle docs che la libreria offre usa il suo componente.
- **Generate dal sorgente** (P5): `<!-- @component -->`, JSDoc di `Props`, variabili CSS, snippet, eventi e tipi esportati citati (sezione Types) estratti da `src/docs/api.server.ts`; versione Markdown per pagina, `llms.txt`, `llms-full.txt`. Esempi in `src/docs/examples/<slug>/NN-name.svelte`, una pagina per componente, route `/examples/<slug>/<id>` per un esempio da solo; esempi allineati in alto a sinistra.

**Test e migrazione** (dettagli in `reference/conventions.md`)
- Vitest in browser mode (Chromium + Firefox) per i componenti, progetto node per utility e regole; un test visivo Playwright che fotografa ogni esempio in 4 aspetti.
- **Test e regole di migrazione si scrivono insieme al componente**: `tests/components/<C>.test.ts`, `migrations/v4-to-v5/<C>.ts` (dati tipizzati), `MIGRATION.md`.
- **Si lanciano solo i test strettamente necessari** (2026-10-13): vedi "Regola dei test".
- **Migrazione guidata** (P211–P219 approvate il 2026-10-15, con due modifiche; dettaglio in `reference/migration.md`): pacchetto separato `@likable-hair/svelte-migrate` in `aurora/migrate/`, un comando a fasi (`analyze` in sola lettura, setup, codemod meccanico deterministico e rigiocabile, lista dei punti rimasti per file da `svelte-check` + regole con l'elenco delle pagine da guardare, pulizia), `v4-compat.css` nei due sensi, MCP e prompt come strato sopra, app v3 con `sv migrate svelte-5` + sintassi v3, regole rese leggibili dalla macchina e MIGRATION.md per componente generato, pilota su tatum dopo `analyze` su tutte le app.
- **Niente wrapper `Standard*`** (2026-10-15, utente): le app usano sempre i componenti della libreria; lo stile si dà con le variabili CSS (default dell'app nel suo CSS), non con un wrapper. Un wrapper resta solo se strettamente necessario (casi estremi). Nella migrazione i wrapper si **sciolgono**: ogni uso diventa il componente della libreria e lo stile fisso del wrapper diventa variabili CSS di default dell'app; quelli con logica vera si segnalano.
- **Niente coesistenza v4 + v5** (2026-10-15, utente): ogni app si migra tutta, poi si ritesta tutto; niente alias né 4.x di manutenzione per la convivenza.
- **Font delle app migrate** (2026-10-15, utente, scelta 2 su 2): le app passano ai font del prototipo (Geist, Bricolage Grotesque, Geist Mono); li carica l'app da Google Fonts con lo stesso URL del prototipo, la pagina prende `var(--global-font-family)`, il vecchio import (es. Inter) si toglie se non è più usato. Lo fa `setup`.
- **Tema delle app migrate: Aurora** (2026-10-15, utente, fra Aurora e `classic`): nessun import di tema; i colori v4 usati dal CSS dell'app passano per `v4-compat.css` (ex P40/P213, fatto), che li porta sui colori Aurora con la stessa posizione nella scala e lascia vincere gli override `--global-color-light/dark-*` dell'app, che col tema di default diventano anche i colori di brand e di stato della v5. `setup` aggiunge l'import.
- **Niente commit nelle app** (2026-10-15, utente): lo strumento e Claude modificano i file dell'app ma non committano mai (sostituisce "una fase = un commit" di P211); committa l'utente.

**Componenti (scelte principali; il dettaglio di ognuno è in `reference/decisions.md`)**
- Button: `buttonType` default/text/icon + `variant` (primary, secondary, danger, gradient) + `size`; `icon`/`appendIcon`, `loading`, `href` (rende `<a>`). LinkButton = link testuale; ActivableButton = toggle con `aria-pressed`; ConfirmOrCancelButtons tiene i nomi v4.
- SimpleTextField: `label`, `hint`, `state`, 4 posizioni di icona, niente `range`. Textarea: contatore, `autoGrow`. Select: `<select>` nativo + `appearance: base-select`. Checkbox/Switch: `checked`. RadioButton `bind:group` + RadioGroup nuovo.
- Autocomplete: combobox ARIA, `values` sempre array, `maxVisibleChips` con "+N" e Tooltip, Drawer con ricerca su mobile opt-in. AsyncAutocomplete: `searcher({ searchText, signal })`. CountriesAutocomplete: `Intl.DisplayNames`. Dropdown: Autocomplete + Button. FlagIcon: `flag-icons`, 4:3.
- Chip: neutro, `selected` toggle, X fratello. TabSwitcher: tablist o `<nav>` con `href`, `variant` underline/segmented. Divider: `<hr>`, `label`, `variant`.
- Feedback: CircularLoader, DotsLoader, Skeleton, ProgressBar, HorizontalStackedProgress, AlertBanner, NoData, Tooltip (rinominato da `ToolTip`), Toaster con funzioni `addToast`, `addSuccessToast`… (stessi nomi delle app).
- **Filtri** (decisioni del 2026-10-09 → 2026-10-13): modello alla ClickUp, si aggiunge un filtro alla volta; `fields` (definizione) + `value` (albero JSON di gruppi e condizioni); operatori per tipo in livelli `basic`/`standard`/`all` (`operatorSet`, `typeOperators`, `field.operators`), coppie positivo/negativo vicine; AND/OR con `allowOr`, gruppi con `maxDepth` (filtro singolo come riga discreta con "+ Add nested filter", riquadro solo per i gruppi veri, un gruppo con un solo elemento si scioglie; gruppi annidati a toni alternati, `--filters-group-background` (`surface-3`) / `--filters-group-alt-background` (`surface-pop`, il pannello)); pill, `pinned`, `presets` (accesi solo se le condizioni coincidono), `confirm`, `applyDelay`, bottom sheet su mobile; filtri salvati (`savedKey` nel browser, `bind:saved` + `onsavedchange` per il backend); query `FilterBuilder` con il JSON della v4 (contratto con i backend) da `filtersToBuilder`; testi dal `locale` (`it`, `en`) con `labels` sopra; uguaglianze di testo senza maiuscole salvo `caseSensitive`; `words` parola per parola (anche `is`/`isNot`); `negativesIncludeEmpty` **acceso di default** (le app con backend E/E' passano `false`); campi con più valori dicono "has any/none/all of". Opzioni che sostituiscono custom e `modify`: `columns`, `joins`, `through`, `json`, `array`, `compareWith`, `whenTrue`/`whenFalse`, `whenAbsent`, `hidden` + `locked`, `scale`, `apply`, `suggest`. Il gruppo C (funzioni senza uso visto) è stato tenuto per intero. SearchBar separata, in AND con i filtri.
- **Paginator** (2026-10-13): `pageCount` (ex `maxPage`), `onchange({ page })`, finestra `1 … 6 7 8 … 24` a elementi fissi (`siblingCount`, `showFirstLast`), estremi con `aria-disabled`, nessuna correzione automatica di `page`; `pageHref`, `compact`, `pageSnippet`.
- **Tabelle** (P47–P55 confermate il 2026-10-13, analisi in `reference/tables.md`): `Table` (ex SimpleTable) + `DataTable` (ex PaginatedTable, EnhancedPaginatedTable e DynamicTable, paginazione `pages`/`infinite`/`none`) + `Paginator` + `ColumnManager` (ex HeadersDrawer); logica in moduli TS interni `utils/table/`. Una sola `onquerychange({ page, pageSize, sort, search, filterValue, builder })` con pagina a 1 su filtri/ricerca/ordinamento, `total`; `loader` opzionale accanto alla modalità controllata; `columns` con `cell` snippet per colonna, tipi `Intl` (number/valuta, date anche luxon, boolean), `format`, `empty`, `sort`, `footer`; `bind:columnState` serializzabile; `rowKey`, `rowHref`, `actionsSnippet` sempre visibile (`actionsVisibility="hover"` per il prototipo), `rowClass`; selezione unica con "tutto" ed esclusioni + barra azioni; `expandedSnippet`. Tolti `cellEdit`, la finestra di 100 righe, doppio clic, quick filter delle tabelle, `editFilterMode`, `stickyAppendSnippet`. **Vista a card su mobile** (approvata dall'utente): sotto una larghezza del contenitore ogni riga diventa una card.
- **Table, dettagli** (2026-10-13): ordinamento **locale di default** (`sorting="manual"` per il server), `bind:sort` = `{ key, direction }`; cella vuota "—" attenuato (`empty`); card sotto **640px** del contenitore (`cardBreakpoint`, `cardTitle`), con 4 campi o `cardColumns` e il resto dietro "Mostra altri N campi", falso = "No" nelle card; riga focusabile solo con `onrowclick`; colonne fisse spostate in testa e sganciate quando superano metà della tabella (`data-pins-off`).
- **DataTable, dettagli** (2026-10-13): **solo server** (`loader` o modalità controllata; per dati in memoria Table + Paginator); **barra della selezione fluttuante** in basso, sticky nella tabella (pill del prototipo QuickActions); la selezione resta cambiando pagina, ordinamento o righe per pagina e **si azzera cambiando filtri o ricerca**; prop **`filterFields`** (ex `filters` v4) + **`bind:filterValue`** (albero), stesso nome nella query.
- **Virtualizzazione delle righe** (ex P57, approvata dall'utente il 2026-10-13): Table (e quindi DataTable) mette nel DOM solo le righe visibili più un margine, con righe spaziatrici e altezze misurate, su `@tanstack/virtual-core` (seconda dipendenza runtime, approvata); si accende da sola sopra una soglia di righe, con una prop per spegnerla.
- **Strumenti compatti su telefono** (ex P58, punti 1–3 approvati dall'utente il 2026-10-13): sotto 640px toolbar di DataTable su una riga (ricerca + Filtri e Colonne solo icona, `toolbarSnippet({ narrow })`), pill dei Filters su una riga che scorre con "Cancella" in fondo e "Aggiungi filtro" solo nel pannello o nel foglio (Filters compatti quando sono larghi meno di 640px, su telefono e su desktop), "Seleziona tutto" e ordinamento compatto sulla stessa riga sopra le card; desktop invariato.
- **Azioni della barra di selezione con aspetto di default** (ex P59, ripristino chiesto dall'utente il 2026-10-14): `selectionActions` (oggetti con etichetta, icona, `danger`, disabled, loading, tooltip `info`/`disabledInfo`) disegnati dalla libreria come nel prototipo, quelle in più in un menu "⋯"; `selectionActionsSnippet` resta come alternativa.
- **Ripristini approvati il 2026-10-14** (ex P60–P62, P64–P66, dall'analisi delle funzioni perse): breakpoint condivisi con i nomi v4, modo chiaro/scuro reattivo, salvataggio del modo con toggle e script contro il lampo, `disabled` della tabella, selezione multipla senza "seleziona tutto", lingua messa in sicurezza (migrazione che aggiunge `setDefaultLocale` + avviso in sviluppo). P63 (margine di ConfirmOrCancelButtons) valutato: default 0 (con i layout a `gap` raddoppiava, e nessun componente ha margini esterni), variabile `--confirm-or-cancel-buttons-margin-top`, la migrazione mette 20px come default dell'app.
- **Componenti non portati** (ex P67, 2026-10-14): QuickActions (→ `selectionActions`), InfiniteScroll (→ `onendreached` + righe virtuali), Navigator, Breadcrumb, VerticalSwitch, VerticalTextSwitch, CollapsibleDivider (0 usi o assorbiti). **Solo su richiesta**: AvatarDropdown, ColorInvertedSelector, SidebarMenuList, StableDividedSideBarLayout, `debounce`, `scrollAtCenter`, VerticalDraggableList. `MIGRATION.md` dice cosa usare al loro posto.
- **Ordine dei prossimi** (ex P68, 2026-10-14): 1) layout delle app (UnstableDividedSideBarLayout, CollapsibleSideBarLayout, HierarchyMenu, HeaderMenu), 2) FileInputList + FileInput, 3) Avatar + DescriptiveAvatar, 4) MenuOrDrawer + Options, 5) grafici (prima la scelta della libreria), 6) il resto (IconsDropdown, SimpleTimeLine, BoxList, GlobalSearchTextField, PeriodPicker con PeriodSelector, ToggleList, SelectableVerticalList, SelectableMenuList).
- **Punto 6** (2026-10-14, analisi in `reference/period.md`, `lists.md`, `icons-dropdown-global-search.md`, `timeline.md`): si portano Timeline, IconsDropdown (tiene il nome, involucro di Dropdown, ex P157), **BoxList ridisegnata** per sostituire le copie locali delle app (ex P172–P179), ToggleList (su ActivableButton), PeriodPicker/PeriodSelector, GlobalSearchTextField, in quest'ordine; **non si portano** SelectableVerticalList pubblica (resta interna) e SelectableMenuList (→ HierarchyMenu o Button). Le altre proposte si chiedono all'inizio di ogni giro.
- **BoxList** (ex P172–P179, 2026-10-14, analisi in `reference/lists.md`): ridisegnata per sostituire le copie locali delle app; `BoxListItem` con `icon`, `description` sempre visibile, `color`, `href`, `disabled`; card del prototipo in griglia `auto-fill` (`--box-list-min-width`, `--box-list-gap` al posto di `gap`), niente freccia (`appendSnippet`), `<ul>`/`<li>` e anello di focus, `boxSnippet` dentro il link/bottone, `onboxClick({ box, event })`; hover con glow **nel tono della card** (alone dall'angolo dell'icona, alone sotto il riquadro, bordo e ombra dello stesso tono) al posto della macchia di gradiente del prototipo (2026-10-15, utente).
- **ToggleList** (ex P189–P191, 2026-10-15, analisi in `reference/lists.md`): gruppo `role="group"` di bottoni a toggle del prototipo su ActivableButton (`aria-pressed`) al posto delle chip; voci `Item<Data>` e `bind:values` come Autocomplete; `onchange({ select, unselect, selection })` con i **nomi v4, uguali ad Autocomplete, Dropdown e IconsDropdown** (scelta lasciata a Claude: "i nomi più giusti per tutto quello fatto finora"), con la voce sostituita in `unselect` nella scelta singola; con `multiple={false}` il secondo clic **lascia acceso** il bottone: prop **`mandatory`** (stesso nome e significato di Autocomplete/Dropdown, al posto di `deselectable` per coerenza), di default accesa nella scelta singola, `mandatory={false}` per spegnerlo; `disabled` vero; `--toggle-list-height` al posto del refuso.
- **PeriodPicker e PeriodSelector** (ex P192–P205, 2026-10-15, analisi in `reference/period.md`): due componenti con i nomi v4, PeriodSelector esportato; JSON `timespanSettings` invariato (contratto coi backend), tipo esportato; `onchange({ timespanSettings, from, to })` + `resolvePeriod` esportata, con la **semantica dei backend** per `this-month`/`this-year` (fino a fine periodo) e `this-week` (da lunedì), ma `last-3month`/`last-6month` = **esattamente 3/6 mesi con oggi** come il dinamico (2026-10-15, chiesto dall'utente; backend corretto con la migrazione) periodo dinamico "ultimi/prossimi N" = **N unità con oggi** (inizio = oggi − N + 1 giorno; ex P207, 2026-10-15; il backend di addibox si corregge **solo con la migrazione**, passo `manual` della regola, non a mano ora) e "questa settimana" **sempre da lunedì** (`weekStart` per cambiarlo); **un mese di default**, `months={2}` per due (ex P208); campo con **frecce insieme a sinistra**, larghezza minima e nome dalle date dopo uno spostamento ("Agosto 2026", ex P206); le frecce che tornano sulle date di un preset **tornano al preset** (ex P209); **niente "Custom range"**: nel campo solo le date, nella lista nessuna voce (dal dinamico si esce con un preset o con "Scegli le date sul calendario", ex P210); aspetto del prototipo (pillola con ‹ › accese di default, `shiftable`; preset + due mesi + piè Inizio/Fine); **bozza + Applica** (un preset applica e chiude; Annulla/Esc/fuori scartano), chiusura sempre con Esc o clic fuori; periodo dinamico e intervalli aperti tenuti; tolte `mode`, `isSelectionMode`, `setTimespanLabel`, `valid`, `quickRangeConvertor`, `lang`; su telefono foglio con un mese. Le copie locali di 4 app **restano** (JSON diverso).
- **GlobalSearchTextField** (ex P164–P171, 2026-10-15): **tiene il nome**; motore di AsyncAutocomplete (debounce, annullamento, errori), risultati con `href`/`group`/`<mark>`, combobox ARIA, Ctrl/⌘+K (`shortcut`), aspetto del prototipo, telefono a tutto schermo, `bind:open`, `label`, snippet `triggerSnippet`/`itemSnippet`/`groupSnippet`/`emptySnippet`/`footerSnippet`.
- **Timeline** (ex P142–P156, 2026-10-14, analisi in `reference/timeline.md`): ex SimpleTimeLine; item con `title` (ex `name`), `status`, `icon`, `variant`, `time`; una colonna di default + `alternate`; aspetto del prototipo; date `Intl` dal `locale`; `groupBy`, `variant="card"`, stato vuoto.
- **IconsDropdown** (ex P157, P159–P163, 2026-10-15): tiene il nome, involucro di Dropdown; tipo delle voci esportato con `icon` path SVG e **`label` obbligatorio** (nome accessibile, Tooltip, type-ahead); `label` del componente = nome del bottone; aspetto del prototipo (tessere, griglia 36px con `columns` fino a 5, frecce 2D); larghezze come variabili CSS; `multiple`.
- **Layout** (ex P69–P77, 2026-10-14, analisi in `reference/layouts.md`): un solo **`SidebarLayout`** al posto di Unstable/Collapsible/StableDividedSideBarLayout, `expandOn` `toggle` (default) / `hover` / `click` / `none`; scorre **la finestra** (barra e sidebar sticky); `hover`/`click` espandono **sopra** il contenuto, `toggle` lo spinge; su mobile (≤1024px) sidebar nel **Drawer** della libreria, chiuso alla scelta; toggle sempre della libreria, `headerSnippet` = barra dopo il toggle, `toggleSnippet`; il layout disegna **HierarchyMenu** da `options`; HierarchyMenu con link veri, `currentPath`, livelli illimitati, `badge`, `disabled`, `bind:expanded`, Tooltip e Menu dei figli da stretta; HeaderMenu non portato; default 4rem/18rem, barra 3.5rem, sidebar con sfondo e bordo.
- **FileInput e FileInputList** (ex P78–P87, approvate dall'utente il 2026-10-14, analisi in `reference/file-inputs.md`): lista **sotto** la dropzone (`--file-input-list-height` = altezza totale, lista che scorre); dropzone del prototipo con `icon`, `title` (ex `placeholder`/`message`), `description`, riga "oppure sfoglia" dal `locale`, `bodySnippet({ dragging })`, niente `messageSnippet`; `accept` (anche sul drop), `maxSize`, `maxFiles` che rifiuta (messaggio sotto + `onreject`), un solo file nel selettore con `maxFiles={1}`; `onchange({ files, added, removed })`, `replace` (ex `persistOverUpload={false}`); righe del prototipo (icona per tipo, miniatura, dimensione `Intl`, X) con `fileStatus(file)`; `view="grid"` (ex `previewFiles`); input nativo focusabile e nei form; niente duplicati identici; `readonly` (via `dropAreaActive`); `label`/`hint`/`state`/`class` per parte.
- **Avatar e DescriptiveAvatar** (ex P88–P94, scelte dell'utente il 2026-10-14, analisi in `reference/avatars.md`): colore per persona (gradienti da `data-1…6`, stabile da `name` o `colorKey`; in dark chiari con testo scuro, confermato il 2026-10-15), iniziali nome+cognome dalla nuova prop `name` (`text` vince), DescriptiveAvatar `<button>`/`<a>`/`<div>` con manina e hover solo se cliccabile, una sola misura (`size` + `--avatar-size`, tolte width/height/min/max), `children` solo dentro il cerchio, icona persona se vuoto, iniziali durante il caricamento (`imageLoadingStatus` con `'loading'`).
- **MenuOrDrawer e Options** (ex P96, P98, P100, P103, scelte dell'utente il 2026-10-14, analisi in `reference/menu-or-drawer.md`): `activator` e `placement` prop dirette, `menuProps`/`drawerProps` per il resto; bottom sheet alto quanto il contenuto (max 85dvh); voci `options` con `label`, `variant: 'danger'`, `class`, senza `appendIcon`; il menu "⋯" di DataTable usa Options (bottom sheet su telefono).
- **Grafici** (ex P115–P119, 2026-10-14, analisi in `reference/charts.md`): **chart.js resta** (niente SVG scritto da noi: troppo lavoro); colori dal tema risolti dalla libreria (`data-1…6`, `'var(--…)'` nei dati, ridisegno al cambio di tema); aspetto del prototipo, **tick visibili**, **zoom acceso** come v4; correzioni dei bug v4; solo i pezzi usati, via adapter date-fns e lodash. **API semplificata** (ex P120–P127, approvata): prop `horizontal`, `stacked`, `format` + `locale`, `legend` (`'auto'` = solo con 2+ serie); serie con `color`, `type: 'line'` + `axis: 'right'`, `format`, `dashed`, `area`; `options` per il resto; altezza `--{chart}-height`, orizzontali alte quanto le righe; tooltip e legenda HTML; icona "Reset zoom" nell'angolo dell'area dati solo mentre si è zoomati, più il doppio clic (l'altezza non cambia mai); `onitemclick`, `bind:chart`; PieChart **donut di default** con `centerSnippet`; `label` + tabella nascosta.
- **DashboardShaper** (ex P128–P141, 2026-10-14, analisi in `reference/dashboard.md`): un solo componente (DashboardGridShaper non portato); forma dei widget invariata (contratto coi backend); `bind:editing` spento di default; spostare solo su celle libere o scambiando, niente spinta; maniglia che scatta tra le `sizes` del catalogo; `movable`/`resizable` per tornare al comportamento v4; tastiera; `catalog` con `sizes: {width, height}[]`, `category`, `unique`; `rows` senza limite; `onchange` unica; `hasEmptySlots`; sotto 640px del contenitore una colonna in lettura e **schema della griglia** in modifica (blocchi con titolo e misura; il tocco seleziona e il selezionato si trascina subito, con X e maniglia di ridimensionamento; gli altri si trascinano con la pressione lunga; niente barra né frecce; scelte dell'utente 2026-10-14); su touch si trascina dopo una pressione lunga anche da largo; gap ~10px.
- **Approvazioni in blocco** (2026-10-15, utente: "il resto tutto approvato"): P95, P97, P99, P101, P102 (MenuOrDrawer, già fatte), tutte le scelte fatte senza domanda che aspettavano l'ok (FileInput → GlobalSearchTextField, elencate in `history.md`); **da implementare**: P56 (ricerca della DataTable parola per parola), P104 (maniglia e trascina giù per chiudere su tutti i bottom sheet), P40 (`v4-compat.css` opt-in, va col lavoro sulla migrazione). P42 resta da ristudiare.
- **ColumnManager** (2026-10-13, ex HeadersDrawer): Drawer a destra (bottom sheet sotto 640px) come il prototipo; `columns` + `bind:columnState` + `bind:open` + `onsave({ columnState })`; **anteprima dal vivo e "Salva vista"**, chiudere senza salvare annulla; "Ripristina" = vista di default; pin attivo di default (`pinnable={false}`); `TableColumn` guadagna `required`, `icon` e `description` (solo pannello, ripiego su `info`; cambiato il 2026-10-13 per non mettere ⓘ in ogni header); riordino a puntatore e tastiera, fisse in testa e riordinabili.

## Proposte (non ancora confermate)

Le nuove proposte vanno in una tabella `| # | Proposta | Nota |`, numerate dal primo numero libero (ultimo usato: P221; P19 e P20 sono state usate per i layer e Tailwind).

| # | Proposta | Nota |
|---|---|---|
| P180–P188 | SelectableVerticalList (P180–P186) e SelectableMenuList (P187–P188) superate dalla decisione "Punto 6"; BoxList P172–P179 e ToggleList P189–P191 approvate | elenco in `reference/lists.md` |
| P220 | Passi `manual` divisi in `review` (si guarda) ed `edit` (si scrive); la lista dei punti rimasti mostra prima gli `edit` | dall'analisi delle 20 app, `reference/migration.md` |
| P221 | Regole v3 → v4 minime per i nomi v3 trovati da `analyze` nelle 10 app v3 | idem |

## Domande aperte

- Font size e densità: sono design (tematizzabili) o layout?
- Quali componenti v4 non portare? Candidato: `Code` (serve solo alla doc; `DashboardGridShaper` non portato il 2026-10-14).
- Consolidare i componenti duplicati (gli 8 picker, i 3 switch, i 3 layout)? È un cambio di API, quindi va chiesto.

## Da fare (richieste dell'utente e del capo)

**Subito, prima del prossimo componente** (deciso il 2026-10-09): fatto il 2026-10-09 (infrastruttura, test e regole dei 30 componenti). Da qui ogni componente nuovo ha test e regole nel suo stesso giro (processo, passi 7b e 8c).

**Ordine dato dall'utente il 2026-10-15**: (1) ricerca delle docs con GlobalSearchTextField (fatta); (2) **studiare un metodo di migrazione semplice**, che funzioni "senza che uno conosca tutto quanto" (chi migra un'app non deve sapere tutta la libreria né leggere MIGRATION.md per intero): P211–P219 approvate il 2026-10-15 (`reference/migration.md`, piano di lavoro nella sezione "Piano"; passi 1–4, fino ad `analyze` su tutte le app, fatti il 2026-10-15); (3) P56, P104, P40 approvate, da fare.

**Dopo** (chiesti dal capo, non bloccano i componenti):
- codemod, server MCP e prompt di migrazione (decisione "Migrazione guidata", `reference/migration.md`), che leggono le regole di ex P44;
- pipeline di rilascio: bump, GitHub release, pnpm, changelog (da proporre: Changesets, che non richiede commit convenzionali; decidere se fare del repo un workspace pnpm con v4 e v5);
- P38 (portare prima i componenti che bloccano la migrazione); P40 (`v4-compat.css`) fatto il 2026-10-15.

**Segnalati dall'utente il 2026-10-13** (prima o dopo le tabelle, non bloccano; i due problemi dei filtri su mobile sono risolti, vedi `history.md`):
- **`FilterModifierApplier` unico**: oggi è copiato nei backend di 20 app in 6 varianti diverse (`reference/filters-backends.md`); trovare il modo di averne uno solo (pacchetto condiviso per Adonis/Lucid, versionato insieme a `FilterBuilder`), così niente copia-incolla e si risolvono insieme varianti rotte (E/E'), `kind` mancanti e whitelist di sicurezza.

Il Toast, chiesto il 2026-10-08, è fatto il 2026-10-09.

## Lezioni dalla v4 (dettagli in `design/AUDIT.md`)

- Gli attributi nativi (`disabled`, `name`, `required`, `id`) devono arrivare all'elemento nativo. Nella v4 Button perdeva `disabled`.
- Mai `outline: 0` senza un sostituto `:focus-visible`.
- Niente import interni dal barrel (`$lib`, `#lib`): creano cicli. Usare percorsi diretti.
- Niente singleton globali né scritture su `document.documentElement` da dentro i componenti.
- Gli id si generano con `$props.id()`: niente id fissi o casuali (rompono l'SSR e si duplicano).
- Ogni `$effect` che aggiunge listener restituisce il cleanup. Se il valore si può derivare, usare `$derived`.
- Tutti i tipi pubblici vanno esportati da `src/lib/index.ts`.
- `{#each}` sempre con chiave.
- Nei componenti niente colori o px hardcoded: si usano solo token.
- Lo stile per istanza deve funzionare anche sugli overlay.

## Processo per un componente

1. **Specifica del comportamento**: leggi il componente v4 e la sua pagina docs (un subagente se è grande). Elenca props, `$bindable`, snippet, callback e variabili CSS.
2. **Riferimento visivo**: la card del prototipo `design/components-prototype.html` (cerca il percorso v4 del componente); stati, varianti, light e dark.
3. **Differenze e parità**: ogni capacità della v4 e il suo equivalente; quello che manca o si scarta, e ogni cambio di comportamento o API, si chiede **prima** di implementare. Segnala i comportamenti senza senso.
4. **Contratto di personalizzazione** (5 punti) e convenzioni: leggi `reference/conventions.md`.
5. **Implementazione** in `aurora/src/lib/components/...`, solo token; variabili CSS per ogni parte e stato.
6. **Docs**: `@component`, JSDoc di ogni prop, esempi in `src/docs/examples/<slug>/`.
7. **Verifica a mano** nel browser (light/dark, Aurora/classic, tastiera, mobile se serve), poi **test** in `tests/components/<C>.test.ts` (quello verificato a mano diventa un test) e baseline visive dei soli esempi nuovi.
8. **Export** da `aurora/src/lib/index.ts`; **migrazione** in `MIGRATION.md` e `migrations/v4-to-v5/<C>.ts`.
9. **Skill**: una riga in "Stato" qui, i dettagli in `reference/history.md`, le decisioni in entrambi i posti.

## Regola dei test (2026-10-13, richiesta dell'utente: girano solo i test strettamente necessari)

La suite intera (~2.400 test in due browser, 3–4 minuti) e il test visivo intero (~500 screenshot, 2 minuti) non si lanciano dopo ogni modifica. Da `aurora/`:

- **Durante il lavoro**, solo i test di ciò che hai toccato:
  - un componente: il **suo file di test** e quelli dei componenti che lo usano direttamente (`npx vitest run --project components tests/components/<C>.test.ts tests/components/<D>.test.ts`);
  - una utility: `npx vitest run --project node tests/node/<x>.test.ts`;
  - lo strumento di migrazione: `npx vitest run --project node migrate/tests` (e `npm run migrate:rules` se cambia una regola);
  - un pezzo condiviso di cui non sai chi lo usa: `npm run test:related -- <file sorgente>` (Vitest esegue i test che lo importano). Attenzione: i test che importano dall'indice `#lib` risultano collegati a tutto, quindi `test:related` su un componente lancia più file del necessario (Divider: 20 file su 86); per un componente il file diretto è meglio.
- **Test visivo**: solo gli esempi toccati, `npx playwright test -g "<slug>"`; baseline nuove o cambiate solo per quelli, `npx playwright test -g "<slug>" --update-snapshots=all` (senza `=all` riscrive solo quelle sopra soglia, vedi `traps.md`), poi guardare le immagini. Mai `test:visual:update` su tutto.
- **`npx svelte-check --threshold error`**: una volta alla fine del giro di modifiche.
- **Suite intera (`npm run test`) e visivo intero (`npm run test:visual`)**, solo:
  - prima di un commit chiesto dall'utente;
  - se si toccano fondamenta usate da tutti: `tokens.css`, la riga dei layer, `floating.ts`, `Menu`, `modal.ts`, `Button`, `SimpleTextField`, `api.server.ts` delle docs;
  - se l'utente lo chiede.
- **`npm run package`**: solo se cambiano export o struttura dei file del pacchetto, o prima di un commit.
- Mai suite e visivo in parallelo. La regola vale anche per i subagenti: va scritta nel loro prompt.

## Convenzioni essenziali (elenco completo in `reference/conventions.md`)

- Ogni CSS e ogni `<style>` inizia con `@layer reset, theme, base, global.base, global.theme, global.components, components, utilities;`; regole in `@layer global.components { … }`, default `--{comp}-default-*` in `Component.css` su `:root` in `@layer global.base`; nel `<style>` `var(--{comp}-x, var(--_x))`.
- Testi di default da `libraryTexts(locale)` (`utils/texts.ts`, `it`/`en`): prop di testo senza default nel destructuring, `closeLabel ?? texts.close`; `locale` risolto con `inheritedLocale()` (prop > `setDefaultLocale` > `en`).
- Props: interfaccia `Props` con JSDoc su ogni membro, tipi scritti per esteso (niente alias), default e `$bindable` nel destructuring; prop di stato legate dalle app `$bindable()` **senza default**; id con `$props.id()`; `{#each}` con chiave; `$effect` con cleanup.
- Elemento esposto (`menuElement`, `input`): `$state` locale copiato nella prop con `bind:this` a coppia getter/setter.
- `aria-describedby`/`aria-invalid` dell'app si uniscono a quelli del componente; hover dei campi `:not(:focus-within)`; hover in `@media (hover: hover)`; focus con `outline` dai token.
- **Commenti** (2026-10-13, richiesta dell'utente): restano solo quelli che chi usa la libreria vede in hover (`@component` e JSDoc delle Props dei componenti pubblici, JSDoc di tipi, funzioni e costanti esportati da `index.ts` e dei membri dei tipi pubblici) e quelli con un effetto (`svelte-ignore`, `@vite-ignore`, `@ts-expect-error`). Niente altro, in nessun file: niente JSDoc su componenti, funzioni e tipi interni, niente commenti in test, docs, esempi, regole di migrazione, CSS.
- Le parti interne di un componente grande stanno in una cartella col suo slug (`search/filters/`).
- Un componente composto espone nelle sue prop/`labels` ogni testo dei sottocomponenti che mostra.
- Test: `vitest-browser-svelte`, locator per ruolo, `expect.element`, `userEvent`; bind con getter/setter o file `*.svelte.test.ts` con `$state`; un test `v4 bug: …` per ogni comportamento v4 scartato. Regole di migrazione: `export default {...} satisfies ComponentMigration`.

## Trappole più frequenti (elenco completo in `reference/traps.md`)

- `cp`, `rm`, `mv` (e `ps`) sono alias interattivi: `command cp -f`, `command rm`, `command mv -f`, altrimenti il comando resta fermo.
- I comandi npm vanno lanciati **da `aurora/`** (dalla root agiscono sulla v4). Aurora non ha Prettier: non lanciarlo.
- `sed -i` a volte non viene visto dal watcher di Vite: usare Edit/Python o fare `touch`.
- SvelteKit 3: niente `$lib` (si usa `#lib/...` in docs e test, percorsi relativi in `src/lib`); `$app/environment` deprecato, usare `import.meta.env.DEV`.
- Un `<dialog>` modale rende inerti anche i popover aperti fuori da lui: un popover che deve funzionare con un modale aperto va messo dentro il `<dialog>`.
- Una prop `$bindable` non legata dall'app torna `undefined` quando il genitore rilegge le prop: tenere l'elemento in uno `$state` locale.
- Test sotto carico: tempi reali instabili nella suite intera; misurare dall'evento giusto, `expect.poll`, mai visivo in parallelo con la suite.
- Playwright MCP: screenshot solo dentro il repo (`.playwright-mcp/`); se il browser è occupato da un'altra sessione, script Node con il `playwright` di aurora.
- Lo scratchpad (`/tmp/claude-1000/...`) si svuota al riavvio del PC.

## Stato (sintesi; dettagli in `reference/history.md`)

- **Fondamenta**: token, temi (Aurora, classic, galleria), layer, Tailwind, docs generate, infrastruttura di test e di migrazione.
- **Componenti fatti**: GlobalSearchTextField, PeriodPicker, PeriodSelector, ToggleList, BoxList, IconsDropdown, Timeline, DashboardShaper, BarChart, LineChart, PieChart, Button, Icon, LinkButton, ActivableButton, ConfirmOrCancelButtons, SimpleTextField, Textarea, Select, Checkbox, Switch, RadioButton, RadioGroup, Autocomplete, AsyncAutocomplete, CountriesAutocomplete, Dropdown, FlagIcon, Chip, Menu, Dialog, Drawer, TabSwitcher, Divider, Tooltip, CircularLoader, DotsLoader, Skeleton, ProgressBar, HorizontalStackedProgress, AlertBanner, NoData, Toaster, Calendar, DatePicker, MonthSelector, YearSelector, DatePickerTextField, YearPickerTextField, **TimePicker**, **TimePickerTextField**, **DateTimePickerTextField** (2026-10-13), **Paginator**, **Table**, **ColumnManager**, **DataTable**, **HierarchyMenu**, **SidebarLayout**, **Avatar**, **AvatarGroup**, **DescriptiveAvatar**, **MenuOrDrawer**, **MenuOrDrawerOptions**, più **Filters**, **FilterEditor**, **SearchBar**, **FileInput** e **FileInputList**.
- **Filtri**: completi e divisi in file piccoli (`search/filters/`, `utils/filters/convert/`); dettagli e decisioni del 2026-10-12/13 in `reference/history.md` e `reference/decisions.md`.
- **2026-10-13**: `DateTimePickerTextField` fatto e usato dai filtri (`datetime`, `datetimeRange`); suite 2542 verde, visivo 528.
- **2026-10-13, dopo**: toni alternati dei gruppi annidati dei filtri, testi dal `locale` in tutta la libreria con `setDefaultLocale`, chip del formato che si nasconde da solo; suite 2653 verde, visivo 528, package ok.
- **2026-10-13, commit e push** su `origin aurora-v5` di tutto il lavoro dal 2026-10-09 (due test instabili sotto carico corretti prima: Tooltip, SearchBar).
- **2026-10-13, piano tabelle**: analisi della v4 e dell'uso nelle app (`reference/tables.md`), proposte P47–P55 confermate dall'utente, più la vista a card su mobile.
- **2026-10-13, Paginator** fatto (decisione omonima): test, regola, 6 esempi, 24 baseline. Commit e push su `origin aurora-v5`.
- **2026-10-13, Table** fatta (ex SimpleTable; decisioni ex P47–P55 e "Table, dettagli"): logica in `utils/table/`, 12 esempi, test, regola; docs con la nuova sezione **Types** per tutti i componenti. Commit e push su `origin aurora-v5`.
- **2026-10-13, ColumnManager** fatto (decisione omonima): logica in `utils/table/manager.ts`, 3 esempi, test, sezione in `MIGRATION.md` (componente nuovo: HeadersDrawer era interno). Commit su `aurora-v5` (push non chiesto).
- **2026-10-13, DataTable** fatta (ex PaginatedTable, EnhancedPaginatedTable, DynamicTable; decisioni ex P47–P55 e "DataTable, dettagli"): logica in `utils/table/query.ts`, 6 esempi con finto backend, test, regole (un file con tre regole), sezione in `MIGRATION.md`. Commit non chiesto.
- **2026-10-14, ripristini**: azioni della barra di selezione (`selectionActions`), breakpoint condivisi + `MediaQuery` con l'API v4, `theme` reattivo/store + `toggleMode` + `rememberAppearance` + `appearanceScript`, `disabled` e `selectAll` di Table/DataTable, avviso in sviluppo per i campi data senza lingua, margine di ConfirmOrCancelButtons come variabile; suite intera 3069 verde (Toaster instabile noto), visivo 644.
- **2026-10-13, DataTable, dopo**: nuova query → scroll interno in cima; corretto in Table il costo delle transizioni avviate in massa ("seleziona tutto" a 10k righe 15 s → 2,9 s). Virtualizzazione (ex P57) fatta: a 10k righe caricate ~1.200 nodi invece di 230k, scroll a 60 fps, selezioni in ~30 ms.
- **2026-10-14, HierarchyMenu e SidebarLayout** (ex Unstable/Collapsible/StableDividedSideBarLayout; decisione "Layout"): link e `currentPath`, Drawer su mobile, esempi dei layout in iframe nelle docs; regole (3 per il layout), `MIGRATION.md` con la nuova sezione "Not ported" (HeaderMenu e componenti di P67); docs costruite su SidebarLayout. Suite intera 3166 verde, visivo 672; commit e push su `origin aurora-v5` (`cba5fd5`).
- **2026-10-14, FileInput e FileInputList** (decisione omonima, ex P78–P87): zona con input nativo, validazione con messaggio, lista sotto con stato per file, griglia, `readonly`; `utils/files.ts` con `formatFileSize` esportata; 11 esempi, 44 baseline, test, regole, `MIGRATION.md`. Suite intera 3253 verde, visivo 716; commit e push su `origin aurora-v5` (`3a6f1a1`). Le 8 scelte fatte senza chiedere (zona compatta automatica, duplicati nel messaggio, messaggio al posto dell'hint, input attivo a lista piena, focus dopo la rimozione, `formatFileSize` decimale, prop in più, variabili della zona solo nella pagina di FileInput) approvate il 2026-10-15.
- **2026-10-14, Avatar, AvatarGroup (nuovo) e DescriptiveAvatar** (decisione omonima, ex P88–P94): colori per persona dai token `data-*` con testo scuro in dark, iniziali da `name`, `src` anche `Blob`, stato, anello, forma, stack con "+N", DescriptiveAvatar button/link/div e `compact`; 12 esempi, 48 baseline, test, regole, `MIGRATION.md`. Suite intera 3343 verde, visivo 764; commit e push su `origin aurora-v5`. Le scelte fatte senza chiedere (vedi `history.md` e il messaggio all'utente) approvate il 2026-10-15.
- **2026-10-14, MenuOrDrawer e MenuOrDrawerOptions** (decisione omonima): menu o foglio da `breakpoints`, voci `options` con tastiera ARIA, `danger`, `checked`, `shortcut`, `divider`; il menu "⋯" di DataTable lo usa. 5 esempi, 20 baseline, test, regole, `MIGRATION.md`; corretta anche la pagina docs che su telefono sbordava (percorso del sorgente). Suite intera 3405 verde, visivo 784; commit e push su `origin aurora-v5`. P95, P97, P99, P101, P102 e le scelte senza domanda (min-width 180px, voci del foglio più basse della v4, focus sulla prima voce) approvate il 2026-10-15.
- **2026-10-14, grafici: analisi** (`reference/charts.md`): v4, prototipo, uso in 11 app, confronto delle librerie; P105–P114 (SVG) ritirate; P115–P119 (chart.js) approvate; P120–P127 (API semplificata) approvate.
- **2026-10-14, BarChart, LineChart e PieChart** su chart.js (decisioni "Grafici"): colori dal tema risolti per il canvas, legenda e tooltip HTML, icona "Reset zoom" nell'angolo dell'area dati e doppio clic, tabella per screen reader, donut con totale; 16 esempi, 64 baseline, 82 test, regole, `MIGRATION.md`. Suite intera 3494 verde, visivo 848; commit e push su `origin aurora-v5`. Le scelte fatte senza chiedere (in `history.md`) approvate il 2026-10-15.
- **2026-10-14, DashboardShaper** (decisione omonima, ex P128–P141; DashboardGridShaper non portato): un solo componente che mostra, aggiunge, toglie, sposta (trascinamento e frecce, scambio a parità di misura) e ridimensiona (maniglia e Shift+frecce tra le `sizes` del catalogo); `movable`/`resizable` per il comportamento v4; logica in `utils/dashboard/`; 7 esempi, 28 baseline, test, regola, `MIGRATION.md`; poi trascinamento con scroll corretto e schema della griglia su schermo stretto (tocco + pressione lunga). Suite intera 3592 verde (1 instabile noto sotto carico: SidebarLayout in Firefox), visivo 876, package ok; commit e push su `origin aurora-v5`. Le scelte fatte senza chiedere (in `history.md`) approvate il 2026-10-15.
- **2026-10-14, punto 6: analisi** di IconsDropdown, SimpleTimeLine, BoxList, GlobalSearchTextField, PeriodPicker/PeriodSelector, ToggleList, SelectableVerticalList, SelectableMenuList (`reference/period.md`, `lists.md`, `icons-dropdown-global-search.md`, `timeline.md`), proposte P142–P205; decisione "Punto 6" su cosa portare. Scoperte: BoxList e 36 PeriodPicker su 42 sono **copie locali** nelle app; IconsDropdown sta quasi solo nel `TipTapEditor` copiato in 11 app.
- **2026-10-15, Timeline** (ex SimpleTimeLine, decisione "Timeline"): una colonna o alternata, stati, icone, gruppi per giorno, card, date `Intl`; 7 esempi, 28 baseline, test, regola, `MIGRATION.md`; SelectableVerticalList e SelectableMenuList in "Not ported". Suite intera 3640 verde, visivo 904, package ok; commit e push su `origin aurora-v5` (`a331af6`). Le scelte senza domanda (in `history.md`) approvate il 2026-10-15.
- **2026-10-15, IconsDropdown** (decisione omonima): involucro di Dropdown con tessere, griglia (`columns`, nuovo anche in Autocomplete e Dropdown) e frecce 2D, `IconItem` esportato con `label` obbligatorio, Tooltip sulla tessera evidenziata, `multiple` con "+N", foglio su telefono; 4 esempi, 16 baseline, test, regola, `MIGRATION.md`. Suite intera 3687 verde (2 instabili sotto carico, verdi da soli: BarChart `tooltipSnippet` in Chromium, Tooltip `appearTimeout` in Firefox), visivo 920, package ok; commit e push su `origin aurora-v5`. Le scelte senza domanda (in `history.md`) approvate il 2026-10-15.
- **2026-10-15, BoxList** (ex P172–P179): griglia di card del prototipo con icona e tono (`color`), descrizione sempre visibile, link/bottone/card, snippet dentro l'elemento della libreria; 5 esempi, 20 baseline, test, regola (con le copie locali delle app), `MIGRATION.md`; corretto `<ulist>` nel generatore delle docs; glow dell'hover nel tono della card. Suite intera 3723 verde (1 instabile sotto carico, verde da solo: Filters `closing the panel drops the incomplete rows` in Chromium), visivo 940, package ok; commit e push su `origin aurora-v5`. Card `<div>` senza `href` né `onboxClick` approvata dall'utente; le altre scelte senza domanda (in `history.md`) approvate il 2026-10-15.
- **2026-10-15, ToggleList** (decisione omonima, ex P189–P191): gruppo `role="group"` di ActivableButton con `bind:active` a getter/setter, `mandatory` di default nella scelta singola, `size`, `dot`, `itemSnippet`; 3 esempi, 12 baseline, 13 test × 2 browser, regola, `MIGRATION.md`.
- **2026-10-15, PeriodPicker e PeriodSelector** (decisione omonima, ex P192–P205): JSON v4 invariato, `resolvePeriod` con la semantica dei backend, pillola con frecce, pannello con preset, due mesi, dinamico e date digitabili, bozza + Applica, foglio su telefono; Calendar guadagna `bind:previewDate` e `followSelection`; 4 esempi, 16 baseline, test, regole, `MIGRATION.md` (indice rigenerato).
- **2026-10-15, PeriodPicker, ritocchi** (ex P206–P208): frecce a sinistra, larghezza minima, nome dalle date, "ultimi N" con oggi, un mese di default (`months={2}`), pannello di misura fissa fra le viste; compatto dalla finestra (la misura del pannello in un menu andava in loop).
- **2026-10-15, PeriodPicker, frecce e "Custom range"** (ex P209–P210): le frecce tornano ai preset, niente "Custom range" nel campo né nella lista, bottone "Scegli le date sul calendario" nel dinamico.
- **2026-10-15, GlobalSearchTextField** (decisione omonima, ex P164–P171): palette su Dialog con combobox, gruppi, `<mark>`, Ctrl/⌘+K, motore con debounce e annullamento, tutto schermo su telefono; 1 esempio, 4 baseline, test, regola, `MIGRATION.md` senza più "Not available yet". **Tutti i componenti v4 sono portati o in "Not ported".**
- **2026-10-15, commit e push** su `origin aurora-v5` di ToggleList, PeriodPicker/PeriodSelector (con i ritocchi), GlobalSearchTextField: suite intera 3867 verde, visivo 976, package ok.
- **2026-10-15, ricerca delle docs** con GlobalSearchTextField nella barra (Ctrl/⌘+K): indice `/search.json` generato dal sorgente (componenti, prop, eventi, snippet, metodi, tipi, variabili CSS, token, esempi, sezioni delle pagine), filtrato nel browser; ogni risultato porta alla riga giusta della pagina, evidenziata. GlobalSearchTextField compatto anche prima dell'idratazione (media query CSS). Commit su `aurora-v5` (push non chiesto) insieme allo studio della migrazione: suite intera verde (corretto un test instabile sotto carico di GlobalSearchTextField), visivo 976, package ok.
- **2026-10-15, studio della migrazione** (`reference/migration.md`): misurato l'uso della v4 nelle 20 app (10 ancora su lib v3 + Svelte 4; wrapper `Standard*` importati da 1.365 file; FilterBuilder invariato in 727 file) e cosa coprono le regole (nessun componente solo meccanico, 336 passi manuali, buchi del formato); coesistenza v4+v5 possibile ma costosa. Proposta P211–P219 presentata all'utente.
- **2026-10-15, strumento di migrazione, `analyze`**: pacchetto `aurora/migrate/` (`@likable-hair/svelte-migrate`), regole compilate in JSON (`npm run migrate:rules`), `npm run migrate -- analyze <app…>` in sola lettura (usi diretti e attraverso i wrapper, auto/check/manual, passi d'app rilevati, rapporto Markdown + JSON + riepilogo); 22 test; lanciato sulle 20 app (tabella in `reference/migration.md`). Commit non chiesto.
- **2026-10-15, `setup` (pacchetti)** provato su tatum: branch `aurora-v5`, v5 da `vendor/*.tgz`, `@mdi/js`, installato; nulla committato (commit dello strumento `analyze`: `775172c`).
- **2026-10-15, `setup` CSS, font, `v4-compat.css`** su tatum (nulla committato): riga dei layer, `tailwind.css`, regole su elementi in `@layer reset`, font del prototipo, `v4-compat.css` (nuovo export della libreria, generato da `npm run migrate:compat`).
- **2026-10-15, `setup` lingua** su tatum: `setDefaultLocale('it')` nel layout radice (lingua stimata dall'interfaccia).
- **2026-10-15, preparazione di tatum finita** (`setup`: pacchetti, CSS, font, `v4-compat.css`, lingua, `lang`, `data-mode` dal server), nulla committato in tatum; nel repo della libreria lavoro non committato da `775172c`.
- **2026-10-15, commit** `3090689` su `aurora-v5` (push non chiesto) di `setup` e `v4-compat.css`: suite intera verde salvo SidebarLayout in Firefox (instabile noto, verde da solo); una prima corsa si era bloccata per 10 minuti senza motivo chiaro, rilanciata andava. Spiegazioni all'utente a piccoli passi, una domanda alla volta.
- **Prossimo**: la tappa delle **modifiche automatiche** (codemod) su tatum e scioglimento dei wrapper (piano passo 5 di `reference/migration.md`), a piccoli passi spiegati all'utente; P220–P221 da far confermare; poi P56, P104, P40 (approvate).
