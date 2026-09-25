# Tappa 2: gli amici (bozza da decidere insieme)

Bozza del 25/09/2026. **Niente di questo è ancora nell'app**: le scelte segnate con ❓ sono da fare insieme prima di
scrivere codice. La tappa 1 (account, accesso, richiesta di entrare, username unico) è fatta.

## Cosa vogliamo

- Vedere a che punto sono gli amici: livello, quanti Mc, quanti verificati, regioni d'oro e di diamante, timbri.
- Confrontarsi: una prima classifica semplice. Le gare vere (sfide a tempo, premi) sono la tappa 3.
- Tutto senza pensieri: nessuna impostazione da capire, niente testi su salvataggi o server.

## La scelta principale ❓: chi vede chi

| | Come funziona | Pro | Contro |
|---|---|---|---|
| **A. Tutti vedono tutti** | L'app è su invito: chi è dentro è già del gruppo. Una lista unica con tutti | Zero passaggi: appena entri vedi gli altri. Semplicissima | Se un domani entrano amici di amici, si vedono anche tra sconosciuti |
| **B. Segui** (come Instagram) | Cerchi un username e premi Segui, senza conferma | Scegli chi guardare | Qualcuno che non conosci può seguirti |
| **C. Amicizia** (con richiesta) | Richiesta → l'altro accetta → vi vedete a vicenda | Massima riservatezza | Un passaggio in più per ogni amico |

**Proposta: A adesso**, perché oggi entra solo chi accetti tu (quindi il gruppo è già filtrato), e si passa a B o C il
giorno che il gruppo cresce. Il lavoro sui dati è lo stesso: cambia solo la regola "chi può leggere il riepilogo".

## Cosa vedono gli altri di te (il "riepilogo")

Solo numeri e traguardi, **mai quando e dove**:

- username, livello (numero e nome), Mc visitati, di cui verificati
- regioni: quante d'oro, quante di diamante (❓ anche *quali*? es. per una mappa dell'amico)
- timbri ottenuti (quanti; ❓ anche *quali*, per mostrare il suo passaporto)
- ultimo aggiornamento del riepilogo ("attivo 2 giorni fa")

Mai: le date delle visite, i singoli ristoranti visitati, i voti, la posizione. ❓ Da valutare dopo: "ultimo Mc visitato"
(città) come notizia per gli amici. Rivela dove sei stato, quindi solo se lo vuoi.

## Come funziona sotto

- Nuova tabella `public_stats` (una riga per persona) con i numeri del riepilogo. La scrive l'app di ognuno a ogni
  salvataggio, perché livello e regioni dipendono dall'elenco dei ristoranti, che sta nell'app.
- Regole: ognuno scrive solo la propria riga; la leggono gli utenti dentro l'app (scelta A) o solo chi ti segue o è
  tuo amico (B/C). Le tabelle `visits` e `achievements` restano leggibili solo dal proprietario, come oggi.
- Per B/C: tabella `follows` (chi segue chi), oppure `friendships` (richiesta, accettata), con le sue regole.
- Il riepilogo lo calcola il telefono, quindi in teoria si potrebbe falsificare. Tra amici va benissimo; per gare con
  premi veri (tappa 3) servirebbe calcolarlo sul server partendo dalle visite.

## Nell'app

- ❓ **Dove**: una quarta voce nella barra in basso ("Amici") oppure una sezione in Stats. Proposta: voce nuova "Amici",
  perché diventerà il posto delle gare.
- **Lista amici**: una card per persona con icona del livello, username, "83 Mc · 12 ✓", figurine d'oro/diamante in
  piccolo. Tu compari evidenziato, al tuo posto in classifica.
- **Ordine**: per Mc visitati (poi verificati, poi regioni). Un selettore per cambiare criterio: Visitati / Verificati /
  Regioni.
- **Scheda dell'amico** (tocco sulla card): livello, percorso, regioni in figurine, timbri.
- **Festa**: quando superi un amico in classifica, un piccolo annuncio ("Hai superato Marco!"), senza esagerare.

## Tappe di lavoro (quando decidiamo)

1. SQL `0005_public_stats.sql` (tabella + regole) → lo esegui tu nel SQL Editor
2. L'app scrive il proprio riepilogo a ogni salvataggio (con test, come per la sincronizzazione)
3. Voce "Amici" con lista e classifica
4. Scheda dell'amico
5. Solo se scelte B/C: cerca per username, segui/richiesta, tabella e regole in più

## Da tenere presente

- Le richieste di entrare: oggi al massimo 20 in attesa, e a te arriva un'email per ognuna. Chiunque conosca il link
  dell'app potrebbe mandarne di finte e riempire la coda. Tra amici è improbabile. Se capitasse, si aggiunge un limite
  per ora e si rifiutano in blocco.
- Resend manda le notifiche da `onboarding@resend.dev`, che Gmail mette nello spam finché non crei il filtro. Con un
  dominio proprio (qualche euro l'anno) le email arriverebbero pulite, anche quelle col codice agli amici.
