# PeriodPicker e PeriodSelector: v4, prototipo, Aurora, uso nelle app (analisi del 2026-10-14)

## v4 (`src/lib/components/composed/forms/`)

- **PeriodSelector** (749 righe, generico `T extends string`): `timespanSettings` ($bindable; se manca scrive `{}` nel genitore all'avvio), `quickSelectOptions` `{value,label}[]` (default `defaultQuickOptions[lang]`, letto una volta), `valid` ($bindable), `mode` `'default'|'datepicker'`, `lang` `'it'|'en'` (default `'en'`), `locale` (default `lang`), `showTimeRangeLabel`, `isSelectionMode` ($bindable), `quickRangeConvertor(value)`, `setTimespanLabel({ timespanSettings })`, `onchange({ timespanSettings })` (senza `detail`). Nessuno snippet.
- **Valore** `TimespanSettings<T>` = `{ method?, values? }`: `quick` (`today`, `this-week`, `this-month`, `last-3month`, `last-6month`, `this-year`, `total`), `rolling` `{ numberOfUnits, measurementUnit: days|weeks|months|years, direction: last|next }`, `picker` `{ from?, to? }`. `mode='datepicker'` converte preset e rolling in `picker` (00:00 → 23:59:59.999; settimana sempre da lunedì; "last N" = N+1 giorni). Le date del calendario sono a mezzanotte, anche `to`.
- **Comportamento**: lista (SelectableVerticalList) con i 7 preset, poi "Intervallo personalizzato" e "Periodo dinamico", che scorrono verso un dettaglio con "‹ Indietro". Personalizzato: DatePicker `dateRange` con `fillOpenRange` (1° clic inizio, 2° fine con scambio, 3° ricomincia) e chip "Dal/Fino al ⇄" per gli intervalli aperti. Rolling: Dropdown direzione + numero + Dropdown unità. Ogni clic aggiorna subito valore e `onchange`.
- **PeriodPicker** (134 righe): stesse prop di PeriodSelector senza `showTimeRangeLabel`, nessuna propria (niente label, placeholder, disabled, class). Campo = SimpleTextField **`disabled`** con il testo di `getPeriodLabel` ("Dal X al Y", "Scorsi 3 Mesi"; senza valore "Seleziona una modalità" *come valore*); si apre solo dal chevron (`span role=button` senza nome). Desktop: Menu 400px; mobile: Drawer dal basso. Un preset chiude; "Applica" (solo nel dettaglio) **chiude soltanto**, il valore era già cambiato.
- **CSS**: 6 variabili `--period-selector-{width, max-width 400px, min-height 360px, list-element-padding, list-element-border-radius, list-element-font-size}`; nessuna `--period-picker-*`.
- **Export**: solo i due componenti; `TimespanSettings`, `getPeriodLabel`, `defaultQuickOptions`, `getDatesFromQuick`/`getDatesFromRolling` non importabili. Docs di PeriodPicker vuote.
- **Bug**: **su desktop con valore non valido il menu non si chiude** (clic fuori disattivato, chevron inerte, niente Esc); `--global-color-conrast-*` (refuso ×4); testo del campo formattato con `lang` invece di `locale`; "1 Mesi"/"Last 1 Months"; "Ultimi" nel menu, "Scorsi" nel testo; titolo "Custom Range" mentre si modifica un rolling in `datepicker`; stato interno copiato solo al montaggio (non si risincronizza); `last-3month` con `setMonth` va in overflow (31 mag − 3 = 3 mar); numero del rolling con decimali; `setTimespanLabel` ignorato dal PeriodPicker.

## Prototipo (gruppo "06 Date & period", card `wide`, righe ~1326–1345; CSS ~657–700, ~931–936; JS ~2020–2095)

- **Trigger**: pillola (padding 3px, `r-md`, `surface-solid`, `border-strong`, `shadow-sm`) con ‹ e › (icon button 28px, "Periodo precedente/successivo") e al centro icona calendar-range `primary`, nome del preset (600, 13px), date mono 12px `text-2` ("10 set – 23 set 2026"), chevron.
- **Popover** (`r-lg`, `surface-pop`, `shadow-lg`): colonna dei preset (min 176px, `surface`; voci 13px con la durata mono "7g" a destra; scelta `primary-soft`); preset Oggi, Ieri, Ultimi 7/14/30 giorni, Questo mese, Mese scorso, "Personalizzato" (acceso quando nessun preset coincide). Niente rolling né "Sempre".
- **Due mesi affiancati** (238px, frecce solo ai lati esterni): celle 32px, oggi con anello, giorni futuri attenuati, banda `primary-soft` arrotondata agli estremi di riga, estremi `fill-primary`, anteprima in hover.
- **Piè**: campi "Inizio → Fine" (readonly, mono), chip "14 giorni" (o "seleziona la data di fine"), "Annulla" e "Applica".
- **Comportamento**: un preset imposta le date e porta il mese della fine a destra; le frecce spostano il periodo della sua durata; durante la scelta il trigger dice "Scegli la fine…". Sotto 900px: colonna, preset come chip a capo, mesi impilati, date del trigger nascoste.

## Aurora oggi

- **Calendar** con `range` (anteprima, `fillOpenRange`, `min`/`max`, `locale`/`weekStart`, tastiera APG): due Calendar con `visibleMonth` danno i due mesi. **DatePicker** `range` per il mese singolo su mobile; maschera di **DatePickerTextField** `range` per i campi Inizio/Fine; **MenuOrDrawer**; `libraryTexts` + `setDefaultLocale`; `utils/dates.ts` (`addMonths` con clamp, `formatDate`, ISO).
- **Già nei filtri**, interno in `utils/filters/convert/dates.ts`: `periodRange(period, { now, weekStart })` con 18 `FilterPeriod` ed etichette it/en, `shift(date, amount, unit)`, `FilterRelative { amount, unit }`, input `relative` di FilterValueInput: la stessa logica di preset e rolling, da spostare in un modulo condiviso.
- SelectableVerticalList non portato: la lista dei preset va fatta come `listbox` (interna o con P180).

## Uso nelle app (conteggio del 2026-10-14)

- **42 file in 6 app, ma solo 6 tag sono della libreria** (addibox 5, stramoniumai 1). Gli altri 36 usano **copie locali** `$lib/components/common/PeriodPicker.svelte` (cbam 13, maya 11, astro 6, ganymede 6), 198–222 righe in 3 varianti: Select "Date Picker/Quick Select/Rolling Select", due date picker From/To, rolling solo "Last N days", testi inglesi fissi.
- 41 file su 42 sono **impostazioni dei widget della dashboard, salvate nel backend**; 1 è la barra di un grafico.
- Prop (6 tag): `bind:timespanSettings` 6, `lang` 6 (5 da paraglide), `locale="it"` 5, `bind:valid` 1 (mai letto), `onchange` 1 (ricalcola le date a mano); mai usate `quickSelectOptions`, `mode`, `isSelectionMode`, `quickRangeConvertor`, `setTimespanLabel`. CSS: solo variabili di SimpleTextField passate dall'app (`--simple-textfield-width` 5, `-default-border-radius` 5, `-default-border` 5, `-default-padding` 5, `-height` 1); `--period-selector-*` 0.
- **Contratto con i backend**: il JSON si salva. addibox legge la forma v4; cbam, maya, astro quella delle copie (rolling = numero di giorni, `current-year` al posto di `this-year`, più "periodo precedente" per i confronti); ganymede un'altra ancora (`timespanMethod` + `pickerValues`/`rollingValues`/`quickValues`). **Nei backend i preset hanno un significato diverso dal client v4**: `last-3month` dal 1° del mese di 2 mesi fa (client: oggi − 3 mesi), `this-month`/`this-year` fino a fine periodo (client: fino a oggi).
- **Pattern fatti a mano**: copia di `getDatesFromQuick` + `getDatesFromRolling` (~70 righe) perché non esportate; tipo ricavato con `ComponentProps`; lo stesso `$effect` di default `{ method: 'quick', values: 'total' }` ripetuto 5 volte; valore ricomposto 6 volte da `selectedMethod`.
- **Bug**: `toISOString().slice(0, 10)` su date a mezzanotte locale (in Italia il giorno prima: l'intervallo slitta e perde l'ultimo giorno); addibox con UI inglese ha campo in formato USA (`lang`) e calendario italiano (`locale="it"`); possibile effetto in loop con `{ timespan: default, ...settings }` (non verificato).
- v3: 1 app su 6 (ganymede, solo la copia locale).

## Proposte (P192–P205, 2026-10-14)

- **P192** Nessun cambio: due componenti con i nomi v4, `PeriodSelector` = pannello, `PeriodPicker` = trigger + MenuOrDrawer; non uniti a DatePickerTextField `range` (il valore può essere relativo).
- **P193** Nessun cambio + aggiunta: stessa forma JSON di `TimespanSettings` (contratto coi backend), `bind:timespanSettings`; tipo esportato; `from`/`to` accettati anche come stringa ISO.
- **P194** Aggiunta: `onchange({ timespanSettings, from, to })` con le date risolte (`Date` a mezzanotte locale, `to` incluso, `from` assente per `total`); utility esportata `resolvePeriod(value, { now, weekStart })` su `periodRange`/`shift`.
- **P195** Cambio di aspetto: trigger a pillola e popover a una vista del prototipo al posto di "campo disabilitato + lista → dettaglio"; le 5 variabili `--simple-textfield-*` passate dalle app diventano `--period-picker-*` con una regola.
- **P196** Cambio di comportamento: **bozza + Applica** nel PeriodPicker (valore e `onchange` solo con Applica o col clic su un preset, che chiude subito come v4; Annulla, Esc e clic fuori scartano). Si perde l'aggiornamento dal vivo (nessuna app lo sfrutta). PeriodSelector da solo resta dal vivo.
- **P197** Correzione: si chiude **sempre** con Esc o clic fuori.
- **P198** Parità: **periodo dinamico tenuto** (non è nel prototipo) come voce della colonna, con direzione + numero + unità al posto dei calendari e le date di anteprima nel piè.
- **P199** Aggiunta: frecce ‹ › del prototipo (personalizzato: di N giorni; mese, settimana, anno: un'unità intera); il valore diventa `picker`; spente con `total`; prop `shiftable`.
- **P200** Aggiunta + rimozione: preset di default = i 7 v4 (gli unici che i backend capiscono), durata a destra di ogni preset; `quickSelectOptions` guadagna `range?: (now) => [from, to]` al posto di `quickRangeConvertor` (0 usi).
- **P201** Rimozioni (0 usi reali): `mode='datepicker'` (→ `from`/`to` di P194), `isSelectionMode`, `showTimeRangeLabel` e `setTimespanLabel` (→ `labelSnippet({ label, from, to, timespanSettings })`), `valid`.
- **P202** Parità, aspetto diverso: intervalli aperti tenuti (Applica con un solo estremo); il chip ⇄ è sostituito dai campi Inizio/Fine del piè, digitabili con la maschera e cancellabili.
- **P203** Cambio: solo `locale` (BCP 47, `setDefaultLocale`) per testi, nomi e formato; `lang` tolto; plurali con `Intl.PluralRules`; inizio settimana dal `locale` (oggi sempre lunedì).
- **P204** Cambio di aspetto: su mobile (≤1024px) bottom sheet con preset come chip, un mese (DatePicker `range`), piè fisso con Annulla/Applica.
- **P205** Aggiunta: trigger `<button aria-haspopup="dialog" aria-expanded>`, preset come `listbox`, frecce ‹ › con nome, Esc riporta il focus; corretti i bug v4 elencati sopra.

Domande aperte dell'analisi: date risolte con la semantica dei backend (`last-3month` dal 1° del mese di 2 mesi fa, `this-month`/`this-year` fino a fine periodo) o del client v4? "Ultimi N giorni" = N o N+1 giorni? Le 4 app con copia locale (36 file, JSON diverso) si migrano con un adattatore (`fromLegacyTimespan`) o restano sulle copie? Frecce ‹ › accese di default? PeriodSelector esportato (0 usi) o interno?
