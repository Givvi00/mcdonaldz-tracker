## Principio guida
L'app si apre poche volte: deve aiutare l'utente a trovare/ricordare i Mc, non farsi cercare. Niente ricerca testuale in Home.

## Distribuzione (decisa il 19/09/2026)
- Canale principale: **web app installata** (Android e iPhone), https://givvi00.github.io/mcdonaldz-tracker/ . Un solo codice, aggiornamenti senza store.
- L'**APK Android è solo per uso personale**: il codice non si aggiorna da solo (i dati sì, vedi sotto).
- **Notifiche di prossimità in background: in pausa.** Non sono possibili come web app (né iPhone né Android); tornano d'attualità con l'app da store (Play Store: costo una tantum; App Store: abbonamento annuale, e Apple richiede più di un semplice sito).
- Il progetto Capacitor Android resta nel repo: tutto il lavoro sulla web app si riusa per pubblicare in futuro.

## Fatto
- [x] Card "Vicino a te": pulsante "Sulla mappa"
- [x] Mappa: punto "Tu sei qui" + pulsante per centrarsi
- [x] Home: con una regione selezionata, prima i Mc già visitati
- [x] Bicchieri di coca con % in overlay (SodaGlass): onda a sinusoide, tante bolle proporzionali al livello (SodaRegion resta nel repo)
- [x] Filtri Home: controllo Tutti / Visitati / Da visitare colorato, selettore regione a pannello con conteggi, ordina per Distanza / A–Z
- [x] Filtro Visitati / Da visitare anche sulla mappa (componente condiviso `StatusFilter`)
- [x] "Portami lì" nel popup della mappa: Android (app e web app) con geo: → app mappe predefinita; iPhone/iPad: la prima volta chiede Apple Maps / Google Maps / Waze, ricorda la scelta (cambiabile dal Profilo); computer: Google Maps. Verificato sul telefono (19/09/2026): si apre l'app scelta, su Android e su iPhone
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
- [x] Stats e achievement rivisti con la nuova palette in chiaro e scuro (testo rosso piccolo più chiaro in scuro per il contrasto). Restano in inglese i nomi degli achievement ("Local Hero", "7 Day Streak"…) e il titolo "Achievements"
- [x] Tema della mappa: tile ritoccati in tono caldo sia in chiaro sia in scuro
- [ ] Icona/splash monocromatica per Android 13+ (icona tematica) e barra di stato coordinata col tema
- [x] Stato vuoto con il vassoio (lista senza risultati in Home)
- [x] Tema McDonald's (19/09/2026): griglia sfalsata di emoji sulle card grandi, barra di progresso con le patatine, livelli col nome del menu (Happy Meal … Re del Drive), pioggia di cibo alla visita (più fitta per livello/achievement), vassoio che si riempie in Stats, scontrino in Stats, icone per tipo di locale (aeroporto, stazione, area di servizio, drive, centro commerciale), emoji diverse sui marker della mappa. Da verificare sul telefono
- [x] Achievement a tema (icone col cibo, nomi in italiano): in standby, da rivedere insieme — fatto: passaporto con 23 timbri, nomi in italiano (aggiornato 21/09/2026)

