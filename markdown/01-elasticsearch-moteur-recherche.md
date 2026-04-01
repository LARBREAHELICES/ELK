# Cours 1 - Elasticsearch Introduction
## Comprendre ce que fait chaque requête

---

## Elasticsearch, c'est quoi concrètement

- <span class="glossary-term" data-definition="Moteur distribué de recherche et d'analyse qui indexé des données pour repondre vite a des requêtes texte et structurees.">Elasticsearch</span> est un moteur de recherche et d'analytics distribué
- Il stocke des <span class="glossary-term" data-definition="Objet JSON unitaire stocke dans un index Elasticsearch.">documents JSON</span> dans des <span class="glossary-term" data-definition="Collection logique de documents partageant un même schema general.">index</span>
- Il expose une <span class="glossary-term" data-definition="Interface HTTP qui permet d'interroger le moteur avec des requêtes JSON.">API REST</span> pour indexer, chercher, filtrer et agréger
- Il est optimisé pour la recherche <span class="glossary-term" data-definition="Recherche dans du langage naturel avec analyse du texte et classement par pertinence.">full-text</span> et les analytics quasi temps réel

---

## Base documentaire ou moteur de recherche

- Oui, Elasticsearch stocke des documents JSON
- Non, son objectif principal n'est pas de remplacer une base transactionnelle relationnelle
- Sa force principale: recherche pertinente, filtres rapides, aggregations et classement par score
- Bon modèle mental: base orientée recherche plutôt que base orientée transactions

---

## Repère historique rapide

- 2010: première version publique d'Elasticsearch
- 2012: création d Elastic autour de l'écosystème Elasticsearch
- Aujourd'hui: stack ELK très utilisée pour search applicatif, observabilité et analyse de logs

---

## Pourquoi les entreprises l'utilisent aujourd'hui

- Moteur de recherche produit (e commerce, catalogues, FAQ)
- Observabilite (logs, traces, métriques) avec dashboards Kibana
- Investigation sécurité (detection, correlation, analyse d événements)
- Recherche transverse dans des données hétérogènes via une API unique

---

## Exemple métier concret

Cas support client:

- On indexe chaque ticket en document JSON (`titre`, `description`, `priorité`, `service`, `date`)
- On cherche en full-text (`match` sur la description)
- On filtre par contrainte métier (`term` sur service, `range` sur date)
- On priorise les résultats par pertinence (`_score`) et urgence métier

---

## Objectif du cours

- Créer un index avec un mapping explicite
- Insérer des données de demo réutilisables
- Lire et expliquer le comportement des requêtes
- Comprendre les particularités moteur (analyse, score, filter context)

---

## Définitions précises à retenir

| Terme | Définition precise | Exemple |
| --- | --- | --- |
| `index` | Espace logique qui regroupe des documents partageant une même intention de recherche | `catalogue_demo` |
| `document` | Unité de donnée stockee en JSON | un produit avec `title`, `price`, `brand` |
| `champ` | Propriété d'un document, avec un type de mapping | `description` (text), `brand` (keyword) |
| `mapping` | Schéma qui définit le type et le comportement de chaque champ | `description: text`, `in_stock: boolean` |
| `query` | Expression JSON de recherche | `match`, `term`, `range`, `bool` |
| `analyzer` | Pipeline linguistique appliqué aux champs `text` et a la requête full-text | tokenizer + filtres |
| `token` | Unité textuelle issue de l'analyse | `bluetooth`, `casque` |
| `_score` | Valeur de pertinence relative pour classer les hits | doc A devant doc B pour une même requête |

---

## Exemple minimal relie aux définitions

Document indexé:

```json
{
  "title": "Casque audio bluetooth",
  "description": "Casque sans fil reduction de bruit",
  "brand": "Acme",
  "price": 99.9,
  "in_stock": true
}
```

Lecture:

- ce JSON est un document
- il vit dans un index (ex: `catalogue_demo`)
- `description` est un champ `text` (full-text)
- `brand` est un champ `keyword` (exact)

---

## Exemple de raisonnement avant écriture de requête

