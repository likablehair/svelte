# BoxList, SelectableVerticalList, SelectableMenuList, ToggleList: v4, prototipo, uso nelle app (analisi del 2026-10-14)

Dato principale: **la BoxList della libreria non la usa nessuna app**; i 34 usi reali passano da copie locali.

## v4

- **BoxList** (`simple/lists/`, 113 righe): `boxes` (`{ name, label, href?, style?: { width, maxWidth, minWidth } }`), `gap` (`'15px'`, inline), `onboxClick({ detail: { box } })` (parte anche con `href`), `boxSnippet({ box })` che sostituisce **tutto il box** compresi `<a>`/`<button>` (lo snippet perde clic e tastiera). `<a>` con `href`, altrimenti `<button>`; testo + `mdi-arrow-right` fisso; `background-300`, hover `background-500`, padding 10px, testo 600 1.2rem, radius 5px, flex-wrap. **Nessuna variabile CSS.**
  - **Bug**: `<ul role="listbox">` con figli `<a>`/`<button>` senza `<li>`; `:focus` (non `:focus-visible`) colora il box di primary, che resta blu dopo un clic; import dal barrel; `{#each}` senza chiave.
- **SelectableVerticalList** (402 righe, generica): `elements` (`{ title, name, description?, icon?, data?, style?, appendIcon?, disabled? }`), `bind:selected`, `bind:focused` (= evidenziato), `activeKeyboard`, `loopSelection` (true), `centered`, `bicolor`, `appendIconSize`; `onselect`/`onfocus({ detail: { element } })`, `oniconClick({ detail: { index, element } })`; snippet `elementSnippet`, `titleSnippet`, `descriptionSnippet`; 17 variabili `--selectable-vertical-list-*` (titolo **1.2rem**).
  - **Bug**: tastiera dal `keyboarder` **globale** (frecce ed Enter agiscono su tutta la pagina); frecce che non saltano i disabilitati e non scorrono in vista; Enter e clic selezionano i disabilitati; `bicolor` **mai funzionato** (`:nth-child(even)` su un figlio unico); `ul role=listbox` › `div role=button` › `li` senza `option`/`aria-selected`; ogni tasto stampabile seleziona; `onfocus` col nome di un evento nativo.
- **SelectableMenuList** (159 righe): `items` (`{ name, label, icon, disabled? }` o `{ divider: true }`), `bind:selected`, `bind:collapsed` (solo icone), `onselect({ detail: { item } })`, 7 variabili. Voce scelta = solo colore del testo, niente hover né focus visibile.
  - **Bug**: `div role=button` dentro `ul`; ogni tasto seleziona; disabilitati focusabili; nessun tooltip da collassata; `name` 0 non selezionabile.
- **ToggleList** (`composed/forms/`, 127 righe): `items` (`{ value, label?, icon?, data? }`), `bind:values` (oggetti), `multiple` (true), `disabled`, `onchange({ detail: { select, unselect, selection } })`; una Chip per voce, gap 5px; variabili `--toggle-list-width`, `-max-width`, `-heigth` (refuso).
  - **Bug**: `disabled` = solo opacità (chip cliccabili); con `multiple={false}` la voce sostituita non arriva in `unselect` e un secondo clic svuota; `--button-focus-color="red"` dimenticato; niente `aria-pressed` né `role="group"`.

## Prototipo

- **ToggleList** ("03 Selection controls"): bottoni a toggle alti 32px, radius 8px, bordo `border-strong`, `surface-solid`, testo `text-2` 500, icona 17px; hover testo e bordo `primary`; acceso `primary-soft` + `primary`. Multi.
- **SelectableVerticalList** ("08 Lists"): card max 360px, radius 10px, righe separate da una linea; avatar 36px, titolo 500, riga 12px `text-3`, indicatore in fondo (cerchio vuoto → check `primary`); hover `surface-2`, scelta `primary-soft`. Singola.
- **SelectableMenuList**: è il Menu statico (280px, `surface-pop`, sezione in maiuscoletto, scelta `primary-soft` con ✓).
- **BoxList**: griglia di 3 colonne (una sotto 900px), gap 12px; card padding 12px 14px, radius 10px, `surface-solid` + bordo; **riquadro icona** 34px (`primary-soft`, tono diverso per box), titolo 600, riga secondaria 12.5px `text-3`; niente freccia; hover: sale di 2px, bordo `primary` 40%, ombra `primary-glow`, macchia di gradiente.

## Aurora oggi

- **ToggleList**: Chip `selected` e **ActivableButton** (`aria-pressed`, quasi il bottone del prototipo); FilterValueInput fa già il gruppo di toggle (`role="group"`), quindi l'uso interno v4 (FilterEditor) è assorbito.
- **SelectableMenuList**: **HierarchyMenu** copre icona + testo, `bind:selected`, `iconsOnly` (= `collapsed`), `disabled`, `onoptionClick`, tooltip da stretta; mancano i divisori. Menu/Options hanno l'aspetto del prototipo ma sono overlay.
- **SelectableVerticalList**: RadioGroup `card` e la listbox di Autocomplete la coprono in parte; dei suoi usi interni v4 restano GlobalSearchTextField (SearchResults) e PeriodSelector (lista dei preset).
- **BoxList**: niente di simile.

## Uso nelle app (conteggio del 2026-10-14)

