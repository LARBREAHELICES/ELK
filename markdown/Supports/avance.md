
# Analyseur et 

## Plan

1. Analyseurs personnalisés
2. Cas pratique complet : base de films (analyse et recherche)
3. Requête complexe imbriquée (function_score + bool + nested)
4. Requêtes imbriquées simples et logique booléenne
5. Pipelines Logstash (ingestion CSV + JSONL)
6. Remarques complémentaires

## 1) Analyseurs personnalisés

Voici un **exemple d'analyseur personnalisé (ad hoc)** dans Elasticsearch pour bien comprendre comment on construit le sien.

---

### Objectif

On veut un analyzer qui :

* met en minuscule
* enlève les mots vides français
* enlève les accents
* fait un peu de stemming (manger → mang)

Donc pipeline :

```
tokenizer → lowercase → stop → asciifolding → stemmer
```

---

### 1. Définition de l'analyzer

On doit le définir **dans les settings de l'index** :

```json
PUT mon_index
{
  "settings": {
    "analysis": {
      "analyzer": {
        "mon_analyzer_fr": {
          "type": "custom",
          "tokenizer": "standard",
          "filter": [
            "lowercase",
            "french_stop",
            "asciifolding",
            "french_stemmer"
          ]
        }
      },
      "filter": {
        "french_stop": {
          "type": "stop",
          "stopwords": "_french_"
        },
        "french_stemmer": {
          "type": "stemmer",
          "language": "light_french"
        }
      }
    }
  }
}
```

---

### Tester l'analyzer

```json
GET mon_index/_analyze
{
  "analyzer": "mon_analyzer_fr",
  "text": "Les étudiants mangent des pommes à l'université"
}
```

Résultat (tokens) :

```
etudiant
mang
pomm
universit
```

On a :

* supprimé **les**
* supprimé **des**
* enlevé accents
* réduit les mots

---

### Cas concret où c'est utile

Par exemple pour un moteur de recherche de formation :

Si quelqu'un cherche :

```
etudier universite
```

Il pourra trouver :

```
Les étudiants mangent à l'université
```

Même si les mots ne sont pas exactement les mêmes.

C'est ça la puissance du full-text.

---

### Autre exemple d'analyzer ad hoc (produits e-commerce)

On veut :

* garder les nombres
* garder les marques
* ignorer la casse
* découper sur espace seulement

```json
"analyzer": {
  "produit_analyzer": {
    "type": "custom",
    "tokenizer": "whitespace",
    "filter": [
      "lowercase"
    ]
  }
}
```

Texte :

```
iPhone 15 Pro Max
```

Tokens :

```
iphone
15
pro
max
```

Très utile pour recherche produit.

---

### Structure générale d'un analyzer custom

Toujours cette structure :

```json
{
  "settings": {
    "analysis": {
      "analyzer": {
        "nom_analyzer": {
          "type": "custom",
          "tokenizer": "...",
          "filter": ["...", "..."]
        }
      }
    }
  }
}
```

---

### Les tokenizers les plus utilisés

| Tokenizer  | Rôle                        |
| ---------- | --------------------------- |
| standard   | texte normal                |
| whitespace | coupe sur espaces           |
| keyword    | ne coupe pas (1 seul token) |
| ngram      | découpe en morceaux         |
| edge_ngram | pour autocomplete           |

---

###  Exemple autocomplete (très classique)

```json
"tokenizer": {
  "autocomplete_tokenizer": {
    "type": "edge_ngram",
    "min_gram": 2,
    "max_gram": 10,
    "token_chars": ["letter"]
  }
}
```

"ordinateur" devient :

```
or
ord
ordi
ordin
ordina
...
```

→ Sert pour la recherche **au fur et à mesure que tu tapes**.

---

### À retenir

Un analyzer custom =
**tokenizer + filtres** pour adapter la recherche à ton métier.

C'est exactement comme un **pipeline de traitement de texte**.

## 2) Cas Pratique Complet : Base De Films (Analyse Et Recherche)

L'idée métier est simple : dans un catalogue de films, les utilisateurs tapent souvent des requêtes comme :

* `amelie`
* `seigneur anneaux`
* `sci fi espace`
* `film fantastique peter jackson`

On veut donc un analyseur qui :

* découpe correctement le texte avec `standard`,
* mette en minuscules,
* enlève les accents avec `asciifolding`,
* supprime les mots vides avec `stop`,
* gère quelques synonymes métier comme `sci fi => science fiction`. Elasticsearch permet justement de créer un analyseur personnalisé en combinant un tokenizer et des token filters. Le tokenizer `standard` est le plus généraliste, `asciifolding` transforme par exemple `à` en `a`, et l'API `_analyze` sert à inspecter les tokens produits. ([Elastic][1])

