
# Installer la librairie

```bash
pip install elasticsearch
```

---

# Connexion à Elasticsearch

```python
from elasticsearch import Elasticsearch

es = Elasticsearch("http://localhost:9200")

print(es.info())
```

---

# Créer un index

```python
es.indices.create(
    index="films",
    mappings={
        "properties": {
            "title": {"type": "text"},
            "year": {"type": "integer"},
            "rating": {"type": "float"}
        }
    }
)
```

---

# Indexer un document

```python
doc = {
    "title": "Interstellar",
    "year": 2014,
    "rating": 8.7
}

es.index(index="films", id=1, document=doc)
```

---

# Recherche simple

```python
response = es.search(
    index="films",
    query={
        "match": {
            "title": "interstellar"
        }
    }
)

print(response)
```

---

# Bulk (très important)

```python
from elasticsearch.helpers import bulk

actions = [
    {"_index": "films", "_id": 1, "_source": {"title": "Interstellar", "year": 2014}},
    {"_index": "films", "_id": 2, "_source": {"title": "Blade Runner", "year": 2017}},
]

bulk(es, actions)
```

---

# Supprimer un index

```python
es.indices.delete(index="films")
```

---

# Voir les index

```python
print(es.cat.indices(format="json"))
```

---

# Structure d'une recherche Python

```python
query = {
    "query": {
        "multi_match": {
            "query": "space",
            "fields": ["title", "summary"]
        }
    }
}

res = es.search(index="films", body=query)
```

---

# Tableau récapitulatif

| Action          | Python            |
| --------------- | ----------------- |
| créer index     | es.indices.create |
| supprimer index | es.indices.delete |
| indexer doc     | es.index          |
| bulk            | bulk()            |
| search          | es.search         |
| stats           | es.cat.indices    |

---

# Exemple complet

```python
from elasticsearch import Elasticsearch
from elasticsearch.helpers import bulk

es = Elasticsearch("http://localhost:9200")

# Création index
es.indices.create(index="films", ignore=400)

# Bulk
actions = [
    {"_index": "films", "_source": {"title": "Interstellar", "year": 2014, "rating": 8.7}},
    {"_index": "films", "_source": {"title": "Blade Runner 2049", "year": 2017, "rating": 8.0}},
]

bulk(es, actions)

# Recherche
res = es.search(
    index="films",
    query={"match": {"title": "blade"}}
)

print(res["hits"]["hits"])
```

---

**L'API Python permet de créer des index, envoyer des documents et faire des recherches dans Elasticsearch.**

---

# Pourquoi la qualité des données ?

En data / IA / BI, le problème principal n'est pas l'algorithme, c'est la **qualité des données** :

| Problème            | Exemple                |
| ------------------- | ---------------------- |
| valeurs manquantes  | âge = NULL             |
| mauvais type        | "2014" au lieu de 2014 |
| valeurs impossibles | rating = 15            |
| doublons            | même film 2 fois       |
| incohérences        | date_fin < date_debut  |

Principe : **Garbage in → Garbage out**

---

# Great Expectations — principe

Great Expectations sert à **tester la qualité des données**.

Comme des tests unitaires, mais pour les données.

On écrit des règles appelées **expectations** :

| Expectation                         | Signification              |
| ----------------------------------- | -------------------------- |
| expect_column_to_exist              | la colonne existe          |
| expect_column_values_to_not_be_null | pas de NULL                |
| expect_column_values_to_be_between  | valeurs dans un intervalle |
| expect_column_values_to_be_unique   | pas de doublons            |
| expect_column_values_to_match_regex | format respecté            |
| expect_column_values_to_be_in_set   | valeurs autorisées         |

---

# Exemple simple (films)

Dataset :

| title        | year | rating |
| ------------ | ---- | ------ |
| Interstellar | 2014 | 8.7    |
| Blade Runner | 2017 | 15     |
| Amélie       | NULL | 8.3    |

Tests qualité :

* year ne doit pas être NULL
* rating doit être entre 0 et 10
* title ne doit pas être NULL

---

# Exemple en Python

Installation :

```bash
pip install great_expectations
```

Exemple :

```python
import great_expectations as gx
import pandas as pd

df = pd.DataFrame({
    "title": ["Interstellar", "Blade Runner", "Amélie"],
    "year": [2014, 2017, None],
    "rating": [8.7, 15, 8.3]
})

validator = gx.from_pandas(df)

validator.expect_column_values_to_not_be_null("year")
validator.expect_column_values_to_be_between("rating", min_value=0, max_value=10)
validator.expect_column_values_to_not_be_null("title")

validator.validate()
```

Résultat :

* erreur sur rating = 15
* erreur sur year = NULL

---

# Types de contrôles de qualité

| Type         | Exemple                          |
| ------------ | -------------------------------- |
| Complétude   | pas de NULL                      |
| Validité     | valeurs possibles                |
| Cohérence    | date_fin > date_debut            |
| Unicité      | id unique                        |
| Type         | integer, float                   |
| Distribution | moyenne correcte                 |
| Référentiel  | genre ∈ {action, comédie, drame} |

---

# Où ça s'utilise dans un pipeline data

Pipeline moderne :

```text
Source → Logstash → Elasticsearch → Kibana
            ↓
     Great Expectations
     (validation qualité)
```

On valide les données **avant indexation**.

---

# Exemple concret sur le jeu de données films

Tests à faire sur films :

| Colonne | Test                 |
| ------- | -------------------- |
| title   | not null             |
| year    | between 1900 et 2025 |
| rating  | between 0 et 10      |
| genres  | not null             |
| id      | unique               |

---

# Idée importante pour les étudiants

Il faut voir Great Expectations comme :

**pytest mais pour les données**

| Code          | Données            |
| ------------- | ------------------ |
| pytest        | great expectations |
| test fonction | test dataset       |
| assert        | expectation        |

---

# Résumé

| Outil              | Rôle                |
| ------------------ | ------------------- |
| Logstash           | ingestion           |
| Elasticsearch      | stockage            |
| Kibana             | visualisation       |
| Great Expectations | qualité des données |