## Feedback sul tema (19/09/2026) — da fare, in attesa di parlarne
- [x] Griglia delle card: icone disegnate, colonne sfalsate anche in verticale, inclinata di 10° e più veloce (una tessera ogni 28 s), senza icone tagliate (`FoodPattern.tsx`). Da verificare sul telefono
- [x] Livelli: nomi e soglie sono provvisori, da rivedere insieme (oggi: Assaggiatore, Cliente abituale, Divoratore di panini, Esperto del Drive, Maestro dei Mc, Leggenda dei Mc, Re del Drive, a 0/5/15/30/60/120/250 visite; in `src/utils/foodTheme.ts`) — ora 12 livelli con nomi e icone nuovi (`src/utils/foodTheme.ts`), decisi il 20/09/2026
- [x] Achievement e livello nuovo: fuochi d'artificio di patatine e stelline (la scatola di patatine sale, le patatine schizzano in alto, tre scoppi uno dopo l'altro), senza icone che cadono; dura circa 7 s (`FoodRain.tsx`). Per una visita normale resta la pioggia leggera. Da verificare sul telefono
- [x] Toast dell'achievement: ora sta sopra la pioggia (z-index 3000) e dura 5,5 s. Da verificare sul telefono. Poi reso più grande (con descrizione), 10 s, e cliccabile: porta in Stats sulla card di quell'achievement, evidenziata per 5 s
- [x] Stats: scontrino prima delle regioni, e delle regioni si vedono solo quelle iniziate, con il pulsante "Mostra tutte le regioni". Da verificare sul telefono. Scontrino reso più chiaro: "I McDonald's che hai visitato, regione per regione", intestazione "RISTORANTI VISITATI", colonne REGIONE / VISITATI, "5 su 18", "TOTALE VISITATI"
- [x] Icone disegnate (13: panino, Big Mac, panino con il pollo, McToast, Filet-O-Fish, McWrap, patatine, nuggets, alette, Tasty Basket, bibita, McFlurry, Happy Meal) al posto delle emoji di cibo: griglia, pioggia, marker della mappa, popup, barra di progresso, vassoio vuoto, scontrino. I disegni stanno in `src/components/foodSprite.ts`, generato dalla pagina di anteprima. Restano emoji i livelli, le icone per tipo di locale e i badge degli achievement
- Fatto e in attesa di conferma: punti tolti da Stats e Profilo (erano uguali alle visite), vassoio tolto da Stats (resta lo stato vuoto in Home)

## Idee medie (da valutare)
- [ ] Diario delle visite: data, nota, cosa hai mangiato, foto
- [ ] Card da condividere ("17/828 Mc, Toscana 23%") come immagine
- [x] Achievement per regione completata e serie di giorni consecutivi — regioni fatte; le serie di giorni sono state tolte

