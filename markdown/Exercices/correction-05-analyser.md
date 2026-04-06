# Correction 05 - Analyzer (Chapitre 05)

## Exercice technique : analyzer films

## 1) Création de l'index `films_lab`

```json
PUT films_lab
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
            "heroic fantasy, fantasy"
          ]
        }
      },
      "analyzer": {
        "film_search_fr": {
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
      "title": { "type": "text", "analyzer": "film_search_fr" },
      "summary": { "type": "text", "analyzer": "film_search_fr" },
      "genres": { "type": "text", "analyzer": "film_search_fr" },
      "year": { "type": "integer" },
      "rating": { "type": "float" }
    }
  }
}
```

---

## 2) Indexation `_bulk` de films

```json
POST films_lab/_bulk
{"index":{"_id":1}}
{"title":"Le Fabuleux Destin d'Amélie Poulain","summary":"Une jeune femme transforme la vie des gens à Montmartre.","genres":["comedie","romance"],"year":2001,"rating":8.3}
{"index":{"_id":2}}
{"title":"Le Seigneur des Anneaux : La Communauté de l'Anneau","summary":"Un hobbit part en quête pour détruire un anneau.","genres":["fantasy","aventure"],"year":2001,"rating":8.8}
{"index":{"_id":3}}
{"title":"Interstellar","summary":"Des astronautes traversent l'espace et le temps.","genres":["science fiction","drame"],"year":2014,"rating":8.7}
{"index":{"_id":4}}
{"title":"Blade Runner 2049","summary":"Une enquête dans un futur dystopique.","genres":["science fiction","thriller"],"year":2017,"rating":8.0}
{"index":{"_id":5}}
{"title":"Harry Potter à l'école des sorciers","summary":"Un jeune sorcier entre à Poudlard.","genres":["fantasy","aventure"],"year":2001,"rating":7.6}
{"index":{"_id":6}}
{"title":"Premier Contact","summary":"Une linguiste tente de communiquer avec des extraterrestres.","genres":["science fiction","drame"],"year":2016,"rating":7.9}
```

---

## 3) Vérification avec `_analyze`

```json
GET films_lab/_analyze
{
  "analyzer": "film_search_fr",
  "text": "Le seigneur des anneaux"
}
```

Tokens attendus :
- `seigneur`
- `anneaux`

```json
GET films_lab/_analyze
{
  "analyzer": "film_search_fr",
  "text": "film sci fi espace"
}
```

Tokens attendus :
- `film`
- `science`
- `fiction`
- `espace`

Lecture :
- `des` est supprimé par le filtre `stop`.
- `sci fi` converge vers `science fiction` via le filtre `synonym`.

---

## 4) Requête `multi_match` avec boosts

```json
GET films_lab/_search
{
  "query": {
    "multi_match": {
      "query": "film sci fi espace",
      "fields": ["title^3", "summary^2", "genres^2"]
    }
  }
}
```

Résultat attendu :
- `Interstellar` et `Blade Runner 2049` remontent en haut, car `science fiction` est présent dans `genres`.

---

## 5) Justification du score avec `_explain`

```json
GET films_lab/_explain/3
{
  "query": {
    "multi_match": {
      "query": "film sci fi espace",
      "fields": ["title^3", "summary^2", "genres^2"]
    }
  }
}
```

Points à vérifier dans la réponse :
- les termes de la requête analysée apparaissent (`science`, `fiction`, `espace`);
- la contribution des champs boostés (`summary^2`, `genres^2`) est visible dans le détail;
- le score final est la somme pondérée des correspondances.

---

## Synthèse

- L'analyzer normalise les accents, retire les mots vides et gère les synonymes métier.
- `_analyze` permet de valider le comportement réel avant d'indexer massivement.
- `multi_match` + boosts améliore la pertinence.
- `_explain` permet de justifier objectivement le classement.
