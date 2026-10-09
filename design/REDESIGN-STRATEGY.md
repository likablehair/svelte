# Redesign Aurora: strategia di transizione

> **Aggiornamento 2026-10-08.** Si è deciso di riscrivere la libreria da zero in `aurora/` invece di restilizzare quella attuale. Restano validi come riferimento: la proposta di token globali (sezione 2), la palette (sezione 3), il contratto delle variabili CSS (sezione 4) e i livelli L0–L3 come criterio per capire quando una modifica tocca la logica. Le fasi in-place (sezione 6) e il piano di rilascio (sezione 8) sono superati. Lo stato aggiornato delle decisioni è nella skill `.claude/skills/redesign-aurora/SKILL.md`.

Proposta su come portare i componenti di `@likable-hair/svelte` verso il prototipo `design/components-prototype.html` senza bloccare il lavoro e senza rompere le app che usano la libreria. Il contesto tecnico (bug, debolezze, numeri) è in `design/AUDIT.md`.

## Il task e il problema

Il task chiede tre cose:
1. avvicinare l'aspetto di default di ogni componente al prototipo, con modifiche **solo stilistiche**, e chiedere prima se serve cambiare la logica;
2. rendere ogni componente personalizzabile tramite variabili CSS;
3. cambiare le tonalità di default, light e dark, per avvicinarle al prototipo.

Il problema: molte differenze tra prototipo e componenti non sono solo CSS. Il prototipo aggiunge varianti di bottone, label e stati di errore nei campi, uno spinner accanto al testo e così via. Se per ognuna si chiede il permesso, il lavoro si ferma di continuo; se non si chiede, si esce dal perimetro del task.

**Proposta:** classificare le modifiche in livelli e concordare **una volta sola** cosa si può fare senza chiedere. Il resto si raccoglie in un registro, da discutere a blocchi invece che caso per caso.

## 1. Livelli di modifica

| Livello | Cosa cambia | Esempi dal prototipo | Si può fare? |
|---|---|---|---|
| **L0. Solo CSS** | valori, nuove variabili CSS, token globali, nuove regole su classi già presenti | palette, radius, ombre, focus ring con `:focus-visible`, transizioni, `:active { transform: scale(.97) }`, gradienti, sostituire px e colori hardcoded con token | Sì, è il cuore del task |
| **L1. Markup interno** | struttura HTML interna, classi interne, attributi `aria-*`; API e comportamento restano identici | Switch: input da `display:none` a `opacity:0` più una `.track` (serve anche per il focus ring); wrapper per l'icona; `aria-*` mancanti | Sì, con nota nel changelog. Rompe solo le app che stilano classi interne con `:global(...)` |
| **L2. API additiva** | nuove prop opzionali il cui default riproduce il comportamento attuale | Button `variant="secondary\|danger\|gradient"` e `size="sm\|lg"`; SimpleTextField `label` e `state="error\|success"`; contatore nella Textarea; prop `loadingText` per Button | Da una lista approvata in anticipo, che non rompe nessuno |
| **L3. Comportamento o API che rompono** | cambia cosa fa il componente, o cambiano nomi e forme dell'API | spinner accanto al testo come **default** di `loading`; overlay su `<dialog>`/`popover` nativi; picker unificati; callback senza `{detail}`; rinomina di prop | No, va nel registro (sezione 7) e si decide a blocchi |
| **Bug** | correzioni di comportamento errato | Button che non inoltra `disabled`, Esc che ignora `persistent`, ... (`AUDIT.md`, sezione 5) | Sì, ma **in PR separate**, mai mescolate al restyle |

Regola pratica: **una PR, un livello**. Uno stesso componente può avere una PR L0 e poi una L2, ma non una PR che mischia stile e logica. Così la review è veloce e si può fare rollback mirato.

## 2. Variabili di app (token globali)

La tua idea, "una riga per rendere tutta l'app super bordata", è **L0 al 100%**: non tocca logica né markup. In più è il modo più rapido per soddisfare il punto 2 del task.

### Come funziona

Oggi ogni proprietà ha due livelli. Basta aggiungerne un terzo in fondo alla catena:

```
--button-border-radius            (1) singola istanza: <Button --button-border-radius="0">
  └─ --button-default-border-radius   (2) tutti i Button dell'app
       └─ --global-radius-md          (3) NUOVO: tutti i componenti dell'app
            └─ --global-radius-scale  (4) NUOVO: una sola manopola
```

