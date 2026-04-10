# QCM ELK — Couverture complète des supports

## A) Fondamentaux ELK, architecture, setup

### Q1
Quel composant transforme et nettoie les données avant indexation ?
A. Kibana
B. Logstash
C. Jupyter
D. Lucene
Réponse: B


### Q2
Dans ELK, quelle brique stocke et indexe les documents JSON ?
A. Kibana
B. Filebeat
C. Elasticsearch
D. Logstash
Réponse: C


### Q3
Quel est le bon enchaînement logique du pipeline ?
A. Kibana -> Elasticsearch -> Logstash
B. Source -> Logstash -> Elasticsearch -> Kibana
C. Source -> Kibana -> Logstash -> Elasticsearch
D. Logstash -> Source -> Elasticsearch -> Kibana
Réponse: B


### Q4
Dans un notebook Jupyter lancé en Docker, l'URL recommandée pour joindre Elasticsearch est souvent :
A. `http://localhost:9200`
B. `http://127.0.0.1:5601`
C. `http://elasticsearch:9200`
D. `http://logstash:9200`
Réponse: C


### Q5
Pourquoi créer un mapping explicite est une bonne pratique ?
A. Pour éviter tout index
B. Pour contrôler les types et la qualité des requêtes
C. Pour remplacer Kibana
D. Pour supprimer les analyzers
Réponse: B


### Q6
`index`, `document`, `mapping` correspondent le mieux à :
A. table, ligne, trigger SQL
B. schéma, vue, fonction SQL
C. base logique, objet JSON, schéma de champs
D. cluster, shard, replica
Réponse: C


### Q7
Quel endpoint vérifie rapidement la présence d'un index ?
A. `GET _cat/indices?v`
B. `GET _cluster/stats` uniquement
C. `GET _nodes/hot_threads`
D. `POST _refresh`
Réponse: A


### Q8
La commande la plus adaptée pour démarrer les conteneurs du cours :
A. `docker run elk`
B. `docker compose up -d`
C. `docker start compose`
D. `docker kubernetes up`
Réponse: B


---

## B) Mapping, types, analyzers

### Q9
Un champ `text` sert principalement à :
A. l'agrégation exacte
B. la recherche full-text analysée
C. stocker des dates
D. des filtres stricts seulement
Réponse: B


### Q10
Un champ `keyword` sert principalement à :
A. la recherche fuzzy uniquement
B. les filtres exacts, tris et agrégations
C. découper du texte en tokens
D. calculer des embeddings
Réponse: B


### Q11
La règle la plus sûre est :
A. `text -> term`
B. `keyword -> match`
C. `text -> match` et `keyword -> term`
D. `text -> wildcard` uniquement
Réponse: C


### Q12
Le mapping dynamique signifie :
A. Elasticsearch refuse les nouveaux champs
B. Elasticsearch déduit automatiquement les types
C. tous les champs deviennent `keyword`
D. aucun champ n'est indexé
Réponse: B


### Q13
Quel est le rôle d'un analyzer ?
A. Chiffrer les documents
B. Transformer le texte en tokens indexables/recherchables
C. Convertir JSON en CSV
D. Créer des dashboards
Réponse: B


### Q14
La chaîne d'analyse correcte est :
A. filter -> tokenizer -> analyzer
B. tokenizer -> filters
C. filters -> tokenizer
D. shard -> analyzer
Réponse: B


### Q15
`_analyze` permet surtout de :
A. supprimer un index
B. visualiser les tokens produits
C. voir les shards
D. créer un data view
Réponse: B


### Q16
Le filtre `asciifolding` sert à :
A. supprimer les stopwords
B. enlever les accents
C. faire du stemming
D. corriger les dates
Réponse: B


### Q17
`edge_ngram` est utile surtout pour :
A. agrégations numériques
B. autocomplétion/préfixes
C. géolocalisation
D. déduplication
Réponse: B


### Q18
Dans `multi_match`, `title^3` signifie :
A. diviser le score par 3
B. booster le champ `title`
C. chercher uniquement dans `title`
D. indexer 3 fois le titre
Réponse: B


---

## C) Query DSL (match, term, bool, range, multi_match)

### Q19
`match` est recommandé pour :
A. les IDs exacts
B. les champs `text`
C. les champs `keyword` stricts uniquement
D. les dates uniquement
Réponse: B


### Q20
`term` est recommandé pour :
A. les champs `keyword`
B. les champs `text` analysés en priorité
C. les champs `nested` seulement
D. les scripts Painless
Réponse: A


### Q21
Dans une requête `bool`, `filter` sert surtout à :
A. influencer fortement le score
B. filtrer sans scoring
C. créer des tokens
D. remplacer `must_not`
Réponse: B


