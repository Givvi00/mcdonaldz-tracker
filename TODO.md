## Principio guida
L'app si apre poche volte: deve aiutare l'utente a trovare/ricordare i Mc, non farsi cercare. Niente ricerca testuale in Home.

## Fatto
- [x] Card "Vicino a te": pulsante "Sulla mappa"
- [x] Mappa: punto "Tu sei qui" + pulsante per centrarsi
- [x] Home: con una regione selezionata, prima i Mc già visitati
- [x] Bicchieri di coca con % in overlay (SodaGlass): onda a sinusoide, tante bolle proporzionali al livello (SodaRegion resta nel repo)
- [x] Filtri Home: controllo Tutti / Visitati / Da visitare colorato, selettore regione a pannello con conteggi, ordina per Distanza / A–Z
- [x] Filtro Visitati / Da visitare anche sulla mappa (componente condiviso `StatusFilter`)
- [x] "Portami lì" nel popup della mappa (Android: geo: → app mappe predefinita; web: Google Maps)
- [x] Icona Android: emoji 🍟 su rosso McDonald's (adaptive icon + icone classiche)
- [x] Popup "Ti trovi qui?": mostra la distanza reale
- [x] Backup/import: il Profilo già li aveva, ma il download via `<a download>` non funziona nella WebView Android. Ora su app nativa il file va nel menu di condivisione (plugin filesystem + share); l'import valida il file prima di scrivere
- [x] Tematizzazione, primo giro: palette calda (grigi crema/marrone al posto dei blu-grigi), header rosso con logo giallo, pillola gialla sulla voce attiva, Profilo senza blu, popup con bottone giallo, splash rossa con 🍟, margini per barra di stato/gesture

## Verificato sul telefono (18/09/2026)
- [x] Header e margini schermo, splash e icona (rosso con 🍟), bicchieri e filtri, "Esporta Dati" (menu di condivisione), "Portami lì"
- [x] "Importa Dati": ripristino da un backup esportato

## Ancora da verificare sul telefono
- [ ] Popup "Ti trovi qui?" con "Segna visita ✓" (provato comparsa entro 2 km e "Non ora"; non il salvataggio per non toccare i dati reali)
- [ ] Tema chiaro e scuro su Stats, achievement e toast (controllati Home, Profilo e Mappa)

## Tematizzazione: cosa resta
- [ ] Rivedere Stats e achievement con la nuova palette
- [ ] Tema della mappa in modalità chiara (oggi solo i tile scuri sono ritoccati)
- [ ] Icona/splash monocromatica per Android 13+ (icona tematica) e barra di stato coordinata col tema
- [ ] Uno stato vuoto/illustrazioni con lo stesso stile (bicchiere, patatine) per le liste vuote

## Idee medie (da valutare)
- [ ] Diario delle visite: data, nota, cosa hai mangiato, foto
- [ ] Card da condividere ("17/828 Mc, Toscana 23%") come immagine
- [ ] Achievement per regione completata e serie di giorni consecutivi

## Idee grandi (da valutare)
- [ ] Notifica quando passi vicino a un Mc non visitato (Capacitor local notifications + posizione in background). Il popup di oggi compare solo all'apertura dell'app e una volta sola: è il passo più coerente col principio guida
- [ ] Check-in verificato dal GPS (visita solo entro ~200 m), come modalità opzionale
- [ ] Aggiornamento dati: rilevare Mc chiusi/nuovi con `fetch-data` senza perdere le visite
- [x] iPhone: PWA su GitHub Pages (manifest, icone, service worker offline, deploy automatico a ogni push su master): https://givvi00.github.io/mcdonaldz-tracker/ . Su iPhone: Safari → Condividi → "Aggiungi alla schermata Home". I dati dell'iPhone sono separati da quelli di Android: si trasferiscono con Esporta/Importa
- [x] Aggiornamenti della web app: `version.json` a ogni build; banner "Nuova versione disponibile" (all'apertura, al ritorno in primo piano, alla riconnessione e ogni 30 min); Profilo con versione, data e codice build + "Controlla aggiornamenti"; cache del service worker per build, con pulizia delle vecchie
- [x] Controllo dei tipi: `npm run typecheck` (prima `tsc -p tsconfig.app.json` non guardava nessun file di `src`); ora gira anche nella pubblicazione su Pages
- [ ] Migrazioni del database locale: se cambia la struttura di IndexedDB (`db.ts`, versione 1) serve una migrazione esplicita nell'`upgrade`, altrimenti i dati esistenti non vengono letti. Consigliare un backup prima
- [ ] iPhone, da verificare sul telefono: installazione, posizione, "Portami lì" (Apple Maps), Esporta/Importa, uso offline
- [ ] iPhone nativo (facoltativo): build cloud + account Apple Developer, solo se servono le notifiche di prossimità in background
- [x] Repository remoto su GitHub come backup del codice: https://github.com/Givvi00/mcdonaldz-tracker (privato). Dopo ogni sessione: `git push`
