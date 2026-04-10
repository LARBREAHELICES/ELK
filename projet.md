# Projet d'examen ELK — Movies Data Platform

##  Cadre
Projet à réaliser en équipe de 4.

Règles d'organisation:
1. Un lead technique est nommé.
2. Le dépôt Git doit être public.
3. Le travail doit être traçable via branches, Pull Requests et reviews.

---

## 1) Contexte
Vous devez construire une plateforme d'analyse de films avec la stack `ELK`.

Vous pouvez :
1. utiliser le dataset de référence `movies.csv`,
2. ou utiliser un dataset de votre choix **à condition qu'il soit lié aux films/cinéma** (films, casting, box-office, recommandations, etc.).

Dataset de référence (assez technique) :
- https://www.kaggle.com/datasets/akshaypawar7/millions-of-movies/versions/67?resource=download

---

## 2) Objectif global
Livrer une solution reproductible qui permet de:

1. démarrer la stack ELK localement,
1. `ingérer` les données films,
1. nettoyer (`logstash`) et typer (`mappings`) les données de manière traçable,
1. indexer des données exploitables dans Elasticsearch,
1. produire des analyses et visualisations pertinentes dans Kibana,
1. démontrer une organisation projet professionnelle (Gitflow, PR, planning poker, répartition des features).

En complément, vous devez produire un document d'environ 5 pages qui décrit précisément vos choix, vos étapes, vos résultats et vos limites (voir à la fin du document pour plus de précision).  
Ce document doit impérativement contenir une partie dédiée à la documentation des données (qualité, nettoyage, impact).

---

## 3) Contraintes techniques obligatoires

1. Utiliser un `docker-compose.yml` inspiré du cours, avec au minimum:
   - Elasticsearch
   - Kibana
   - Logstash
2. Monter un dossier `data` dans le conteneur Logstash en lecture seule (`ro`).
3. Mettre en place au minimum deux index:
   - `movies_raw` (ingestion brute)
   - `movies_clean` (données nettoyées et typées)
4. Définir un mapping explicite pour `movies_clean`.
5. Définir dans les settings au moins un analyzer personnalisé.
6. Livrer au moins 12 requêtes Elasticsearch commentées, dont 5 requêtes `bool`.
7. Livrer un dashboard Kibana avec 6 à 8 visualisations.
8. Implémenter un mini moteur de recherche (API ou UI) connecté à Elasticsearch.

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
`dataset_films.csv` -> Logstash (parse + nettoyage) -> Elasticsearch (`movies_raw`, `movies_clean`) -> Kibana (Lens + Dashboard)

---

## 5) Exigences de qualité des données
Vous devez documenter précisément le nettoyage et la normalisation.

Champs du dataset à traiter (exemples, si vous utilisez `movies.csv`):
- `id`, `title`, `genres`, `original_language`, `overview`, `popularity`, `production_companies`, `release_date`, `budget`, `revenue`, `runtime`, `status`, `tagline`, `vote_average`, `vote_count`, `credits`, `keywords`, `poster_path`, `backdrop_path`, `recommendations`

Si vous utilisez un autre dataset cinéma, adaptez ce dictionnaire et justifiez vos choix de typage/nettoyage.

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
- `main` : version stable
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

#### Aide: déroulement recommandé d'une session
1. Le lead présente une `user story` et ses critères d'acceptation.
2. L'équipe pose des questions de clarification (données, dépendances, risques).
3. Chaque membre vote en même temps avec une valeur Fibonacci (`1,2,3,5,8,13`).
4. En cas d'écart important, les estimations extrêmes justifient leur choix.
5. L'équipe revote jusqu'à convergence.
6. La valeur finale et les hypothèses sont notées dans `docs/planning_poker.md`.

#### Exemple de user story
**US-03 — Ingestion nettoyée dans `movies_clean`**  
En tant qu'analyste data, je veux indexer des données films nettoyées dans `movies_clean` afin de produire des visualisations fiables dans Kibana.

**Critères d'acceptation (exemple)**
1. `release_date` est indexé en `date`.
2. `vote_average`, `vote_count`, `runtime`, `popularity` sont typés correctement.
3. Les champs multi-valeurs (`genres`, `keywords`) sont normalisés.
4. Un contrôle avant/après est documenté dans `docs/data_cleaning.md`.

**Exemple d'estimation**
1. Votes initiaux: `3, 5, 8, 5`
2. Décision finale: `5`
3. Hypothèse: pas de changement majeur du format CSV.