#### Création de l'index

```json
PUT films
{
  "settings": {
    "analysis": {
      "filter": {
        "film_stop_fr": {
          "type": "stop",
          "stopwords": "_french_"
        },
        "film_synonyms": {
          "type": "synonym",
          "synonyms": [
            "sci fi, science fiction",
            "sf, science fiction",
            "heroic fantasy, fantasy",
            "romcom, comedie romantique"
          ]
        }
      },
      "analyzer": {
        "film_text_analyzer": {
          "type": "custom",
          "tokenizer": "standard",
          "filter": [
            "lowercase",
            "asciifolding",
            "film_stop_fr",
            "film_synonyms"
          ]
        }
      }
    }
  },
  "mappings": {
    "properties": {
      "title": {
        "type": "text",
        "analyzer": "film_text_analyzer"
      },
      "summary": {
        "type": "text",
        "analyzer": "film_text_analyzer"
      },
      "genres": {
        "type": "text",
        "analyzer": "film_text_analyzer"
      },
      "director": {
        "type": "text",
        "analyzer": "film_text_analyzer"
      },
      "year": {
        "type": "integer"
      },
      "rating": {
        "type": "float"
      }
    }
  }
}
```

##### Pourquoi cet analyseur est pertinent ici

* `lowercase` : `Amélie` et `amélie` deviennent comparables.
* `asciifolding` : `Amélie` peut être retrouvé avec `amelie`. ([Elastic][2])
* `stop` : des mots peu utiles comme `le`, `la`, `de`, `des` sont retirés.
* `synonym` : `sci fi` et `science fiction` peuvent converger vers la même idée métier.
* `standard` : bon choix par défaut pour du texte courant. ([Elastic][3])

---

#### 2. Insertion d'un petit jeu de données

```json
POST films/_bulk
{"index":{"_id":1}}
{"title":"Le Fabuleux Destin d'Amélie Poulain","summary":"Une jeune femme timide transforme la vie des gens autour d'elle à Montmartre.","genres":["comedie","romance"],"director":"Jean-Pierre Jeunet","year":2001,"rating":8.3}
{"index":{"_id":2}}
{"title":"Le Seigneur des Anneaux : La Communauté de l'Anneau","summary":"Un hobbit hérite d'un anneau et part dans une quête fantastique pour le détruire.","genres":["fantasy","aventure"],"director":"Peter Jackson","year":2001,"rating":8.8}
{"index":{"_id":3}}
{"title":"Interstellar","summary":"Des astronautes traversent l'espace et le temps pour sauver l'humanité.","genres":["science fiction","drame"],"director":"Christopher Nolan","year":2014,"rating":8.7}
{"index":{"_id":4}}
{"title":"Blade Runner 2049","summary":"Un agent découvre un secret qui pourrait bouleverser la société futuriste.","genres":["science fiction","thriller"],"director":"Denis Villeneuve","year":2017,"rating":8.0}
{"index":{"_id":5}}
{"title":"Harry Potter à l'école des sorciers","summary":"Un jeune garçon découvre qu'il est sorcier et entre dans une école de magie.","genres":["fantasy","aventure"],"director":"Chris Columbus","year":2001,"rating":7.6}
```

---

#### 3. Vérifier le comportement de l'analyseur

```json
GET films/_analyze
{
  "analyzer": "film_text_analyzer",
  "text": "Le Fabuleux Destin d'Amélie Poulain"
}
```

Avec cet analyseur, on s'attend à obtenir des tokens proches de :

```text
fabuleux
destin
amelie
poulain
```

Ici :

* `Le` disparaît comme stop word,
* `Amélie` devient `amelie` grâce à `asciifolding`. L'API `_analyze` est précisément faite pour visualiser ce type de transformation. ([Elastic][4])

---

#### 4. Requête simple sur le titre

```json
GET films/_search
{
  "query": {
    "match": {
      "title": "amelie"
    }
  }
}
```

Cette requête peut retrouver **Le Fabuleux Destin d'Amélie Poulain** même si l'utilisateur tape sans accent, car le texte indexé et la requête sont tous deux analysés. La logique d'analyse s'applique au moment de l'indexation et peut aussi être testée côté requête via l'analyseur. ([Elastic][1])

---

#### 5. Requête métier plus réaliste

Un utilisateur tape :

```text
film sci fi espace
```

On peut chercher à la fois dans le titre, le résumé, les genres et le réalisateur :

