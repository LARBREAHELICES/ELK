# TP Films (2h) - Logstash + Elasticsearch

## But du TP

Construire une mini chaine data sur des films:
- ingestion CSV avec Logstash
- mapping propre dans Elasticsearch
- verification de la qualite des donnees
- requetes metier pour analyser le catalogue

Duree cible: **2 heures**.

---

## Scenario

Vous recevez deux fichiers:
- `films_catalog.csv` (metadonnees films)
- `films_ratings.csv` (notes utilisateurs)

Vous devez produire deux index:
- `films-catalog`
- `films-ratings`

Puis repondre a des questions produit simples (top genres, meilleurs films, etc.).

---

## Pre-requis 

1. Verifier les services:

```bash
docker compose ps
```

2. Creer un dossier de travail:

```bash
mkdir -p logs/films
```

3. Ajouter deux CSV dans `logs/films/`.

Format minimal conseille:

`films_catalog.csv`

```csv
movie_id,title,year,genre,director
1,Inception,2010,Sci-Fi,Christopher Nolan
2,The Godfather,1972,Crime,Francis Ford Coppola
3,Parasite,2019,Thriller,Bong Joon-ho
```

`films_ratings.csv`

```csv
movie_id,user_id,rating,rated_at
1,101,4.8,2026-03-01T10:00:00Z
1,102,4.6,2026-03-02T11:20:00Z
3,103,4.9,2026-03-03T09:15:00Z
```

---

## Etape 1 - Pipeline catalog 

### Travail

Creer un pipeline Logstash pour `films_catalog.csv`:
- `input file`
- `filter csv`
- conversion de `movie_id` et `year` en entier
- `output elasticsearch` vers `films-catalog`

### Verification

```bash
curl "http://localhost:9200/films-catalog/_count?pretty"
```

```bash
curl "http://localhost:9200/films-catalog/_search?pretty&size=3"
```

---

## Etape 2 - Pipeline ratings (30 min)

### Travail

Creer un pipeline Logstash pour `films_ratings.csv`:
- `input file`
- `filter csv`
- conversion `movie_id` en entier, `rating` en float
- parse `rated_at` vers `@timestamp`
- output vers `films-ratings`

### Verification

```bash
curl "http://localhost:9200/films-ratings/_count?pretty"
```

```bash
curl "http://localhost:9200/films-ratings/_search?pretty&size=3"
```

---

## Etape 3 - Controle qualite 

### Travail

Verifier:
- types de champs (`movie_id`, `rating`, `@timestamp`)
- presence de tags d'erreur de parsing
- doublons evidents

### Commandes utiles

```bash
curl "http://localhost:9200/films-catalog/_mapping?pretty"
curl "http://localhost:9200/films-ratings/_mapping?pretty"
```

```bash
curl -X GET "http://localhost:9200/films-ratings/_search?pretty" -H "Content-Type: application/json" -d '{
  "query": {"exists": {"field": "tags"}}
}'
```

---

## Etape 4 - Questions metier 

Faire ces requetes:

1. Top genres par nombre de films (`films-catalog`)
2. Note moyenne par film (`films-ratings`, agg `avg` sur `rating`)
3. Top 3 films les mieux notes (tri sur moyenne)
4. Evolution du volume de notes par jour (`date_histogram` sur `@timestamp`)

---

## Bonus

- Ajouter un champ `rating_band` (`low`, `medium`, `high`) via `mutate` / condition.
- Creer une requete qui compte les notes par `rating_band`.

---

## Livrables attendus

1. Deux fichiers pipeline Logstash (`catalog` et `ratings`)
2. Captures ou commandes de verification (`_count`, `_mapping`, `_search`)
3. 4 requetes metier + interpretation en 3 lignes max par requete

---

## Grille de temps recommandee

- 0:00 -> 0:10: setup
- 0:10 -> 0:40: pipeline catalog
- 0:40 -> 1:10: pipeline ratings
- 1:10 -> 1:30: qualite
- 1:30 -> 1:55: analyses metier
- 1:55 -> 2:00: rendu
