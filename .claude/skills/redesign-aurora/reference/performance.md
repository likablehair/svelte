# Performance

Metodo: pagina temporanea con N righe di componenti in v4 e in v5 (stessi componenti), Playwright con CDP `Performance.getMetrics` (`RecalcStyleDuration`) in Chromium e tempo nella pagina (cambio + `offsetHeight`) in Firefox. 200 righe = 1400 istanze, ~3900 elementi. Le pagine di prova sono state cancellate; lo script era nello scratchpad.

- **Causa principale: le transizioni**, non le variabili. Al cambio di modalità ogni componente con `transition` sui colori avvia le sue transizioni: Button v5 120 ms contro 4 ms della v4 (1400 bottoni), tutto il mix 65 contro 22 ms in Chromium, 106 contro 43 in Firefox. Senza transizioni: Button 12 ms, mix 19 ms. Con la pausa delle transizioni (ex P28, `setMode`): Button 24 ms, mix 37 ms in Chromium; Button 13 ms, mix 67 ms in Firefox. Il doppio ricalcolo (attributo messo e tolto) costa circa il doppio del caso senza transizioni: accettato.
- **Token complessi (`color-mix()`, `light-dark()`)**: nessun costo misurabile. Sostituirli con colori fissi lascia i tempi uguali.
- **Registrare i token con `@property` (`<color>`)**: nessun guadagno, e con le transizioni peggiora (151 ms contro 120: i colori registrati diventano interpolabili). Non farlo.
- **Numero di custom property su `:root`** (oggi ~540, ~2000 a libreria completa): +2000 variabili finte costano +10–20% sul cambio modalità. Fonti esterne concordi: GitLab (+1,8% sul rendering) e web.dev (le proprietà ereditate costano al cambio, non per numero).
- Resta un costo per istanza 1,5–3× la v4 (ricalcolo completo: Button 9,5 contro 5,4 ms per 1400, Chip 22 contro 5,5), cioè pochi µs per componente: trascurabile per pagine reali.
- Regole per i nuovi componenti: transizioni solo sulle proprietà che cambiano con l'interazione; niente selettori universali con `::before`/`::after` nelle regole sempre attive; niente `@property` sui token.

