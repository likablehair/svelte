# MenuOrDrawer e MenuOrDrawerOptions: v4, prototipo, uso nelle app

Analisi del 2026-10-14 (uso nelle app raccolto da un subagente sulle 22 app). Le proposte che ne derivano sono in `SKILL.md` (P95–P103) e, una volta confermate, in `decisions.md`.

## Comportamento v4

- `composed/common/MenuOrDrawer.svelte` (77 righe): `MediaQuery` → con `mAndDown` (≤1024px) un `Drawer` (`position: 'bottom'` di default, `_space` 20rem dal Drawer), altrimenti un `Menu`. Prop: `open` (bindable), `menuProps`, `drawerProps` (fusi con `lodash.merge` sui default: Menu `closeOnClickOutside`, `_boxShadow`, `_height: fit-content`, `_minWidth: 100px`, `_borderRadius: 5px`, `anchor: 'bottom-center'`, `stayInViewport`), `children({ isDrawer, isMenu })`. Fa `bind:` di sei chiavi di `menuProps` (activator, menuElement, ...), che quindi vengono mutate.
- `composed/common/MenuOrDrawerOptions.svelte` (92 righe): `MenuOrDrawer` + `SelectableVerticalList`. Prop: `open`, `elements` (`{ name, title, description?, icon? (classe MDI), data?, style?: { color, backgroundColor }, appendIcon?, disabled? }`), `onselect({ detail: { element } })`, `menuProps`, `drawerProps`. Al clic chiude e chiama `onselect`. Altezza del drawer `min(n, 5) * 56px`, righe da 56px nel drawer.
- Bug e stranezze v4:
  - nessuna tastiera: `activeKeyboard` della lista resta `false`, le voci sono `div role="button"` dentro `<li>` dentro `ul role="listbox"` (ARIA sbagliata);
  - `appendIcon` non fa niente: il clic si ferma con `stopPropagation` e `oniconClick` non viene inoltrato;
  - `disabled` = `pointer-events: none`, non raggiungibile né annunciato;
  - `lodash.merge(menuPropsDefaultValue, menuProps)` muta i default condivisi (Options; MenuOrDrawer usa `merge({}, …)`);
  - `selected` viene azzerato da un `$effect` subito dopo il clic.

## Prototipo

Card "MenuOrDrawer · Options" (`design/components-prototype.html` ~riga 1273): desktop = menu flottante con voci icona + testo, voce selezionata con ✓ a destra ("Preferito"); mobile = bottom sheet con maniglia, stesse voci. Card Menu subito sopra: etichetta di sezione ("Azioni"), scorciatoie da tastiera a destra (`E`, `⌘D`, `⌫`), separatore, voce `danger` rossa in fondo.

## Uso nelle app (11 app su v4; ganymede, h24, lupette usano MenuOrDrawer ma sono su v3)

**MenuOrDrawer**: 11 istanze, 10 file, 4 app (stramoniumai 7, addibox 2, maya 1, contattorapido 1), più usi indiretti tramite componenti dell'app.
- `menuProps`: `activator` 11/11, `anchor` 8 (`bottom-center` 4, `bottom` 3, `left` 1), `_width` 3, `_borderRadius` 3, `_height: auto` 2, `_maxHeight` 2, `_boxShadow` 2. Mai: `closeOnClickOutside`, `flipOnOverflow`, `stayInViewport`, `openingId`, `refreshPosition`, `menuElement`, `_minWidth`. `bind:menuProps` mai.
- `drawerProps`: 9/11, solo `_space` (8: `60dvh` 4, `90dvh` 3, `40dvh` 1) e `_borderRadius` 1. Una volta `--drawer-space` come style prop.
- `children`: 9/11 con parametri, `isDrawer` letto 8 volte, `isMenu` 1. Schema fisso: un solo snippet dell'app reso in entrambi i rami; nel drawer cambia solo il padding, nel menu l'app costruisce la "scatola" (sfondo, bordo, radius, ombra, larghezza, `max-height` + scroll). Una sola volta cambia il contenuto (header ed nota solo nel menu).
- Apertura: sempre `bind:open` + activator `bind:this` (`<button>` 8, `<div>` attorno a un componente 3); toggle 10/11; la chiusura dopo la scelta la fa sempre l'app.

**MenuOrDrawerOptions**: 13 istanze, 12 file, 4 app (addibox 7, stramoniumai 4, maya 1, mufasa 1 in un wrapper usato 4 volte).
- `menuProps` 10/13: `activator` 10, `anchor` 10 (`right` 8, `left` 1, `bottom` 1), `flipOnOverflow: true` 9, `_activatorGap: -15` 1, `_minWidth` 1. `drawerProps` mai.
- `elements` (16 siti): `name` e `title` 16, `icon` 12, `style` 7 (6 solo `color` per le voci di eliminazione, 1 sfondo pieno), `disabled` 4, `data` 3, `description` 0, `appendIcon` 0. Da 1 a 5 voci, ~3 in media, spesso condizionate da permessi.
- `onselect`: sempre azioni (dialog, export/download, elimina, salva, naviga), mai la scelta di un valore. 13 siti fanno `if/else` su `e.detail.element.name`, 2 chiamano `element.data.action()`, il tipo dell'evento è riscritto a mano in 4 file.
- Voci "danger": 9 voci in 7 siti, tutte con `style.color` rosso (`error-500`, una `#ad0000`), maya con sfondo rosso pieno.
- Activator: bottone con icona "⋯" 8, altri wrapper 3, nessun activator (solo drawer) 2.

**Pattern e bug delle app** (non della libreria): un'istanza per riga di tabella con activator in un `Record`, `stopPropagation` sul clic di riga (mancante in un ramo); stato `open` condiviso dentro un `{#each}` (addibox ContractsDocuments); `onselect` che non parte mai perché aspetta `data` assente (stramoniumai wallets); `bind:activator` inesistente in v4 (mufasa OptionMenu, API v3); ramo scelto a mano in 6 punti (solo Menu su desktop + Drawer separato su mobile, o solo Drawer senza activator su mobile); `{#key}` per forzare il remount; drawer aperto da un `onselect` che apre un altro drawer.
