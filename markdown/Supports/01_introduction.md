# Elasticsearch 

## Ordre des notions importantes dans cette base de données

1. Document JSON
2. Index
3. Mapping (text vs keyword)
4. Analyzer (tokenizer + filtres)
5. Tokens
6. Index inversé
7. match
8. term
9. bool (must + filter)

## Avant de commencer 

## Elasticsearch : idée générale

Elasticsearch est un moteur qui :

1. reçoit des documents JSON
2. analyse certains champs
3. construit des index de recherche
4. permet de rechercher très rapidement

Il ne stocke pas seulement des données → il construit des **structures de recherche**.

---

# Exemple fil rouge de l'introduction

Vous allez manipuler Elasticsearch comme si vous suiviez la santé d'un site web e-commerce.

## Objectif de ce cas

1. Identifier les endpoints qui échouent
2. Comprendre les pics de latence
3. Relier les logs bruts à une visualisation Kibana

---

## Données brutes (logs applicatifs)

```json
PUT web_monitoring/_doc/1
{
  "timestamp": "2026-04-07T09:00:00Z",
  "endpoint": "/checkout",
  "status": 500,
  "response_time_ms": 812,
  "message": "Timeout payment provider"
}
```

```json
PUT web_monitoring/_doc/2
{
  "timestamp": "2026-04-07T09:00:05Z",
  "endpoint": "/search",
  "status": 200,
  "response_time_ms": 142,
  "message": "Search request completed"
}
```

---

```json
PUT web_monitoring/_doc/3
{
  "timestamp": "2026-04-07T09:00:08Z",
  "endpoint": "/checkout",
  "status": 200,
  "response_time_ms": 265,
  "message": "Payment accepted"
}
```

## Questions que vous allez pouvoir résoudre

1. Quel endpoint génère le plus d'erreurs ?
2. Où la latence devient-elle critique ?
3. Quels messages reviennent le plus souvent dans les logs ?

---

## Exemple réel de dataviz Kibana (Lens)

<img src="https://static-www.elastic.co/v3/assets/bltefdd0b53724fa2ce/blt5bf7610cab1034cf/68b775ef981e9660952a236f/screenshot-lens-switch-chart-index-landing-page.webp" alt="Capture d'écran Kibana Lens" style="width: 92%; max-width: 1180px; max-height: 68vh; border-radius: 12px; border: 1px solid #2b3a55;" />

---

## Exemple de lecture rapide

```json
GET web_monitoring/_search
{
  "query": {
    "bool": {
      "filter": [
        { "term": { "endpoint": "/checkout" } }
      ],
      "must": [
        { "match": { "message": "timeout" } }
      ]
    }
  }
}
```

Ce cas fil rouge vous servira ensuite pour comprendre les requêtes, les agrégations, les analyseurs et les dashboards.

---

# Structure d'Elasticsearch

| Base SQL        | Elasticsearch        |
| --------------- | -------------------- |
| Base de données | Index                |
| Table           | (équivalent logique) |
| Ligne           | Document JSON        |
| Colonne         | Champ                |
| Id              | _id                  |

**Schéma :**

```text
Index
 └── Documents (JSON)
       └── Fields
```

---

# Création d'un index et mapping

## Création automatique d'un index

Quand on envoie un document JSON à Elasticsearch :

```json
PUT shakespeare/_doc/1
{
  "play_name": "Hamlet",
  "speaker": "HAMLET",
  "text_entry": "To be or not to be"
}
```

Si l'index **shakespeare** n'existe pas, Elasticsearch :

1. crée automatiquement l'index
2. devine les types des champs (mapping dynamique)
3. indexe le document
4. construit les index de recherche

On appelle cela le **mapping dynamique**.

---

## Introduction aux bonnes pratiques : créer le mapping soi-même


```json
PUT shakespeare
{
  "mappings": {
    "properties": {
      "play_name": { "type": "keyword" },
      "speaker": { "type": "keyword" },
      "text_entry": { "type": "text" }
    }
  }
}
```

Puis on indexe les documents.

**Indexer un document = insérer une donnée + la rendre recherchable.**

Sans précision de votre part, Elasticsearch utilise le mapping dynamique.

---

# Données Shakespeare

On va travailler avec des documents simples :

```json
PUT shakespeare/_doc/1
{
  "play_name": "Hamlet",
  "speaker": "HAMLET",
  "text_entry": "To be, or not to be: that is the question."
}
```

```json
PUT shakespeare/_doc/2
{
  "play_name": "Macbeth",
  "speaker": "LADY MACBETH",
  "text_entry": "Out, damned spot! out, I say!"
}
```

```json
PUT shakespeare/_doc/3
{
  "play_name": "Othello",
  "speaker": "OTHELLO",
  "text_entry": "She loved me for the dangers I had passed."
}
```

Chaque ligne = **un document JSON**.

## Exercice