```json
GET films/_search
{
  "query": {
    "multi_match": {
      "query": "film sci fi espace",
      "fields": ["title^3", "summary^2", "genres^2", "director"]
    }
  }
}
```

##### Ce qui se passe

* `film` peut avoir peu d'impact s'il n'est pas présent,
* `sci fi` est rapproché de `science fiction` via les synonymes,
* `espace` matche bien le résumé d'**Interstellar**.

Donc ce type d'analyseur améliore la recherche en collant au vocabulaire réel des utilisateurs.

---

#### 6. Requête sur un univers de films fantastiques

```json
GET films/_search
{
  "query": {
    "multi_match": {
      "query": "seigneur anneaux fantasy peter jackson",
      "fields": ["title^4", "summary", "genres^2", "director^2"]
    }
  }
}
```

Ici, on mélange :

* des mots du titre,
* un genre,
* un réalisateur.

C'est un bon cas d'usage full-text.

---

#### 7. Variante utile : autocomplétion sur le titre

Pour une vraie base de films, on ajoute souvent un second champ pour l'autocomplete. Par exemple :

```json
PUT films_autocomplete
{
  "settings": {
    "analysis": {
      "tokenizer": {
        "film_autocomplete_tokenizer": {
          "type": "edge_ngram",
          "min_gram": 2,
          "max_gram": 15,
          "token_chars": ["letter", "digit"]
        }
      },
      "analyzer": {
        "film_autocomplete": {
          "type": "custom",
          "tokenizer": "film_autocomplete_tokenizer",
          "filter": ["lowercase", "asciifolding"]
        }
      }
    }
  }
}
```

`edge_ngram` est justement le tokenizer classique pour des débuts de mots, donc pour la saisie assistée. Elasticsearch documente que les analyseurs personnalisés peuvent assembler tokenizer et filtres, ce qui couvre aussi ce type de montage. ([Elastic][1])

---

#### 8. Ce que ce design vous apprend

Dans cet exemple, l'analyseur n'est pas “linguistiquement parfait”, mais il est **cohérent métier** :

* base films francophone,
* titres avec accents,
* requêtes utilisateur imprécises,
* synonymes de genres,
* recherche sur plusieurs champs.

Autrement dit, un bon analyseur n'est pas seulement “technique”, il doit refléter **la manière dont les utilisateurs cherchent**.

#### 9. Version pédagogique ultra claire

Pipeline de notre analyseur :

```text
"Le Fabuleux Destin d'Amélie Poulain"
→ standard
→ ["Le","Fabuleux","Destin","d","Amélie","Poulain"]
→ lowercase
→ ["le","fabuleux","destin","d","amélie","poulain"]
→ asciifolding
→ ["le","fabuleux","destin","d","amelie","poulain"]
→ stop
→ ["fabuleux","destin","amelie","poulain"]
```

C'est exactement l'idée d'un analyseur custom dans Elasticsearch : construire sa propre chaîne de traitement à partir d'un tokenizer et de filtres adaptés. ([Elastic][1])

Je peux aussi vous donner la **version avec `completion suggester`** ou une **version pédagogique minimale pour un cours avec seulement `title` + `summary`**.

[1]: https://www.elastic.co/docs/manage-data/data-store/text-analysis/create-custom-analyzer?utm_source=chatgpt.com "Create a custom analyzer | Elastic Docs"
[2]: https://www.elastic.co/docs/reference/text-analysis/analysis-asciifolding-tokenfilter?utm_source=chatgpt.com "ASCII folding token filter | Elasticsearch Reference"
[3]: https://www.elastic.co/docs/reference/text-analysis/analysis-standard-tokenizer?utm_source=chatgpt.com "Standard tokenizer | Elasticsearch Reference"
[4]: https://www.elastic.co/docs/manage-data/data-store/text-analysis/test-an-analyzer?utm_source=chatgpt.com "Test an analyzer | Elastic Docs"


## 3) Requête Complexe Imbriquée (Function_score + Bool + Nested)

Oui. En partant de la base **films**, voici une **query complexe**, réaliste, avec plusieurs niveaux d'imbrication.

Je vais supposer que l'index contient au moins ces champs :

* `title`, `summary`, `genres`, `director` en `text`
* `year`, `rating`, `popularity` en numériques
* `cast` en **nested** avec :

  * `cast.name`
  * `cast.role`
* `streaming_offers` en **nested** avec :

  * `streaming_offers.platform`
  * `streaming_offers.price`
  * `streaming_offers.country`

