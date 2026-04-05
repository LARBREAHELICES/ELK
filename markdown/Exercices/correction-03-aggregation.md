# Correction — Exercice 03 (Agrégations)

## Pré-requis Jupyter

```python
import requests
import json

ES_URL = "http://elasticsearch:9200"
INDEX = "shakespeare_extended"

def run(query):
    resp = requests.get(f"{ES_URL}/{INDEX}/_search", json=query)
    data = resp.json()
    print(json.dumps(data, indent=2, ensure_ascii=False))
    return data
```

---

## Correction 1 — Documents par pièce

```json
GET shakespeare_extended/_search
{
  "size": 0,
  "aggs": {
    "par_piece": {
      "terms": {
        "field": "play_name.keyword"
      }
    }
  }
}
```

```python
run({
  "size": 0,
  "aggs": {
    "par_piece": {
      "terms": {"field": "play_name.keyword"}
    }
  }
})
```

---

## Correction 2 — Top 5 speakers

```json
GET shakespeare_extended/_search
{
  "size": 0,
  "aggs": {
    "top_speakers": {
      "terms": {
        "field": "speaker.keyword",
        "size": 5
      }
    }
  }
}
```

```python
run({
  "size": 0,
  "aggs": {
    "top_speakers": {
      "terms": {"field": "speaker.keyword", "size": 5}
    }
  }
})
```

---

## Correction 3 — Speakers distincts par pièce

```json
GET shakespeare_extended/_search
{
  "size": 0,
  "aggs": {
    "par_piece": {
      "terms": {
        "field": "play_name.keyword"
      },
      "aggs": {
        "speakers_uniques": {
          "cardinality": {
            "field": "speaker.keyword"
          }
        }
      }
    }
  }
}
```

```python
run({
  "size": 0,
  "aggs": {
    "par_piece": {
      "terms": {"field": "play_name.keyword"},
      "aggs": {
        "speakers_uniques": {
          "cardinality": {"field": "speaker.keyword"}
        }
      }
    }
  }
})
```

---

## Correction 4 — Longueur moyenne par speaker

```json
GET shakespeare_extended/_search
{
  "size": 0,
  "runtime_mappings": {
    "line_length": {
      "type": "long",
      "script": "emit(doc['text_entry.keyword'].size() == 0 ? 0 : doc['text_entry.keyword'].value.length())"
    }
  },
  "aggs": {
    "par_speaker": {
      "terms": {
        "field": "speaker.keyword"
      },
      "aggs": {
        "longueur_moyenne": {
          "avg": {
            "field": "line_length"
          }
        }
      }
    }
  }
}
```

```python
run({
  "size": 0,
  "runtime_mappings": {
    "line_length": {
      "type": "long",
      "script": "emit(doc['text_entry.keyword'].size() == 0 ? 0 : doc['text_entry.keyword'].value.length())"
    }
  },
  "aggs": {
    "par_speaker": {
      "terms": {"field": "speaker.keyword"},
      "aggs": {
        "longueur_moyenne": {"avg": {"field": "line_length"}}
      }
    }
  }
})
```

---

## Correction 5 — Réplique la plus longue par pièce

```json
GET shakespeare_extended/_search
{
  "size": 0,
  "runtime_mappings": {
    "line_length": {
      "type": "long",
      "script": "emit(doc['text_entry.keyword'].size() == 0 ? 0 : doc['text_entry.keyword'].value.length())"
    }
  },
  "aggs": {
    "par_piece": {
      "terms": {
        "field": "play_name.keyword"
      },
      "aggs": {
        "longueur_max": {
          "max": {
            "field": "line_length"
          }
        }
      }
    }
  }
}
```

```python
run({
  "size": 0,
  "runtime_mappings": {
    "line_length": {
      "type": "long",
      "script": "emit(doc['text_entry.keyword'].size() == 0 ? 0 : doc['text_entry.keyword'].value.length())"
    }
  },
  "aggs": {
    "par_piece": {
      "terms": {"field": "play_name.keyword"},
      "aggs": {
        "longueur_max": {"max": {"field": "line_length"}}
      }
    }
  }
})
```

---

## Correction 6 — Moyenne du nombre de répliques par pièce

```json
GET shakespeare_extended/_search
{
  "size": 0,
  "aggs": {
    "par_piece": {
      "terms": {
        "field": "play_name.keyword"
      }
    },
    "moyenne_repliques_par_piece": {
      "avg_bucket": {
        "buckets_path": "par_piece._count"
      }
    }
  }
}
```

```python
run({
  "size": 0,
  "aggs": {
    "par_piece": {
      "terms": {"field": "play_name.keyword"}
    },
    "moyenne_repliques_par_piece": {
      "avg_bucket": {"buckets_path": "par_piece._count"}
    }
  }
})
```

---

## Correction 7 — Histogramme longueur (intervalle 20)

```json
GET shakespeare_extended/_search
{
  "size": 0,
  "runtime_mappings": {
    "line_length": {
      "type": "long",
      "script": "emit(doc['text_entry.keyword'].size() == 0 ? 0 : doc['text_entry.keyword'].value.length())"
    }
  },
  "aggs": {
    "histogramme_longueur": {
      "histogram": {
        "field": "line_length",
        "interval": 20
      }
    }
  }
}
```

```python
run({
  "size": 0,
  "runtime_mappings": {
    "line_length": {
      "type": "long",
      "script": "emit(doc['text_entry.keyword'].size() == 0 ? 0 : doc['text_entry.keyword'].value.length())"
    }
  },
  "aggs": {
    "histogramme_longueur": {
      "histogram": {"field": "line_length", "interval": 20}
    }
  }
})
```

---

## Correction 8 — Répliques par année puis par pièce

```json
GET shakespeare_extended/_search
{
  "size": 0,
  "aggs": {
    "par_annee": {
      "terms": {
        "field": "year"
      },
      "aggs": {
        "par_piece": {
          "terms": {
            "field": "play_name.keyword"
          }
        }
      }
    }
  }
}
```

```python
run({
  "size": 0,
  "aggs": {
    "par_annee": {
      "terms": {"field": "year"},
      "aggs": {
        "par_piece": {
          "terms": {"field": "play_name.keyword"}
        }
      }
    }
  }
})
```
