# McDonaldz Tracker · Design guide

PWA mobile-first (min 360px, ottimizzata per iPhone installata) per un gruppo di amici: segnare i McDonald's d'Italia visitati (834), verificarli col GPS, sbloccare timbri/regioni/livelli, gareggiare in classifica. Non è collegata a McDonald's: **niente loghi o marchi ufficiali**. Italiano, tono giocoso, testi brevi, zero tecnicismi.

Le schermate di riferimento sono in `design/reference/*.html` (markup con stili inline, apribile nel browser; copiare valori e struttura, non la tecnica). Questo file ha la precedenza in caso di dubbio.

## Principi

1. **Un posto solo per ogni cosa.** Ogni dato vive in una schermata:
   - progresso e prossimo livello → Home (un solo numero grande);
   - dettaglio visitati/verificati/regioni, passaporto, album → Stats;
   - livelli → Strada dei livelli (Profilo rimanda, non ripete);
   - ristoranti → Mappa/Lista (stesso set di filtri);
   - scontrino → solo come immagine da condividere.
2. **Icone a linea per il funzionale, illustrazioni per il premio.** Le emoji/illustrazioni personalizzate dell'app compaiono solo in celebrazioni, schede vuote, onboarding, toast e piccoli accenti (es. "Ultima visita"). Mai al posto di navigazione, stati o filtri. Mai emoji di sistema.
3. **Il gesto principale è giallo.** Un solo bottone giallo per schermata ("Segna visita", "Entra", "Continua").
4. **Posizione mai mostrata né condivisa.** Agli amici si mostrano solo numeri e traguardi, mai voti né email. Dirlo dove serve (onboarding verifica, accesso, condivisione).
5. **Mai parlare di "salvataggi" o "backup".**

## Token

### Colori (tema scuro, quello di riferimento)

| Token | Valore | Uso |
|---|---|---|
| bg | `#150F0F` | sfondo app |
| surface | `#221918` | card, campi, nav (nav `#1B1313`) |
| surface-2 | `#2D2220` | chip, pulsanti secondari, voce attiva nav |
| line | `#3D2E2B` | bordi 1px |
| text | `#FBF3EA` | testo principale |
| muted | `#C4B0A7` | testo secondario |
| red | `#CC2318` | header, hero, accenti (sfondi con testo bianco; il rosso brand `#DA291C` va bene solo per grafica senza testo) |
| red-deep | `#A81C14` | fine gradiente rosso (onboarding/accesso), passaporto |
| red-light | `#FF8A7A` | testo/link rosso su fondo scuro |
| yellow | `#FFC72C` | CTA principale, stato attivo, barre di progresso; testo sopra: `#2A1A00` |
| green | `#4CD68B` | stato "visitato" |
| blue | `#5B9BFF` | stato "verificato" (gradiente `#A8CCFF → #2F6BE0`, con glow `rgba(91,155,255,.8)`) |

Onboarding/accesso: gradiente verticale `#D42A1C → #A81C14` + pattern di icone cibo a linea bianca al 15% di opacità (tile 104px).

Contrasto: testo ≥ 4.5:1 (3:1 da 24px). Stati distinguibili anche per forma, non solo colore: da visitare = anello vuoto, visitato = cerchio pieno con spunta, verificato = sigillo scalloppato lucido.

### Tipografia