Le point important est que `nested` sert à interroger des objets imbriqués comme s'ils étaient indexés séparément, tout en renvoyant le document parent. Le `bool` permet ensuite de combiner des clauses `must`, `should`, `filter` et `must_not`. Enfin, `function_score` permet de modifier le score final d'un document déjà trouvé. ([Elastic][1])

#### Exemple de besoin métier

On veut chercher :

> “films de science-fiction ou fantasy, plutôt récents, bien notés, disponibles sur Netflix ou Prime en France, avec éventuellement Matthew McConaughey ou un rôle de wizard, et on veut favoriser les films populaires”.

#### Query complète

```json
GET films/_search
{
  "size": 10,
  "_source": [
    "title",
    "year",
    "rating",
    "director",
    "genres",
    "popularity"
  ],
  "query": {
    "function_score": {
      "query": {
        "bool": {
          "must": [
            {
              "multi_match": {
                "query": "science fiction espace voyage temporel",
                "fields": [
                  "title^4",
                  "summary^3",
                  "genres^2",
                  "director"
                ],
                "minimum_should_match": "75%"
              }
            }
          ],
          "filter": [
            {
              "range": {
                "year": {
                  "gte": 2000
                }
              }
            },
            {
              "range": {
                "rating": {
                  "gte": 7.5
                }
              }
            },
            {
              "bool": {
                "should": [
                  {
                    "term": {
                      "genres.keyword": "science fiction"
                    }
                  },
                  {
                    "term": {
                      "genres.keyword": "fantasy"
                    }
                  }
                ],
                "minimum_should_match": 1
              }
            },
            {
              "nested": {
                "path": "streaming_offers",
                "query": {
                  "bool": {
                    "must": [
                      {
                        "terms": {
                          "streaming_offers.platform.keyword": [
                            "Netflix",
                            "Prime Video"
                          ]
                        }
                      },
                      {
                        "term": {
                          "streaming_offers.country.keyword": "FR"
                        }
                      }
                    ],
                    "filter": [
                      {
                        "range": {
                          "streaming_offers.price": {
                            "lte": 15
                          }
                        }
                      }
                    ]
                  }
                }
              }
            }
          ],
          "should": [
            {
              "nested": {
                "path": "cast",
                "score_mode": "max",
                "query": {
                  "bool": {
                    "should": [
                      {
                        "match": {
                          "cast.name": "Matthew McConaughey"
                        }
                      },
                      {
                        "match": {
                          "cast.role": "wizard"
                        }
                      }
                    ],
                    "minimum_should_match": 1
                  }
                }
              }
            },
            {
              "bool": {
                "should": [
                  {
                    "match_phrase": {
                      "summary": "trou noir"
                    }
                  },
                  {
                    "match_phrase": {
                      "summary": "space travel"
                    }
                  }
                ],
                "minimum_should_match": 1
              }
            }
          ],
          "must_not": [
            {
              "term": {
                "genres.keyword": "horror"
              }
            }
          ]
        }
      },
      "functions": [
        {
          "field_value_factor": {
            "field": "popularity",
            "factor": 0.1,
            "modifier": "log1p",
            "missing": 1
          }
        },
        {
          "filter": {
            "term": {
              "director.keyword": "Christopher Nolan"
            }
          },
          "weight": 2
        }
      ],
      "score_mode": "sum",
      "boost_mode": "sum"
    }
  },
  "sort": [
    "_score",
    {
      "rating": "desc"
    },
    {
      "year": "desc"
    }
  ]
}
```

---

#### Lecture de la structure

##### Niveau 1 : `function_score`

C'est l'enveloppe externe.
Elle prend une query normale, puis **augmente ou ajuste le score** avec des fonctions. Ici :

* on ajoute un bonus selon `popularity`
* on ajoute un bonus fixe si le réalisateur est `Christopher Nolan`

C'est exactement le rôle de `function_score`. ([Elastic][2])

##### Niveau 2 : `bool`

À l'intérieur, on a un gros `bool`, qui combine plusieurs familles de contraintes :

* `must` : indispensable
* `filter` : indispensable mais sans effet sur le score
* `should` : bonus de pertinence
* `must_not` : exclusion

Elastic distingue bien `query context` et `filter context` : `must` et `should` participent au score, alors que `filter` sert à filtrer sans influencer le score. ([Elastic][3])

##### Niveau 3 : `multi_match` dans `must`

Ici, on veut une vraie recherche full-text sur plusieurs champs :

```json
"multi_match": {
  "query": "science fiction espace voyage temporel",
  "fields": ["title^4", "summary^3", "genres^2", "director"],
  "minimum_should_match": "75%"
}
```

