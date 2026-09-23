# Aggiornare l'elenco dei McDonald's

L'elenco sta in `shared/data/mcdonalds.json`. Le tue visite sono salvate **per ID** (`mc0001`, `mc0002`…):
un ID deve puntare per sempre allo stesso ristorante. Per questo l'elenco non si rigenera da zero: si **unisce** una
nuova raccolta a quello esistente con `npm run fetch-data`.

## Regole (le fa rispettare lo script, e i test le verificano)

- **Chi c'è ancora tiene il suo ID.** Si riconosce per nome e città (anche se si è spostato fino a 2 km) o, se è stato
  rinominato, per posizione (entro 150 m). L'ordine della raccolta non conta.
- **Un ristorante nuovo prende il prossimo numero libero**, che non viene mai riusato.
- **Uno sparito dalla raccolta non si cancella:** diventa chiuso (`opened: false`, `closedAt: data`).
- **Uno chiuso che ricompare viene riaperto** con il suo ID.
- **Nell'app:** un chiuso mai visitato scompare da liste, mappa, "Vicino a te" e percentuali. Un chiuso che hai visitato
  resta nel tuo storico, con l'etichetta "Chiuso", e **continua a contare** (il totale è "aperti + chiusi visitati", quindi
  non superi mai il 100% e non perdi progressi). I nuovi hanno l'etichetta "Nuovo" per 30 giorni.

## Procedura

1. **Raccolta.** mcdonalds.it è protetto da un sistema anti-bot: la lista va raccolta da un browser vero, non con
   curl o script. Si ottiene un file JSON con un array di oggetti con questi campi:
   `slug, name, region, citySlug, city, street, phone, lat, lng`. Puoi chiedere a Claude Code di raccoglierla con il browser.
2. **Anteprima, senza scrivere niente:**
   ```
   npm run fetch-data -- percorso/raccolta.json --dry-run
   ```
   Il rapporto mostra invariati, nuovi, chiusi, riaperti e modificati. Leggilo: se i numeri non ti tornano, fermati.
3. **Freno di sicurezza.** Se la raccolta aggiungerebbe o chiuderebbe più del **5%** dei ristoranti aperti, lo script si
   ferma con codice 2 e non scrive niente: quasi certamente la raccolta è incompleta. Solo se sai che è giusto, aggiungi `--force`.
4. **Scrittura:** stesso comando senza `--dry-run`.
5. **Controlli:** `npm run test:data` e `npm run typecheck`.
6. **Pubblicazione:** commit e `git push`. Il sito si ripubblica da solo, e con lui il file `data/mcdonalds.json`.

## Come arrivano i dati ai telefoni (automatico, nessuna azione dell'utente)

Ogni pubblicazione espone `data/mcdonalds.json` (versione = impronta del contenuto). L'app installata, sia web sia APK:

- lo controlla all'apertura, quando torna in primo piano, quando torna la rete e ogni 6 ore (se non è cambiato costa una risposta "304" di pochi byte);
- lo **valida** prima di usarlo: struttura corretta, coordinate in Italia, nessun ID già noto che manca, non più di 300 ristoranti nuovi né più del 15% di chiusure in un colpo solo. Se non passa, viene scartato e resta l'elenco in uso (il motivo è nel log del browser);
- se è valido lo applica subito sullo schermo e ne tiene una copia sul dispositivo, usata al lancio successivo anche senza rete;
- una copia salvata più vecchia dell'elenco incluso in una nuova versione dell'app non viene mai usata al posto di quello.

Il file `data/mcdonalds.json` esiste solo nel sito pubblicato (lo genera la build); l'elenco incluso nell'app è `shared/data/mcdonalds.json`.

## Controllo settimanale con OpenStreetMap (automatico, solo segnalazioni)

Ogni lunedì mattina GitHub esegue `.github/workflows/osm-check.yml`: confronta l'elenco con i punti McDonald's di
OpenStreetMap e, **solo se trova qualcosa**, apre una segnalazione (issue con l'etichetta `osm-check`) o aggiunge un
commento a quella già aperta. **Non modifica mai l'elenco.** Si può lanciare anche a mano da GitHub → Actions →
"Controllo elenco con OpenStreetMap" → Run workflow, oppure in locale con `npm run osm-check`.

OpenStreetMap non è completo (circa 1 ristorante su 10 dei nostri lì non c'è), quindi le regole sono prudenti:
- **possibile chiuso**: solo un ristorante che OpenStreetMap aveva e che manca da **2 controlli di fila**; chi su
  OpenStreetMap non c'è mai stato non viene mai segnalato;
- **possibile nuovo**: un punto lontano più di 150 m da tutti i nostri, presente **2 controlli di fila**;
- **possibile riapertura**: un punto dove c'è un nostro ristorante segnato come chiuso;
- il **primo controllo** impara soltanto chi c'è, e non segnala niente;
- se la risposta di OpenStreetMap sembra incompleta (meno di 500 punti), non salva niente.

Quello che ha imparato sta in `shared/data/osm-state.json` (lo aggiorna il controllo stesso, con un commit che non
ripubblica il sito). **Quando arriva una segnalazione:** controlla i casi sul sito McDonald's e, se sono veri, fai la
procedura qui sopra con una raccolta completa (per i nuovi OpenStreetMap spesso non ha città e via). Poi chiudi la
segnalazione: la prossima volta ne verrà aperta una nuova. Dati © OpenStreetMap contributors, licenza ODbL.

## Da non fare

- Non ricreare l'elenco con altri strumenti né modificare a mano gli ID: le visite finirebbero attaccate ai ristoranti sbagliati.
- Non cancellare righe dal file: per chiudere un ristorante usa l'aggiornamento (o `opened: false` + `closedAt`).
- Prima di un aggiornamento grosso, fai un backup dal Profilo → "Esporta Dati".