Question métier:

- retrouver des produits qui parlent de bluetooth
- limiter aux produits en stock

Traduction technique:

- besoin textuel -> `match` sur `description`
- besoin exact -> `term` sur `in_stock`
- combinaison logique -> `bool` avec `must` + `filter`

---


## Repères théoriques indispensables (moteur)

- Elasticsearch est un moteur de recherche distribué base sur <span class="glossary-term" data-definition="Bibliothèque de recherche plein texte utilisée comme cœur d'Elasticsearch.">Lucene</span>
- Les documents JSON sont indexés dans un index inverse (terme -> ids de documents)
- Le full-text passe par un pipeline d'analyse: tokenizer + filtres
- Le score de pertinence est basé sur <span class="glossary-term" data-definition="Algorithme de ranking par défaut qui estime la pertinence d'un document pour une requête.">BM25</span>
- `query` context calcule un score, `filter` context ne score pas et peut etre mis en cache
- Le moteur est near-real-time: les docs deviennent visibles après refresh

---

## Pourquoi l'index inverse est le cœur d'Elasticsearch

Dans une base classique, on parcourt souvent les lignes pour trouver une valeur.

Dans Elasticsearch, on construit plutôt une structure:

- terme -> liste des documents qui contiennent ce terme

Cette structure s'appelle l'index inverse.

---

## Exemple concret (3 documents)

Document `1`:

- `text_entry`: "to be or not to be"

Document `2`:

- `text_entry`: "be brave and bold"

Document `3`:

- `text_entry`: "not today"

---

## À quoi ressemble l'index inverse

Représentation simplifiée:

- `to` -> [1]
- `be` -> [1, 2]
- `or` -> [1]
- `not` -> [1, 3]
- `brave` -> [2]
- `bold` -> [2]
- `today` -> [3]

Idée cle:

- Elasticsearch ne cherche pas d'abord dans les documents
- il cherche d'abord dans la table des termes

---

## Ce qui se passe pendant une requête `match`

Requête:

```json
{
  "query": { "match": { "text_entry": "be not" } }
}
```

Exécution simplifiée:

- la requête est analysée en tokens (`be`, `not`)
- Elasticsearch lit rapidement les postings de l'index inverse
- il combine les listes de documents
- il calcule un score de pertinence (`_score`)

---

## Pourquoi c'est important pour la suite du cours

- `text` + `match`: logique linguistique via index inverse
- `keyword` + `term`: logique exacte via valeur brute
- Un bon mapping décide comment chaque champ sera indexé
- Donc la qualité de recherche dépend d'abord de l'indexation, ensuite de la requête

---

## Créer l'index et son schema

```bash
curl -X PUT "http://localhost:9200/catalogue_demo" -H "Content-Type: application/json" -d '{
  "settings": {
    "number_of_shards": 1,
    "number_of_replicas": 0
  },
  "mappings": {
    "properties": {
      "title":       { "type": "text" },
      "description": { "type": "text" },
      "brand":       { "type": "keyword" },
      "category":    { "type": "keyword" },
      "price":       { "type": "float" },
      "in_stock":    { "type": "boolean" }
    }
  }
}'
```

Ce que fait le code:
- Crée un index `catalogue_demo`
- Définit les types de champs (important pour les requêtes et performance)
- `text` sert a la recherche linguistique
- `keyword` sert au filtrage exact et aux aggregations

---

## Bulk API et NDJSON, c'est quoi exactement

`_bulk` permet d envoyer plusieurs operations en une seule requête HTTP.

Le corps n'est pas un JSON unique.
C'est du NDJSON (Newline Delimited JSON):

- 1 ligne JSON pour l'action (`index`, `create`, `update`, `delete`)
- 1 ligne JSON pour la source du document (sauf `delete`)
- puis on recommence pour chaque document

---

## Structure minimale attendue par `_bulk`

```ndjson
{"index":{"_index":"catalogue_demo","_id":"1"}}
{"title":"Casque audio bluetooth","brand":"Acme"}
{"index":{"_index":"catalogue_demo","_id":"2"}}
{"title":"Ecouteurs sport","brand":"Acme"}
```

