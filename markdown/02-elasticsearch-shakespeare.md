
# Les requêtes Elasticsearch

## Structure d'une requête

Dans Elasticsearch, toutes les recherches se font avec `_search`.

Structure générale :

```json
GET shakespeare/_search
{
  "query": {
    ...
  }
}
```

> Dans Elasticsearch, on recherche toujours avec `_search` et une requête dans `query`.

---

#  Rappel : match vs term

On a deux types de recherche :

| Requête | Utilisation             |
| ------- | ----------------------- |
| match   | recherche dans un texte |
| term    | recherche exacte        |

### Exemple match

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

Ici Elasticsearch cherche le mot **question** dans le texte.

1. Elasticsearch reçoit "question"
2. Il passe "question" dans l'analyzer
3. Il obtient un token : "question"
4. Il cherche ce token dans l'index inversé
5. Il trouve les documents
6. Il calcule le score
7. Il renvoie les résultats

---

## Exercice 

L'objectif de cet exercice est de comprendre pourquoi Elasticsearch utilise des tokens et pourquoi la requête match est adaptée pour la recherche dans du texte.

1. Ajouter de nouvelles données.
1. Utilisez la commande _analyze pour voir les tokens générés pour la phrase: `To be or not to be`
1. Faites une recherche avec `match` puis avec `term` et comparer.
1. Concluez 

---

Remarque sur les méthodes d'ajout

| Action              | URL            | Méthode |
| ------------------- | -------------- | ------- |
| Ajouter doc avec id | /index/_doc/1  | PUT     |
| Ajouter doc sans id | /index/_doc    | POST    |
| Lire doc            | /index/_doc/1  | GET     |
| Rechercher          | /index/_search | GET     |


---

### Exemple term

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

Ici Elasticsearch cherche exactement **HAMLET**.

---

# La requête bool - important 

Structure :

```json
{
  "query": {
    "bool": {
      "must": [],
      "filter": [],
      "should": [],
      "must_not": []
    }
  }
}
```

| Élément  | Signification     |
| -------- | ----------------- |
| must     | AND               |
| should   | OR                |
| must_not | NOT               |
| filter   | filtre sans score |


> La requête bool permet de combiner plusieurs conditions.

> Dans Elasticsearch, `must` calcule un score de pertinence (à quel point le document correspond à la recherche), alors que filter sert seulement à limiter les résultats sans changer le score.

---

# must = AND

Exemple :

> On veut les phrases avec "be" prononcées par Hamlet.

```json
GET shakespeare/_search
{
  "query": {
    "bool": {
      "must": [
        { "match": { "text_entry": "be" } },
        { "term": { "speaker": "HAMLET" } }
      ]
    }
  }
}
```

Traduction logique :

```text
text contient "be"
AND speaker = HAMLET
```

---

# should = OR

Exemple :

> On veut les phrases prononcées par Hamlet ou Othello.

```json
GET shakespeare/_search
{
  "query": {
    "bool": {
      "should": [
        { "term": { "speaker": "HAMLET" } },
        { "term": { "speaker": "OTHELLO" } }
      ],
      "minimum_should_match": 1
    }
  }
}
```

Traduction :

```text
speaker = HAMLET
OR speaker = OTHELLO
```

---


`minimum_should_match` indique combien de conditions should doivent être vraies pour que le document soit accepté.
minimum_should_match: 1 signifie qu'au moins une des conditions doit être vraie.

On peut mettre `0` augmente le score si on a un match. 

```json
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
      "minimum_should_match": 0
    }
  }
}
```

---

- Image mentale

```txt
text contient "love"
ET
si speaker = HAMLET ou OTHELLO → meilleur score
sinon → document accepté quand même
```

Ici si `minimum_should_match=2`, c'est clairement un `AND`.

On en reparle à la fin du cours.

---

# must_not = NOT

Exemple :

> On veut tous les textes sauf ceux de Macbeth.

```json
GET shakespeare/_search
{
  "query": {
    "bool": {
      "must_not": [
        { "term": { "play_name": "Macbeth" } }
      ]
    }
  }
}
```

Traduction :

```text
NOT play_name = Macbeth
```

---

# filter (filtrer sans influencer le score)

Exemple :

> On veut les textes contenant "be" mais seulement Hamlet.

```json
GET shakespeare/_search
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

**Important :**

- `must` → influence le score
- `filter` → filtre seulement

**Phrase à retenir :**

> filter sert à filtrer, must sert à chercher.

---

# Requête avec AND + OR

Exemple :

> On veut les textes contenant "love" et prononcés par Hamlet ou Othello.

```json
GET shakespeare/_search
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

Traduction :

```text
text contient "love"
AND
(HAMLET OR OTHELLO)
```

---

# Requêtes imbriquées

On peut mettre un `bool` dans un `bool`.

Exemple :

```json
GET shakespeare/_search
{
  "query": {
    "bool": {
      "must": [
        { "match": { "text_entry": "love" } },
        {
          "bool": {
            "should": [
              { "term": { "speaker": "HAMLET" } },
              { "term": { "speaker": "OTHELLO" } }
            ],
            "minimum_should_match": 1
          }
        }
      ]
    }
  }
}
```

---

Traduction :

```text
text contient "love"
AND
(HAMLET OR OTHELLO)
```

C'est une **requête imbriquée**.

---

# Requête range (intervalle)

Si on avait un champ `year` :

```json
GET shakespeare/_search
{
  "query": {
    "range": {
      "year": {
        "gte": 1600,
        "lte": 1700
      }
    }
  }
}
```

| Opérateur | Signification |
| --------- | ------------- |
| gte       | >=            |
| lte       | <=            |
| gt        | >             |
| lt        | <             |

---

# Correspondance SQL

| SQL     | Elasticsearch |
| ------- | ------------- |
| AND     | must          |
| OR      | should        |
| NOT     | must_not      |
| WHERE   | filter        |
| LIKE    | match         |
| =       | term          |
| BETWEEN | range         |

---

# Schéma d'une requête Elasticsearch

```text
query
 └── bool
      ├── must
      ├── should
      ├── filter
      └── must_not
```

Et on peut imbriquer :

```text
bool
 └── must
      └── bool
           └── should
```

---

# Résumé du cours

| Élément  | Rôle            |
| -------- | --------------- |
| match    | recherche texte |
| term     | valeur exacte   |
| must     | AND             |
| should   | OR              |
| must_not | NOT             |
| filter   | filtre          |
| range    | intervalle      |

---

# Ce qu'il faut retenir

> Une requête Elasticsearch est une structure logique (AND / OR / NOT) qui permet de combiner des recherches texte et des filtres.

---

# 15. Exercices 

Exercices à donner :

1. Trouver toutes les phrases de Hamlet
2. Trouver les phrases contenant "love"
3. Trouver les phrases contenant "love" prononcées par Othello
4. Trouver toutes les phrases sauf celles de Macbeth
5. Trouver les phrases contenant "be" et prononcées par Hamlet ou Othello


---
