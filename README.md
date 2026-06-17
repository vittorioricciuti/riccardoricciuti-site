# Sito Riccardo Antonio Ricciuti — versione 6

Questa versione è pensata per GitHub Pages ed è completamente statica: non richiede server, database o abbonamenti.

## Come caricarla su GitHub

1. Apri lo ZIP.
2. Entra dentro la cartella `ricciuti-site`.
3. Carica nel repository **il contenuto interno** della cartella, non la cartella stessa.
4. Fai `Commit changes` su `main`.
5. Vai su `Actions` e aspetta che il workflow `Deploy GitHub Pages` diventi verde.
6. Vai su `Settings > Pages` e verifica che la Source sia `GitHub Actions`.

## Foto

Il file da sostituire è:

`assets/portrait-placeholder.svg`

Quando avrai una foto autorizzata, puoi caricarla come `assets/portrait.jpg` e cambiare in `index.html` la riga dell'immagine da:

`assets/portrait-placeholder.svg`

a:

`assets/portrait.jpg`

## Pubblicazioni automatiche

Il workflow esegue a ogni deploy e ogni lunedì lo script:

`scripts/update_orcid.py`

La fonte principale è ORCID:

`https://orcid.org/0000-0003-4970-2065`

Lo script legge le opere pubbliche dal profilo ORCID, ordina le pubblicazioni per anno decrescente e genera il file usato dal sito durante il deploy. Se ORCID non risponde, il sito mantiene il file `data/publications.json` già presente e il deploy non si blocca.

## File contenuti

- `data/profile.json`: profilo, link, aree cliniche
- `data/publications.json`: pubblicazioni iniziali
- `data/congresses.json`: congressi e corsi
- `data/booking.json`: contatti San Camillo e Progetto Salute
- `data/news.json`: notizie, TV, articoli online
- `scripts/update_orcid.py`: aggiornamento pubblicazioni
- `.github/workflows/pages.yml`: pubblicazione automatica GitHub Pages


## Nota v8
Questa versione rende il caricamento dei dati più robusto: se una sezione opzionale non viene caricata, il resto del sito resta visibile.


## Pubblicazioni e ORCID

Le pubblicazioni vengono aggiornate dal profilo ORCID `0000-0003-4970-2065` durante il workflow GitHub Actions. Il workflow aggiorna `data/publications.json`, salva la modifica nel repository e poi pubblica il sito su GitHub Pages. Nel sito ogni pubblicazione può mostrare link a DOI, PubMed e ORCID quando disponibili.


## Controllo ORCID
Dopo il commit, apri Actions → Deploy GitHub Pages → Update publications from ORCID. Se leggi `Updated ... with X ORCID works`, le pubblicazioni sono state scaricate da ORCID. Se leggi `ORCID update skipped`, GitHub ha pubblicato il file statico già presente in `data/publications.json`.


## Foto profilo
La foto principale è `assets/riccardo-ricciuti.jpg`. Per sostituirla in futuro, usare lo stesso nome file oppure aggiornare il percorso in `index.html`.
