# Analyseur et 

## Analyseurs personnalisés

Voici un **exemple d'analyseur personnalisé (ad hoc)** dans Elasticsearch pour bien comprendre comment on construit le sien.

---

### Objectif

On veut un analyzer qui :

- met en minuscule
- enlève les mots vides français
- enlève les accents
- fait un peu de stemming (manger → mang)

Donc pipeline :

```
tokenizer → lowercase → stop → asciifolding → stemmer
```

---

###  Définition de l'analyzer - exemple

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
## Remarque sur les mots clés

Elasticsearch utilise une liste interne implémentée dans le moteur Lucene lui-même.

"stopwords": "_french_", le type "stop" ici supprime des mots.

1. french → agressif
1. light_french → mieux pour la recherche
1. minimal_french → très léger

Un **stemmer** transforme un mot en sa racine pour regrouper les variantes d'un même mot.

`pomme → pome`

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
mangent
pome
universit
```

On a :

- supprimé **les**
- supprimé **des**
- enlevé accents
- réduit les mots

---

### Cas concret où c'est utile

Par exemple pour un moteur de recherche de formation, si quelqu'un cherche :

```
etudier universite
```

Il pourra trouver :

```
Les étudiants mangent à l'université
```

Même si les mots ne sont pas exactement les mêmes. C'est ça la puissance du full-text.

---

### Autre exemple d'analyzer ad hoc (produits e-commerce)

On veut :

- garder les nombres
- garder les marques
- ignorer la casse
- découper sur espace seulement

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

- `type custom` → on crée son propre analyseur.
- `whitespace` → découpe selon les espaces (slide)

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

###  Exemple autocomplete 

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

→ Sert pour la recherche **au fur et à mesure que l'on tape**.

---

### Synthèse guidée

Un analyzer custom = **tokenizer + filtres** pour adapter la recherche à notre métier.

C'est exactement comme un **pipeline de traitement de texte**.

---

## Cas pratique complet : base de films

L'idée métier est simple : dans un catalogue de films, les utilisateurs tapent souvent des requêtes comme :

- `amelie`
- `seigneur anneaux`
- `sci fi espace`
- `film fantastique peter jackson`

---

### Objectif d'analyse

On veut donc un analyseur qui :

- découpe correctement le texte avec `standard`,
- mette en minuscules,
- enlève les accents avec `asciifolding`,
- supprime les mots vides avec `stop`,
- gère quelques synonymes métier comme `sci fi => science fiction`. Elasticsearch permet justement de créer un analyseur personnalisé en combinant un tokenizer et des token filters. Le tokenizer `standard` est le plus généraliste, `asciifolding` transforme par exemple `à` en `a`, et l'API `_analyze` sert à inspecter les tokens produits. ([Elastic][1])

---

#### Création de l'index

```json
PUT films
 "settings": {
        "analysis": {
            "filter": {
                "film_elision_fr": {
                    "type": "elision",
                    "articles_case": True,
                    "articles": ["l", "d", "c", "j", "m", "n", "s", "t", "qu"]
                },
                "film_stop_fr": {
                    "type": "stop",
                    "stopwords": ["le", "la", "les", "de", "du", "des"]
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
                        "film_elision_fr",
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
            "title": {"type": "text", "analyzer": "film_text_analyzer"},
            "summary": {"type": "text", "analyzer": "film_text_analyzer"},
            "genres": {"type": "text", "analyzer": "film_text_analyzer"},
            "director": {"type": "text", "analyzer": "film_text_analyzer"},
            "year": {"type": "integer"},
            "rating": {"type": "float"}
        }
    }
}
```

---

##### Pourquoi cet analyseur est pertinent ici

- `lowercase` : `Amélie` et `amélie` deviennent comparables.
- `asciifolding` : `Amélie` peut être retrouvé avec `amelie`. ([Elastic][2])
- `stop` : des mots peu utiles comme `le`, `la`, `de`, `des` sont retirés.
- `synonym` : `sci fi` et `science fiction` peuvent converger vers la même idée métier.
- `standard` : bon choix par défaut pour du texte courant. ([Elastic][3])

---

#### Insertion d'un petit jeu de données

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

#### Vérifier le comportement de l'analyseur

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

- `Le` disparaît comme stop word,
- `Amélie` devient `amelie` grâce à `asciifolding`. L'API `_analyze` est précisément faite pour visualiser ce type de transformation. 

---

#### Requête simple sur le titre

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

Cette requête peut retrouver **Le Fabuleux Destin d'Amélie Poulain** même si l'utilisateur tape sans accent, car le texte indexé et la requête sont tous deux analysés. La logique d'analyse s'applique au moment de l'indexation et peut aussi être testée côté requête via l'analyseur.

---

#### Requête métier plus réaliste

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

- `film` peut avoir peu d'impact s'il n'est pas présent,
- `sci fi` est rapproché de `science fiction` via les synonymes,
- `espace` matche bien le résumé d'**Interstellar**.

Donc ce type d'analyseur améliore la recherche en collant au vocabulaire réel des utilisateurs.

---

#### Requête sur un univers de films fantastiques

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

- des mots du titre,
- un genre,
- un réalisateur.

C'est un bon cas d'usage full-text.

---

####  Variante utile : autocomplétion sur le titre

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

`edge_ngram` est justement le tokenizer classique pour des débuts de mots, donc pour la saisie assistée.

### Principe
On indexe le début des mots pour pouvoir chercher pendant que l'utilisateur tape.

```txt
Interstellar → in, int, inte, inter, inters, etc.
```

---

####  Ce que ce design nous apprend

Dans cet exemple, l'analyseur n'est pas "linguistiquement parfait", mais il est **cohérent métier** :

1. base films francophone,
1. titres avec accents,
1. requêtes utilisateur imprécises,
1. synonymes de genres,
1. recherche sur plusieurs champs.

Autrement dit, un bon analyseur n'est pas seulement "technique", il doit refléter **la manière dont les utilisateurs cherchent**.

---

## Exercice technique : analyzer films

Objectif : construire un analyzer orienté recherche de films et vérifier son impact concret sur les résultats.

Travail demandé :

1. Créer un index `films_lab` avec un analyzer `film_search_fr` :
   - tokenizer `standard`
   - filtres `lowercase`, `asciifolding`, `stop` (français), `synonym`
1. Mapper `title`, `summary`, `genres` avec cet analyzer.
1. Indexer au moins 6 films (dont un avec accent, un film fantasy, un film science-fiction).
1. Tester l'analyzer avec `_analyze` sur :
   - `Le seigneur des anneaux`
   - `film sci fi espace`

---

### Livrables attendus

1. Requête `PUT` complète de création d'index (settings + mappings).
1. Requête `_bulk` d'indexation des films.
1. Résultat `_analyze` commenté :
   - quels tokens restent ?
   - quels tokens sont supprimés ?
1. Requête `multi_match` sur `title`, `summary`, `genres` avec boosts.
1. Une requête `_explain` sur un document pour justifier le score.

Critères de réussite :

- une recherche `amelie` retrouve un titre avec `Amélie`,
- une recherche `sci fi` remonte un film `science fiction`,
- la justification du score est lisible via `_explain`.
