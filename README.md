# Sito Dott. Riccardo Antonio Ricciuti — versione definitiva v14

Questa versione è pensata per GitHub Pages e per una gestione più semplice nel tempo.

## Cosa contiene

- Homepage più compatta e orientata al paziente.
- Foto principale in `assets/riccardo-ricciuti.jpg`.
- Sezione **Aree cliniche** con schede espandibili.
- Sezione **Percorso di cura**.
- Sezione **Prenota una visita** con San Camillo e Progetto Salute.
- Sezione **Domande frequenti**.
- Sezione **Notizie e media**.
- Sezione **Attività scientifica e congressuale**.
- Sezione **Pubblicazioni** aggiornata da ORCID tramite GitHub Actions.
- Predisposizione per aggiornare Notizie, Congressi, Video e Prenotazioni tramite Google Sheets.

## Pubblicazione su GitHub Pages

Caricare nella root del repository tutto il contenuto della cartella `ricciuti-site-v14`, non la cartella intera.

La root del repository deve contenere direttamente:

```text
.github
assets
data
docs
scripts
app.js
index.html
styles.css
README.md
```

Dopo il caricamento fare **Commit changes**. Poi andare su **Actions** e attendere il workflow verde.

## Workflow ORCID

Il file `.github/workflows/pages.yml` esegue lo script:

```text
scripts/update_orcid.py
```

Lo script legge il profilo ORCID:

```text
0000-0003-4970-2065
```

e aggiorna:

```text
data/publications.json
data/publications.meta.json
```

Se ORCID non viene letto correttamente, il workflow deve diventare rosso: così non ci sono più aggiornamenti “falsamente verdi”.

## Contenuti aggiornabili senza toccare codice

I contenuti ordinari sono nei file JSON dentro `data/`:

```text
data/profile.json
data/booking.json
data/news.json
data/congresses.json
data/videos.json
data/faqs.json
data/pathway.json
```

La versione v14 è già predisposta per sostituire alcuni JSON con Google Sheets pubblici in CSV.

Il file da configurare è:

```text
data/site-config.json
```

Per ora i campi Google Sheets sono vuoti, quindi il sito usa i dati locali.

```json
{
  "googleSheets": {
    "news": "",
    "congresses": "",
    "videos": "",
    "booking": ""
  }
}
```

Quando saranno disponibili i fogli Google pubblicati in formato CSV, basterà inserire gli URL al posto delle stringhe vuote.

## Template Google Sheets

Nella cartella:

```text
docs/google-sheets-template/
```

ci sono esempi CSV con le colonne da usare per:

- notizie;
- congressi;
- video;
- prenotazioni.

Spiegherò separatamente come creare e collegare Google Sheets.
