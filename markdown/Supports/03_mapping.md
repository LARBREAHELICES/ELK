# Le Mapping dans Elasticsearch

## Qu'est-ce que le mapping ?

Le **mapping** définit la structure des documents dans Elasticsearch.

C'est l'équivalent du schéma d'une table en base de données.

> Le mapping définit le type des champs et comment Elasticsearch va les indexer.

---

## Exemple de mapping

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

Ce mapping définit 3 champs :

| Champ      | Type    |
| ---------- | ------- |
| play_name  | keyword |
| speaker    | keyword |
| text_entry | text    |

---

## Différence entre text et keyword

C'est la chose la plus importante à comprendre.

### Type text

- Le texte est **analysé**
- Il est découpé en mots (tokens)
- Utilisé pour la recherche full-text
- Utilise `match`

### Type keyword

- La valeur est **stockée telle quelle**
- Pas découpée
- Utilisé pour filtrer
- Utilise `term`

---

## Exemple concret

Document :

```json
{
  "speaker": "HAMLET",
  "text_entry": "To be or not to be"
}
```

### Si `speaker` = keyword

```text
HAMLET → doc 1
```

### Si `text_entry` = text

```text
to → doc 1
be → doc 1
not → doc 1
```

Donc :

| Type    | Stockage       |
| ------- | -------------- |
| keyword | valeur entière |
| text    | mots séparés   |

---

## Mapping dynamique

Si on ne crée pas le mapping, Elasticsearch devine les types.

Exemple :

```json
PUT shakespeare/_doc/1
{
  "play_name": "Hamlet",
  "speaker": "HAMLET",
  "text_entry": "To be or not to be"
}
```

Elasticsearch va deviner :

| Champ      | Type    |
| ---------- | ------- |
| play_name  | keyword |
| speaker    | keyword |
| text_entry | text    |

C'est le **mapping dynamique**.

> Elasticsearch peut créer le mapping automatiquement.

---

## 6. Voir le mapping

```json
GET shakespeare/_mapping
```

Cela permet de voir la structure de l'index.

---

## 7. Pourquoi le mapping est important ?

Parce que le type du champ détermine la requête :

| Type    | Requête |
| ------- | ------- |
| text    | match   |
| keyword | term    |

Si on se trompe de type, la recherche ne marche pas correctement.

---

## 8. Résumé

| Type    | Sert à                   |
| ------- | ------------------------ |
| text    | rechercher dans le texte |
| keyword | filtrer                  |
| integer | nombres                  |
| date    | dates                    |
| boolean | true / false             |

---

## 9. Schéma

```text
Mapping
  ↓
Définit type des champs
  ↓
Définit comment Elasticsearch indexe
  ↓
Définit comment on peut rechercher
```

---

## 10. Phrase très importante pour les étudiants

> Le mapping définit comment les champs sont stockés et comment on pourra faire les recherches.

---

## 11. Règle simple à retenir

| Si on veut…                  | On met  |
| ---------------------------- | ------- |
| chercher dans une phrase     | text    |
| filtrer (nom, catégorie, id) | keyword |

---

## 12. Exemple complet

Mapping :

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

Requêtes :

```json
match → text_entry
term → speaker
term → play_name
```

---

# Conclusion

> Le mapping est la structure de l'index.
> Il définit le type des champs et donc la manière de rechercher.