- **BoxList: 0 usi reali della libreria.** I 53 risultati: 7 `StandardBoxList.svelte` identici che **nessuno importa**, 12 tipi, **34 tag in 14 app che usano una copia locale** (`$lib/components/common/BoxList.svelte`: 4 = v4 senza freccia, 10 riscritte; 10 app su v3, 4 su rune).
  - Campi delle copie: `icon` + `description` in 23 tag di 7 app (descrizione **solo in hover**, con `slide` e `{@html}`, quasi sempre testo semplice); `redirectUrl` 11 (solo per `preloadData`); `href`/`url` 7; `style` 0.
  - **27 tag su 34 navigano con `goto`** da una mappa `name → URL` scritta nell'handler; nessuno fa altro che navigare. `gap` `15px` 17, `10px` 5; `animateOnMount={false}` 7/7; `prepend` 1; `boxSnippet` 0.
  - **Bug**: un box che non fa niente per un nome sbagliato nella mappa; copie con `onkeydown` che chiama il clic con **qualsiasi tasto** (Tab naviga via) ed Enter che naviga due volte; `aria-describedby` verso un id che esiste solo in hover; `<a><button>` annidati; `<div on:click>` senza ruolo; le copie scrivono `box.expanded` negli oggetti dell'app.
- **SelectableVerticalList**: 4 tag in 2 app. lupette (v3): 3 **dentro copie dei Filters v3** (già assorbiti), con 3 override per annullare l'1.2rem del titolo; mufasa: 1 wrapper con `elementSnippet` avatar + nome + email + freccia (come il prototipo). Mai usati: `activeKeyboard`, `loopSelection`, `titleSnippet`, `descriptionSnippet`, `onfocus`, `style`.
- **SelectableMenuList**: 2 tag nello stesso `PassRightMenu` di epass (v3) e new-vigipass: colonna fissa di 9–12 **azioni** con icona che aprono un dialog; `selected=''` e `collapsed={false}` fissi; divisori, `disabled`, variabili 0. È un menu di azioni, non una selezione.
- **ToggleList**: 4 tag in 3 app: 2 nelle copie dei filtri (assorbiti), 1 con un solo item usato come interruttore (addibox), 1 "Set 1…N" (mufasa) **rotto**: `onchange={() => handleSetChange}` non chiama la funzione e `values` non è legato.

## Proposte (P172–P191, 2026-10-14)

**BoxList**
- **P172** [cambio di aspetto] Portarla progettata per **sostituire le 14 copie**: card del prototipo, `Box` = `{ name, label, href?, icon?, description?, disabled?, data? }`. Si perde la pillola grigia larga quanto il testo.
- **P173** [aggiunta] Descrizione **sempre visibile** come riga secondaria, `descriptionSnippet` per l'HTML; niente espansione in hover, `animateOnMount`, `preloadData` delle copie (con `href` precarica SvelteKit).
- **P174** [cambio] Griglia `auto-fill minmax(--box-list-min-width ~240px, 1fr)` con `--box-list-gap` 12px al posto di flex-wrap e 15px; tolto `style` per box (0 usi).
- **P175** [cambio di forma] Docs e migrazione spingono `href` al posto di `onboxClick` + `goto` (27 tag); `onboxClick({ box, event })` resta.
- **P176** [cambio di aspetto] Niente freccia di default; `appendSnippet` per chi la vuole.
- **P177** [cambio di aspetto] `<ul>`/`<li>` senza `listbox`; anello `:focus-visible` al posto del box blu su `:focus`.
- **P178** [cambio] `boxSnippet` disegna il contenuto **dentro** l'`<a>`/`<button>` della libreria; più `iconSnippet`, `prependSnippet`/`appendSnippet`.
- **P179** [aggiunta] Hover del prototipo (rispetta reduced-motion), tono dell'icona per box (`color`: `primary`, `data-1…6`), variabili per ogni parte.

**SelectableVerticalList**
- **P180** Pubblica con lo stesso nome (serve a GlobalSearch e PeriodSelector, è nel prototipo); in alternativa solo interna.
- **P181** [cambio] ARIA vera (`listbox`/`option`, `aria-selected`/`aria-disabled`), frecce, Home/End, Enter/Space, salto dei disabilitati, scroll in vista; tastiera **solo con il focus** sulla lista o su un `keyboardTarget` (`aria-activedescendant` dal campo di ricerca), non più su tutta la pagina.
- **P182** [correzione] Disabilitati mai selezionabili.
- **P183** [cambio API] `focused`/`onfocus` → `bind:highlighted`/`onhighlight` (`onfocus` collide con l'evento nativo).
- **P184** [rimozione] Tolti `bicolor` (mai funzionato), `style` (0 usi), `onkeypress` (0); `appendIconSize` → variabile; `centered` da decidere (2 usi, nei filtri copiati).
- **P185** [cambio] `appendIcon` + `oniconClick`: un bottone dentro un `option` non è ARIA valido; l'icona finale diventa l'indicatore di scelta del prototipo, le azioni in `appendSnippet` fuori dalla riga.
- **P186** [cambio di aspetto] Card del prototipo, titolo 14px 500 al posto di 1.2rem, `prependSnippet` per l'avatar.

**SelectableMenuList**
- **P187** [rimozione] Non portarla (2 usi in un componente gemello di due app, usata come colonna di azioni); `MIGRATION.md` rimanda a HierarchyMenu (voci senza `href` + `onoptionClick`, `iconsOnly`) o a `Button` testuali.
- **P188** [aggiunta] `divider` nelle voci di HierarchyMenu, solo se serve.

**ToggleList**
- **P189** [cambio di aspetto] Portarla piccola su ActivableButton: `role="group"` e bottoni `aria-pressed` del prototipo al posto delle chip. In alternativa non portarla (Chip `selected` in un `{#each}`; 2 usi reali).
- **P190** [cambio] `disabled` vero; `onchange({ values, selected, unselected })` con la voce sostituita; con `multiple={false}` niente selezione vuota salvo `deselectable`.
- **P191** [cambio] `--toggle-list-height` al posto del refuso (0 usi); `values` resta un array di oggetti.
