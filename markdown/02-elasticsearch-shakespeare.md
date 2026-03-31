# Cours 2 - Elasticsearch avec Shakespeare
## Du jeu de donnees classique aux requetes full-text explicables

---

## Objectif du chapitre

- Construire un index full-text propre pour les lignes de Shakespeare
- Importer un echantillon reproductible
- Executer des requetes metier et comprendre leur resultat
- Relier chaque requete a un repere theorique moteur

---

## Reperes theoriques (full-text)

- Le champ `text_entry` doit etre en `text` pour la recherche linguistique
- Les dimensions d analyse (`play_name`, `speaker`) doivent etre en `keyword`
- Les champs numeriques (`line_id`, `speech_number`) servent aux tris et agregations
- Elasticsearch est near-real-time: utiliser `_refresh` pour les demos

---

## Source de donnees (cours)

Jeu de donnees cible:
- Shakespeare (jeu classique de demo Elasticsearch)
- Source full dataset: `https://raw.githubusercontent.com/grokify/kibana-tutorial-go/refs/heads/master/shakespeare.json`

Pour les demos rapides en cours:
- Echantillon local: `sandbox/data/shakespeare_sample.ndjson`

---

## Creer l index Shakespeare

```bash
curl -X PUT "http://localhost:9200/shakespeare" -H "Content-Type: application/json" -d '{
  "settings": {
    "number_of_shards": 1,
    "number_of_replicas": 0
  },
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

Ce que fait le code:
- Cree un index dedie au corpus Shakespeare
- Separe champs full-text et champs de filtrage exact
- Prepare les analyses lexicales et analytiques

---

## Inserer un mini echantillon reproductible

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
- Charge l echantillon NDJSON
- Force la visibilite immediate via `_refresh`
- Verifie la quantite chargee

---

## Requete metier 1: retrouver une intention textuelle

```bash
curl -X GET "http://localhost:9200/shakespeare/_search?pretty" -H "Content-Type: application/json" -d '{
  "query": {
    "match": {
      "text_entry": "question"
    }
  }
}'
```

Ce que fait le code:
- Analyse linguistiquement le terme de recherche
- Retourne les lignes les plus proches semantiquement

Repere theorique:
- `match` applique l analyseur du champ `text_entry`
- Le resultat est trie par `_score`

---

## Requete metier 2: full-text + filtre piece

```bash
curl -X GET "http://localhost:9200/shakespeare/_search?pretty" -H "Content-Type: application/json" -d '{
  "query": {
    "bool": {
      "must": [
        { "match": { "text_entry": "sleep" } }
      ],
      "filter": [
        { "term": { "play_name": "Macbeth" } }
      ]
    }
  }
}'
```

Ce que fait le code:
- `must`: recherche textuelle dans les lignes
- `filter`: restreint a une piece sans affecter le score

---

## Requete metier 3: tolerance aux fautes

```bash
curl -X GET "http://localhost:9200/shakespeare/_search?pretty" -H "Content-Type: application/json" -d '{
  "query": {
    "match": {
      "text_entry": {
        "query": "queston",
        "fuzziness": "AUTO"
      }
    }
  }
}'
```

Ce que fait le code:
- Recupere aussi des variantes orthographiques proches
- Ameliore la robustesse des recherches utilisateur

---

## Aggregations metier Shakespeare

```bash
curl -X GET "http://localhost:9200/shakespeare/_search?pretty" -H "Content-Type: application/json" -d '{
  "size": 0,
  "aggs": {
    "by_play": {
      "terms": { "field": "play_name" }
    },
    "top_speakers": {
      "terms": { "field": "speaker", "size": 5 }
    },
    "avg_speech_number": {
      "avg": { "field": "speech_number" }
    }
  }
}'
```

Ce que fait le code:
- Mesure la repartition des lignes par piece
- Identifie les personnages les plus presents
- Produit un indicateur numerique global

---

## Controle qualite technique

```bash
curl "http://localhost:9200/_cat/indices?v"
curl "http://localhost:9200/shakespeare/_mapping?pretty"
curl "http://localhost:9200/shakespeare/_search?size=3&pretty"
```

Ce que fait le code:
- Controle l etat de l index
- Verifie les types reels du mapping
- Echantillonne des docs pour valider le format

---

## Recap operationnel

- Tu sais creer un index full-text sur un corpus classique
- Tu sais injecter un echantillon reproductible et l interroger
- Tu sais combiner scoring textuel + filtres exacts
- Tu sais produire des aggregations utiles a l interpretation

Prochaine etape: optimisation avancee (pertinence, profiling, alias).
