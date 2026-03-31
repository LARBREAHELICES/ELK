"""
SciPulse — Mappings Elasticsearch
Contient les mappings optimisés pour les index arxiv-papers et hn-items.
Usage : python -m src.utils.mappings
"""

ARXIV_SETTINGS = {
    "settings": {
        "number_of_shards": 1,
        "number_of_replicas": 0,
        "analysis": {
            "filter": {
                "english_stemmer": {
                    "type": "stemmer",
                    "language": "english"
                },
                "english_stop": {
                    "type": "stop",
                    "stopwords": "_english_"
                },
                "scientific_synonyms": {
                    "type": "synonym",
                    "synonyms": [
                        "cnn, convolutional neural network",
                        "rnn, recurrent neural network",
                        "lstm, long short-term memory",
                        "gan, generative adversarial network",
                        "vae, variational autoencoder",
                        "nlp, natural language processing",
                        "rl, reinforcement learning",
                        "llm, large language model",
                        "ml, machine learning",
                        "dl, deep learning",
                        "bert, bidirectional encoder representations from transformers",
                        "gpt, generative pre-trained transformer",
                        "rlhf, reinforcement learning from human feedback"
                    ]
                }
            },
            "analyzer": {
                "scientific_english": {
                    "type": "custom",
                    "tokenizer": "standard",
                    "filter": [
                        "lowercase",
                        "english_stop",
                        "scientific_synonyms",
                        "english_stemmer"
                    ]
                }
            }
        }
    },
    "mappings": {
        "properties": {
            "arxiv_id": {
                "type": "keyword"
            },
            "title": {
                "type": "text",
                "analyzer": "scientific_english",
                "fields": {
                    "keyword": {"type": "keyword"},
                    "suggest": {
                        "type": "completion",
                        "analyzer": "simple"
                    }
                }
            },
            "abstract": {
                "type": "text",
                "analyzer": "scientific_english",
                "term_vector": "with_positions_offsets"
            },
            "authors": {
                "type": "nested",
                "properties": {
                    "name": {"type": "text", "fields": {"keyword": {"type": "keyword"}}},
                    "affiliation": {"type": "text", "fields": {"keyword": {"type": "keyword"}}}
                }
            },
            "authors_flat": {
                "type": "text",
                "fields": {"keyword": {"type": "keyword"}}
            },
            "categories": {
                "type": "keyword"
            },
            "primary_category": {
                "type": "keyword"
            },
            "date_published": {
                "type": "date",
                "format": "yyyy-MM-dd||yyyy-MM-dd'T'HH:mm:ss||epoch_millis"
            },
            "date_updated": {
                "type": "date",
                "format": "yyyy-MM-dd||yyyy-MM-dd'T'HH:mm:ss||epoch_millis"
            },
            "doi": {
                "type": "keyword"
            },
            "keywords": {
                "type": "keyword"
            },
            "hn_score": {
                "type": "integer"
            },
            "hn_comments_count": {
                "type": "integer"
            },
            "hn_item_ids": {
                "type": "keyword"
            }
        }
    }
}


HN_SETTINGS = {
    "settings": {
        "number_of_shards": 1,
        "number_of_replicas": 0
    },
    "mappings": {
        "properties": {
            "hn_id": {
                "type": "keyword"
            },
            "type": {
                "type": "keyword"
            },
            "by": {
                "type": "keyword"
            },
            "time": {
                "type": "date",
                "format": "epoch_second"
            },
            "title": {
                "type": "text",
                "analyzer": "english",
                "fields": {
                    "keyword": {"type": "keyword"}
                }
            },
            "url": {
                "type": "keyword"
            },
            "text": {
                "type": "text",
                "analyzer": "english"
            },
            "score": {
                "type": "integer"
            },
            "descendants": {
                "type": "integer"
            },
            "parent": {
                "type": "keyword"
            },
            "relation": {
                "type": "join",
                "relations": {
                    "story": "comment"
                }
            },
            "arxiv_id_linked": {
                "type": "keyword"
            }
        }
    }
}


ARXIV_HN_LINKS_SETTINGS = {
    "settings": {
        "number_of_shards": 1,
        "number_of_replicas": 0
    },
    "mappings": {
        "properties": {
            "arxiv_id":         {"type": "keyword"},
            "hn_item_id":       {"type": "keyword"},
            "hn_score":         {"type": "integer"},
            "hn_comments":      {"type": "integer"},
            "hn_title":         {"type": "text", "fields": {"keyword": {"type": "keyword"}}},
            "hn_url":           {"type": "keyword"},
            "hn_time":          {"type": "date", "format": "epoch_second"},
            "detected_at":      {"type": "date"}
        }
    }
}


if __name__ == "__main__":
    """Créer les index dans Elasticsearch."""
    from elasticsearch import Elasticsearch
    import json

    es = Elasticsearch("http://localhost:9200")

    indices = {
        "arxiv-papers": ARXIV_SETTINGS,
        "hn-items": HN_SETTINGS,
        "arxiv-hn-links": ARXIV_HN_LINKS_SETTINGS,
    }

    for name, body in indices.items():
        if es.indices.exists(index=name):
            print(f"  ⏭  Index '{name}' existe déjà, ignoré.")
        else:
            es.indices.create(index=name, body=body)
            print(f"  ✅ Index '{name}' créé.")

    print("\nMappings déployés avec succès.")