Points obligatoires:

- header `Content-Type: application/x-ndjson`
- un retour à la ligne entre chaque objet
- une fin de fichier terminee par newline

---

## Pourquoi utiliser Bulk en pratique

- beaucoup plus rapide que 1 requête HTTP par document
- moins de surcharge reseau
- format standard pour charger un dataset de cours ou de preproduction

Erreurs frequentes:

- envoyer un tableau JSON `[{...},{...}]` au lieu de NDJSON
- oublier la ligne d action avant un document
- utiliser `application/json` au lieu de `application/x-ndjson`

---

## Insérer des données d'exemple (bulk NDJSON)

```bash
curl -X POST "http://localhost:9200/catalogue_demo/_bulk" -H "Content-Type: application/x-ndjson" -d '
{"index":{"_id":"1"}}
{"title":"Casque audio bluetooth","description":"Casque sans fil reduction de bruit","brand":"Acme","category":"audio","price":99.9,"in_stock":true}
{"index":{"_id":"2"}}
{"title":"Ecouteurs sport","description":"Ecouteurs bluetooth etanche","brand":"Acme","category":"audio","price":59.0,"in_stock":true}
{"index":{"_id":"3"}}
{"title":"Clavier mecanique","description":"Clavier gaming switch rouge","brand":"KeyPro","category":"informatique","price":129.0,"in_stock":false}
'
```

```bash
curl -X POST "http://localhost:9200/catalogue_demo/_refresh"
curl "http://localhost:9200/catalogue_demo/_count?pretty"
```

Ce que fait le code:
- Envoie 3 documents via `_bulk` (format NDJSON)
- Force un refresh pour rendre les docs visibles tout de suite
- Vérifie le nombre de documents indexés

---

## Recherche plein texte: ce que cela veut dire

Une recherche plein texte ne cherche pas une chaine exacte caractere par caractere.

Elle cherche des termes et leur pertinence dans du langage naturel.

Exemple intention utilisateur:

- "casque bluetooth"
- "casque sans fil"
- "bluetooth filaire" (requête imparfaite)

Le moteur doit quand même retrouver les documents les plus proches de l'intention.

---

## Comment Elasticsearch traite une recherche plein texte

Pipeline simplifie:

