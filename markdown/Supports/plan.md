# Plan de cours ELK
## Progression pédagogique orientée UX

---

## Introduction à ELK

Pipeline cible du cours :

```text
Source (CSV / logs) -> Logstash -> Elasticsearch -> Kibana -> Jupyter
```

Ce que les étudiants doivent comprendre dès le départ :
- où chaque outil intervient
- ce qui transite entre les briques
- où diagnostiquer en cas d'erreur

---

## Ordre des supports

- `markdown/Supports/00_configuration.md`
- `markdown/Supports/01_introduction.md`
- `markdown/Supports/02_requetes.md`
- `markdown/Supports/03_aggregation.md`
- `markdown/Supports/03_02_agregation.md`
- `markdown/Supports/04_mapping.md`
- `markdown/Supports/05_analyser.md`
- `markdown/Supports/00_01_logstash.md`
- `markdown/Supports/00_logstash.md`
- `markdown/Supports/00_modules_python.md`
- TP films (`markdown/Exercices/tp-05-films-2h.md`)

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

## Bloc Automatisation avant TP

Compétences visées :
- piloter Elasticsearch depuis Jupyter
- automatiser les vérifications de mapping, volume, qualité
- préparer un rendu reproductible pour le TP

Support :
- `00_modules_python.md`

---

## Logique UX de la progression

Principes de séquencement :
- démarrer par une vue système claire (pipeline ELK)
- introduire une seule difficulté nouvelle à la fois
- passer des concepts aux manipulations, puis au cas réel
- conserver des points de contrôle explicites entre chaque bloc

Résultat attendu :
- une montée en charge progressive
- moins de friction au moment du TP
- meilleure autonomie sur le debug

---

## Transition avant le TP

> Vous savez maintenant lire, transformer et indexer les données avec ELK,
> puis vérifier ces résultats depuis Python.
> Le TP films applique ce workflow complet sur un dataset réel.
