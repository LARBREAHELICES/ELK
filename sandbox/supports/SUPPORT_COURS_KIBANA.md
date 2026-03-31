# Support de Cours: Comprendre Kibana

## 1. Objectif
Comprendre ce que fait Kibana, comment il lit Elasticsearch, et comment construire une analyse utile de tes donnees.

## 2. Kibana en 1 phrase
Kibana est l interface qui permet d explorer, filtrer, agreger et visualiser les donnees stockees dans Elasticsearch.

## 3. Les notions de base

1. Index
- Un index Elasticsearch est un ensemble de documents JSON.
- Exemples de la stack:
  - `app-logs-*`
  - `products_demo`

2. Data View (ancien "Index Pattern")
- Un Data View est une "porte d entree" Kibana vers un ou plusieurs index.
- Exemples:
  - Data View `app-logs-*`
  - Data View `products_demo`

3. Champ temporel
- Si possible, on choisit `@timestamp` comme champ temps.
- Cela active les filtres temporels dans Kibana.

4. KQL (Kibana Query Language)
- Langage de filtre simple dans Discover.
- Exemples:
  - `level: "ERROR"`
  - `service: "api" and level: "INFO"`
  - `brand: "Acme" and price > 80`

## 4. Les ecrans principaux

1. Discover
- Pour voir les documents bruts.
- Ideal pour debug et verification de pipeline.

2. Lens
- Pour faire des graphes rapidement (barres, lignes, secteurs, metriques).

3. Dashboard
- Assemble plusieurs visualisations sur une meme page.

4. Dev Tools
- Console pour executer des requetes Elasticsearch (`GET index/_search`).

## 5. Parcours pratique guide

## Etape A - Creer les Data Views
1. Aller sur `Stack Management -> Data Views`.
2. Creer:
- `app-logs-*` avec champ temps `@timestamp`
- `products_demo` avec champ temps `created_at` (si disponible) sinon sans temps.

## Etape B - Explorer les logs (Discover)
1. Ouvrir Discover sur `app-logs-*`.
2. Ajouter colonnes: `@timestamp`, `service`, `level`, `log_message`.
3. Tester filtres KQL:
```text
level: "ERROR"
service: "billing"
```
4. Observer:
- volume de logs
- repartition par niveau
- messages d erreur.

## Etape C - Explorer les produits (Discover)
1. Ouvrir Discover sur `products_demo`.
2. Ajouter colonnes: `name`, `brand`, `price`, `in_stock`.
3. Tester:
```text
brand: "Acme" and in_stock: true
```

## Etape D - Construire 2 visualisations (Lens)
1. Visualisation logs
- Type: bar chart
- Axe X: `@timestamp` (date histogram)
- Axe Y: `Count`
- Breakdown: `level`

2. Visualisation produits
- Type: bar chart
- Axe X: `brand`
- Axe Y: moyenne de `price`

## Etape E - Dashboard final
1. Creer dashboard `ELK Demo`.
2. Ajouter les 2 visualisations.
3. Ajouter un filtre global (ex: `service: "api"` ou `brand: "Acme"`).

## 6. Comment Kibana "travaille" techniquement

1. Tu choisis un Data View.
2. Kibana construit une requete Elasticsearch JSON.
3. Elasticsearch execute la requete et renvoie des resultats.
4. Kibana rend les resultats (table, graphe, metrique).

Important:
- Kibana ne stocke pas les donnees metier.
- Les donnees restent dans Elasticsearch.
- Kibana stocke surtout la configuration (dashboards, visualisations, data views).

## 7. Requetes utiles (Dev Tools)

Nombre total de logs:
```json
GET app-logs-*/_count
```

Top services:
```json
GET app-logs-*/_search
{
  "size": 0,
  "aggs": {
    "services": {
      "terms": { "field": "service.keyword" }
    }
  }
}
```

Prix moyen par marque:
```json
GET products_demo/_search
{
  "size": 0,
  "aggs": {
    "brands": {
      "terms": { "field": "brand" },
      "aggs": {
        "avg_price": { "avg": { "field": "price" } }
      }
    }
  }
}
```

## 8. Erreurs frequentes

1. "No results found"
- verifier la periode temporelle en haut a droite
- verifier le Data View cible.

2. Champ absent dans Lens
- verifier mapping dans Elasticsearch
- verifier que le champ existe dans les documents.

3. Filtres qui ne matchent pas
- tester sans guillemets puis avec guillemets
- verifier type de champ (`text` vs `keyword`).

## 9. Check de fin de cours
Tu dois savoir:
1. creer un Data View
2. lire des documents dans Discover
3. filtrer en KQL
4. creer 1 visualisation Lens
5. assembler un dashboard.
