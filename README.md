# Sito Dott. Riccardo Antonio Ricciuti

## Pubblicazione su GitHub Pages

1. Carica nella root del repository tutti i file e le cartelle contenuti in questa cartella.
2. Fai **Commit changes**.
3. Vai su **Settings → Pages** e verifica che la sorgente sia **GitHub Actions**.
4. Vai su **Actions** e apri l'ultimo workflow **Deploy GitHub Pages**.
5. Controlla lo step **Update publications from ORCID**.

Se l'aggiornamento ORCID funziona, nello step devi vedere una riga simile a:

```text
Updated data/publications.json with XX ORCID works
```

Se ORCID non viene letto, il workflow diventa rosso. Questo è voluto: evita che il sito venga pubblicato dando l'impressione che le pubblicazioni siano aggiornate quando non lo sono.

## Controllo delle pubblicazioni

Dopo un workflow verde, apri:

```text
https://vittorioricciuti.github.io/riccardoricciuti-site/data/publications.json
```

Le pubblicazioni devono essere generate da ORCID e ordinate per anno decrescente.

Il file tecnico:

```text
data/publications.meta.json
```

serve solo per verificare origine e numero dei lavori letti.
