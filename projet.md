# Projet d'examen ELK — Movies Data Platform

##  Cadre
Projet à réaliser en équipe de 4.

Règles d'organisation:
1. Un lead technique est nommé.
2. Le dépôt Git doit être public.
3. Le travail doit être traçable via branches, Pull Requests et reviews.

---

## 1) Contexte
Vous devez construire une plateforme d'analyse de films avec la stack ELK à partir du dataset:

- `DATA/archive.zip` -> `movies.csv`

Si le dataset n'est pas présent, vous pouvez le récupérer depuis:
- https://www.kaggle.com/datasets/akshaypawar7/millions-of-movies/versions/67?resource=download

---

## 2) Objectif global
Livrer une solution reproductible qui permet de:

1. démarrer la stack ELK localement,
2. ingérer les données films,
3. nettoyer et typer les données de manière traçable,
4. indexer des données exploitables dans Elasticsearch,
5. produire des analyses et visualisations pertinentes dans Kibana,
6. démontrer une organisation projet professionnelle (Gitflow, PR, planning poker, répartition des features).

En complément, vous devez produire un document d'environ 5 pages qui décrit précisément vos choix, vos étapes, vos résultats et vos limites.

---

## 3) Contraintes techniques obligatoires

1. Utiliser un `docker-compose.yml` inspiré du cours, avec au minimum:
   - Elasticsearch
   - Kibana
   - Logstash
2. Monter un dossier `DATA` dans le conteneur Logstash en lecture seule (`ro`).
3. Mettre en place au minimum deux index:
   - `movies_raw` (ingestion brute)
   - `movies_clean` (données nettoyées et typées)
4. Définir un mapping explicite pour `movies_clean`.
5. Définir dans les settings au moins un analyzer personnalisé.
6. Livrer au moins 12 requêtes Elasticsearch commentées, dont 5 requêtes `bool`.
7. Livrer un dashboard Kibana avec 6 à 8 visualisations.

---

## 4) Cible d'architecture

### 4.1 Services attendus
- `elasticsearch`
- `kibana`
- `logstash`

### 4.2 Volumes recommandés
- `./logstash/pipeline/logstash.conf:/usr/share/logstash/pipeline/logstash.conf:ro`
- `./DATA:/data:ro`
- `./logs:/usr/share/logstash/logs:ro`

### 4.3 Flux attendu
`movies.csv` -> Logstash (parse + nettoyage) -> Elasticsearch (`movies_raw`, `movies_clean`) -> Kibana (Lens + Dashboard)

---

## 5) Exigences de qualité des données
Vous devez documenter précisément le nettoyage et la normalisation.

Champs du dataset à traiter (exemples):
- `id`, `title`, `genres`, `original_language`, `overview`, `popularity`, `production_companies`, `release_date`, `budget`, `revenue`, `runtime`, `status`, `tagline`, `vote_average`, `vote_count`, `credits`, `keywords`, `poster_path`, `backdrop_path`, `recommendations`

Points attendus:
1. conversion de types (`date`, `integer`, `float`, `keyword`, `text`),
2. gestion des valeurs manquantes/invalides,
3. normalisation des champs liste (`genres`, `keywords`, `credits`, etc.),
4. règles explicites de nettoyage dans Logstash,
5. mesure d'impact avant/après nettoyage.

---

## 6) Gestion de projet obligatoire

### 6.1 Gitflow imposé
Branches minimales:
- `main` : version stable / soutenance
- `dev` : intégration
- `feature/<id>-<slug>` : développement

### 6.2 Pull Requests
1. Interdiction de push direct sur `main` et `dev`.
2. PR obligatoires pour merger.
3. Minimum 1 reviewer par PR.
4. Commits explicites et historiques lisibles.

### 6.3 Planning poker
Le planning poker est une méthode d'estimation collaborative (souvent en échelle Fibonacci) pour estimer l'effort des features avant développement.

Vous devez produire un fichier `docs/planning_poker.md` avec:
1. le backlog des features,
2. l'échelle utilisée (1,2,3,5,8,13),
3. les estimations initiales,
4. l'estimation finale retenue,
5. les hypothèses,
6. la répartition des features par membre.

### 6.4 Implication individuelle
Chaque membre doit:
1. ouvrir au moins 1 PR,
2. reviewer au moins 1 PR,
3. être responsable d'au moins 1 feature.

