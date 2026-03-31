# Support de Cours: Data View dans Kibana (detaille)

## 1. Pourquoi ce document
Quand Kibana affiche:
"You have data in Elasticsearch. Now, create a data view.",
cela veut dire:
- les donnees existent dans Elasticsearch
- mais Kibana ne sait pas encore "quelle famille d index" il doit lire.

Un Data View est cette "liaison" entre Kibana et tes index.

## 2. Definition simple
Un Data View (ancien nom: Index Pattern) est une configuration Kibana qui dit:
1. quels index cibler (`titanic_data`, `app-logs-*`, etc.)
2. quel champ temps utiliser (ou aucun)
3. quels champs sont disponibles pour Discover, Lens, Dashboards.

Important:
- Un Data View ne duplique pas les donnees.
- Un Data View ne cree pas de documents.
- Un Data View ne vit que dans Kibana (objet de configuration).

## 3. Pourquoi Kibana en a besoin
Elasticsearch peut avoir des dizaines d index.
Kibana doit savoir:
- lequel lire
- comment filtrer dans le temps
- quels champs exposer dans les ecrans d analyse.

Sans Data View, Kibana ne peut pas construire les requetes correctement.

## 4. Cas pratique dans ton projet

Tes index principaux:
1. `titanic_data` (docs importes depuis le notebook)
2. `app-logs-*` (docs ingeres par Logstash)
3. `products_demo` (docs de la demo PostgreSQL -> Elasticsearch)

Data Views recommandes:
1. `Titanic` -> pattern `titanic_data` -> sans champ temps
2. `Logs` -> pattern `app-logs-*` -> champ temps `@timestamp`
3. `Produits` -> pattern `products_demo` -> champ temps `created_at`

## 5. Creation pas a pas (UI Kibana)

## Etape 1
Aller dans:
`Kibana -> Stack Management -> Data Views -> Create data view`

## Etape 2
Renseigner:
- `Name`: nom lisible (ex: `Titanic`)
- `Index pattern`: nom d index ou wildcard (ex: `titanic_data`, `app-logs-*`)

## Etape 3
Choisir le champ temps:
- si index de logs: `@timestamp`
- si dataset sans date: `I don't want to use the time filter`

## Etape 4
Cliquer `Save`.

## Etape 5
Aller dans `Discover`, choisir le Data View, verifier les documents.

## 6. Comment choisir le champ temps

Choisir un champ temps est utile quand:
- tu veux filtrer par periode (Last 15 minutes, Last 7 days, etc.)
- tu fais des graphes temporels.

Ne pas choisir de champ temps quand:
- ton dataset n a pas de date fiable
- ton analyse n est pas temporelle.

Exemple:
- `titanic_data` ne contient pas de timestamp evenementiel: pas de time filter.
- `app-logs-*` contient `@timestamp`: time filter obligatoire/recommande.

## 7. Difference "index" vs "data view"

1. Index Elasticsearch
- contient les documents reels.
- se voit via:
```bash
curl "http://localhost:9200/_cat/indices?v"
```

2. Data View Kibana
- configuration d acces/lecture.
- se gere dans Stack Management.

Analogie:
- Index = dossier de fichiers reels
- Data View = raccourci intelligent vers ce dossier.

## 8. Verification complete (diagnostic)

Si tu ne vois rien dans Discover:

1. Verifier que l index existe
```bash
curl "http://localhost:9200/_cat/indices?v"
```

2. Verifier qu il contient des docs
```bash
curl "http://localhost:9200/titanic_data/_count?pretty"
```

3. Verifier le Data View
- pattern exact?
- wildcard correct?
- bon espace Kibana (si tu utilises plusieurs spaces)?

4. Verifier le filtre de temps
- si Data View avec champ temps: agrandir la periode
- sinon recreer sans time filter.

## 9. Erreurs frequentes et correction rapide

1. "No matching indices"
- le pattern est faux (`titanic-data` au lieu de `titanic_data`)
- l index n a pas encore ete cree par le notebook.

2. "No results found"
- docs absents
- mauvaise periode temporelle
- mauvais Data View selectionne dans Discover.

3. Champ manquant dans Lens
- mapping non conforme
- reouvrir le Data View (ou refresh field list).

## 10. Mini TP guide

## TP A - Titanic
1. Executer le notebook Titanic.
2. Creer Data View `Titanic` -> `titanic_data` -> sans time filter.
3. Dans Discover:
- afficher `sex`, `class`, `survived`, `fare`.
4. Dans Lens:
- chart 1: taux de survie moyen par `sex`
- chart 2: moyenne `fare` par `class`.

## TP B - Logs
1. Creer Data View `Logs` -> `app-logs-*` -> `@timestamp`.
2. Dans Discover, filtre KQL:
```text
level: "ERROR"
```
3. Dans Lens:
- date histogram sur `@timestamp`
- repartition par `level`.

## 11. Ce que tu dois retenir
1. Les documents vivent dans Elasticsearch, pas dans Kibana.
2. Kibana a besoin d un Data View pour savoir quoi lire.
3. Un Data View est une config, pas une copie de donnees.
4. Le choix du champ temps change fortement l experience Discover/Lens.
