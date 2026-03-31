# Cours 2 - Comprendre Elasticsearch pas a pas avec Shakespeare
## Du vocabulaire fondamental aux requetes combinees

---

## Objectif du cours

A la fin, vous devez comprendre:

- ce qu'est un <span class="glossary-term" data-definition="Collection logique de documents JSON dans Elasticsearch.">index</span>
- ce qu'est un <span class="glossary-term" data-definition="Unite de donnees stockee dans un index, representee en JSON.">document</span>
- ce qu'est un <span class="glossary-term" data-definition="Propriete d'un document JSON, avec un type et un usage de recherche.">champ</span>
- la difference entre <span class="glossary-term" data-definition="Champ analyse pour la recherche plein texte.">`text`</span> et <span class="glossary-term" data-definition="Champ exact non analyse pour filtre, tri et aggregations.">`keyword`</span>
- pourquoi on utilise <span class="glossary-term" data-definition="Requete full-text basee sur l'analyse linguistique du texte.">`match`</span> pour le plein texte
- pourquoi on utilise <span class="glossary-term" data-definition="Requete de correspondance exacte sur une valeur indexee telle quelle.">`term`</span> pour la recherche exacte
- a quoi sert la <span class="glossary-term" data-definition="API d'ingestion en masse basee sur le format NDJSON (action + document).">Bulk API</span>
- comment combiner recherche textuelle et filtres structures

---

## Le probleme que resout Elasticsearch

Imaginons un gros corpus de citations litteraires.

Vous voulez pouvoir:

- retrouver les phrases qui parlent de `love`
- retrouver les phrases prononcees par `HAMLET`
- retrouver les phrases de `Othello` qui parlent d'amour
- classer les resultats par pertinence

Une base relationnelle peut aider, mais Elasticsearch est concu pour chercher efficacement dans du texte.

---

## Premiere idee: Elasticsearch travaille avec des documents JSON

Exemple de donnee:

```json
{
  "line_id": 2,
  "play_name": "Hamlet",
  "speech_number": 2,
  "line_number": "3.1.64",
  "speaker": "HAMLET",
  "text_entry": "To be, or not to be: that is the question."
}
```

A retenir:

- un document = un objet JSON
- un champ = une propriete du JSON
- un ensemble de documents = un index

---

## Vocabulaire fondamental

- Index: collection de documents (ex: `shakespeare`)
- Document: une unite d'information (une replique)
- Champ: attribut du document (`speaker`, `play_name`, `text_entry`, ...)

Modele metier simple:

- 1 citation = 1 document
- toutes les citations = 1 index

---

## Grande distinction: `text` vs `keyword`

- `text` = texte humain analyse
- `keyword` = valeur brute exacte

Exemples:

- `text_entry` doit etre en `text`
- `speaker` et `play_name` doivent etre en `keyword`

---

## Pourquoi `text_entry` doit etre en `text`

Parce que c'est le contenu litteraire recherche en langage naturel.

Requetes attendues:

- `question`
- `to be`
- `cursed spite`

Elasticsearch doit analyser le texte pour retrouver ces intentions.

---

## Pourquoi `speaker` et `play_name` doivent etre en `keyword`

Ces champs servent surtout de filtres exacts:

- `speaker = HAMLET`
- `play_name = Macbeth`

Ici on veut une egalite stricte, pas une recherche approximee.

---

## Le mapping

Le mapping definit les types des champs.

```json
PUT shakespeare
{
  "mappings": {
    "properties": {
      "line_id": { "type": "integer" },
      "play_name": { "type": "keyword" },
      "speech_number": { "type": "integer" },
      "line_number": { "type": "keyword" },
      "speaker": { "type": "keyword" },
      "text_entry": { "type": "text" }
    }
  }
}
```

---

## Ce que fait Elasticsearch sur un champ `text`

Lors de l'indexation d'une phrase, Elasticsearch la prepare pour la recherche:

- decoupage en tokens
- normalisation
- indexation optimisee

Exemple idee:

`To be, or not to be: that is the question.`

devient une suite de tokens exploitables (`to`, `be`, `question`, ...).

---

## Format des donnees pour Bulk API

Principe NDJSON (2 lignes par document):

1. ligne d'action
2. ligne de document

```json
{"index":{"_id":"1"}}
{"line_id":1,"play_name":"Hamlet","speaker":"BERNARDO","text_entry":"Whos there?"}
{"index":{"_id":"2"}}
{"line_id":2,"play_name":"Hamlet","speaker":"HAMLET","text_entry":"To be, or not to be: that is the question."}
```

---

## Pourquoi utiliser le Bulk API

Quand on a beaucoup de documents, on evite une requete HTTP par document.

Avantages:

- plus rapide
- plus realiste
- ideal pour un dataset de cours

---

## Charger les donnees Shakespeare

Option dataset complet:

```bash
curl -L "https://raw.githubusercontent.com/grokify/kibana-tutorial-go/refs/heads/master/shakespeare.json" \
  -o sandbox/data/shakespeare.json

curl -X PUT "http://localhost:9200/shakespeare" -H "Content-Type: application/json" -d '{
  "mappings": {
    "properties": {
      "line_id": { "type": "integer" },
      "play_name": { "type": "keyword" },
      "speech_number": { "type": "integer" },
      "line_number": { "type": "keyword" },
      "speaker": { "type": "keyword" },
      "text_entry": { "type": "text" }
    }
  }
}'

curl -X POST "http://localhost:9200/shakespeare/_bulk?pretty" \
  -H "Content-Type: application/x-ndjson" \
  --data-binary @sandbox/data/shakespeare.json

curl -X POST "http://localhost:9200/shakespeare/_refresh"
curl "http://localhost:9200/shakespeare/_count?pretty"
```

---

## Premiere requete: chercher dans le texte

On veut les citations liees a `question`.

```json
GET shakespeare/_search
{
  "query": {
    "match": {
      "text_entry": "question"
    }
  }
}
```

Pourquoi `match`?

- `text_entry` est un champ `text`
- `match` est fait pour le langage naturel

---

## Pourquoi ne pas utiliser `term` sur `text_entry`

Erreur classique debutant:

```json
GET shakespeare/_search
{
  "query": {
    "term": {
      "text_entry": "question"
    }
  }
}
```

Regle simple:

- `match` sur `text`
- `term` sur `keyword`

---

## Requete exacte sur un champ `keyword`

On veut toutes les citations de `HAMLET`.

```json
GET shakespeare/_search
{
  "query": {
    "term": {
      "speaker": "HAMLET"
    }
  }
}
```

Ici `term` est correct car `speaker` est un champ `keyword`.

---

## Filtre exact par piece

```json
GET shakespeare/_search
{
  "query": {
    "term": {
      "play_name": "Macbeth"
    }
  }
}
```

Resultat: uniquement des citations de `Macbeth`.

---

## Requete combinee avec `bool`

On veut les citations prononcees par HAMLET dans la piece Hamlet.

```json
GET shakespeare/_search
{
  "query": {
    "bool": {
      "must": [
        { "term": { "play_name": "Hamlet" } },
        { "term": { "speaker": "HAMLET" } }
      ]
    }
  }
}
```

Lecture logique: les deux conditions sont obligatoires.

---

## Combiner plein texte et filtre exact

On veut: citations qui parlent de `love`, seulement dans `Othello`.

```json
GET shakespeare/_search
{
  "query": {
    "bool": {
      "must": [
        { "match": { "text_entry": "love" } }
      ],
      "filter": [
        { "term": { "play_name": "Othello" } }
      ]
    }
  }
}
```

---

## Pourquoi separer `must` et `filter`

- `must`: participe a la pertinence textuelle
- `filter`: restreint le perimetre sans recalcul de score

Pedagogiquement: on separe la pertinence du texte et la contrainte metier.

---

## Le score `_score`

Avec `match`, Elasticsearch calcule un score de pertinence.

```json
GET shakespeare/_search
{
  "query": {
    "match": {
      "text_entry": "love"
    }
  }
}
```

Interpretation simple:

- plus `_score` est eleve, plus le document est juge pertinent.

---

## Ce que cela change par rapport a SQL

SQL renvoie surtout vrai/faux sur des conditions.

Elasticsearch renvoie aussi un ordre de pertinence.

C'est une difference de logique centrale pour la recherche.

---

## Trois familles d'usage sur ce dataset

1. Recherche textuelle (`match` sur `text_entry`)
2. Filtre exact (`term` sur `speaker` ou `play_name`)
3. Combinaison (`bool` avec `match` + `filter`)

---

## Plan pedagogique en 6 etapes

1. Comprendre index / document / champ
2. Lire un JSON concret
3. Distinguer `text` et `keyword`
4. Creer le mapping
5. Charger les donnees avec `_bulk`
6. Executer 3 requetes pivots (`match`, `term`, `bool`)

---

## Ce qu'un etudiant doit absolument retenir

- Un index contient des documents JSON
- Un document contient des champs
- `text` sert au plein texte
- `keyword` sert a l'exact
- `match` va avec `text`
- `term` va avec `keyword`
- `_bulk` charge vite beaucoup de documents

---

## Mini sequence d'exercices

Exercice 1:
- Creer l'index `shakespeare` avec le bon mapping

Exercice 2:
- Indexer les documents avec `_bulk`

Exercice 3:
- Retrouver la citation contenant `question`

Exercice 4:
- Retrouver tous les documents de `OTHELLO`

Exercice 5:
- Retrouver les citations de `Romeo and Juliet` qui parlent de `sun`

---

## Erreurs classiques a eviter

- Utiliser `term` sur `text_entry`
- Mettre `speaker` en `text` alors qu'on filtre exactement
- Indexer sans mapping explicite
- Confondre recherche plein texte et filtrage exact

---

## Synthese finale

Avec ce dataset Shakespeare:

- index = `shakespeare`
- document = une citation
- champs = `speaker`, `play_name`, `text_entry`, ...
- `text_entry` doit etre en `text`
- `speaker` et `play_name` doivent etre en `keyword`
- `match` pour le texte
- `term` pour l'exact
- `_bulk` pour charger vite
- `bool` pour combiner texte et filtres
