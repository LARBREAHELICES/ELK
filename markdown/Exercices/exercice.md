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

<details>
<summary>Voir la réponse (JSON + Python Jupyter)</summary>

`text`: `text_entry`  
`keyword`: `play_name`, `speaker`  
numériques: `act`, `scene`, `year`

```json
GET shakespeare_extended/_search
{
  "query": {
    "match": {
      "text_entry": "question"
    }
  }
}
```

```json
GET shakespeare_extended/_search
{
  "query": {
    "term": {
      "play_name": "Hamlet"
    }
  }
}
```

```python
import requests
import json

ES_URL = "http://elasticsearch:9200"

mapping = {
    "mappings": {
        "properties": {
            "play_name": {"type": "keyword"},
            "speaker": {"type": "keyword"},
            "text_entry": {"type": "text"},
            "act": {"type": "integer"},
            "scene": {"type": "integer"},
            "year": {"type": "integer"}
        }
    }
}

requests.put(f"{ES_URL}/shakespeare_extended", json=mapping)

docs = [
    {
        "id": 1,
        "doc": {
            "play_name": "Hamlet",
            "speaker": "HAMLET",
            "text_entry": "To be or not to be",
            "act": 3,
            "scene": 1,
            "year": 1603,
        },
    },
    {
        "id": 2,
        "doc": {
            "play_name": "Macbeth",
            "speaker": "MACBETH",
            "text_entry": "Is this a dagger which I see before me",
            "act": 2,
            "scene": 1,
            "year": 1606,
        },
    },
    {
        "id": 3,
        "doc": {
            "play_name": "Othello",
            "speaker": "OTHELLO",
            "text_entry": "One that loved not wisely but too well",
            "act": 5,
            "scene": 2,
            "year": 1604,
        },
    },
]

for item in docs:
    requests.put(f"{ES_URL}/shakespeare_extended/_doc/{item['id']}", json=item["doc"])

query_match = {"query": {"match": {"text_entry": "question"}}}
resp_match = requests.get(f"{ES_URL}/shakespeare_extended/_search", json=query_match)
print("MATCH")
print(json.dumps(resp_match.json(), indent=2, ensure_ascii=False))

query_term = {"query": {"term": {"play_name": "Hamlet"}}}
resp_term = requests.get(f"{ES_URL}/shakespeare_extended/_search", json=query_term)
print("TERM")
print(json.dumps(resp_term.json(), indent=2, ensure_ascii=False))
```
</details>

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

<details>
<summary>Voir la réponse (JSON + Python Jupyter)</summary>

En général, le document `4` apparaît avant `5` car il contient plus de termes de la requête (`to`, `be`, `question`).  
`_score` = score de pertinence calculé par Elasticsearch.

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

```python
import requests
import json

ES_URL = "http://elasticsearch:9200"

requests.put(
    f"{ES_URL}/shakespeare_extended/_doc/4",
    json={
        "play_name": "Hamlet",
        "speaker": "HAMLET",
        "text_entry": "To be or not to be that is the question",
        "act": 3,
        "scene": 1,
        "year": 1603,
    },
)

requests.put(
    f"{ES_URL}/shakespeare_extended/_doc/5",
    json={
        "play_name": "Hamlet",
        "speaker": "HAMLET",
        "text_entry": "To be a king",
        "act": 4,
        "scene": 2,
        "year": 1603,
    },
)

query = {"query": {"match": {"text_entry": "to be question"}}}
resp = requests.get(f"{ES_URL}/shakespeare_extended/_search", json=query)
print(json.dumps(resp.json(), indent=2, ensure_ascii=False))

hits = resp.json().get("hits", {}).get("hits", [])
for h in hits[:5]:
    print(h.get("_id"), h.get("_score"), h.get("_source", {}).get("text_entry"))
```
</details>

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

<details>
<summary>Voir la réponse (JSON + Python Jupyter)</summary>

`must` fait la recherche texte et contribue au score.  
`filter` limite les résultats, sans influencer `_score`.

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

```python
import requests
import json

ES_URL = "http://elasticsearch:9200"

query = {
    "query": {
        "bool": {
            "must": [
                {"match": {"text_entry": "be"}}
            ],
            "filter": [
                {"term": {"play_name": "Hamlet"}}
            ],
        }
    }
}

resp = requests.get(f"{ES_URL}/shakespeare_extended/_search", json=query)
print(json.dumps(resp.json(), indent=2, ensure_ascii=False))
```
</details>

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