* `title^4` compte plus que `summary`
* `summary^3` compte plus que `genres`
* `minimum_should_match` force un certain niveau de recouvrement entre les termes de la requête et le document

`multi_match` sert justement à interroger plusieurs champs avec éventuellement des boosts par champ, et `minimum_should_match` contrôle combien de clauses optionnelles doivent matcher. ([Elastic][4])

##### Niveau 4 : `filter` avec bool imbriqué

Dans `filter`, il y a déjà plusieurs niveaux :

* `range` sur l'année
* `range` sur la note
* un `bool` avec `should` pour exiger au moins un genre parmi `science fiction` ou `fantasy`

Ici :

```json
{
  "bool": {
    "should": [
      { "term": { "genres.keyword": "science fiction" } },
      { "term": { "genres.keyword": "fantasy" } }
    ],
    "minimum_should_match": 1
  }
}
```

Cela signifie : *dans les filtres, je veux au moins un de ces deux genres*. Le `bool` supporte précisément ce type de combinaison. ([Elastic][3])

##### Niveau 5 : `nested` dans `filter`

On filtre ensuite sur les offres de streaming :

```json
{
  "nested": {
    "path": "streaming_offers",
    "query": {
      "bool": {
        "must": [...],
        "filter": [...]
      }
    }
  }
}
```

C'est un vrai cas d'usage de `nested` : on veut s'assurer que **la même offre imbriquée** vérifie à la fois :

* plateforme = Netflix ou Prime Video
* pays = FR
* prix <= 15

Sans `nested`, on risque des faux positifs si les conditions matchent sur deux objets différents du tableau. La query `nested` est conçue pour ce cas. ([Elastic][1])

##### Niveau 6 : `nested` dans `should`

On ajoute ensuite un bonus si un acteur ou un rôle dans `cast` correspond :

```json
{
  "nested": {
    "path": "cast",
    "score_mode": "max",
    "query": {
      "bool": {
        "should": [
          { "match": { "cast.name": "Matthew McConaughey" } },
          { "match": { "cast.role": "wizard" } }
        ],
        "minimum_should_match": 1
      }
    }
  }
}
```

Cela ne rend pas le document obligatoire, mais améliore son score s'il contient ce type d'information dans un objet `cast`. `nested` permet bien ce ciblage sur des sous-documents imbriqués. ([Elastic][1])

---

#### Ce que cette query exprime en français

Elle dit en substance :

> Cherche des films qui correspondent textuellement à “science fiction espace voyage temporel”, sortis après 2000, notés au moins 7.5, appartenant à la science-fiction ou à la fantasy, disponibles en France sur Netflix ou Prime pour un prix ≤ 15.
> Exclue les films d'horreur.
> Donne un bonus si le casting contient Matthew McConaughey ou un rôle de type wizard, si le résumé contient certaines expressions, si le film est populaire, et encore plus si le réalisateur est Christopher Nolan.

---

#### Pourquoi c'est un bon exemple pédagogique

Cette query montre bien :

* **imbrication 1** : `function_score` autour de tout
* **imbrication 2** : `bool` principal
* **imbrication 3** : `multi_match` dans `must`
* **imbrication 4** : `bool` dans `filter`
* **imbrication 5** : `nested` + `bool` dans `streaming_offers`
* **imbrication 6** : `nested` + `bool` dans `cast`

Autrement dit, on ne fait pas juste une recherche par mot-clé ; on combine :

* du full-text,
* du filtrage métier,
* des objets imbriqués,
* du scoring personnalisé.

---

#### Version encore plus “cours”

On peut résumer la logique comme ceci :

```text
function_score
└── bool
    ├── must
    │   └── multi_match
    ├── filter
    │   ├── range(year)
    │   ├── range(rating)
    │   ├── bool(genre A OU genre B)
    │   └── nested(streaming_offers)
    │       └── bool
    │           ├── must
    │           └── filter
    ├── should
    │   ├── nested(cast)
    │   │   └── bool
    │   │       └── should
    │   └── bool
    │       └── should
    └── must_not
        └── term(horror)
```


## 4) Requêtes Imbriquées Simples Et Logique Booléenne

Voici un **exemple ultra simple de requête imbriquée** dans Elasticsearch.

On suppose une base de films avec des **acteurs en nested** :

#### Mapping (simplifié)

```json
PUT films
{
  "mappings": {
    "properties": {
      "title": { "type": "text" },
      "year": { "type": "integer" },
      "cast": {
        "type": "nested",
        "properties": {
          "name": { "type": "text" },
          "role": { "type": "text" }
        }
      }
    }
  }
}
```

#### Exemple de document

