## Principio guida
L'app si apre poche volte: deve aiutare l'utente a trovare/ricordare i Mc, non farsi cercare. Niente ricerca testuale in Home.

## Fatto
- [x] Card "Vicino a te": pulsante "Sulla mappa"
- [x] Mappa: punto "Tu sei qui" + pulsante per centrarsi
- [x] Home: con una regione selezionata, prima i Mc già visitati
- [x] Bicchieri di coca con % in overlay (SodaGlass) al posto delle sagome regione (SodaRegion resta nel repo)
- [x] Filtri Home: controllo Tutti / Visitati / Da visitare, selettore regione a pannello con conteggi, ordina per Distanza / A–Z
- [x] "Portami lì" nel popup della mappa (Android: geo: → app mappe predefinita; web: Google Maps)

## Da verificare
- [ ] "Portami lì" su Android reale (ramo `geo:` di `utils/navigation.ts`, non testabile da browser)
- [ ] Popup "Ti trovi qui?" con "Segna visita ✓" (provato: comparsa entro 2 km e "Non ora"; non provato il salvataggio per non toccare i dati reali)
- [ ] Popup: il testo dice sempre "a due passi" anche a 1,9 km → mostrare la distanza reale

## Idee medie (da valutare)
- [ ] Diario delle visite: data, nota, cosa hai mangiato, foto
- [ ] Backup / export / import JSON dal Profilo (i dati sono solo in IndexedDB sul dispositivo)
- [ ] Card da condividere ("17/828 Mc, Toscana 23%") come immagine
- [ ] Achievement per regione completata e serie di giorni consecutivi
- [ ] Filtro visitati / da visitare anche sulla mappa

## Idee grandi (da valutare)
- [ ] Notifica quando passi vicino a un Mc non visitato (Capacitor local notifications + posizione in background). Il popup di oggi compare solo all'apertura dell'app e una volta sola: è il passo più coerente col principio guida
- [ ] Check-in verificato dal GPS (visita solo entro ~200 m), come modalità opzionale
- [ ] Aggiornamento dati: rilevare Mc chiusi/nuovi con `fetch-data` senza perdere le visite
