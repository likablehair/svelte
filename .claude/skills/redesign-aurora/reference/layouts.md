# Layout e HierarchyMenu: v4, bug e uso nelle app (analisi del 2026-10-14)

Serve per `SidebarLayout`, `HierarchyMenu` e le loro regole di migrazione. Decisioni in `decisions.md` (ex P69–P77).

## Uso nelle app (20 app con un layout)

- **Montaggio**: 20/20 in `src/routes/(main)/+layout.svelte`, mai nel layout radice; login in `src/routes/auth/*` fuori dal gruppo. Il layout radice tiene store utente, nprogress, Toaster. Pagine che scappano dalla shell: `+page@.svelte` (addibox, h24), `{#if}` su una regex (mufasa), barra `static` su certe rotte (ganymede).
- **Versioni**: su v3 (slot, `on:`) billboards, emarket, epass, ermes, ganymede, h24, lupette, quantum, likable-tools; su v4 cbam, mufasa, new-vigipass, addibox, maya, stramoniumai, tatum, contattorapido, biblio, biblio-smart-folder, astro.
- **UnstableDividedSideBarLayout** (11 app: billboards, cbam, emarket, epass, ermes, ganymede, h24, lupette, mufasa, new-vigipass, quantum): `options` 11 (8 con il menu interno), `bind:drawerOpened` 11 (quasi mai letto), `bind:selectedIndex` 8 (sempre derivato dall'URL con `startsWith` + `findIndex`), `sidebarExpanded` 4, `expandOn` esplicito 6 (`hover` 4, `click` 2), `onmenuSelect` 10 (catena if/else nome → `goto`). Snippet: innerMenu 10 (logo ridotto su mobile, ricerca globale, pill del cliente/azienda che apre un Dialog, campanella), logo 10, user 10 (avatar → `/profile`, Logout 11/11, tema 10/11), menu 2 (HierarchyMenu), prepend/option 1 (badge numerici + `preloadData` al passaggio), sidebar 1 (cbam: copia del markup interno per voci disabilitate e badge), header 1 (new-vigipass: perde l'hamburger, su mobile il menu non si apre). Variabili: `--color-inverted-selector-selected-background-color` 7, `-header-menu-height` 2, `-header-menu-position` 2, `-content-padding-top` 2, `-default-content-padding` passato come prop 2, `-content-padding` 1.
- **CollapsibleSideBarLayout** (8 app: likable-tools, addibox, maya, stramoniumai, tatum, contattorapido, biblio, biblio-smart-folder; le ultime 5 quasi identiche): `bind:drawerOpened` 8, `bind:sidebarExpanded` 8, `onmenuSelect` 6 (morto). Snippet: header 8/8 (rifanno a mano i toggle: `mdi-menu` su `mAndDown`, `mdi-dock-left` su desktop; poi tema, avatar → `/profile`, pill tenant/azienda, bottone AI, notifiche, job), logo 7 (`collapsed={!sidebarExpanded && !hamburgerVisible}`), menu 7 (sempre HierarchyMenu), user 7, sidebar 1, children 8 (7 dentro un box `calc(100dvw - 52px)` × `calc(100dvh - 50px)` con `overflow-auto`). Variabili copiate in 7 app: `-content-padding: 0px`, `-background-color`, `-side-bar-border`, `-header-menu-border`, `-inner-header-menu-background-color`, più due col prefisso `--collapsible-side-bar-layout-*` **senza effetto** (`drawer-background-color`, `header-menu-padding`: la migrazione le toglie, non le mappa).
- **StableDividedSideBarLayout**: 1 app (astro), `menuSnippet` che rifà l'hamburger, `sidebarSnippet` con SidebarMenuList (unico uso).
- **HierarchyMenu** (11 app): `options` 11, `selected` 11 (nome derivato dall'URL), `iconsOnly` 11 (`!sidebarExpanded && !hamburgerVisible`), `onoptionClick` 11 (nome → `goto`, più `drawerOpened = false` in 6), `expanded` 1, prepend/option 1 (Tooltip sull'icona da stretta). Variabili: `--hierarchy-menu-element-selected-background-color` 10 (primary-500), `-element-selected-color` 10 (white), `--icon-size: 20px` 10, `--hierarchy-menu-default-gap` 8, `--icon-cursor` 4.
- **HeaderMenu**: 0 usi vivi. Store `sidebarOpened`: non esportato, 0 usi.
- **Voci del menu**: `{ name, label, icon: 'mdi-*' }`, `url` (2 app), figli `options` (addibox, maya), 2–9 voci; filtri per permessi in 9 app; menu a scomparsa con voce "Indietro" (epass, new-vigipass, cbam).
- **Funzioni ricorrenti fatte a mano**: pill tenant/azienda nella barra (10 app), cambio tema (tutte), logout in sidebar (12), badge/contatori (2), preload al passaggio (2, gratis con link veri), voci disabilitate (1), Tooltip da stretta (1), pannello a destra del contenuto (AI, 4 app: diventa Drawer dal basso su mobile).

## Comportamento v4

- Tutti e tre: scorre la finestra, barra e sidebar `fixed`, `.main-section` spostata con padding; su mobile (`mAndDown` + CSS 1024px) hamburger e pannello da sinistra **sotto** la barra con overlay; `drawerOpened` + `ondrawerChange({detail:{opened}})`; `class {container, header, mainSection, overlay}`.
- **Unstable**: rail 4rem → 18rem su hover (default) o click, spinge il contenuto; menu interno ColorInvertedSelector da `options` con `selectedIndex`; chiude il drawer alla scelta; `ondrawerChange` anche su desktop a ogni scelta; scrive lo store globale `sidebarOpened`; rail senza sfondo e `overflow: clip`.
- **Collapsible**: rail 4rem → 300px col bottone `mdi-dock-left`, `onsidebarToggle({detail:{expanded}})`; nessun menu interno; su mobile forza `sidebarExpanded = false`; non chiude il drawer alla scelta; variabili `--collapsible-divided-side-bar-layout-*`; barra 48px.
- **Stable**: sidebar fissa 18rem, `menuSnippet` senza parametri sostituisce la barra.
- **HierarchyMenu**: `Option = { label, name, icon?, href?, options? }` (2 livelli, `href` ignorato); `selected` (nome, bindable), `expanded` (non bindable), `iconsOnly`; righe `div role=presentation` senza tastiera; icona che diventa freccia al passaggio; da stretta figli irraggiungibili e il genitore si seleziona; `onoptionClick({detail:{option}})`.

## Bug v4 da non ripetere (test `v4 bug: …`)

- Righe del menu non raggiungibili da tastiera; bottoni senza nome né `aria-expanded`; niente `aria-current`.
- Da stretta i figli sono irraggiungibili e le icone non hanno nome.
- Drawer mobile senza Esc, focus, blocco dello scroll; voci chiuse focusabili; hamburger `span role=button` senza nome.
- Unstable `click`: dopo la scelta il clic risale all'header e riapre la rail.
- Hover non escluso su touch; overlay chiuso a z-index -100 cliccabile.
- Testi "Menu", "logo", "Content", "Sidebar" in produzione senza snippet.
- Espansione che sposta la pagina (in `hover`/`click`); `transition-property` senza virgola.
- Variabili di Collapsible col prefisso sbagliato e due mai lette; colore della barra come tripletta RGB.
- Il `headerSnippet` sostituisce anche l'hamburger e non riceve una funzione per aprire il drawer.
