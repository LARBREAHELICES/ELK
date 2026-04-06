
# Introduction
## ELK : bases théoriques avant la pratique

---

## Introduction à ELK

Pipeline cible du cours :

```text
Source (CSV / logs) -> Logstash -> Elasticsearch -> Kibana -> Jupyter
```

Dépôt du cours : [https://github.com/LARBREAHELICES/ELK](https://github.com/LARBREAHELICES/ELK)

---

## Schéma ELK du cours

<img src="assets/elk-pipeline-schema.svg" alt="Schéma du pipeline ELK du cours" style="width: 100%; max-width: 1320px; border-radius: 14px; border: 1px solid #263043;" />

---

## Repères historiques

- **2009** : naissance de **Logstash** (collecte et transformation de logs)
- **2010** : première version publique d'**Elasticsearch**
- **2013** : **Kibana** devient l'interface de visualisation la plus utilisée avec Elasticsearch
- **2015+** : arrivée de **Beats** pour la collecte légère sur serveurs/postes
- **2018** : l'écosystème est souvent présenté comme **Elastic Stack** (ELK + autres briques)

Le terme **ELK** reste très utilisé en pratique pour parler du pipeline central
Logstash + Elasticsearch + Kibana.

---

## À quoi sert ELK

ELK sert à traiter des données volumineuses et hétérogènes pour :

- centraliser des logs applicatifs et systèmes
- rechercher rapidement dans de grands volumes de texte
- produire des indicateurs (agrégations, tendances, anomalies)
- visualiser les résultats dans des dashboards exploitables

---

## Rôle des composants

- **Source** : fichiers, logs applicatifs, exports CSV/JSON
- **Logstash** : lit les données, parse, nettoie, transforme, enrichit
- **Elasticsearch** : indexe les documents et répond aux requêtes
- **Kibana** : explore les données et crée des visualisations
- **Jupyter** : automatise les vérifications et les analyses en Python

---

## Cycle de traitement des données

Le flux suit cette logique :

1. Lire les données brutes (`input`)
2. Transformer les champs (`filter`)
3. Indexer dans Elasticsearch (`output`)
4. Vérifier le résultat (mapping, volume, qualité)
5. Rechercher et analyser (requêtes + visualisation)

---

## Vocabulaire à maîtriser

- **Index** : conteneur logique de documents
- **Document** : objet JSON stocké dans Elasticsearch
- **Champ** : propriété d'un document (ex: `title`, `release_date`)
- **Mapping** : définition des types de champs
- **Analyzer** : traitement texte pour la recherche full-text
- **Agrégation** : calcul analytique (groupement, moyenne, histogramme, etc.)

---

## Pourquoi cette base est importante

Sans ces notions :

- on ingère mal les données (types incorrects, dates mal parsées)
- les recherches deviennent incohérentes
- les visualisations deviennent trompeuses

Avec ces notions :

- on construit des pipelines robustes
- on interprète correctement les résultats
- on peut passer rapidement d'un besoin métier à une requête fiable

---

## Transition vers la suite

> Après cette introduction, on enchaîne sur :
> configuration de l'environnement, prise en main Python/Jupyter, puis ingestion, mapping, recherche, agrégations et visualisation.