Il markup e i `<style>` dei componenti non cambiano, cambia solo il **valore** dei default.

```css
/* src/lib/css/main.css (libreria) */
:where(:root) {
  --global-radius-scale: 1;
  --global-radius-xs: calc(4px * var(--global-radius-scale));
  --global-radius-sm: calc(6px * var(--global-radius-scale));
  --global-radius-md: calc(8px * var(--global-radius-scale));
  --global-radius-lg: calc(10px * var(--global-radius-scale));
  --global-radius-xl: calc(12px * var(--global-radius-scale));
  --global-radius-full: 9999px; /* le pillole restano pillole */
}

/* src/lib/components/simple/buttons/Button.css (libreria) */
:where(:root) {
  --button-default-border-radius: var(--global-radius-md); /* oggi: .5rem */
}
```

```css
/* app.css dell'applicazione */
:root { --global-radius-scale: 2; }    /* tutto più bombato */
:root { --global-radius-scale: 0; }    /* tutto squadrato */
:root { --global-radius-md: 14px; }    /* oppure si tocca un solo gradino */
```

### Dettagli tecnici da rispettare
- **`:where(:root)` al posto di `:root`** per i default della libreria. `:where()` ha specificità zero, quindi qualsiasi `:root { ... }` dell'app vince **indipendentemente dall'ordine di caricamento dei CSS**. Oggi i `:root { --x-default-* }` della libreria hanno la stessa specificità delle override dell'app, e vince chi viene caricato per ultimo. Applicarlo a tutti i file `Component.css` risolve anche questo problema latente.
- La scala funziona impostata su `:root`. Su un sottoalbero (es. `.sidebar { --global-radius-scale: 0 }`) non ha effetto, perché `--global-radius-md` è già calcolato su `:root`. Per i sottoalberi si sovrascrive direttamente il gradino (`--global-radius-md`).
- I token globali funzionano anche dentro Dialog e Drawer. Le style props per istanza invece oggi non ci arrivano, perché i nodi vengono spostati in `<body>`.

### Set iniziale proposto

| Token | Valori dal prototipo | Cosa governa |
|---|---|---|
| `--global-radius-{xs,sm,md,lg,xl,full}` + `--global-radius-scale` | 4/6/8/10/12/999px | bordi di tutti i componenti. Oggi ci sono 84 radius hardcoded e default incoerenti (2, 4, 5, 6px, .5rem) |
| `--global-font-family`, `--global-font-family-display`, `--global-font-family-mono` | Geist, Bricolage Grotesque, Geist Mono | testi. Default consigliato: `inherit`, così la libreria non carica font (vedi sezione 9) |
| `--global-control-height-{sm,md,lg}` + `--global-density` | 28/34/40px (bottoni), 36px (campi) | altezze di bottoni, campi e chip: compatto o arioso con una riga |
| `--global-shadow-{sm,md,lg}` | `--shadow-*` | elevazione di card, menu, dialog |
| `--global-focus-ring` | `0 0 0 3px` primary al 22% | focus visibile ovunque (oggi assente) |
| `--global-transition-duration`, `--global-ease` | .2s, `cubic-bezier(.2,.8,.2,1)` | animazioni; con `prefers-reduced-motion` la durata va a 0 |
| `--global-border-width` | 1px | spessore dei bordi |

Gli z-index restano fuori dalla prima tornata: Dialog e Menu li calcolano in JavaScript, quindi toccarli è L3.

## 3. Palette (punto 3 del task)

- **Restano le triplette RGB e i nomi attuali** (`--global-color-primary-500: 69, 93, 201`). Componenti e app usano `rgb(var(--x), .5)` per la trasparenza: passare a hex sarebbe breaking.
- Mappatura dei ruoli del prototipo sui token più usati oggi:

  | Prototipo | Token attuale | Usi | Ruolo |
  |---|---|---|---|
  | `--primary` | `primary-500` (vicini: 400, 600, 700) | 74 | brand, azioni |
  | `--surface-solid`, `--surface-2/3` | `background-100`, `-200`, `-300` | 29 / 37 / 54 | superfici, quasi sempre `background-color` |
  | `--text` | `contrast-900` (`-800` e `-500` per i secondari) | 45 | testo |
  | `--on-primary` | `grey-50` | 25 | testo su primary |
  | `--error`, `--warning`, `--success`, `--accent` | `error-*`, `warning-*`, `success-*`, `secondary-*` | | stati e accento |