#### Template à copier dans `docs/planning_poker.md`
```md
# Planning Poker

## 1) Participants
- Membre 1:
- Membre 2:
- Membre 3:
- Membre 4:

## 2) Échelle utilisée
Fibonacci: 1, 2, 3, 5, 8, 13

## 3) Stories estimées
| ID | User Story | Votes initiaux | Estimation finale | Hypothèses | Owner |
| --- | --- | --- | --- | --- | --- |
| US-01 |  |  |  |  |  |
| US-02 |  |  |  |  |  |
| US-03 |  |  |  |  |  |
| US-04 |  |  |  |  |  |

## 4) Décisions de découpage
- Story:
  - Découpage:
  - Risque:
  - Action:

## 5) Répartition finale des features
- Membre 1:
- Membre 2:
- Membre 3:
- Membre 4:
```

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

8. **F8 - Moteur de recherche**
   - mini moteur connecté à Elasticsearch
   - recherche full-text sur les films
   - au moins un filtre simple (langue, genre, année, etc.)

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
8. démonstration visuelle courte (`docs/demo.gif`) montrant la démo technique,
9. mini moteur de recherche fonctionnel,
10. document synthèse (~5 pages).

### Documentation obligatoire
1. `docs/data_dictionary.md`
2. `docs/data_cleaning.md`
3. `docs/runbook.md`
4. `docs/project_management.md`
5. `docs/planning_poker.md`

### Exigence obligatoire pour le document synthèse (~5 pages)
Le document synthèse doit inclure explicitement :
1. une section **Documentation des données**,
2. les anomalies observées,
3. les règles de nettoyage appliquées,
4. une mesure d'impact avant/après.

---

## 10) Démonstration asynchrone (pas de soutenance)
L'évaluation se fait sans soutenance orale.

### Preuve de démonstration à déposer
Vous devez déposer dans le repo:
1. un **GIF animé court** (`docs/demo.gif`) qui montre la démo technique principale,
2. un script associé (`docs/demo_script.md`) pour expliquer ce qui est montré.

Recommandation: garder un GIF court (poids raisonnable) et lisible, avec un parcours clair.

---

## 11) Critères de validation finale
Le projet est validé si:

1. la stack démarre sans erreur,
2. `movies_raw` et `movies_clean` existent et sont vérifiables,
3. la documentation des données est présente, claire et exploitable,
4. le nettoyage est documenté et mesuré,
5. les PR et reviews sont traçables,
6. le dashboard répond à des questions métier,
7. le mini moteur de recherche fonctionne et est démontrable,
8. un GIF de démonstration (`docs/demo.gif`) est présent dans le dépôt,
9. la démonstration est reproductible sur une machine vierge.

---

## 12) Moteur de recherche (obligatoire, peu noté)
Le mini moteur de recherche est obligatoire, avec une pondération faible dans la note finale.

Exigences minimales:
1. interface API ou UI (technologie libre),
2. recherche full-text sur un champ textuel (`title`, `overview`, etc.),
3. au moins un filtre exact (langue, genre, année, etc.),
4. démonstration d'usage dans `docs/demo_script.md`.

Améliorations possibles (optionnelles):
1. ajouter une logique de scoring,
2. comparer plusieurs analyzers,
3. ajouter une pagination avancée.

---

## 13) Grille d'évaluation

| Axe | Critères observables | Points |
| --- | --- | --- |
| Technique ELK | Stack opérationnelle, ingestion `movies_raw` et `movies_clean`, mapping explicite, requêtes DSL pertinentes, dashboard exploitable | 45 |
| Moteur de recherche | Mini moteur connecté à Elasticsearch, recherche + filtre, démonstration fonctionnelle | 5 |
| Documentation data & nettoyage | Dictionnaire complet, règles de nettoyage justifiées, mesures avant/après, runbook exécutable | 20 |
| Gestion de projet | Gitflow respecté, PR/reviews traçables, planning poker documenté, répartition claire des features | 20 |
| Restitution & reproductibilité | Démo claire, lecture métier pertinente, projet relançable par un tiers | 10 |
| **Total** |  | **100** |

### Détail indicatif par axe

**Technique ELK (45 pts)**
- 10 pts : Docker Compose et services opérationnels
- 10 pts : Ingestion brute fiable (`movies_raw`)
- 10 pts : Nettoyage + mapping qualité (`movies_clean`)
- 10 pts : Requêtes Elasticsearch (volume + qualité)
- 5 pts : Dashboard Kibana (lisibilité + utilité métier)

