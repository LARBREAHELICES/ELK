# Introduction
## Parcours ELK du cours

---

## Introduction à ELK

Pipeline cible du cours :

```text
Source (CSV / logs) -> Logstash -> Elasticsearch -> Kibana -> Jupyter
```

Schéma ELK du cours :

```text
                    +--------------------+
                    | Sources de données |
                    | CSV / logs / JSON  |
                    +---------+----------+
                              |
                              v
                    +--------------------+
                    |      Logstash      |
                    | parse / nettoie /  |
                    | transforme / route |
                    +---------+----------+
                              |
                              v
                    +--------------------+
                    |   Elasticsearch    |
                    | indexe / recherche |
                    | agrégations        |
                    +-----+---------+----+
                          |         |
                          v         v
               +----------------+  +----------------+
               |     Kibana     |  |    Jupyter     |
               | explore / vis. |  | tests / contrôles |
               +----------------+  +----------------+
```

---

## Bloc Fondations Elasticsearch

Compétences visées :
- comprendre index, document, champ
- distinguer `text` et `keyword`
- écrire les requêtes de base (`match`, `term`, `bool`)

Supports :
- `01_introduction.md`
- `02_requetes.md`

---

## Bloc Analyse et lecture métier

Compétences visées :
- transformer des questions métier en agrégations
- lire des distributions et comparer des segments
- manipuler runtime fields / `emit` pour enrichir l'analyse

Supports :
- `03_aggregation.md`
- `03_02_agregation.md`

---

## Bloc Modélisation de la recherche

Compétences visées :
- choisir un mapping cohérent
- personnaliser l'analyse textuelle
- préparer une recherche multi-champs plus pertinente

Supports :
- `04_mapping.md`
- `05_analyser.md`

---

## Bloc Ingestion et qualité des données

Compétences visées :
- appliquer le flux `input -> filter -> output`
- nettoyer et transformer les données avant indexation
- exécuter, tester et rejouer un pipeline sans ambiguïté

Supports :
- `00_01_logstash.md` (logique de nettoyage)
- `00_logstash.md` (exécution, conventions et cas TMDB)

---

## Transition avant le TP

> Vous savez maintenant lire, transformer et indexer les données avec ELK,
> puis vérifier ces résultats depuis Python.
> Le TP films applique ce workflow complet sur un jeu de données réel.