- Ogni scala 50–950 va **generata attorno al colore del prototipo**, per esempio interpolando in oklch, con valori **diversi in light e in dark**: oggi primary e gli stati sono identici nei due temi, mentre il prototipo usa `#4d8dff` in dark e `#1f5af0` in light.
- Le superfici traslucide del prototipo (es. `rgba(255,255,255,.035)` sopra `#060a13`) vanno convertite in colori **opachi equivalenti** per le scale.
- Gli effetti che le scale non possono esprimere (vetro, gradiente, glow) diventano **nuovi token semantici additivi**: `--global-gradient-primary`, `--global-color-surface-glass`, ... Restano L0, perché sono nomi nuovi che non toccano quelli esistenti.
- Già che si è in `main.css`: la palette è oggi copiata 3 volte (light, `prefers-color-scheme: dark`, `.dark`). Si può ridurre, ma **l'ordine dei blocchi conta**: un `.light` forzato deve battere il dark del sistema operativo. Va verificato con tutte e quattro le combinazioni (OS light/dark × classe light/dark).

## 4. Variabili per componente (punto 2 del task)

Il pattern esiste già: `var(--x-prop, var(--x-default-prop))`. Serve renderlo **completo e coerente**.

- **Contratto minimo**: per ogni parte visibile del componente vanno esposte `background-color`, `color`, `border` / `border-color`, `border-radius`, `padding`, `font-size`, `font-weight`, `box-shadow`, `height` (per i controlli), più gli stati `hover`, `focus`, `active`, `disabled` ed eventualmente `error`.
- **Naming invariato**: `--{componente}[-{parte}][-{stato}]-{proprietà}`, come in `--button-hover-background-color` o `--chip-inactive-focus-color`.
- **Ogni default punta a un token globale**, non a un valore: `--chip-default-border-radius: var(--global-radius-sm)` invece di `6px`.
- **Non si rinomina e non si rimuove mai una variabile esistente**: le app le usano. Se serve un nome migliore, il vecchio resta come fallback:
  ```css
  border-radius: var(--chip-radius, var(--chip-border-radius, var(--chip-default-border-radius)));
  ```
- Ogni variabile nuova va aggiunta in `styleProps` nella pagina docs del componente.

## 5. Flusso per ogni componente

1. Aprire la sezione del prototipo e la pagina docs del componente; fare screenshot "prima" in light, dark e mobile.
2. Elencare le differenze e assegnare a ognuna un livello (L0–L3).
3. **L0 e L1**: implementare usando solo token globali, senza introdurre nuovi px o colori hardcoded.
4. Esporre ogni nuova proprietà stilistica come `--comp-default-*` in `Comp.css` (dentro `:where(:root)`), usata con `var(--comp-x, var(--comp-default-x))`.
5. **L2**: implementare solo se è nella lista approvata, altrimenti va nel registro.
6. **L3** e bug trovati strada facendo: nel registro o in una issue, **non** implementare nella PR di stile.
7. Aggiornare `styleProps` (e `props` se L2) nella pagina docs.
8. Fare screenshot "dopo" e metterli nella PR.

Template per la descrizione della PR:

```
Componente: Button        Livello: L0
Riferimento prototipo: sezione 01 Buttons
Variabili nuove: --button-default-height, --button-default-transition, ...
Variabili rinominate/rimosse: nessuna
Differenze rimaste rispetto al prototipo: varianti secondary/danger → registro #3 (L2)
Screenshot: prima/dopo, light/dark
```

## 6. Ordine di lavoro

I componenti composti ereditano dai semplici (Dropdown = Autocomplete + Button + Menu), quindi si parte dal basso.