- analyser le texte indexé (au moment de l'indexation)
- analyser la requête utilisateur (au moment de la recherche)
- comparer les tokens dans l'index inverse
- classer les hits par `_score`

Donc la recherche plein texte dépend a la fois:

- du mapping (`text`)
- de l'analyse linguistique
- de la requête (`match`, `multi_match`, etc.)

---

## Voir concrètement les tokens avec `_analyze`

```bash
curl -X GET "http://localhost:9200/catalogue_demo/_analyze?pretty" -H "Content-Type: application/json" -d '{
  "field": "description",
  "text": "Casque sans fil bluetooth"
}'
```

Ce test montre la representation interne du texte en tokens.
Ces tokens sont la base réelle du matching full-text.

---

## Plein texte vs recherche exacte

- plein texte: champ `text` + requête `match`
- recherche exacte: champ `keyword` + requête `term`

Règle pratique:

- si vous cherchez une idée dans une phrase -> `match`
- si vous cherchez une valeur exacte (marque, code, statut) -> `term`

---

## Recherche full-text avec `match`: pas a pas

Requête de base:

```bash
curl -X GET "http://localhost:9200/catalogue_demo/_search?pretty" -H "Content-Type: application/json" -d '{
  "query": { "match": { "description": "bluetooth sans fil" } }
}'
```

---

## Ce que fait `match` en interne

`match` ne compare pas une phrase brute.
Le moteur suit ce pipeline:

- il analyse la requête (`bluetooth`, `sans`, `fil`)
- il lit l'index inverse du champ `description`
- il retrouve les documents qui contiennent ces termes
- il calcule un `_score` de pertinence (BM25)

Conclusion:

- `match` = recherche linguistique, pas égalité stricte

---

## Résultat attendu sur nos 3 documents

Avec les données de demo:

- doc 1 (`Casque sans fil reduction de bruit`) matche fort
- doc 2 (`Ecouteurs bluetooth etanche`) peut matcher partiellement
- doc 3 (clavier gaming) ne match pas

Pourquoi:

- par défaut, `match` utilise une logique OR (au moins un terme)
- plus il y a de termes utiles, plus le score monte

---

## Notion de score (`_score`): comment l interpréter

`_score` représente la pertinence estimee d'un document pour la requête courante.

Important:

- ce n'est pas un pourcentage
- ce n'est pas une note métier absolue
- c'est surtout une valeur relative pour trier les hits d'une même requête

---

## Pourquoi un document a un meilleur `_score`

BM25 favorise en general:

- un document qui contient plus de termes de la requête
- des termes plus discriminants dans le corpus
- une bonne densite de termes utiles dans le champ

Exemple d interpretation:

- doc A: `_score = 2.9` (deux termes très pertinents)
- doc B: `_score = 1.4` (un seul terme faible)

Ici A est classe avant B pour cette requête, sur cet index.

---

## Rendre la recherche plus stricte

Option 1: tous les termes doivent etre presents (`operator: and`)

```json
GET catalogue_demo/_search
{
  "query": {
    "match": {
      "description": {
        "query": "bluetooth sans fil",
        "operator": "and"
      }
    }
  }
}
```

Option 2: compromis avec `minimum_should_match`

```json
GET catalogue_demo/_search
{
  "query": {
    "match": {
      "description": {
        "query": "bluetooth sans fil",
        "minimum_should_match": "2"
      }
    }
  }
}
```

---

## Comment lire la réponse `match`

- `hits.total.value`: combien de documents correspondent
- `hits.hits[*]._score`: ordre de pertinence
- `hits.hits[*]._source.description`: texte qui a vraiment matche

Reflexe de debug:

- si trop de bruit, rendre la requête plus stricte (`operator`, `minimum_should_match`)
- si zero resultat, vérifier l analyseur et le contenu réel du champ

---

## Filtrage exact avec `term`

```bash
curl -X GET "http://localhost:9200/catalogue_demo/_search?pretty" -H "Content-Type: application/json" -d '{
  "query": { "term": { "brand": "Acme" } }
}'
```

Ce que fait le code:
- Filtre les docs dont `brand` vaut exactement `Acme`
- Fonctionne car `brand` est de type `keyword`

Repère théorique:
- `term` sur un champ `text` donne souvent des surprises
- Pour un filtre exact, utiliser un champ `keyword`

---

## Combiner texte + contraintes métier (`bool`)

```bash
curl -X GET "http://localhost:9200/catalogue_demo/_search?pretty" -H "Content-Type: application/json" -d '{
  "query": {
    "bool": {
      "must": [
        { "match": { "description": "bluetooth" } }
      ],
      "filter": [
        { "term": { "in_stock": true } },
        { "range": { "price": { "lte": 120 } } }
      ]
    }
  }
}'
```

Ce que fait le code:
- `must`: partie full-text qui influence `_score`
- `filter`: contraintes booleennes et numeriques sans impact sur le score
- Renvoie des résultats pertinents et filtrables en production

---

## `match` vs `must`: différence fondamentale

| Element | Role |
| --- | --- |
| `match` | type de requête full-text |
| `must` | operateur logique (condition obligatoire) |

Lecture simple:

- `match` dit comment chercher
- `must` dit si c'est obligatoire

---

## Exemple direct sans `bool`

```json
GET catalogue_demo/_search
{
  "query": {
    "match": {
      "description": "bluetooth"
    }
  }
}
```

Ici:

- `match` est la requête
- il n'y a pas encore de composition logique complexe

---

## Meme idée avec `bool` et `must`

```json
GET catalogue_demo/_search
{
  "query": {
    "bool": {
      "must": [
        { "match": { "description": "bluetooth" } }
      ]
    }
  }
}
```

Ici:

- `bool` construit la logique
- `must` impose une condition obligatoire
- `match` reste le mecanisme full-text

---

## Correspondance mentale SQL

| Elasticsearch | Idée SQL |
| --- | --- |
| `match` | LIKE / full-text |
| `term` | `=` |
| `must` | AND |
| `should` | OR (avec bonus de pertinence) |
| `filter` | WHERE exact (sans score) |

Cette table est une analogie pedagogique utile, pas une equivalence parfaite.

---

## Ce que `must` peut contenir

`must` ne recherche pas par lui-même.
Il peut contenir plusieurs types de requêtes:

- `match` (texte)
- `term` (exact)
- `range` (intervalle)

Exemple:

```json
GET catalogue_demo/_search
{
  "query": {
    "bool": {
      "must": [
        { "match": { "description": "bluetooth" } },
        { "range": { "price": { "lte": 100 } } }
      ]
    }
  }
}
```

---

## Schéma mental à retenir

```text
query
 └── bool
      ├── must
      │     ├── match
      │     ├── term
      │     └── range
      ├── filter
      └── should
```

Idée cle:

- `bool/must/filter/should` = logique
- `match/term/range` = types de requêtes

---

## Exemple complet (`must` + `filter` + `should`)

```json
GET catalogue_demo/_search
{
  "query": {
    "bool": {
      "must": [
        { "match": { "description": "bluetooth casque" } }
      ],
      "filter": [
        { "term": { "in_stock": true } },
        { "range": { "price": { "lte": 150 } } }
      ],
      "should": [
        { "term": { "brand": "Acme" } }
      ]
    }
  }
}
```

Lecture:

- `must`: la recherche texte est obligatoire
- `filter`: les contraintes métier sont obligatoires
- `should`: bonus de ranking si la marque correspond

---

## Phrase de reference

`match` est une requête.
`must` est une condition logique.

---

## Piloter la pertinence (boost de champ)

```bash
curl -X GET "http://localhost:9200/catalogue_demo/_search?pretty" -H "Content-Type: application/json" -d '{
  "query": {
    "multi_match": {
      "query": "bluetooth",
      "fields": ["title^3", "description"]
    }
  }
}'
```

Ce que fait le code:
- Cherche le terme sur plusieurs champs
- Donne 3x plus de poids a `title` qu'a `description`

Repère théorique:
- `_score` sert a ordonner des résultats relatifs a une requête
- Le boost est un levier métier pour contrôler le ranking

---

## Tolerance aux fautes (`fuzziness`)

```bash
curl -X GET "http://localhost:9200/catalogue_demo/_search?pretty" -H "Content-Type: application/json" -d '{
  "query": {
    "match": {
      "title": {
        "query": "bluetoth",
        "fuzziness": "AUTO"
      }
    }
  }
}'
```

Ce que fait le code:
- Accepte des variations orthographiques proches
- Utile pour barre de recherche utilisateur

Repère théorique:
- `fuzziness` s'appuie sur la distance d'edition (Levenshtein)
- A utiliser avec contrôle (précision/performance)

---

## Facettes et stats avec aggregations

```bash
curl -X GET "http://localhost:9200/catalogue_demo/_search?pretty" -H "Content-Type: application/json" -d '{
  "size": 0,
  "aggs": {
    "brands":    { "terms": { "field": "brand" } },
    "avg_price": { "avg":   { "field": "price" } }
  }
}'
```

Ce que fait le code:
- `size: 0` ignore les hits, renvoie uniquement les agregations
- `terms` construit une facette par marque
- `avg` calcule une metrique (prix moyen)

Repère théorique:
- Les aggregations s'appuient surtout sur des champs `keyword` ou numeriques
- Elles servent a construire filtres UI, dashboards, analytics

---

## Lecture de réponse: quoi regarder en premier

- `hits.total.value`: volume total de résultats
- `hits.hits[*]._source`: documents retournes
- `hits.hits[*]._score`: ordre de pertinence
- `aggregations`: données de facettes/statistiques
- `took`: temps d'execution cote moteur (ms)

---