<details>
<summary>Voir la réponse (JSON + Python Jupyter)</summary>

`should` = logique OR (et/ou boost selon le contexte).  
`minimum_should_match: 1` = au moins une condition `should` doit matcher.  
Avec `2`, il faut que les 2 conditions `should` soient vraies.

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

```python
import requests
import json

ES_URL = "http://elasticsearch:9200"

query = {
    "query": {
        "bool": {
            "must": [
                {"match": {"text_entry": "love"}}
            ],
            "should": [
                {"term": {"speaker": "HAMLET"}},
                {"term": {"speaker": "OTHELLO"}},
            ],
            "minimum_should_match": 1,
        }
    }
}

resp = requests.get(f"{ES_URL}/shakespeare_extended/_search", json=query)
print(json.dumps(resp.json(), indent=2, ensure_ascii=False))
```
</details>

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

<details>
<summary>Voir la réponse (JSON + Python Jupyter)</summary>

`gte` = greater than or equal (`>=`)  
`lte` = lower than or equal (`<=`)  
Avec les données de l’exercice, la plus ancienne est 1603 et la plus récente 1604 dans l’intervalle demandé.

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
  },
  "sort": [
    { "year": "asc" }
  ]
}
```

```python
import requests
import json

ES_URL = "http://elasticsearch:9200"

query = {
    "query": {
        "range": {
            "year": {
                "gte": 1603,
                "lte": 1605,
            }
        }
    },
    "sort": [{"year": "asc"}],
}

resp = requests.get(f"{ES_URL}/shakespeare_extended/_search", json=query)
print(json.dumps(resp.json(), indent=2, ensure_ascii=False))
```
</details>

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

<details>
<summary>Voir la réponse (JSON + Python Jupyter)</summary>

Les tokens dépendent de l’analyzer du champ (`text_entry`).  
Elasticsearch crée les tokens à l’indexation et réutilise l’analyse au moment de la recherche `match`.

```json
POST shakespeare_extended/_analyze
{
  "field": "text_entry",
  "text": "To be or not to be that is the question"
}
```

```python
import requests
import json

ES_URL = "http://elasticsearch:9200"

payload = {
    "field": "text_entry",
    "text": "To be or not to be that is the question",
}

resp = requests.post(f"{ES_URL}/shakespeare_extended/_analyze", json=payload)
print(json.dumps(resp.json(), indent=2, ensure_ascii=False))

tokens = [t["token"] for t in resp.json().get("tokens", [])]
print(tokens)
```
</details>

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

<details>
<summary>Voir la réponse (JSON + Python Jupyter)</summary>

- recherche: `must` (`match` sur `text_entry`)  
- filtre: `filter` (`play_name` + `year`)  
- score/boost: `should` (`speaker = HAMLET`)

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

```python
import requests
import json

ES_URL = "http://elasticsearch:9200"

query = {
    "query": {
        "bool": {
            "must": [
                {"match": {"text_entry": "be"}}
            ],
            "filter": [
                {"term": {"play_name": "Hamlet"}},
                {"range": {"year": {"gte": 1600}}},
            ],
            "should": [
                {"term": {"speaker": "HAMLET"}}
            ],
        }
    }
}

resp = requests.get(f"{ES_URL}/shakespeare_extended/_search", json=query)
print(json.dumps(resp.json(), indent=2, ensure_ascii=False))
```
</details>

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

<details>
<summary>Voir la réponse (synthèse + Python Jupyter)</summary>

| Élément       | Rôle |
| ------------- | ---- |
| `match`       | recherche full-text sur champ `text` |
| `term`        | recherche exacte sur champ `keyword` |
| `must`        | condition obligatoire qui participe au score |
| `filter`      | condition obligatoire sans impact score |
| `should`      | préférence/boost (ou OR selon `minimum_should_match`) |
| `tokens`      | unités de texte produites par l’analyzer |
| `index inversé` | structure terme -> documents |

```python
import requests
import json

ES_URL = "http://elasticsearch:9200"

query = {
    "query": {
        "bool": {
            "must": [
                {"match": {"text_entry": "love"}}
            ],
            "filter": [
                {"term": {"play_name": "Othello"}}
            ],
            "should": [
                {"term": {"speaker": "OTHELLO"}}
            ],
        }
    }
}

resp = requests.get(f"{ES_URL}/shakespeare_extended/_search", json=query)
print(json.dumps(resp.json(), indent=2, ensure_ascii=False))
```
</details>

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
