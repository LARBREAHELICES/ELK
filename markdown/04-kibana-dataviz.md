# Cours 4 - Kibana Dataviz
## De la requete a la lecture metier fiable

---

## Objectif du chapitre

- Comprendre precisement ce que Kibana fait (et ne fait pas)
- Construire des analyses lisibles dans Discover, Lens, Dashboard
- Savoir relier chaque visuel a une requete Elasticsearch
- Mettre en place des pratiques de qualite et de verification

---

## Reperes theoriques (moteur + interface)

- Kibana est une interface de requetage/visualisation, pas une base de donnees
- Elasticsearch execute les requetes et calcule les aggregations
- Un visuel Lens est une traduction UI d un DSL Elasticsearch
- Sans mapping coherent (`keyword`, numerique, date), un dashboard peut mentir

---

## Jeu de donnees de reference Titanic

```bash
curl -X PUT "http://localhost:9200/titanic_data" -H "Content-Type: application/json" -d '{
  "mappings": {
    "properties": {
      "survived":    { "type": "integer" },
      "sex":         { "type": "keyword" },
      "class":       { "type": "keyword" },
      "age":         { "type": "float" },
      "fare":        { "type": "float" },
      "embark_town": { "type": "keyword" }
    }
  }
}'
```

```bash
curl -X POST "http://localhost:9200/titanic_data/_bulk" -H "Content-Type: application/x-ndjson" -d '
{"index":{"_id":"1"}}
{"survived":1,"sex":"female","class":"First","age":38,"fare":71.2833,"embark_town":"Cherbourg"}
{"index":{"_id":"2"}}
{"survived":0,"sex":"male","class":"Third","age":22,"fare":7.25,"embark_town":"Southampton"}
{"index":{"_id":"3"}}
{"survived":1,"sex":"female","class":"Third","age":26,"fare":7.925,"embark_town":"Southampton"}
{"index":{"_id":"4"}}
{"survived":0,"sex":"male","class":"First","age":54,"fare":51.8625,"embark_town":"Southampton"}
'

curl -X POST "http://localhost:9200/titanic_data/_refresh"
curl "http://localhost:9200/titanic_data/_count?pretty"
```

Ce que fait le code:
- Cree un schema propre pour Kibana
- Charge un echantillon de donnees testable
- Garantit une demo reproductible pour Discover/Lens

---

## Data View: contrat entre Kibana et les index

Actions:
- Stack Management -> Data Views -> Create
- Pattern: `titanic_data`
- Time field: none (si pas de champ date)

Ce que cela change:
- Kibana connait les champs disponibles et leurs types
- Les menus Lens/Discover proposent les bons champs

Repere theorique:
- Data View = metadata de lecture, pas duplication des donnees

---

## Discover: lecture analytique des documents

Actions concretes:
- Ajouter colonnes: `class`, `sex`, `survived`, `age`, `fare`
- Trier par `fare` decroissant
- Sauvegarder une recherche "Titanic - controle qualite"

Exemples KQL:

```text
sex: "female" and survived: 1
class: "Third" and fare < 10
embark_town: "Southampton" and age >= 30
```

Ce que fait le code (KQL):
- Traduit une intention metier en filtre instantane
- Permet de valider la coherence des documents avant visualisation

---

## KQL vs DSL: quand utiliser quoi

- KQL: rapide pour l exploration interactive
- DSL JSON: indispensable pour validation technique et partage precise

Exemple DSL equivalent a un filtre Discover:

```json
GET titanic_data/_search
{
  "query": {
    "bool": {
      "filter": [
        { "term": { "sex": "female" } },
        { "range": { "fare": { "lt": 10 } } }
      ]
    }
  }
}
```

Repere theorique:
- Le DSL est la source de verite de ce que Kibana execute

---

## Lens 1: taux de survie par classe

Configuration Lens:
- Horizontal axis: `class`
- Metric: Average of `survived`
- Format metric: percent

Ce que cela represente:
- `avg(survived)` = taux de survie (car 0/1)

Verification Dev Tools:

```json
GET titanic_data/_search
{
  "size": 0,
  "aggs": {
    "by_class": {
      "terms": { "field": "class" },
      "aggs": {
        "survival_rate": { "avg": { "field": "survived" } }
      }
    }
  }
}
```

---

## Lens 2: segmentation plus fine

Objectif:
- Comprendre l effet combine `class x sex`

Configuration:
- Axis: `class`
- Breakdown: `sex`
- Metric: average `survived`
- Type: stacked bar

Repere theorique:
- Ajouter un breakdown revient a introduire un niveau d aggregation

---

## Lens 3: formule (part de population)

Exemple de formule Lens:
- `count(kql='sex: "female"') / count()`

Interet:
- Exprimer une proportion dans le visuel
- Eviter des calculs externes

Verification DSL (idee):
- `filter` agg sur femmes + `value_count` total

---

## Dashboard: composition et interactions

Structure conseillee:
- Panel 1: taux de survie par classe
- Panel 2: repartition par sexe
- Panel 3: histogramme des fares
- Panel 4: table des top embarquements

Bonnes pratiques:
- Titre explicite orientes decision
- Filtres globaux epingles (pinned filters)
- Pas plus de 6-8 panels pour garder la lisibilite

---

## Controls et filtres globaux

Exemples de controls a ajouter:
- Dropdown sur `class`
- Dropdown sur `sex`
- Range slider sur `fare`

Ce que cela apporte:
- Navigation metier sans ecrire de requete
- Explorations comparatives rapides en demo

---

## Inspect et validation technique

Dans Kibana:
- Sur un panel -> Inspect -> Requests
- Copier la requete envoyee
- Rejouer dans Dev Tools

Ce que cela garantit:
- Le graphique correspond bien a une requete attendue
- La narration metier est techniquement verifiable

---

## Qualite, biais et interpretation

A verifier avant diffusion:
- Taille d echantillon suffisante
- Valeurs manquantes explicitees
- Axes/units correctement formates
- Perimetre de filtre clairement indique

Repere theorique:
- Une visualisation est une hypothese sur les donnees, pas une preuve automatique

---

## Recap operationnel

- Tu sais preparer un Data View propre
- Tu sais analyser via Discover puis formaliser dans Lens
- Tu sais verifier chaque visuel via Inspect + Dev Tools
- Tu sais appliquer des regles de qualite analytique

Prochaine etape: industrialiser l ingestion avec Logstash.
