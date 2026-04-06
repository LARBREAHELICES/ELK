# TP Application Films Full-Stack

## Objectif

Concevoir une application de recherche films connectée de bout en bout :

- ingestion CSV avec Logstash
- indexation et recherche dans Elasticsearch
- API FastAPI comme point d'entrée unique
- interface React + TypeScript + TanStack Query
- exploration et contrôle dans Kibana

---

## Contexte technique

Dossier de travail :

`/Users/antoinelucsko/Desktop/HETIC/ELK/app-films`

Stack attendue :

- Front : React + TypeScript + TanStack Query
- Back : FastAPI
- Data pipeline : Logstash -> Elasticsearch
- Dataviz : Kibana

---

## Préparation de l'environnement

1. Copier la configuration d'environnement.
2. Vérifier que le CSV TMDB est présent dans `app-films/data`.
3. Démarrer la stack Docker.
4. Vérifier que les services sont accessibles.

Commandes de départ :

```bash
cd /Users/antoinelucsko/Desktop/HETIC/ELK/app-films
cp .env.example .env
cp ../sandbox/data/*TMDB*.csv ./data/
docker compose up -d --build
docker compose ps
```

---

## Étape 1 - Ingestion et qualité des données

Travail demandé :

- valider que Logstash lit bien le fichier CSV TMDB
- vérifier l'index cible `tmdb-movies`
- contrôler le mapping des champs clés (`title`, `release_date`, `vote_average`, `vote_count`)
- identifier les documents incomplets ou mal parsés

Questions :

1. Quel est le volume de documents indexés dans `tmdb-movies` ?
2. Quels champs sont de type numérique ?
3. Quel champ sert de date exploitable pour les tris temporels ?
4. Combien de documents n'ont pas de résumé exploitable ?

---

## Étape 2 - API FastAPI (moteur de recherche unique)

Travail demandé :

Implémenter ou compléter les endpoints suivants :

- `GET /health`
- `GET /search` avec paramètres :
  - `q`, `page`, `size`, `sort`
  - `language`, `min_rating`, `year_from`, `year_to`
- `GET /suggest` pour l'auto-complétion sur les titres

Contraintes :

- l'API ne doit pas exposer Elasticsearch directement au front
- la pagination doit être stable
- la réponse doit inclure les résultats et au moins une facette (langue)

Questions :

1. Quelle structure de réponse renvoyez-vous pour `GET /search` ?
2. Quels modes de tri sont disponibles et comment sont-ils appliqués ?
3. Quelle stratégie utilisez-vous pour les suggestions (`/suggest`) ?

---

## Étape 3 - Front React + TypeScript + TanStack Query

Travail demandé :

Construire une interface qui permet :

- recherche texte
- filtres (langue, note minimale, période)
- tri
- pagination
- affichage clair des cartes films
- auto-complétion sur le champ recherche

Contraintes UX :

- état de chargement visible
- état vide explicite
- état erreur lisible
- aucune requête Elasticsearch directe depuis le navigateur

Questions :

1. Quels `queryKey` TanStack Query utilisez-vous ?
2. Comment évitez-vous les requêtes trop fréquentes lors de la saisie ?
3. Quelles informations affichez-vous dans chaque carte film ?

---

## Étape 4 - Contrôle dans Kibana

Travail demandé :

- créer une Data View sur `tmdb-movies`
- vérifier les champs disponibles
- produire un mini tableau de bord avec :
  - répartition par langue
  - top films par popularité
  - évolution du volume de sorties par année

Questions :

1. Quelle visualisation est la plus adaptée pour chaque indicateur ?
2. Quels filtres globaux appliquez-vous pour analyser une période précise ?
3. Que constatez-vous sur la distribution des langues ?

---

## Étape 5 - Validation bout en bout

Démontrer le flux complet :

`CSV -> Logstash -> Elasticsearch -> FastAPI -> React -> Kibana`

Checklist de validation :

1. Une recherche simple retourne des films attendus.
2. Un filtre langue modifie bien les résultats.
3. La pagination renvoie des pages différentes.
4. Les suggestions remontent des titres cohérents.
5. Kibana affiche les mêmes ordres de grandeur que l'API.

---

## Livrables attendus

1. Le dépôt `app-films` fonctionnel.
2. Les endpoints FastAPI documentés via `/docs`.
3. Une capture du front avec recherche + filtres.
4. Une capture Kibana du dashboard.
5. Une note technique courte :
   - choix de query Elasticsearch
   - choix TanStack Query
   - principales limites observées

---

## Critères d'évaluation

- Robustesse technique (pipeline + API + front)
- Pertinence des requêtes Elasticsearch
- Qualité de l'intégration front/back
- Lisibilité de l'interface
- Qualité de l'analyse finale

