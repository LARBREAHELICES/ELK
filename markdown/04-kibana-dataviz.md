# Cours 4 - Kibana Dataviz
## De la requete full-text a la lecture analytique fiable

---

## Objectif du chapitre

- Comprendre precisement ce que Kibana fait (et ne fait pas)
- Construire des analyses lisibles dans Discover, Lens, Dashboard
- Relier chaque visuel a une requete Elasticsearch verifiable
- Mettre en place des pratiques de qualite et de validation

---


## Reperes theoriques (moteur + interface)

- Kibana est une interface de requetage/visualisation, pas une base de donnees
- Elasticsearch execute les requetes et calcule les aggregations
- Un visuel Lens est une traduction UI d'un DSL Elasticsearch
- Sans mapping coherent (`text`, `keyword`, numerique), un dashboard peut mentir

---

## Jeu de donnees de reference Shakespeare

```bash
curl -X PUT "http://localhost:9200/shakespeare" -H "Content-Type: application/json" -d '{
  "mappings": {
    "properties": {
      "line_id":       { "type": "integer" },
      "play_name":     { "type": "keyword" },
      "speech_number": { "type": "integer" },
      "line_number":   { "type": "keyword" },
      "speaker":       { "type": "keyword" },
      "text_entry":    { "type": "text" }
    }
  }
}'
```

```bash
# Option A - full dataset (recommande)
curl -L "https://raw.githubusercontent.com/grokify/kibana-tutorial-go/refs/heads/master/shakespeare.json" \
  -o sandbox/data/shakespeare.json

curl -X POST "http://localhost:9200/shakespeare/_bulk?pretty" \
  -H "Content-Type: application/x-ndjson" \
  --data-binary @sandbox/data/shakespeare.json

# Option B - echantillon local rapide
curl -X POST "http://localhost:9200/shakespeare/_bulk" \
  -H "Content-Type: application/x-ndjson" \
  --data-binary @sandbox/data/shakespeare_sample.ndjson

curl -X POST "http://localhost:9200/shakespeare/_refresh"
curl "http://localhost:9200/shakespeare/_count?pretty"
```

Ce que fait le code:
- Cree un schema propre pour Kibana
- Charge un echantillon Shakespeare full-text
- Garantit une demo reproductible pour Discover/Lens

---

## <span class="glossary-term" data-definition="Configuration Kibana qui decrit quels index lire et comment exposer leurs champs.">Data View</span>: contrat entre Kibana et les index

Actions:
- Stack Management -> Data Views -> Create
- Pattern: `shakespeare`
- Time field: none

Ce que cela change:
- Kibana connait les champs disponibles et leurs types
- Les menus Lens/Discover proposent les bons champs

Repere theorique:
- Data View = metadata de lecture, pas duplication des donnees

---

## <span class="glossary-term" data-definition="Ecran Kibana pour explorer les documents bruts et filtrer en KQL.">Discover</span>: lecture analytique des lignes

Actions concretes:
- Ajouter colonnes: `play_name`, `speaker`, `speech_number`, `text_entry`
- Trier par `speech_number` decroissant
- Sauvegarder une recherche "Shakespeare - controle qualite"

Exemples KQL:

```text
speaker: "HAMLET"
play_name: "Macbeth" and text_entry: "sleep"
play_name: "Romeo and Juliet" and text_entry: "sun"
```

Ce que fait le code (KQL):
- Traduit une intention analytique en filtre instantane
- Permet de valider la coherence des documents avant visualisation

---

## KQL vs DSL: quand utiliser quoi

- KQL: rapide pour l'exploration interactive
- DSL JSON: indispensable pour validation technique et partage precis

Exemple DSL equivalent a un filtre Discover:

```json
GET shakespeare/_search
{
  "query": {
    "bool": {
      "filter": [
        { "term": { "play_name": "Macbeth" } }
      ],
      "must": [
        { "match": { "text_entry": "sleep" } }
      ]
    }
  }
}
```

Repere theorique:
- Le DSL est la source de verite de ce que Kibana execute

---

## <span class="glossary-term" data-definition="Editeur de visualisations Kibana qui construit des aggregations via une interface graphique.">Lens</span> 1: volume de lignes par piece

Configuration Lens:
- Horizontal axis: `play_name`
- Metric: Count

Ce que cela represente:
- Repartition du corpus par oeuvre
- Base de comparaison entre pieces

Verification Dev Tools:

```json
GET shakespeare/_search
{
  "size": 0,
  "aggs": {
    "by_play": {
      "terms": { "field": "play_name" }
    }
  }
}
```

---

## Lens 2: top personnages

Objectif:
- Identifier les personnages les plus presents

Configuration:
- Horizontal axis: `speaker`
- Metric: Count
- Sort by: Desc
- Size: 10

Repere theorique:
- `terms` sur `keyword` permet un top-N stable

---

## Lens 3: formule (part de Macbeth)

Exemple de formule Lens:
- `count(kql='play_name: "Macbeth"') / count()`

Interet:
- Exprimer une proportion dans le visuel
- Evaluer rapidement le poids relatif d'une piece

Verification DSL (idee):
- `filter` agg sur Macbeth + total global

---

## Dashboard: composition et interactions

Structure conseillee:
- Panel 1: volume par piece
- Panel 2: top speakers
- Panel 3: distribution `speech_number`
- Panel 4: table des lignes full-text

Bonnes pratiques:
- Titre explicite oriente interpretation
- Filtres globaux epingles (pinned filters)
- Pas plus de 6-8 panels pour garder la lisibilite

---

## Exemples visuels: monitoring site web (style Kibana)

### Vue globale trafic + latence

![Kibana monitoring overview](assets/kibana-monitoring-overview.svg)

### Disponibilite et uptime

![Kibana monitoring uptime](assets/kibana-monitoring-uptime.svg)

### Performance applicative et erreurs

![Kibana monitoring performance](assets/kibana-monitoring-performance.svg)

---

## Controls et filtres globaux

Exemples de controls a ajouter:
- Dropdown sur `play_name`
- Dropdown sur `speaker`
- Range slider sur `speech_number`

Ce que cela apporte:
- Navigation analytique sans ecrire de requete
- Explorations comparatives rapides en demo

---

## <span class="glossary-term" data-definition="Fonction Kibana qui affiche la requete Elasticsearch exacte envoyee par un visuel.">Inspect</span> et validation technique

Dans Kibana:
- Sur un panel -> Inspect -> Requests
- Copier la requete envoyee
- Rejouer dans Dev Tools

Ce que cela garantit:
- Le graphique correspond bien a une requete attendue
- La narration analytique est techniquement verifiable

---

## Qualite, biais et interpretation

A verifier avant diffusion:
- Echantillon representatif du corpus complet
- Effets de tokenization bien compris sur le full-text
- Differences `match` vs `term` explicitees
- Perimetre de filtre clairement indique

Repere theorique:
- Une visualisation est une hypothese sur les donnees, pas une preuve automatique

---