### Q22
`must_not` sert à :
A. booster un résultat
B. exclure des documents
C. faire des agrégations
D. trier
Réponse: B


### Q23
`should` dans `bool` sert principalement à :
A. exclure des résultats
B. rendre des clauses optionnelles/bonus de score
C. remplacer `_source`
D. désactiver BM25
Réponse: B


### Q24
`range` est la requête adaptée pour :
A. intervalle numérique ou date
B. texte libre
C. autocomplétion
D. nested obligatoire
Réponse: A


### Q25
`multi_match` est utile quand :
A. on cherche sur plusieurs champs textuels
B. on filtre un booléen
C. on fait une suppression
D. on crée un mapping
Réponse: A


### Q26
Combinaison la plus correcte pour "texte + filtre exact" :
A. `bool` avec `must: match` et `filter: term`
B. `term` partout
C. `match` partout sur keyword
D. `range` uniquement
Réponse: A


---

## D) Requêtes — fonctionne ou pas

### Q27 (Requête)
```json
GET shakespeare/_search
{
  "query": {
    "match": { "text_entry": "question" }
  }
}
```
A. Ne fonctionne pas (erreur syntaxe)
B. Fonctionne et est pertinente
C. Fonctionne mais uniquement sur `keyword`
D. Ne fonctionne que sur Kibana Lens
Réponse: B


### Q28 (Requête)
```json
GET shakespeare/_search
{
  "query": {
    "term": { "speaker.keyword": "HAMLET" }
  }
}
```
A. Fonctionne et est pertinente
B. Erreur de syntaxe
C. Fonctionne seulement si `speaker` est `text`
D. Ne fonctionne que avec `must`
Réponse: A


### Q29 (Requête)
```json
GET shakespeare/_search
{
  "query": {
    "term": { "text_entry": "question" }
  }
}
```
A. Erreur syntaxique
B. Fonctionne et généralement pertinent pour full-text
C. Peut fonctionner syntaxiquement mais souvent non pertinent
D. Fonctionne uniquement avec `size:0`
Réponse: C


### Q30 (Requête)
```json
GET shakespeare/_search
{
  "query": {
    "bool": {
      "must": [
        { "match": { "text_entry": "love" } }
      ],
      "filter": [
        { "term": { "speaker.keyword": "HAMLET" } }
      ]
    }
  }
}
```
A. Erreur syntaxique
B. Fonctionne et combinaison recommandée
C. Ne fonctionne pas car `filter` interdit
D. Fonctionne mais ignore `must`
Réponse: B


### Q31 (Requête)
```json
GET shakespeare/_search
{
  "query": {
    "range": {
      "year": { "gte": 1600, "lte": 1610 }
    }
  }
}
```
A. Fonctionne si `year` est numérique/date
B. Ne fonctionne jamais
C. Fonctionne uniquement avec `match`
D. Syntaxe invalide
Réponse: A


### Q32 (Requête)
```json
GET shakespeare/_search
{
  "query": {
    "multi_match": {
      "query": "hamlet question",
      "fields": ["title^3", "text_entry"]
    }
  }
}
```
A. Erreur: `^` interdit
B. Fonctionne et booste `title`
C. Fonctionne mais `fields` est ignoré
D. Ne fonctionne que sur `keyword`
Réponse: B


### Q33 (Requête)
```json
GET shakespeare/_search
{
  "query": {
    "bool": {
      "must_not": [
        { "term": { "speaker.keyword": "HAMLET" } }
      ]
    }
  }
}
```
A. Erreur syntaxe
B. Fonctionne, exclut HAMLET
C. Fonctionne seulement si `speaker` est date
D. Ignore `must_not`
Réponse: B


### Q34 (Requête)
```json
GET shakespeare/_search
{
  "query": {
    "bool": {
      "filter": [
        { "term": { "speaker": "HAMLET" } }
      ]
    }
  }
}
```
A. Toujours erreur
B. Toujours parfait
C. Peut fonctionner syntaxiquement mais champ souvent mal ciblé
D. Ne fonctionne que avec `must`
Réponse: C


### Q35 (Requête)
```json
GET shakespeare/_search
{
  "query": {
    "bool": {
      "must": "text_entry:king"
    }
  }
}
```
A. Erreur: `must` attend une requête, pas une chaîne de caractères
B. Fonctionne forcément partout
C. Ne fonctionne que en SQL
D. Fonctionne mais supprime le score
Réponse: A


### Q36 (Requête)
```json
GET shakespeare/_search
{
  "query": {
    "term": {
      "speaker.keyword": {
        "value": "hamlet",
        "case_insensitive": true
      }
    }
  }
}
```
A. Fonctionne (version compatible) et gère la casse
B. Ne fonctionne jamais
C. Fonctionne seulement sur `text_entry`
D. Erreur car `value` interdit
Réponse: A


