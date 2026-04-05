# Exercice 1 — Mapping et types de champs

## Objectif

Comprendre l’importance du mapping et des types `text`, `keyword`, `integer`.

## Travail

Créez un nouvel index `shakespeare_extended` avec le mapping suivant :

```json
PUT shakespeare_extended
{
  "mappings": {
    "properties": {
      "play_name": { "type": "keyword" },
      "speaker": { "type": "keyword" },
      "text_entry": { "type": "text" },
      "act": { "type": "integer" },
      "scene": { "type": "integer" },
      "year": { "type": "integer" }
    }
  }
}
```

Ajoutez ensuite les documents suivants :

```json
PUT shakespeare_extended/_doc/1
{
  "play_name": "Hamlet",
  "speaker": "HAMLET",
  "text_entry": "To be or not to be",
  "act": 3,
  "scene": 1,
  "year": 1603
}
```

```json
PUT shakespeare_extended/_doc/2
{
  "play_name": "Macbeth",
  "speaker": "MACBETH",
  "text_entry": "Is this a dagger which I see before me",
  "act": 2,
  "scene": 1,
  "year": 1606
}
```

```json
PUT shakespeare_extended/_doc/3
{
  "play_name": "Othello",
  "speaker": "OTHELLO",
  "text_entry": "One that loved not wisely but too well",
  "act": 5,
  "scene": 2,
  "year": 1604
}
```

### Questions

1. Quels champs sont de type `text` ?
2. Quels champs sont de type `keyword` ?
3. Quels champs sont numériques ?
4. Quelle requête faut-il utiliser pour chercher un mot dans `text_entry` ?
5. Quelle requête faut-il utiliser pour filtrer `play_name` ?

---

# Exercice 2 — match et pertinence (score)

## Objectif

Comprendre comment Elasticsearch classe les résultats.

Ajoutez ces documents :

```json
PUT shakespeare_extended/_doc/4
{
  "play_name": "Hamlet",
  "speaker": "HAMLET",
  "text_entry": "To be or not to be that is the question",
  "act": 3,
  "scene": 1,
  "year": 1603
}
```

```json
PUT shakespeare_extended/_doc/5
{
  "play_name": "Hamlet",
  "speaker": "HAMLET",
  "text_entry": "To be a king",
  "act": 4,
  "scene": 2,
  "year": 1603
}
```

Faites la requête :

```json
GET shakespeare_extended/_search
{
  "query": {
    "match": {
      "text_entry": "to be question"
    }
  }
}
```

### Questions

1. Quel document apparaît en premier ?
2. Pourquoi ?
3. Quel document contient le plus de mots recherchés ?
4. Que représente `_score` ?

---

# Exercice 3 — bool : must + filter

## Objectif

Comprendre la différence entre chercher et filtrer.

Faites la requête :

> Trouver les textes contenant "be" mais seulement dans Hamlet.

```json
GET shakespeare_extended/_search
{
  "query": {
    "bool": {
      "must": [
        { "match": { "text_entry": "be" } }
      ],
      "filter": [
        { "term": { "play_name": "Hamlet" } }
      ]
    }
  }
}
```

### Questions

1. Quel est le rôle de `must` ?
2. Quel est le rôle de `filter` ?
3. Est-ce que `filter` change le score ?

---

# Exercice 4 — bool : should (OR logique)

## Objectif

Comprendre `should`.

> Trouver les textes contenant "love" prononcés par Hamlet ou Othello.

```json
GET shakespeare_extended/_search
{
  "query": {
    "bool": {
      "must": [
        { "match": { "text_entry": "love" } }
      ],
      "should": [
        { "term": { "speaker": "HAMLET" } },
        { "term": { "speaker": "OTHELLO" } }
      ],
      "minimum_should_match": 1
    }
  }
}
```

### Questions

1. À quoi correspond `should` ?
2. Que signifie `minimum_should_match: 1` ?
3. Que se passe-t-il si on met `minimum_should_match: 2` ?

---

# Exercice 5 — range (requête sur nombres)

## Objectif

Utiliser un filtre sur un champ numérique.

> Trouver les pièces écrites entre 1603 et 1605.

```json
GET shakespeare_extended/_search
{
  "query": {
    "range": {
      "year": {
        "gte": 1603,
        "lte": 1605
      }
    }
  }
}
```

### Questions

1. Que signifie `gte` ?
2. Que signifie `lte` ?
3. Quelle pièce est la plus ancienne ?
4. Quelle pièce est la plus récente ?

---

# Exercice 6 — Tokens et _analyze

## Objectif

Comprendre comment Elasticsearch découpe le texte.

Utilisez :

```json
POST shakespeare_extended/_analyze
{
  "field": "text_entry",
  "text": "To be or not to be that is the question"
}
```

### Questions

1. Quels sont les tokens ?
2. Pourquoi certains mots disparaissent ?
3. Quand Elasticsearch crée ces tokens ?
4. Quand Elasticsearch utilise ces tokens ?

---

# Exercice 7 — Requête complète (niveau technique)

> Trouver les textes contenant "be", seulement dans Hamlet, écrits après 1600, et favoriser ceux prononcés par HAMLET.

```json
GET shakespeare_extended/_search
{
  "query": {
    "bool": {
      "must": [
        { "match": { "text_entry": "be" } }
      ],
      "filter": [
        { "term": { "play_name": "Hamlet" } },
        { "range": { "year": { "gte": 1600 } } }
      ],
      "should": [
        { "term": { "speaker": "HAMLET" } }
      ]
    }
  }
}
```

### Questions

Identifier :

* la partie recherche
* la partie filtre
* la partie score

---

# Exercice final — Compréhension globale

Expliquez avec vos mots la différence entre :

| Élément       | Rôle |
| ------------- | ---- |
| match         |      |
| term          |      |
| must          |      |
| filter        |      |
| should        |      |
| tokens        |      |
| index inversé |      |

---

# Objectif pédagogique global

À la fin, les étudiants doivent comprendre :

```text
Document JSON
      ↓
Mapping
      ↓
Analyzer
      ↓
Tokens
      ↓
Index inversé
      ↓
match / term
      ↓
bool
      ↓
Résultats + score
```

Si un étudiant comprend ce schéma, il a compris Elasticsearch.
