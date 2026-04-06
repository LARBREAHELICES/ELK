# TP Films (2h) - Logstash + Elasticsearch (TMDB 10 000 films)

## But du TP

Construire une chaine d'ingestion complete avec un dataset TMDB reel:
- ingestion CSV avec Logstash
- conversion des types
- parsing de date
- indexation Elasticsearch
- analyses metier

Duree cible: **2 heures**.

---

## Dataset utilise

Fichier source:

`sandbox/data/Latest 10000 Movies Dataset from TMDB export 2026-04-05 16-03-36.csv`

Colonnes detectees:
- `index`
- `title`
- `original_language`
- `release_date` (format `dd-MM-yyyy`)
- `popularity`
- `vote_average`
- `vote_count`
- `overview`

Volume: **10 001 lignes** (1 header + 10 000 films).

---

## Demarrage Docker (copier-coller)

```bash
cd /Users/antoinelucsko/Desktop/HETIC/ELK/sandbox

# Mettre la conf TP en place (fichier à compléter par les étudiants)
cp ../markdown/Exercices/logstash.conf ./logstash.conf

# Vérifier le dataset
ls -lh ./data/*TMDB*.csv

# Démarrer les services utiles
docker compose up -d elasticsearch kibana logstash

# Tester la config Logstash
docker compose run --rm logstash --config.test_and_exit -f /usr/share/logstash/pipeline/logstash.conf

# Forcer une réingestion propre (optionnel)
docker compose exec logstash rm -f /tmp/logstash_tmdb_movies.sincedb
docker compose restart logstash

# Logs
docker compose logs -f --tail=200 logstash
```

---

## Etape 1 - Construire le pipeline Logstash (40 min)

### Travail demandé

Créer/compléter `sandbox/logstash.conf` pour:
- lire le CSV TMDB depuis `/data`
- parser les colonnes CSV
- ignorer le header
- renommer `index` en `movie_id`
- convertir les types numériques
- parser `release_date` en champ date exploitable
- indexer dans `tmdb-movies`

### Contraintes

- le pipeline doit fonctionner avec le fichier CSV fourni
- les champs numériques ne doivent pas rester en texte
- le pipeline doit être relançable après suppression du `sincedb`

### Vérification minimale

- l'index `tmdb-movies` existe
- le `count` est cohérent avec le volume attendu

---

## Etape 2 - Contrôle qualité (20 min)

### Travail demandé

Vérifier que:
- `movie_id` est bien numérique
- `popularity` et `vote_average` sont numériques
- `vote_count` est numérique
- le champ date issu de `release_date` est bien présent
- les documents problématiques (date absente ou invalide) sont identifiés

### Questions

1. Combien de documents n'ont pas de date parsée exploitable ?
2. Quel est le type réel des champs numériques dans le mapping ?
3. Avez-vous des valeurs anormales évidentes (ex: `vote_average` hors plage) ?

---

## Etape 3 - Analyses metier (40 min)

Écrire vos requêtes Elasticsearch pour répondre aux questions suivantes:

1. Quelles sont les 10 langues les plus représentées ?
2. Quels sont les 10 films les plus populaires ?
3. Quels films ont une note élevée **et** un volume de votes significatif ?
4. Comment évolue le volume de sorties de films par année ?

### Contraintes

- utilisez des agrégations quand c'est nécessaire
- limitez les champs retournés quand vous listez les films
- ajoutez un tri pertinent dans les listes

---

## Bonus (10 min)

1. Créer une logique de classement `quality_band` (`A`, `B`, `C`) basée sur `vote_average`.
2. Compter le nombre de films par `quality_band`.

---

## Erreurs frequentes (a corriger vite)

1. `count = 0`
- vérifier le chemin du CSV dans le conteneur (`/data/...`)
- vérifier que `sandbox/logstash.conf` est bien pris en compte

2. Pas de réingestion après modification
- supprimer le `sincedb`, puis redémarrer Logstash

3. Parsing CSV instable
- vérifier `separator`, `quote_char`, `columns`, `skip_header`

---

## Livrables attendus

1. Le pipeline Logstash utilisé (`sandbox/logstash.conf`)
2. Les commandes de vérification (`_count`, `_mapping`, `_search`)
3. Les requêtes utilisées pour les 4 questions métier
4. Une interprétation courte (2-3 lignes) pour chaque question

---

## Grille de temps recommandee

- 0:00 -> 0:10: setup Docker
- 0:10 -> 0:50: pipeline + ingestion
- 0:50 -> 1:10: contrôle qualité
- 1:10 -> 1:50: analyses métier
- 1:50 -> 2:00: bonus + rendu
