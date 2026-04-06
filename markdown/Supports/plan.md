# Progression recommandée

## Objectif global

Construire une progression qui va:
- des bases Elasticsearch
- vers la recherche métier
- puis vers l'ingestion réelle
- et enfin vers l'automatisation avec Python avant le TP

---

## Ordre des supports (référence)

- `markdown/Supports/00_configuration.md`
- `markdown/Supports/01_introduction.md`
- `markdown/Supports/02_requetes.md`
- `markdown/Supports/03_aggregation.md`
- `markdown/Supports/03_02_agregation.md`
- `markdown/Supports/04_mapping.md`
- `markdown/Supports/05_analyser.md`
- `markdown/Supports/00_logstash.md`
- `markdown/Supports/00_modules_python.md`
- TP films (fichier dans `markdown/Exercices`)

---

## Découpage pédagogique

### Bloc A - Fondations Elasticsearch

- index, document, champ
- mapping dynamique puis explicite
- `text` vs `keyword`
- analyzer, tokens, index inversé
- requêtes de base: `match`, `term`, `bool`

Support principal:
- `01_introduction.md`
- `02_requetes.md`

### Bloc B - Analyse et exploration

- agrégations de base
- agrégations avancées avec runtime fields / `emit`
- lecture de résultats orientée analyse

Support principal:
- `03_aggregation.md`
- `03_02_agregation.md`

### Bloc C - Modélisation de la recherche

- mapping orienté cas métier
- analyzers personnalisés
- recherche multi-champs

Support principal:
- `04_mapping.md`
- `05_analyser.md`

### Bloc D - Ingestion réelle

- pipeline Logstash (`input -> filter -> output`)
- parsing CSV
- normalisation des types
- stratégie de vérification

Support principal:
- `00_logstash.md`

### Bloc E - Pilotage Python (à placer avant le TP)

- connexion à Elasticsearch depuis Jupyter
- création d'index et indexation via client Python
- requêtes Python pour vérifier ingestion et qualité des résultats
- préparation au rendu du TP (scripts reproductibles)

Support principal:
- `00_modules_python.md`

Positionnement:
- ce cours vient **après Logstash**
- ce cours vient **avant le TP films**

Pourquoi ce placement:
- les étudiants ont déjà les concepts Elasticsearch
- ils appliquent ensuite ces concepts en code Python sans nouvelle couche théorique lourde
- ils arrivent au TP avec une capacité de vérification plus fiable depuis notebook

---

## Transition proposée avant le TP

> Vous savez maintenant ingérer des données avec Logstash et interroger Elasticsearch en API REST.
> On ajoute une couche pratique: piloter les mêmes opérations depuis Python dans Jupyter pour automatiser les vérifications.
> Ensuite, vous appliquez ce workflow complet dans le TP films.

---

## Remarque de cadrage sur `00_modules_python.md`

Le support contient actuellement deux thèmes:
- client Python Elasticsearch
- qualité de données avec Great Expectations

Pour la progression du cours ELK:
- garder le bloc client Elasticsearch dans la séquence avant TP
- traiter Great Expectations en ouverture vers data quality (extension ou séance dédiée)
