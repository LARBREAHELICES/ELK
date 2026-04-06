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

# Pipeline de nettoyage — ordre correct

Toujours cet ordre :

```text
1. Parse (csv / grok / json)
2. Nettoyer texte (strip, lowercase, gsub)
3. Convert types
4. Corriger valeurs (if)
5. Date
6. Drop erreurs
7. Générer ID
8. Output
```

Si on change l’ordre → erreurs fréquentes.

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
