# Sito Dott. Riccardo Antonio Ricciuti

Sito statico gratuito pensato per GitHub Pages, con grafica responsive, sezioni interattive e aggiornamento automatico delle pubblicazioni da PubMed tramite GitHub Actions.

## Struttura

```text
index.html
styles.css
app.js
assets/portrait-placeholder.svg
data/profile.json
data/publications.json
data/congresses.json
data/videos.json
scripts/update_pubmed.py
.github/workflows/pages.yml
```

## Come pubblicarlo gratis su GitHub Pages

1. Crea un account su GitHub.
2. Crea un nuovo repository, ad esempio `riccardoricciuti-site`.
3. Carica tutti i file di questa cartella nel repository.
4. Vai su **Settings → Pages**.
5. In **Build and deployment**, seleziona **GitHub Actions**.
6. Vai su **Actions** e avvia manualmente il workflow **Deploy GitHub Pages**, oppure fai un normale commit su `main`.
7. Al termine del deploy, GitHub mostrerà l'indirizzo pubblico del sito.

## Dominio personalizzato

Quando compri il dominio:

1. Nel repository vai su **Settings → Pages → Custom domain**.
2. Inserisci il dominio, ad esempio `www.riccardoricciuti.it`.
3. Dal pannello DNS del provider imposta:
   - un record `CNAME` per `www` verso `<tuo-utente-github>.github.io`;
   - per il dominio senza `www`, usa i record `A` indicati dalla documentazione GitHub Pages.
4. Attiva **Enforce HTTPS** quando GitHub completa la verifica.

## Come aggiornare i contenuti

- Profilo, ruolo, interessi: modifica `data/profile.json`.
- Congressi: modifica `data/congresses.json`.
- Video/interviste: modifica `data/videos.json`.
- Pubblicazioni: il file `data/publications.json` viene aggiornato automaticamente ogni lunedì dal workflow. Puoi anche avviare il workflow manualmente da GitHub Actions.

## Fotografia

Il sito contiene un placeholder professionale in `assets/portrait-placeholder.svg`. Sostituiscilo con una foto autorizzata chiamandola, ad esempio, `assets/ricciuti.jpg`, e modifica in `index.html`:

```html
<img src="assets/ricciuti.jpg" alt="Ritratto professionale del Dott. Riccardo Antonio Ricciuti" id="portrait">
```

Per evitare problemi di diritti, non usare immagini scaricate da siti terzi se non c'è autorizzazione.

## Nota privacy

Il sito non include form di contatto e non raccoglie dati sanitari. Per un medico è una scelta prudente: un eventuale form richiederebbe gestione GDPR, informativa specifica e misure tecniche adeguate.
