# Diaporamas du cours ELK

Ce dossier contient les 2 modeles demandes:

- `markdown/`: source editable des slides
- `html/`: version Reveal.js prete a presenter

## Structure

- `markdown/01-elasticsearch-moteur-recherche.md`
- `markdown/02-elasticsearch-titanic.md`
- `markdown/03-elasticsearch-avance.md`
- `markdown/04-kibana-dataviz.md`
- `markdown/05-logstash-cas-usage.md`
- `html/01-elasticsearch-moteur-recherche.html`
- `html/02-elasticsearch-titanic.html`
- `html/03-elasticsearch-avance.html`
- `html/04-kibana-dataviz.html`
- `html/05-logstash-cas-usage.html`
- `html/exercices.html` (hub des exercices)
- `html/exercices-elasticsearch-titanic.html` (20 exos Elasticsearch Titanic)
- `html/exercices-kibana.html` (exos Kibana)
- `html/exercices-logstash.html` (exos Logstash)
- `html/assets/theme.css`

## Utilisation

Ouvrir les fichiers HTML dans un navigateur.

Pour un rendu plus fiable (polices/code highlight), servir le dossier localement:

```bash
cd supports/diaporama-html/html
python3 -m http.server 8080
```

Puis ouvrir:

- `http://localhost:8080/01-elasticsearch-moteur-recherche.html`
- `http://localhost:8080/02-elasticsearch-titanic.html`
- `http://localhost:8080/03-elasticsearch-avance.html`
- `http://localhost:8080/04-kibana-dataviz.html`
- `http://localhost:8080/05-logstash-cas-usage.html`
- `http://localhost:8080/exercices.html`
- `http://localhost:8080/exercices-elasticsearch-titanic.html`
- `http://localhost:8080/exercices-kibana.html`
- `http://localhost:8080/exercices-logstash.html`