## Idee grandi (da valutare)
- [ ] **IN PAUSA (decisione del 19/09/2026)**: notifica quando passi vicino a un Mc non visitato. Funziona solo con app nativa (Capacitor local notifications + posizione in background; su web/PWA la posizione in background non esiste). Per ora si tiene solo la web app, quindi la si riprende se e quando si sceglie di fare le app ufficiali. Il popup di oggi compare solo all'apertura dell'app e una volta sola
- [x] Check-in verificato dal GPS (visita solo entro ~200 m), come modalità opzionale — fatto il 22/09/2026, non come modalità a parte ma automatico (vedi "Ristorante verificato" più sotto)
- [x] Aperture e chiusure, fondamenta: ID stabili (l'elenco non si rinumera più), stato aperto/chiuso con data, chiusi visitati che continuano a contare, chiusi mai visitati che spariscono, etichette "Chiuso" e "Nuovo", nuovo `fetch-data` che unisce la raccolta all'elenco con rapporto delle differenze e freno al 5%. Vedi `docs/AGGIORNAMENTO-DATI.md`. Test: `npm run test:data`
- [ ] Primo aggiornamento vero dell'elenco: raccolta da mcdonalds.it (browser reale) e `npm run fetch-data -- raccolta.json --dry-run`. Attenzione: il file attuale è stato generato con il vecchio script, quindi la prima unione può segnalare qualche "modificato" da controllare
- [x] Elenco ristoranti che si aggiorna da solo sui dispositivi: a ogni pubblicazione il sito espone `data/mcdonalds.json`; l'app lo scarica (all'apertura, al ritorno in primo piano, alla riconnessione, ogni 6 ore), lo valida (mai perdere un ID, niente chiusure di massa, coordinate e campi corretti), lo salva sul dispositivo e lo applica subito; offline usa l'ultima copia valida, altrimenti quella inclusa. Vale anche per l'APK. Nel Profilo: da dove viene l'elenco e quando è stato aggiornato
- [x] Guida all'installazione: pulsante "Installa" su Android/Chrome, istruzioni su iPhone (Condividi → Aggiungi alla schermata Home), avviso "apri nel browser" dentro Instagram/Facebook/WebView; card in Home (solo telefoni, nascondibile, riproposta dopo 14 giorni) e sezione fissa nel Profilo iPhone con Chrome/Firefox/Edge: card con "Apri in Safari" (schema x-safari-https, non documentato da Apple) e "Copia link" come alternativa. Verificato su iPhone con Chrome (19/09/2026): Safari si apre.
- [ ] **Raccolta automatica delle novità/chiusure** (oggi serve una raccolta a mano): azione programmata su GitHub che interroga OpenStreetMap (Overpass) e unisce con `fetch-data`. Confronto fatto il 19/09/2026: 787 punti OSM vs 828 nel nostro elenco; il 98% dei punti OSM coincide con un nostro ristorante (entro 150 m), ma il **10% dei nostri (81) non ha nessun punto OSM**: l'assenza in OSM NON significa chiuso. Regole prudenti: chiuso solo se era già visto in OSM e manca per più controlli di fila; nuovo solo se compare in modo stabile; soglia di variazione → nessuna scrittura automatica; prime settimane in sola modalità rapporto. In OSM mancano città e via (278/340 su 787): per i nuovi vanno ricavate a parte. Attenzione alla licenza ODbL (attribuzione © OpenStreetMap contributors)
- [ ] Applicare gli aggiornamenti della web app in silenzio al lancio successivo, senza il tocco su "Aggiorna"
- [x] Protezione dei dati utente (21/09/2026): il browser viene richiesto di non cancellare i dati (`navigator.storage.persist()`, `src/services/storagePersist.ts`) a ogni avvio e il Profilo mostra se sono protetti; promemoria periodico di backup già presente (`backupReminder`)
- [ ] Lungo termine: account e sincronizzazione tra dispositivi (serve un server)
- [ ] Prova su dispositivi veri della web app installata: iPhone (installazione, posizione, Apple Maps, Esporta/Importa, offline) e Android (installazione da Chrome, offline, aggiornamento dati)
- [ ] Popup della mappa: in sviluppo (React StrictMode) e in schede in background la mappa può restare a metà animazione e il popup non aprirsi; su telefono funziona. Se capita di nuovo su un dispositivo reale, indagare `zoomToShowLayer` con i marker ricreati
- [x] iPhone: PWA su GitHub Pages (manifest, icone, service worker offline, deploy automatico a ogni push su master): https://givvi00.github.io/mcdonaldz-tracker/ . Su iPhone: Safari → Condividi → "Aggiungi alla schermata Home". I dati dell'iPhone sono separati da quelli di Android: si trasferiscono con Esporta/Importa
- [x] Aggiornamenti della web app: `version.json` a ogni build; banner "Nuova versione disponibile" (all'apertura, al ritorno in primo piano, alla riconnessione e ogni 30 min); Profilo con versione, data e codice build + "Controlla aggiornamenti"; cache del service worker per build, con pulizia delle vecchie
- [x] Controllo dei tipi: `npm run typecheck` (prima `tsc -p tsconfig.app.json` non guardava nessun file di `src`); ora gira anche nella pubblicazione su Pages
- [x] Migrazioni del database locale (21/09/2026): `DB_VERSION` e un passo per versione in `src/services/db.ts` (`MIGRATIONS`, `BACKUP_MIGRATIONS`); prima di ogni aggiornamento della struttura i dati vengono copiati in localStorage (`getPreMigrationBackup()`); i backup portano `schemaVersion` e un backup di una versione più nuova viene rifiutato con un messaggio chiaro. Test: `scripts/test-migration.ts` (fake-indexeddb). Il Profilo mostra il pulsante "Scarica la copia di sicurezza" solo se l'app ne ha messa da parte una
- [ ] iPhone, da verificare sul telefono: installazione, posizione, "Portami lì" (Apple Maps), Esporta/Importa, uso offline
- [ ] iPhone nativo (facoltativo, in pausa): build cloud + account Apple Developer, solo se servono le notifiche di prossimità in background
- [x] Repository remoto su GitHub come backup del codice: https://github.com/Givvi00/mcdonaldz-tracker (**pubblico**, necessario per GitHub Pages gratuito; autore dei commit: noreply di GitHub). Dopo ogni sessione: `git push`

## Da discutere insieme (19/09/2026)
- [x] **Logo del banner in alto** e **icona dell'app**: già rifatti (19/09/2026): scritta "McDonald.z" nel banner al posto del quadratino giallo, icona rossa con segnaposto giallo con spunta e "Mz." bianco (`public/icons`). Voci rimaste indietro nel TODO, aggiornate il 21/09/2026. Resta da fare l'icona monocromatica per Android 13+ (riga più sopra)
- [x] **Marker della mappa**: risolto, ora sono semplici marker rossi (da visitare) e verdi (visitati), senza icone di cibo (commit 8d40efd). Voce rimasta indietro, aggiornata il 21/09/2026

## Funzioni future (da approfondire, in coda)
- [x] **Recensioni** (22/09/2026): sulla card del ristorante visitato "☆ Vota" apre `VisitRatingSheet.tsx` con 4 categorie a stelle (Pulizia, Personale, Spazi esterni, Velocità); una volta votato la card mostra la media (es. "★ 3.5"); nessuna nota di testo. Nuovo timbro "Critico gastronomico" (rari) per chi vota almeno 10 ristoranti. Il voto non tocca livelli né conta come nuova visita. Nessuna migrazione: campo `rating` opzionale su Visit, come `dateEdited`. Test: `scripts/test-passport.ts`. Da provare sul telefono. Non fatto: voto dal popup della mappa, media nelle Stats
- [x] **Data di visita** (21/09/2026): sulla card del ristorante visitato "Visitato il … · Cambia" apre il selettore (`VisitDateSheet.tsx`, mai nel futuro); nuovo ordinamento "Recenti" in Home. La visita con data cambiata porta `dateEdited` e non vale per i timbri a orario (Nottambulo, Ferragosto, Doppietta, Pioniere). Nessuna migrazione: il campo è opzionale. Fatti anche: data (con "Cambia") nel popup della mappa e riga "Ultimo Mc" in Stats. Da provare sul telefono
- [x] **Ristorante "verificato"** (22/09/2026): un solo pulsante "Segna visita" ovunque (card, mappa, popup "Ti trovi qui?"); se in quel momento la posizione del telefono è entro 200 m dal ristorante (`GPS_VERIFY_RADIUS_KM` in `mcdonaldStore.ts`), la visita nasce verificata col GPS, senza bisogno di un pulsante o una modalità a parte. Pallino blu stile Instagram sulla card, sul marker della mappa e nel popup. Le vecchie visite restano senza pallino per sempre, di proposito: nessun modo per confermarle a mano, altrimenti il distintivo non varrebbe nulla. Livelli, regioni e percentuali non cambiano: contano tutte le visite come prima. Nuovo timbro bonus "Sul posto" per chi arriva a 25 visite verificate; riga "🔵 N verificate col GPS" in Stats. Nessuna migrazione: campo `verified` opzionale su Visit. Test: `scripts/test-passport.ts`. Da provare sul telefono (con il GPS vero)

## Roadmap, livelli e collezionabili (idea del 20/09/2026)
- [x] **Roadmap dei livelli** nella pagina Stats: tutti i livelli in fila, come un percorso. Raggiunti: nome e icona in chiaro. Prossimo: in evidenza con barra e "mancano N visite". Futuri: sagoma con lucchetto, "???" al posto del nome e solo la soglia di ristoranti visitati. Da decidere: se il nome del prossimo livello si vede già (consigliato sì) e le soglie (proposta: 5, 15, 30, 60, 120, 250, 500, 828 = tutti) — fatta (vedi sotto)
- [x] **Achievement rifatti**: nomi in italiano con tono ironico da fast food, icone disegnate a tema cibo, anteprima html da approvare prima — fatti (vedi sotto)
- [x] **Regioni e collezionabili**: completamento delle regioni (es. "Abruzzo completato" come figurina/medaglia), da integrare con la roadmap. Altre idee di collezionabili da valutare insieme — fatti: figurine oro/argento e album (vedi sotto)
- Decisione del 20/09/2026 sulle regioni: figurina **oro** = regione completa (tutti i Mc aperti visitati) e aggiornata; **argento** = era completa ma è arrivato un Mc nuovo da visitare; regioni e livelli restano separati. Livelli: 12 gradini (0, 5, 15, 30, 50, 80, 120, 180, 260, 380, 550, 800), da aumentare in futuro se serve. Bozza in `Desktop\mcdz-anteprima\anteprima-roadmap.html`
- [x] (20/09/2026, in locale, da provare sul telefono) Roadmap dei 12 livelli, passaporto con 23 timbri (achievement), album delle regioni con figurine oro/argento, feste diverse per livello, regione e timbro con coda ordinata. Nuovo `src/services/regions.ts` (una regione completata viene ricordata come record `REGION:<nome>` accanto agli achievement). Le serie di giorni consecutivi sono state tolte. Test: `scripts/test-passport.ts`
- [ ] Da rivedere insieme dopo la prova: durata della coda di feste (livello + regione + timbri possono superare i 20 secondi), disegni delle figurine per regione, icona del livello 12, timbri "Nottambulo/Ferragosto/Doppietta" (dipendono dall'orario in cui si segna la visita: più precisi con la "data di visita")

## Rifiniture del 22/09/2026
- [x] Il voto compare subito, insieme alla festa della visita appena segnata, non dopo: `AutoRatingPrompt.tsx` mostra la scheda nello stesso istante in cui parte la festa (store `pendingRatingFor`), sopra il velo di livelli/regioni/timbri (z-index più alto), così restano usabili insieme invece di aspettare che la festa grande finisca. Il pulsante "Vota"/"★ media" sulla card resta per cambiare il voto in un secondo momento
- [x] Distintivo "verificato col GPS", seconda versione, più prezioso: alone blu sfumato dietro l'anello, riflesso lucido sulla spunta, due lucine che pulsano (`VerifiedBadge.tsx`, id univoci con `useId` per non confliggere quando ce ne sono tanti in lista). Anche sulla mappa (marker e popup) ha lo stesso sigillo a sfumatura, senza rotazione per restare leggero con tanti marker (`verifiedSealMarkup` in `mapMarkers.ts`)
- [x] Terzo giro sul verificato: sigillo più pieno (anello ~35 px contro i 32 del cerchio verde, prima sembrava più piccolo); sulla mappa il sigillo **sostituisce** l'intero marker invece di stare in un angolo; nel popup una sola pillola blu "Visitato il …" col sigillo, senza "Cambia"
- [x] Una visita verificata **non può cambiare data** (card, popup e anche lo store la rifiuta): la data è la prova del GPS
- [x] I timbri a orario (Nottambulo, Ferragosto, Doppietta, Pioniere) valgono **solo con visite verificate col GPS**, non più con qualsiasi visita a data non modificata. Fortunello (77°) resta un semplice conteggio. Test aggiornati in `scripts/test-passport.ts`

## Account, community e onboarding (idea del 22/09/2026, da capire con calma)
- [ ] **Utenze/account**: oggi non esistono, ogni telefono ha i propri dati locali senza login. Serve per: community tra amici, seguire altri utenti, classifiche/gare, vedere il livello degli amici. Grosso cambio di architettura, da progettare a parte
- [ ] **Salvataggio in remoto**: serve un server con hosting e database (oggi tutto vive solo nell'IndexedDB del dispositivo, vedi `src/services/db.ts`); da capire login, sincronizzazione tra dispositivi, costi e chi lo mantiene
- [ ] **Onboarding/tutorial alla prima apertura**: una guida rapida per chi installa l'app per la prima volta, prima ancora di aprire un account
- Nota: queste tre cose sono collegate (l'account serve sia per la community sia per il salvataggio remoto) ma vanno affrontate con una sessione dedicata, non di corsa

## Festa della regione "che esce dall'Italia" (21/09/2026, fatta)
- [x] Mappa condivisa `src/data/italyMap.ts` (generata da `scripts/generate-italy-map.ts` con il GeoJSON openpolis/geojson-italy); `ItalyMap.tsx`; sequenza in `RegionFlight.tsx` (mappa → regione si accende → vola al centro → figurina d'oro con i fuochi → torna d'oro al suo posto); mappa anche in Stats sopra l'album. Durata festa regione accorciata il 21/09/2026 a circa 8,4 s
- [ ] Da provare sul telefono (peso e resa); eventualmente accorciare la durata