```json
POST films/_doc/1
{
  "title": "Interstellar",
  "year": 2014,
  "cast": [
    { "name": "Matthew McConaughey", "role": "Cooper" },
    { "name": "Anne Hathaway", "role": "Brand" }
  ]
}
```

---

### Requête imbriquée simple

On veut :

> Films après 2010 avec un acteur nommé Matthew McConaughey

```json
GET films/_search
{
  "query": {
    "bool": {
      "must": [
        {
          "range": {
            "year": { "gte": 2010 }
          }
        },
        {
          "nested": {
            "path": "cast",
            "query": {
              "match": {
                "cast.name": "Matthew McConaughey"
              }
            }
          }
        }
      ]
    }
  }
}
```

---

### Structure logique

Cette requête veut dire :

```text
bool
 ├── must
 │    ├── year >= 2010
 │    └── nested cast
 │          └── cast.name = Matthew McConaughey
```

Donc :

* Niveau 1 : `bool`
* Niveau 2 : `must`
* Niveau 3 : `nested`
* Niveau 4 : `match`

→ Ça, c'est déjà une requête imbriquée.

---

### Exemple avec 2 niveaux d'imbrication

On veut :

> Films après 2010 avec un acteur Matthew McConaughey OU un rôle "Brand"

```json
GET films/_search
{
  "query": {
    "bool": {
      "must": [
        { "range": { "year": { "gte": 2010 } } }
      ],
      "should": [
        {
          "nested": {
            "path": "cast",
            "query": {
              "bool": {
                "should": [
                  { "match": { "cast.name": "Matthew McConaughey" } },
                  { "match": { "cast.role": "Brand" } }
                ]
              }
            }
          }
        }
      ]
    }
  }
}
```

---

### À retenir (très important)

Structure typique Elasticsearch :

```text
query
 └── bool
      ├── must
      ├── should
      ├── filter
      └── must_not
```

Et on peut mettre **bool dans bool**, **nested dans bool**, **bool dans nested**, etc.

C'est ça une requête imbriquée :

> une requête qui contient d'autres requêtes à l'intérieur.

---

### Version ultra simple à retenir

```json
GET films/_search
{
  "query": {
    "bool": {
      "must": [
        { "match": { "title": "interstellar" } },
        {
          "nested": {
            "path": "cast",
            "query": {
              "match": {
                "cast.name": "McConaughey"
              }
            }
          }
        }
      ]
    }
  }
}
```

Oui.
Dans Elasticsearch, dans un `bool` :

| Clause     | Signification logique |
| ---------- | --------------------- |
| `must`     | AND                   |
| `should`   | OR                    |
| `must_not` | NOT                   |
| `filter`   | AND (mais sans score) |

---

### Exemple simple

```json
{
  "query": {
    "bool": {
      "must": [
        { "match": { "title": "interstellar" } },
        { "range": { "year": { "gte": 2010 } } }
      ]
    }
  }
}
```

Traduction logique :

```text
title = interstellar
AND year >= 2010
```

Donc **oui → `must` = AND**.

---

### Exemple avec AND + OR

```json
{
  "query": {
    "bool": {
      "must": [
        { "match": { "summary": "espace" } }
      ],
      "should": [
        { "term": { "genres.keyword": "science fiction" } },
        { "term": { "genres.keyword": "fantasy" } }
      ],
      "minimum_should_match": 1
    }
  }
}
```

Traduction logique :

```text
summary contient "espace"
AND
(genre = science fiction OR genre = fantasy)
```

---

### Attention à un point très important

Si tu mets **seulement** `should` sans `must`, alors :

```json
{
  "query": {
    "bool": {
      "should": [
        { "match": { "title": "interstellar" } },
        { "match": { "title": "inception" } }
      ]
    }
  }
}
```

→ Ça veut dire :

```text
interstellar OR inception
```

Mais si tu mets `must` + `should` :

* `must` = obligatoire
* `should` = bonus de score

Sauf si tu ajoutes :

```json
"minimum_should_match": 1
```

Dans ce cas `should` devient obligatoire (OR obligatoire).

---

### Tableau résumé

| SQL              | Elasticsearch |
| ---------------- | ------------- |
| AND              | must          |
| OR               | should        |
| NOT              | must_not      |
| WHERE sans score | filter        |

---

### Exemple traduction SQL → Elasticsearch

SQL :

```sql
SELECT * FROM films
WHERE year >= 2010
AND genre = 'science fiction'
AND rating >= 8
```

Elasticsearch :

```json
{
  "query": {
    "bool": {
      "filter": [
        { "range": { "year": { "gte": 2010 } } },
        { "term": { "genres.keyword": "science fiction" } },
        { "range": { "rating": { "gte": 8 } } }
      ]
    }
  }
}
```