- **Display** (titoli, numeri grandi, nomi): *Fredoka* 500/600/700.
- **Testo**: *DM Sans* 400/500/700. (Da confermare: nell'app oggi il testo sembra Inter; se si preferisce mantenerlo, sostituire ovunque.)
- **Scontrino**: *DM Mono*.
- Scala: hero 64 · titolo pagina 30–34 · titolo sezione 21 · nome card 18–19 · testo 15–17 · secondario 14 · etichette 12–13 (maiuscolo con letter-spacing .1–.14em). Minimo assoluto 12px.

### Forme, spazi, tocco

- Raggi: hero 26 · card 22 · bottoni/campi 16–18 · chip/barre 999 · tile app-icon 27% del lato.
- Padding pagina 20px; gap tra sezioni 20–24; gap tra elementi 8–12.
- **Target minimo 44px** (bottoni primari 52–56). Il bottone giallo ha ombra piena `0 6px 0 #B8860B` e si schiaccia al tap.
- Header: rosso, 36px di safe-area sopra + riga da 44. Nav inferiore: 4 voci (Home, Mappa, Stats, Amici), voce attiva = pillola `surface-2` + icona/etichetta gialle. Nessuna barra di stato finta.

### Icone

Set unico a linea, stroke 2, angoli arrotondati, 24px (home, map, list, stats, users, pin, search, check, cross/locate, share, lock, chevron, calendar, star, monitor/sun/moon, navigation, eye, close, refresh, book). Livelli: 12 icone food-line (bicchiere, patatine, hamburger, nuggets, gelato, sacchetto, auto/drive, bussola, coppa, corona, stella, diamante) in un badge circolare: attuale = bordo giallo, sbloccato = rosso pieno, prossimo = bordo tratteggiato, bloccato = scuro con lucchetto.

## Componenti ricorrenti

- **Hero progresso (Home):** card rossa, "IL TUO PROGRESSO", numero 64px, "McDonald's visitati su 834 in Italia", barra gialla verso il prossimo livello (valore `3 / 5`), riga di aiuto "Mancano 2 visite a …". La barra mostra sempre il prossimo traguardo, mai la % sul totale (sarebbe quasi 0).
- **Card ristorante (carosello "Vicino a te" e righe lista):** nome Fredoka, città/indirizzo, chip distanza, stato (icona + etichetta). Da visitare → bottone giallo "Segna visita"; altrimenti "Sulla mappa". Bordo tinto per stato (blu verificato, verde visitato).
- **Selettore a segmenti / filtri:** contenitore `surface` raggio 18, voce attiva `#4A3834`. Filtri: Tutti, Da visitare, Visitati, Verificati, Nuovi (con puntino colore).
- **Interruttore Mappa/Lista:** due icone in un contenitore, attivo giallo.
- **Pin mappa:** goccia con bordo bianco; rosso (da visitare), verde con spunta (visitato), blu **lucente** con glow, riflesso e scintilla (verificato); selezionato = ingrandito con anello giallo. Cluster come nell'app attuale.
- **Barra di avanzamento:** altezza 10–12, track scuro, fill giallo (rosso nel percorso livelli), `role="progressbar"`.

## Schermate

1. **Home:** hero progresso → "Ultima visita" (accento con illustrazione) → "Vicino a te" (carosello) → card "N nuovi McDonald's" → bottone "Tutti i ristoranti" (apre la Lista).
2. **Mappa:** mappa a tutto schermo; in alto ricerca + interruttore Mappa/Lista, sotto i filtri; scheda del ristorante selezionato in basso con "Segna visita" e indicazioni. Pulsante "centra posizione".
3. **Lista:** stessa testata (ricerca, interruttore, filtri) + menu regione + ordinamento (Distanza/A–Z/Recenti) + righe ristorante. Stessi dati e filtri della Mappa.
4. **Segna visita:** scelta tra "Verifica con la posizione" (disattivata se lontano, con spiegazione) e "Segna come visitato"; data (cambiabile); voto a stelle facoltativo (nell'app: categorie dentro/McDrive con interruttore); CTA fissa in basso con nota "Il sigillo blu si ottiene solo segnando la visita dal ristorante".
5. **Stats ("portafoglio"):** tre numeri (Visitati, Verificati, Regioni) → selettore **Passaporto | Album**. Passaporto: copertina e pagine che si sfogliano (la pagina Traguardi sta dentro il passaporto, non fuori) con indicatore di pagina. Album: legenda (vuota/argento/oro/diamante), mappa d'Italia colorata per livello, figurine delle regioni. Pulsante condividi in alto.
6. **Condividi:** sheet con lo scontrino riepilogativo come immagine, "Condividi" / "Salva come immagine", nota privacy ("solo numeri: niente posizione, niente voti").
7. **Amici:** classifica con selettore Visitati / Verificati / Regioni finite; riga personale evidenziata con tag "TU"; posizioni 1–2–3 con medaglie disegnate (numeri, non emoji); scheda "Sfida un amico". La scheda amico (numeri, passaporto, mappa, album) resta come oggi.
8. **Profilo:** testata con avatar/nome/livello; link "Strada dei livelli"; account (email, username + Salva, password, Esci, Elimina account); aspetto (Sistema/Chiaro/Scuro); app (installata, versione, aggiornamenti, guida). Nessun conteggio ripetuto.
9. **Strada dei livelli:** percorso verticale a tappe sinuoso; livello attuale grande con "Sei qui", tratto percorso giallo, prossimo con barra, bloccati con nome "???" e soglia (5, 15, 30, 50, 80, 120, 180, 260, 380, 550, 800).

### Ingresso (in ordine)

Onboarding 4 slide (Benvenuto → Segna i Mc → Se sei lì vale di più, con frase privacy e richiesta posizione "soft" → Timbri, regioni e livelli; con "Salta", "Indietro" ad alto contrasto) → **Accesso** (Google; email + password con etichette visibili e occhio; niente codice via email) → **Scegli il nome** (passo 1 di 2, con anteprima "Così ti vedono") → **Scegli una password** (passo 2 di 2, regole come spunte che si accendono; obbligatoria) → Home. Il messaggio di installazione PWA (guida iPhone: Condividi → Aggiungi alla schermata Home) resta quello già esistente.

## Segnaposto da sostituire (non inventare)

- Illustrazioni/emoji personalizzate: usare gli asset veri; nel riferimento sono figurine con icona a linea.
- Mappa: base Leaflet/OSM esistente; nel riferimento è un disegno.
- Mappa d'Italia dell'Album e sagome delle regioni: usare gli SVG esistenti.
- Logo "G" di Google: usare il pulsante ufficiale.
- Nomi dei livelli 3–12, "Montecatini · 18 km", regole password (8 caratteri, lettera, numero): esempi, da allineare ai dati reali.
- Icone dei livelli 3–12: proposta, da approvare.

## Come lavorare con Claude Code

Una schermata alla volta, partendo dalla più semplice (Home), così:

> Leggi `DESIGN.md` e `design/reference/Home.dc.html`. Rifai la Home dell'app seguendo esattamente token, layout e regole. Riusa i componenti che esistono già e non cambiare la logica. Se un dato non esiste, dimmelo invece di inventarlo.

Ordine suggerito: token e componenti condivisi (header, nav, bottoni, chip, card) → Home → Mappa+Lista → Segna visita → Stats e Condividi → Amici → Profilo e Strada → ingresso (onboarding, accesso, nome, password). Dopo ogni schermata, controllare a 360px e da installata su iPhone.