**Moteur de recherche (5 pts)**
- 5 pts : Moteur fonctionnel (recherche + au moins un filtre + démonstration)

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

---

## 14) Plan du document final 

1. **Contexte, objectifs et périmètre** (~0,5 page)  
   Problème traité, objectifs techniques/métier, périmètre réalisé vs non réalisé.

2. **Architecture et environnement** (~0,5 à 1 page)  
   Schéma de la stack ELK, description du `docker-compose`, flux de données de `movies.csv` au dashboard.

3. **Données et nettoyage (obligatoire)** (~1 à 1,5 page)  
   Description des colonnes, anomalies détectées, règles Logstash appliquées, comparaison avant/après.

4. **Modélisation Elasticsearch** (~0,5 à 1 page)  
   Mapping de `movies_clean`, choix `text`/`keyword`, analyzer personnalisé et justification.

5. **Requêtes et analyses** (~1 page)  
   Requêtes principales (dont `bool`), exemples de requêtes valides/non valides, résultats obtenus.

6. **Dashboard Kibana et lecture métier** (~0,5 page)  
   Synthèse des visualisations, insights métier, limites d'interprétation.

7. **Gestion de projet et collaboration** (~0,5 page)  
   Gitflow, PR/reviews, planning poker, répartition des features.

8. **Bilan, limites et améliorations** (~0,5 page)  
   Retour d'expérience, points bloquants, axes d'amélioration.

---

## 15) Démarche PR (guide détaillé débutant)

Objectif : travailler proprement avec `dev` et des branches `feature/*`, sans se bloquer.

### 15.1 Ordre conseillé de merge des features
1. `feature/bootstrap-stack`
2. `feature/ingestion-raw`

...

Pourquoi cet ordre : chaque étape dépend de la précédente (infrastructure -> data -> recherche -> visualisation -> docs).

### 15.2 Étape 1 - Se synchroniser avant de commencer
But : partir d'une base propre.

```bash
git checkout dev
git pull
```

À vérifier :
1. Vous êtes bien sur `dev`. (vérifier que vous êtes sur la bonne branche : `git branch`, touche `q` pour sortir)
2. Le `git pull` ne renvoie pas d'erreur.

### 15.3 Étape 2 - Créer une branche de feature
But : isoler votre travail.

```bash
git checkout -b feature/nom-court
```

Exemple : `feature/ingestion-raw`

### 15.4 Étape 3 - Développer puis commit
But : sauvegarder un état clair.

```bash
git add .
git commit -m "feat: ingestion raw movies"
```

Bonnes pratiques :
1. Un commit = une idée claire.
2. Message de commit explicite.

### 15.5 Étape 4 - Pousser la branche sur GitHub
But : rendre la branche visible pour ouvrir une PR.

```bash
git push origin feature/nom-court
```

### 15.6 Étape 5 - Ouvrir la Pull Request
Sur GitHub :
1. Cliquer sur `Compare & pull request`.
2. Choisir :
   - `base` = `dev`
   - `compare` = `feature/nom-court`
3. Remplir la PR :
   - objectif,
   - changements réalisés,
   - comment tester,
   - captures/logs si utile.

### 15.7 Étape 6 - Faire reviewer
1. Demander au moins 1 reviewer.
2. Le reviewer vérifie :
   - que la feature fonctionne,
   - que le code est lisible,
   - que la doc est mise à jour.

### 15.8 Étape 7 - Corriger les retours
Si on vous demande des corrections :

```bash
git add .
git commit -m "fix: prise en compte review PR"
git push
```

La PR se met à jour automatiquement.

### 15.9 Étape 8 - Merger dans `dev`
Quand la PR est validée :
1. cliquer sur `Merge pull request`,
2. supprimer la branche feature côté GitHub.

Puis, en local :
```bash
git checkout dev
git pull
```

### 15.10 Mini checklist avant chaque merge
1. `docker compose up -d` fonctionne.
2. La feature est testée.
3. Les fichiers de documentation liés à la feature sont à jour.
4. La PR a été relue et approuvée.

### 15.11 Erreurs fréquentes à éviter
1. Push direct sur `dev` ou `main` (interdit).
2. PR trop grosse (préférer des PR courtes).
3. Oublier de mettre à jour la doc.
4. Attendre trop longtemps avant d'ouvrir la PR.