---

## E) Agrégations, histogrammes, runtime fields

### Q37
Pour ne retourner que les agrégations sans hits documents :
A. `size: 1000`
B. `size: 0`
C. `track_total_hits: false`
D. `_source: false` uniquement
Réponse: B


### Q38
`terms` aggregation sert à :
A. découper le texte en tokens
B. grouper par valeur (type GROUP BY)
C. calculer des embeddings
D. corriger les dates
Réponse: B


### Q39
Sur un champ textuel, l'agrégation la plus fiable utilise souvent :
A. `field: text_entry`
B. `field: text_entry.keyword`
C. `field: text_entry.ngram`
D. `field: _source`
Réponse: B


### Q40
`avg`, `min`, `max`, `sum`, `stats` sont des :
A. bucket aggregations
B. metric aggregations
C. token filters
D. query types booléennes
Réponse: B


### Q41
`histogram` sert à :
A. buckets numériques par intervalle
B. filtre exact
C. autocomplétion
D. suppression d'index
Réponse: A


### Q42
`date_histogram` sert à :
A. agrégation temporelle par intervalle de date
B. stemmer les dates
C. trier uniquement
D. parser CSV
Réponse: A


### Q43
Avec `runtime_mappings`, `emit(...)` sert à :
A. supprimer un champ
B. émettre une valeur calculée à la volée
C. indexer définitivement la valeur
D. créer un shard
Réponse: B


### Q44
Les runtime fields sont surtout pratiques pour :
A. exploration rapide et prototypage
B. remplacer toute stratégie d'indexation en prod volumique
C. éviter toute agrégation
D. remplacer Logstash
Réponse: A


---

## F) Logstash (pipeline, nettoyage, sincedb)

### Q45
Structure logique d'un pipeline Logstash :
A. filter -> output -> input
B. input -> filter -> output
C. output -> input -> filter
D. input -> output -> filter
Réponse: B


### Q46
Dans `input { file { ... } }`, `start_position => "beginning"` sert à :
A. lire depuis la fin
B. lire depuis le début au premier passage
C. supprimer sincedb
D. créer un mapping
Réponse: B


### Q47
`sincedb` sert à :
A. stocker les mappings ES
B. mémoriser la position de lecture du fichier
C. stocker les dashboards
D. calculer les agrégations
Réponse: B


### Q48
En TP, mettre `sincedb_path => "/dev/null"` permet surtout de :
A. rejouer facilement le fichier
B. augmenter le score BM25
C. empêcher toute ingestion
D. activer Kibana
Réponse: A


### Q49
Filtre Logstash pour parser un CSV :
A. `json {}`
B. `csv {}`
C. `xml {}`
D. `kv {}`
Réponse: B


### Q50
`mutate { convert => { "vote_count" => "integer" } }` sert à :
A. supprimer le champ
B. typer correctement le champ
C. créer un index pattern
D. trier les documents
Réponse: B


### Q51
`date { match => ["released_at", "yyyy-MM-dd"] target => "@timestamp" }` sert à :
A. convertir une date texte en timestamp
B. créer une agrégation date_histogram
C. extraire des keywords
D. faire du stemming
Réponse: A


### Q52
`stdout { codec => rubydebug }` sert à :
A. visualiser l'événement transformé dans les logs
B. indexer dans Elasticsearch
C. créer des dashboards
D. lancer Kibana
Réponse: A


---

## G) Kibana (Data View, Lens, dashboard)

### Q53
Avant de créer un Data View Kibana, il faut :
A. créer un dashboard
B. que l'index existe dans Elasticsearch
C. configurer Logstash monitoring
D. créer un watcher
Réponse: B


### Q54
Le `time field` d'un Data View est important pour :
A. les visualisations temporelles et filtre global de temps
B. le mapping dynamique
C. l'autocomplétion uniquement
D. les requêtes SQL uniquement
Réponse: A


### Q55
Lens est principalement :
A. un parseur CSV
B. un éditeur de visualisations drag-and-drop
C. un moteur d'indexation
D. un plugin Logstash
Réponse: B


### Q56
Dans Kibana, pour créer plusieurs graphiques distincts sur le même jeu de données :
A. impossible
B. créer plusieurs visualisations puis les regrouper dans un dashboard
C. il faut un index différent par graphique
D. il faut un cluster différent
Réponse: B


### Q57
Le Data View ne :
A. crée pas automatiquement l'index Elasticsearch
B. remplace Logstash
C. remplace un mapping
D. stocke les documents
Réponse: A


### Q58
Un bon dashboard final doit :
A. contenir des graphes sans titre
B. répondre à des questions métier claires
C. éviter toute agrégation
D. utiliser un seul type de graphe
Réponse: B