---

## 7) Backlog minimum attendu

1. **F1 - Bootstrap stack**
   - Docker Compose opérationnel
   - scripts de lancement/arrêt
   - vérifications santé des services

2. **F2 - Ingestion brute**
   - lecture de `movies.csv`
   - indexation dans `movies_raw`
   - preuve d'ingestion (`_count` + échantillon)

3. **F3 - Nettoyage & normalisation**
   - conversions de types
   - parsing date
   - normalisation des listes
   - traitement des anomalies
   - indexation dans `movies_clean`

4. **F4 - Mapping & qualité data**
   - mapping explicite
   - analyzer personnalisé
   - contrôle qualité avant/après

5. **F5 - Requêtes analytiques**
   - 12 requêtes DSL commentées
   - au moins 5 requêtes `bool`
   - cas métier exploitables

6. **F6 - Dataviz Kibana**
   - 6 à 8 visualisations
   - 1 dashboard structuré
   - lecture métier des résultats

7. **F7 - Documentation finale**
   - runbook technique
   - dictionnaire de données
   - documentation nettoyage
   - documentation projet

---

## 8) Ordre conseillé de réalisation

1. Kick-off, Gitflow, planning poker, répartition
2. Ingestion brute + vérification
3. Nettoyage + mapping + qualité
4. Requêtes analytiques
5. Dashboard Kibana + narration
6. Finalisation documentation

---

## 9) Livrables attendus

1. code source complet (repo propre),
2. `docker-compose.yml` opérationnel,
3. pipeline Logstash versionné,
4. mapping Elasticsearch versionné,
5. dossier `docs/` complet,
6. export Kibana (`.ndjson`) des visualisations/dashboard,
7. script de démo `docs/demo_script.md`,
8. document synthèse (~5 pages).

### Documentation obligatoire
1. `docs/data_dictionary.md`
2. `docs/data_cleaning.md`
3. `docs/runbook.md`
4. `docs/project_management.md`
5. `docs/planning_poker.md`

---

## 10) Soutenance
1. Démo technique
2. Lecture métier des résultats
3. Questions/réponses

---

## 11) Critères de validation finale
Le projet est validé si:

1. la stack démarre sans erreur,
2. `movies_raw` et `movies_clean` existent et sont vérifiables,
3. le nettoyage est documenté et mesuré,
4. les PR et reviews sont traçables,
5. le dashboard répond à des questions métier,
6. la démonstration est reproductible sur une machine vierge.

---

## 12) Bonus (optionnel)
Si le périmètre principal est terminé:
1. implémenter un mini moteur de recherche (API ou UI),
2. ajouter une logique de scoring,
3. comparer plusieurs analyzers et justifier le choix final.

---

## 13) Grille d'évaluation

| Axe | Critères observables | Points |
| --- | --- | --- |
| Technique ELK | Stack opérationnelle, ingestion `movies_raw` et `movies_clean`, mapping explicite, requêtes DSL pertinentes, dashboard exploitable | 50 |
| Documentation data & nettoyage | Dictionnaire complet, règles de nettoyage justifiées, mesures avant/après, runbook exécutable | 20 |
| Gestion de projet | Gitflow respecté, PR/reviews traçables, planning poker documenté, répartition claire des features | 20 |
| Restitution & reproductibilité | Démo claire, lecture métier pertinente, projet relançable par un tiers | 10 |
| **Total** |  | **100** |

### Détail indicatif par axe

**Technique ELK (50 pts)**
- 10 pts : Docker Compose et services opérationnels
- 10 pts : Ingestion brute fiable (`movies_raw`)
- 10 pts : Nettoyage + mapping qualité (`movies_clean`)
- 10 pts : Requêtes Elasticsearch (volume + qualité)
- 10 pts : Dashboard Kibana (lisibilité + utilité métier)

**Documentation data & nettoyage (20 pts)**
- 8 pts : Dictionnaire de données précis
- 8 pts : Règles de nettoyage argumentées + mesures d'impact
- 4 pts : Runbook clair et reproductible

**Gestion de projet (20 pts)**
- 8 pts : Qualité du Gitflow + PR
- 6 pts : Qualité des reviews
- 6 pts : Planning poker + répartition des features

**Restitution & reproductibilité (10 pts)**
- 5 pts : Clarté de la démonstration
- 5 pts : Capacité à relancer le projet sans assistance