1. Pour ces 3 exemples, créez l'index et les documents dans `Elasticksearch` dans Jupyter.
2. Créez un DataFrame Pandas pour présenter les données.

---

# Lire les documents

## Lire un document

```json
GET shakespeare/_doc/1
```

## Lire tous les documents

```json
GET shakespeare/_search
```

| Action           | Requête           |
| ---------------- | ----------------- |
| Ajouter document | PUT index/_doc/1  |
| Lire 1 document  | GET index/_doc/1  |
| Lire tous        | GET index/_search |

---

# Que se passe-t-il quand Elasticsearch reçoit un JSON ?

Quand vous envoyez un document, Elasticsearch fait :

| Étape | Action                    |
| ----- | ------------------------- |
| 1     | stocke le JSON            |
| 2     | analyse les champs texte  |
| 3     | construit l'index inversé |
| 4     | prépare les filtres       |

---

# Introduction au Analyzer 

Pour les champs `text`, Elasticsearch applique :

```text
Tokenizer + Filtres = Analyzer
```

### Exemple

Texte :

```text
To be, or not to be: that is the question
```

### Tokenizer :

```text
[to] [be] [or] [not] [to] [be] [that] [is] [the] [question]
```

### Filtres :

```text
[to] [be] [not] [be] [question]
```

Ces mots deviennent des **tokens**.

---

# Index inversé

Elasticsearch construit une table :

| Token    | Documents |
| -------- | --------- |
| to       | 1         |
| be       | 1         |
| not      | 1         |
| question | 1         |
| out      | 2         |
| damned   | 2         |
| spot     | 2         |
| loved    | 3         |
| dangers  | 3         |

C'est **l'index inversé** :

> mot → documents

C'est ce qui permet la recherche rapide. 

## Application 

Testez le code suivant pour voir les tokens créer par Elasticsearch.

```json
url = "http://elasticsearch:9200/shakespeare/_termvectors/1"

data = {
    "fields": ["text_entry"]
}

response = requests.get(url, json=data)
print(json.dumps(response.json(), indent=2))
```

### à retenir 

Elasticsearch ne cherche pas dans les phrases, il cherche dans les tokens (les mots) qu'il a extraits des textes.

---

# Différence entre `text` et `keyword`

| Champ      | Type    | Usage           |
| ---------- | ------- | --------------- |
| text_entry | text    | recherche texte |
| speaker    | keyword | filtre exact    |
| play_name  | keyword | filtre exact    |

---

# Rechercher

## Recherche texte (full-text)

```json
GET shakespeare/_search
{
  "query": {
    "match": {
      "text_entry": "question"
    }
  }
}
```

Cette requête utilise l'index inversé.

```txt
"question"
   ↓
Analyzer
   ↓
Token = "question"
   ↓
Index inversé
   ↓
Documents trouvés
```

Une requête match passe par l'analyzer puis utilise l'index inversé pour retrouver les documents.

## Recherche exacte (filtre)

```json
GET shakespeare/_search
{
  "query": {
    "term": {
      "speaker": "HAMLET"
    }
  }
}
```

1. Ne passe PAS par l'analyzer
2. Cherche directement la valeur "HAMLET"
3. Regarde dans l'index (structure keyword)
4. Retourne les documents correspondants

---

> `term` cherche une valeur exacte dans un champ keyword, sans passer par l'analyzer.

> `match` découpe le texte, `term` cherche exactement la valeur.

---

# Très important pour éviter une erreur classique

Si vous faites :

```json
{
  "term": {
    "text_entry": "question"
  }
}
```

Ça ne marche pas bien, parce que `text_entry` est `text` → il est tokenisé.

Il faut utiliser :

```json
{
  "match": {
    "text_entry": "question"
  }
}
```

---

### Règle simple à retenir

| Si le champ est | On utilise |
| --------------- | ---------- |
| text            | match      |
| keyword         | term       |

---

### Résumé final

| Type    | Recherche | Requête |
| ------- | --------- | ------- |
| text    | full-text | match   |
| keyword | exact     | term    |


---

# Combiner texte + filtre

On va revoir, `texte + filtre`, tout ça en détail dans le chapitre suivant `02_requetes`

Testez pour l'instant cette requête dans `Jupyter`

```json
GET shakespeare/_search
{
  "query": {
    "bool": {
      "must": [
        { "match": { "text_entry": "be" } }
      ],
      "filter": [
        { "term": { "play_name": "Hamlet" } }
      ]
    }
  }
}
```

Testez ce code dans Jupyter.

| Élément | Rôle            |
| ------- | --------------- |
| must    | recherche texte |
| filter  | filtre exact    |


---

# Résumé 

Quand Elasticsearch reçoit un document JSON :

1. Il stocke le document original
2. Il découpe les champs `text` en mots (tokens)
3. Il construit un index inversé (mot → documents)
4. Il indexe les champs `keyword`
5. Il permet ensuite de chercher très rapidement
