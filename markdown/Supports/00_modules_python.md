
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