Ici on met en `filter` car on ne veut pas influencer le score, juste filtrer.

---

### Règle simple à retenir

```text
must     = AND
should   = OR
must_not = NOT
filter   = AND (mais filtre)
```


## 5) Pipelines Logstash (Ingestion CSV + JSONL)

Oui. Voici un **exemple simple mais crédible** de pipeline Logstash pour ingérer un catalogue de films dans Elasticsearch à partir de **deux sources fictives locales** :

* un fichier CSV pour le catalogue principal,
* un fichier JSON Lines pour les notes critiques.

L'intérêt pédagogique est de montrer que Logstash sait **lire**, **parser**, **transformer**, puis **envoyer** les documents vers Elasticsearch à l'aide de plugins d'input, de filter et d'output. Le `file` input garde aussi une position de lecture via `sincedb`, le filtre `csv` sait mapper des colonnes, `mutate` sert à renommer/convertir des champs, et `fingerprint` permet de produire un identifiant stable pour éviter les doublons. ([Elastic][1])

#### 1. Sources fictives

##### `films.csv`

```csv
film_id,title,year,director,genres,summary
1,Interstellar,2014,Christopher Nolan,"science fiction|drame","Des astronautes traversent l'espace et le temps pour sauver l'humanité."
2,Le Fabuleux Destin d'Amélie Poulain,2001,Jean-Pierre Jeunet,"comedie|romance","Une jeune femme timide transforme la vie des gens autour d'elle."
3,Blade Runner 2049,2017,Denis Villeneuve,"science fiction|thriller","Un agent découvre un secret qui pourrait bouleverser la société."
```

##### `ratings.jsonl`

```json
{"film_id":1,"rating_imdb":8.7,"votes":2200000}
{"film_id":2,"rating_imdb":8.3,"votes":790000}
{"film_id":3,"rating_imdb":8.0,"votes":680000}
```

---

#### 2. Premier pipeline : catalogue CSV → Elasticsearch

Ici, on lit le CSV, on parse les colonnes, on convertit quelques types, on découpe `genres`, puis on écrit dans l'index `films`. Le `file` input peut relire depuis le début avec `start_position => "beginning"` lors d'un premier chargement, tandis que `sincedb` mémorise la progression de lecture. Le filtre `csv` accepte une liste de colonnes et le filtre `mutate` sert aux transformations générales. ([Elastic][1])

##### `pipelines/films_catalog.conf`

```conf
input {
  file {
    path => "/data/films.csv"
    start_position => "beginning"
    sincedb_path => "/tmp/logstash_films_catalog.sincedb"
    mode => "read"
  }
}

filter {
  csv {
    separator => ","
    skip_header => true
    columns => ["film_id","title","year","director","genres","summary"]
  }

  mutate {
    convert => {
      "film_id" => "integer"
      "year"    => "integer"
    }
    split => { "genres" => "|" }
    strip => ["title", "director", "summary"]
  }

  fingerprint {
    source => ["film_id"]
    method => "SHA256"
    target => "[@metadata][doc_id]"
  }
}

output {
  elasticsearch {
    hosts => ["http://localhost:9200"]
    index => "films"
    document_id => "%{[@metadata][doc_id]}"
  }

  stdout { codec => rubydebug }
}
```

##### Ce que fait ce pipeline

* `file` lit le fichier CSV ligne par ligne. Logstash conserve la position de lecture dans un fichier `sincedb`, ce qui évite de repartir de zéro à chaque redémarrage, sauf si l'on réinitialise cet état. ([Elastic][1])
* `csv` transforme chaque ligne en champs nommés. `skip_header` permet de gérer l'en-tête quand les colonnes sont connues. ([Elastic][2])
* `mutate` convertit `film_id` et `year` en entiers et découpe `genres` en tableau. `mutate` est précisément prévu pour renommer, remplacer et modifier des champs. ([Elastic][3])
* `fingerprint` crée un hash stable à partir de `film_id`, ce qui est utile pour fournir un `document_id` cohérent dans Elasticsearch et donc remplacer un document existant au lieu de créer un doublon. ([Elastic][4])

---

#### 3. Deuxième pipeline : notes JSON Lines → Elasticsearch

On lit maintenant une seconde source, déjà structurée en JSON. On l'envoie dans un index séparé `films_ratings`. Cela permet ensuite de faire des enrichissements plus tard, ou simplement de montrer qu'on peut ingérer plusieurs flux distincts. Le `file` input fonctionne aussi pour ce type de source, avec la même logique de suivi de position. ([Elastic][1])