| Fase | Contenuto | Livelli | Effetto |
|---|---|---|---|
| **0. Fondamenta** | token globali (sezione 2), nuova palette (sezione 3), `:where(:root)`, focus ring globale; screenshot di base di tutte le pagine docs | L0 | gran parte della libreria cambia aspetto senza toccare un solo componente: **è la demo da mostrare per prima** a chi ha assegnato il task |
| **1. Primitivi** | Icon, Button, LinkButton, CircularLoader, Chip, Checkbox, Radio, Switch, SimpleTextField, Textarea, Menu (solo aspetto) | L0, L1, L2 approvati | il restyle si propaga ai composti |
| **2. Composti di form** | Autocomplete e famiglia, Select, date e periodi, FileInput | L0, L1 | |
| **3. Superfici** | Dialog, Drawer, ToolTip, HeaderMenu, Navigator, TabSwitcher, layout | L0, L1 | |
| **4. Dati** | SimpleTable, PaginatedTable, DynamicTable, Filters, Paginator | L0, L1 | è la fase più costosa: molti override inline duplicati |

Componenti da **non** restilizzare finché non si decide se tenerli: `DashboardGridShaper` (demo morta, non esportata) e `Code` (serve solo alla doc).

## 7. Registro delle modifiche che toccano la logica

Un solo file o una board, rivisto **a fine di ogni fase** invece che caso per caso. Prime voci, già emerse dal confronto con il prototipo:

| # | Componente | Cosa serve per il prototipo | Livello | Perché non è solo stile | Proposta |
|---|---|---|---|---|---|
| 1 | Button | varianti `secondary`, `danger`, `gradient` | L2 | nuova prop (oggi esiste solo `buttonType` default/text/icon) | prop `variant`, default = aspetto attuale |
| 2 | Button | taglie `sm` e `lg` | L2 | nuova prop | prop `size`, oppure solo token `--button-height` (L0) |
| 3 | Button | spinner **accanto** al testo durante il loading | L2 o L3 | oggi `loading` sostituisce il contenuto | L2: prop `loadingText`; L3 se diventa il default |
| 4 | SimpleTextField | label sempre visibile, stati error/success con hint | L2 | oggi non ha né `label` né stato di errore | prop `label`, `state`, `message`. Valutare un wrapper `Field` comune |
| 5 | Textarea | contatore `66 / 200` | L2 | serve logica (conteggio dei caratteri) | prop `counter` |
| 6 | Switch | track con focus ring | L1 | l'input è `display:none` (non focusabile) | `opacity:0` più `.track` |
| 7 | Calendar | puntino "evento" sui giorni | L2 | servono dati in input | prop `markedDates` |
| 8 | Dialog, Drawer | personalizzazione per istanza | L3 | le style props non arrivano (teleport) | per ora token globali; fix del teleport più avanti |
| 9 | Menu, ToolTip | ombre e vetro tagliati dentro contenitori con `overflow` | L3 | Menu non viene spostato in `<body>` | rimandare alla primitiva overlay |
| 10 | Font | Geist e Bricolage nel prototipo | decisione | caricarli dalla libreria = Google Fonts per tutte le app (peso, GDPR) | token `--global-font-family`; il font lo carica l'app |
| 11 | Tema | il prototipo è dark-first | decisione | oggi la libreria segue il sistema operativo | mantenere il comportamento attuale |

## 8. Rilascio

- Cambiare i default visivi cambia l'aspetto di **tutte** le app al primo aggiornamento, anche se l'API non cambia. Quindi è una **major**: `5.0.0`.
- Durante il lavoro si pubblicano prerelease `5.0.0-next.N` con dist-tag `next` (`npm publish --tag next`). Le app restano su `^4` finché non scelgono di provare.
- Si tiene un branch `4.x` per gli hotfix sulla versione attuale.
- Le voci L3 del registro vanno decise prima di chiudere la 5.0. **Rompere una volta sola costa meno che rompere due volte**: se le app devono comunque adattarsi al nuovo look, conviene includere nella stessa major le modifiche breaking approvate.

## 9. Da concordare all'avvio

Domande da chiudere con chi ha assegnato il task, prima di iniziare:

1. I livelli L0 e L1 si possono fare senza chiedere caso per caso?
2. Quali voci L2 si approvano subito? Proposta: registro #1, #2, #4, #6.
3. Va bene introdurre i token globali `--global-*` (radius, font, altezze, ombre, focus, motion)?
4. Il rilascio è una major `5.0.0` con prerelease `next`?
5. La libreria deve caricare i font, o resta `inherit` e li carica l'app?
6. Le voci L3 entrano nella stessa major o in una successiva?
7. Si può aggiungere una rete minima di screenshot Playwright sulle pagine docs (light e dark) per vedere le regressioni? Non tocca i componenti.
