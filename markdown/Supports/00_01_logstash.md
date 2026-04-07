# Logstash — Nettoyer et corriger des données

## Introduction à ELK

Dans ce cours, on construit une chaîne ELK complète et exploitable :

```text
Source (CSV / logs) -> Logstash -> Elasticsearch -> Kibana -> Jupyter
```

Rôle de chaque brique :
- **Logstash** lit, nettoie et transforme les données
- **Elasticsearch** stocke les documents et permet la recherche / agrégation
- **Kibana** permet d'explorer rapidement les résultats
- **Jupyter** sert à vérifier et automatiser les contrôles depuis Python

Objectif pédagogique :
- comprendre le pipeline global avant d'entrer dans la syntaxe
- appliquer un flux unique de bout en bout
- garder un chemin de debug simple (input -> filter -> output)

---

## Charger le fichier avant de nettoyer (input)

Avant les filtres (`csv`, `mutate`, `date`), il faut d'abord **lire le fichier** avec un `input file`.

```conf
input {
  file {
    path => "/usr/share/logstash/logs/films/tmdb_movies.csv"
    start_position => "beginning"
    sincedb_path => "/tmp/logstash_tmdb_movies.sincedb"
  }
}
```

À retenir :
- `path` : chemin du fichier **dans le conteneur Logstash**
- `start_position => "beginning"` : lit depuis le début au premier lancement
- `sincedb_path` : mémorise la position de lecture (à supprimer pour rejouer l'ingestion)

Ordre logique du pipeline :
`input file` -> `filter (nettoyage)` -> `output (Elasticsearch)`

---

## Le vrai problème en ingestion

Dans la réalité, les données sont **sales** :

| Problème             | Exemple                  |
| -------------------- | ------------------------ |
| Types incorrects     | `"vote_count": "12 345"` |
| Dates invalides      | `"32-13-2010"`           |
| Champs vides         | `""`                     |
| Espaces              | `"  Inception  "`        |
| Casse incohérente    | `"EN"`, `"en"`, `"En"`   |
| Valeurs incohérentes | `vote_average = 15`      |
| Doublons             | même film importé 2 fois |
| Colonnes décalées    | CSV mal formé            |

**Le rôle principal du filtre Logstash = corriger ces problèmes.**

---

# Contrôler la qualité des données

Nettoyer ne suffit pas : il faut aussi **valider**.

Principe :

**Garbage in -> Garbage out**

Types de contrôles utiles sur un dataset films :

| Type         | Exemple                          |
| ------------ | -------------------------------- |
| Complétude   | `title` non vide                 |
| Validité     | `vote_average` entre 0 et 10     |
| Cohérence    | `release_date` au bon format     |
| Unicité      | pas de doublon sur un identifiant |
| Référentiel  | langue dans une liste autorisée  |

---

# Great Expectations (validation)

Great Expectations permet d'écrire des règles de qualité de données.

À retenir :

- logique de test appliquée aux datasets
- exécution possible dans Jupyter
- rapport lisible pour savoir quelles lignes échouent

Exemples de règles :

- `expect_column_values_to_not_be_null`
- `expect_column_values_to_be_between`
- `expect_column_values_to_be_unique`
- `expect_column_values_to_match_regex`

---

# Exemple rapide en Python (Jupyter)

```python
import great_expectations as gx
import pandas as pd

df = pd.DataFrame({
    "title": ["Interstellar", "Blade Runner", "Amelie"],
    "vote_average": [8.7, 15, 8.3],
    "release_date": ["2014-11-05", "2017-10-04", ""]
})

validator = gx.from_pandas(df)

validator.expect_column_values_to_not_be_null("title")
validator.expect_column_values_to_be_between("vote_average", min_value=0, max_value=10)
validator.expect_column_values_to_match_regex("release_date", r"^\d{4}-\d{2}-\d{2}$")

result = validator.validate()
print(result["success"])
```

Interprétation :

- les lignes invalides sont détectées avant indexation
- le rapport guide les corrections dans le pipeline

---

# Pipeline orienté nettoyage

```conf
filter {

  # 1. Parse CSV
  csv {
    separator => ","
    skip_header => true
    columns => ["index","title","original_language","release_date","popularity","vote_average","vote_count","overview"]
  }

  # 2. Nettoyage texte
  mutate {
    strip => ["title", "overview"]
    lowercase => ["original_language"]
  }

  # 3. Corriger champs vides
  if [title] == "" {
    mutate { replace => { "title" => "unknown" } }
  }

  # 4. Corriger nombres avec espaces
  mutate {
    gsub => ["vote_count", " ", ""]
  }

  mutate {
    convert => {
      "vote_count" => "integer"
      "vote_average" => "float"
      "popularity" => "float"
    }
  }

  # 5. Corriger valeurs incohérentes
  if [vote_average] > 10 {
    mutate { replace => { "vote_average" => 10 } }
  }

  if [vote_average] < 0 {
    mutate { replace => { "vote_average" => 0 } }
  }

  # 6. Corriger dates
  date {
    match => ["release_date", "dd-MM-yyyy", "yyyy-MM-dd"]
    target => "@timestamp"
  }

  # 7. Supprimer lignes invalides
  if ![title] or ![vote_average] {
    drop { }
  }

  # 8. Supprimer champs inutiles
  mutate {
    remove_field => ["message", "path", "@version"]
  }
}
```

---

# Outils principaux pour nettoyer

## mutate

Le plus important.

| Action       | Exemple         |
| ------------ | --------------- |
| strip        | enlever espaces |
| lowercase    | minuscules      |
| uppercase    | majuscules      |
| convert      | type            |
| rename       | renommer        |
| remove_field | supprimer       |
| replace      | remplacer       |
| gsub         | regex replace   |

### Exemple nettoyage classique

```conf
mutate {
  strip => ["title"]
  lowercase => ["original_language"]
  gsub => ["vote_count", " ", ""]
  convert => { "vote_count" => "integer" }
}
```

---

## if / else (corriger les données)

Logstash permet de corriger avec des conditions.

```conf
if [vote_average] > 10 {
  mutate { replace => { "vote_average" => 10 } }
}
```

```conf
if [title] == "" {
  mutate { replace => { "title" => "unknown" } }
}
```

```conf
if [overview] == "" {
  mutate { add_field => { "overview" => "No overview" } }
}
```

---

## drop (supprimer des données)

Très important en data cleaning.

```conf
if [vote_count] == 0 {
  drop { }
}
```

```conf
if "_csvparsefailure" in [tags] {
  drop { }
}
```

---

## gsub (corriger texte avec regex)

```conf
mutate {
  gsub => ["title", "\s+", " "]   # espaces multiples → 1 espace
}
```

```conf
mutate {
  gsub => ["vote_count", "[^0-9]", ""]
}
```

Très utile pour nettoyer :

* espaces
* caractères spéciaux
* symboles
* monnaie
* unités

---

# Corriger avec Ruby (cas avancé)

Quand mutate ne suffit plus.

```conf
ruby {
  code => '
    title = event.get("title")
    if title
      event.set("title", title.strip.capitalize)
    end
  '
}
```

Exemple : calculer une catégorie :

```conf
ruby {
  code => '
    rating = event.get("vote_average")
    if rating
      if rating >= 7
        event.set("rating_category", "good")
      else
        event.set("rating_category", "bad")
      end
    end
  '
}
```

---

# Gérer les erreurs de parsing

Quand Logstash échoue, il ajoute un tag :

| Tag               | Signification |
| ----------------- | ------------- |
| _csvparsefailure  | erreur CSV    |
| _grokparsefailure | erreur grok   |
| _dateparsefailure | erreur date   |

On peut les exploiter :

```conf
if "_csvparsefailure" in [tags] {
  mutate { add_field => { "error" => "csv parsing failed" } }
}
```

Ou supprimer :

```conf
if "_csvparsefailure" in [tags] {
  drop { }
}
```

Ou envoyer dans un index erreurs :

```conf
output {
  if "_csvparsefailure" in [tags] {
    elasticsearch { index => "movies-errors" }
  } else {
    elasticsearch { index => "movies" }
  }
}
```

Très utilisé en production.

---

# Déduplication (doublons)

Avec fingerprint :

```conf
fingerprint {
  source => ["title", "release_date"]
  target => "[@metadata][doc_id]"
  method => "SHA1"
}
```

Puis :

```conf
document_id => "%{[@metadata][doc_id]}"
```

Permet :

* rejouer ingestion
* éviter doublons
* clé métier

---

# Exemple réel de nettoyage complet

```conf
filter {
  csv { ... }

  mutate {
    strip => ["title"]
    lowercase => ["original_language"]
    gsub => ["vote_count", "[^0-9]", ""]
  }

  mutate {
    convert => {
      "vote_count" => "integer"
      "vote_average" => "float"
    }
  }

  if [vote_average] > 10 { mutate { replace => { "vote_average" => 10 } } }
  if [vote_average] < 0 { mutate { replace => { "vote_average" => 0 } } }

  if [title] == "" { drop {} }

  date { match => ["release_date", "dd-MM-yyyy"] }

  fingerprint {
    source => ["title", "release_date"]
    target => "[@metadata][doc_id]"
  }
}
```

---

# Ce qu’il faut retenir (le plus important du cours)

Logstash sert surtout à :

| Action        | Plugin         |
| ------------- | -------------- |
| Parser        | csv / grok     |
| Nettoyer      | mutate         |
| Corriger      | if / ruby      |
| Supprimer     | drop           |
| Convertir     | mutate convert |
| Dates         | date           |
| Déduplication | fingerprint    |
| Router        | output if      |

Donc :

**Logstash = nettoyage + transformation + préparation des données.**

---

# Cas pratique guidé (TMDB) - objectif et préparation

Dataset cible :
`Latest 10000 Movies Dataset from TMDB export 2026-04-05 16-03-36.csv`

Préparation recommandée (plus simple à manipuler) :

1. Copier/renommer le fichier en `tmdb_movies.csv`
2. Le placer dans le dossier monté pour Logstash
3. Créer un index cible `tmdb_movies_clean`

Chemin dans le conteneur Logstash :

```text
/usr/share/logstash/logs/films/tmdb_movies.csv
```

Objectif :

* ingérer proprement le CSV
* corriger les champs principaux
* vérifier rapidement la qualité dans Elasticsearch

---

# Cas pratique guidé (TMDB) - étape 1 pipeline minimal

```conf
input {
  file {
    path => "/usr/share/logstash/logs/films/tmdb_movies.csv"
    start_position => "beginning"
    sincedb_path => "/tmp/tmdb_movies.sincedb"
  }
}

filter {
  csv {
    separator => ","
    skip_header => true
    columns => ["id","title","original_language","release_date","popularity","vote_average","vote_count","overview"]
  }
}

output {
  elasticsearch {
    hosts => ["http://elasticsearch:9200"]
    index => "tmdb_movies_clean"
  }
}
```

---

# Cas pratique guidé (TMDB) - étape 2 nettoyage méthodique

Ajouts utiles dans `filter` :

```conf
mutate {
  strip => ["title", "overview"]
  lowercase => ["original_language"]
  gsub => ["vote_count", "[^0-9]", ""]
  convert => {
    "vote_count" => "integer"
    "vote_average" => "float"
    "popularity" => "float"
  }
}

if [vote_average] > 10 { mutate { replace => { "vote_average" => 10 } } }
if [vote_average] < 0 { mutate { replace => { "vote_average" => 0 } } }
if [title] == "" { drop {} }

date { match => ["release_date", "dd-MM-yyyy", "yyyy-MM-dd"] target => "@timestamp" }
```

Principe :
parse -> nettoyer -> convertir -> corriger -> dater -> supprimer invalides.

---

# Cas pratique guidé (TMDB) - étape 3 exécution et validation

Lancer l'ingestion :

```bash
docker compose exec logstash logstash -f /usr/share/logstash/pipeline/logstash.conf
```

Rejouer l'ingestion complète (cas le plus fréquent en TP) :

```bash
docker compose exec logstash rm -f /tmp/tmdb_movies.sincedb
docker compose restart logstash
```

Ce que cela fait :

* suppression du `sincedb` -> Logstash oublie la position de lecture précédente
* `restart logstash` -> le pipeline repart et relit le fichier depuis le début

Vérifier dans Elasticsearch :

```bash
curl -s "http://localhost:9200/tmdb_movies_clean/_count?pretty"
curl -s "http://localhost:9200/tmdb_movies_clean/_search?size=3&pretty"
```

Checklist de fin :

* `title` non vide
* `vote_average` borné entre 0 et 10
* `vote_count` bien numérique
* `original_language` homogène (minuscule)