##### `pipelines/films_ratings.conf`

```conf
input {
  file {
    path => "/data/ratings.jsonl"
    start_position => "beginning"
    sincedb_path => "/tmp/logstash_films_ratings.sincedb"
    mode => "read"
    codec => json
  }
}

filter {
  mutate {
    convert => {
      "film_id" => "integer"
      "rating_imdb" => "float"
      "votes" => "integer"
    }
  }

  fingerprint {
    source => ["film_id"]
    method => "SHA256"
    target => "[@metadata][doc_id]"
  }
}

output {
  elasticsearch {
    hosts => ["http://localhost:9200"]
    index => "films_ratings"
    document_id => "%{[@metadata][doc_id]}"
  }

  stdout { codec => rubydebug }
}
```

---

#### 4. Pourquoi faire deux index au lieu d'un seul

Pour un cours, c'est utile parce que cela montre deux idées :

* **ingestion brute de plusieurs sources**,
* **séparation des domaines de données**.

Le catalogue et les notes n'ont pas forcément le même rythme de mise à jour. Garder deux pipelines et deux index simplifie souvent les premières démonstrations. Ensuite, si besoin, on enrichit en amont ou on consolide côté Elasticsearch.

---

#### 5. Variante plus réaliste : mise à jour du même index

Si vous voulez que le fichier des notes **mette à jour** le même document film, il faut utiliser un `document_id` cohérent et un `action => "update"` avec `doc_as_upsert => true`. L'idée générale est la suivante : avec un identifiant stable, Elasticsearch peut remplacer ou mettre à jour le document correspondant ; sans identifiant explicite, Elasticsearch génère un `_id` et vous créez des doublons. Les docs et la documentation du filtre `fingerprint` décrivent précisément cet usage. ([Elastic][4])

Exemple de sortie pour le pipeline des notes :

```conf
output {
  elasticsearch {
    hosts => ["http://localhost:9200"]
    index => "films"
    action => "update"
    document_id => "%{film_id}"
    doc_as_upsert => true
  }
}
```

Dans cette logique :

* si le film existe déjà, les champs de note sont mis à jour ;
* sinon, le document peut être créé grâce à `doc_as_upsert => true`. Cette stratégie est couramment utilisée pour rejouer des sources sans dupliquer les documents. ([Discuss the Elastic Stack][5])

---

#### 6. Lancer Logstash

Exemple local :

```bash
bin/logstash -f pipelines/films_catalog.conf
bin/logstash -f pipelines/films_ratings.conf
```

Si vous rejouez souvent vos fichiers pour des démonstrations, il faut penser au `sincedb` du `file` input, car Logstash mémorise où il s'est arrêté. Réinitialiser ou supprimer ce fichier permet de relire la source depuis le début. ([Elastic][1])

---

#### 7. Résultat attendu dans Elasticsearch

Après ingestion, vous aurez au minimum :

* `films`
* `films_ratings`

Un document dans `films` ressemblera à ceci :

```json
{
  "film_id": 1,
  "title": "Interstellar",
  "year": 2014,
  "director": "Christopher Nolan",
  "genres": ["science fiction", "drame"],
  "summary": "Des astronautes traversent l'espace et le temps pour sauver l'humanité."
}
```

Et dans `films_ratings` :

```json
{
  "film_id": 1,
  "rating_imdb": 8.7,
  "votes": 2200000
}
```

---

#### 8. Version pédagogique très lisible

Le schéma mental est celui-ci :

```text
CSV / JSONL
   ↓
input file
   ↓
filters (csv / mutate / fingerprint)
   ↓
output elasticsearch
```

C'est exactement le rôle de Logstash : **ingérer**, **transformer**, **router**. Les plugins sont faits pour être combinés de cette manière dans un pipeline. ([Elastic][3])

#### 9. Ce que je vous conseillerais pour un cours

Pour une démo claire, prenez ce scénario :

* source 1 : `films.csv`
* source 2 : `ratings.jsonl`
* premier objectif : voir les documents arriver dans Elasticsearch
* second objectif : montrer le rôle de `mutate`
* troisième objectif : montrer pourquoi `document_id` évite les doublons

## 6) Remarques Complémentaires

- Le fond du contenu a été conservé ; seule la structure (sections et niveaux de titres) a été réorganisée pour la lisibilité.
- Pour un usage en cours, vous pouvez ajouter un mini quiz à la fin de chaque partie pour valider les acquis.
- Si vous voulez, je peux produire une version "support oral 60 min" avec durée par section et ordre de démonstration.
