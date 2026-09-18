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

## Da verificare sul telefono
- [ ] Margini schermo: header sotto la barra di stato e barra in basso sopra i gesti (usa `--safe-top` / `--safe-bottom`; non testato su dispositivo)
- [ ] "Portami lì" su Android reale (ramo `geo:` di `utils/navigation.ts`)
- [ ] Backup: "Esporta" deve aprire il menu di condivisione e "Importa" ripristinare (ramo nativo non testabile da browser)
- [ ] Popup "Ti trovi qui?" con "Segna visita ✓" (provato comparsa entro 2 km e "Non ora"; non il salvataggio per non toccare i dati reali)
- [ ] Icona e splash: aspetto reale, e se lo sfondo rosso dell'icona adattiva sta bene con la forma scelta dal launcher
- [ ] Tema chiaro e scuro su Stats, achievement e toast (ho controllato Home, Profilo e Mappa)

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
- [ ] iPhone: PWA (manifest + service worker + hosting HTTPS) oppure app nativa con build cloud e account Apple Developer
- [ ] Repository remoto su GitHub come backup del codice
