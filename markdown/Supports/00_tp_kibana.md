# TP 00 — Kibana pas à pas
## Dataset `shakespeare`

Objectif du TP : construire un dashboard lisible et expliquer chaque visuel.

---

## Ce que vous allez produire

1. Une visualisation Lens : répliques par pièce
2. Une visualisation Lens : top speakers
3. Une visualisation Lens : moyenne des années
4. Un dashboard qui regroupe ces visualisations

---

## Étape 0 — Commencer par le champ datetime

Pourquoi c'est important :

- Kibana utilise un champ date pour les graphiques temporels
- le filtre de temps global dépend de ce champ
- sans date, certaines visualisations semblent vides

Créer le champ `year_date` :

```json
PUT shakespeare/_mapping
{
  "properties": {
    "year_date": { "type": "date" }
  }
}
```

Alimenter `year_date` à partir de `year` :

```json
POST shakespeare/_update_by_query
{
  "script": {
    "source": """
      if (ctx._source.year != null) {
        ctx._source.year_date = ctx._source.year + '-01-01T00:00:00Z';
      }
    """
  }
}
```

Contrôle rapide :

```json
GET shakespeare/_search
{
  "size": 1,
  "_source": ["year", "year_date"]
}
```

---

## Étape 1 — Vérifier les données

```json
GET shakespeare/_count
```

Attendu : `count > 0`.

---

## Étape 2 — Créer le Data View

Chemin : `Stack Management` -> `Data Views`

- Name : `shakespeare`
- Index pattern : `shakespeare`
- Time field : `year_date` (recommandé)

Si vous ne faites pas de timeline : vous pouvez `Skip time field`.

---

## Étape 3 — Ouvrir la Visualize Library

Chemin :

`Analytics` -> `Visualize Library` -> `Create new visualization`

<img src="assets/tp-kibana-01.png" alt="Capture Kibana 1 - Visualize Library" style="display:block;margin:12px auto 0;max-height:60vh;width:auto;max-width:100%;border:1px solid #263043;border-radius:12px;" />

---

## Étape 4 — Choisir Lens et comprendre les autres choix

Dans cette fenêtre, choisir **Lens** pour ce TP.

<img src="assets/tp-kibana-02.png" alt="Capture Kibana 2 - Choix Lens" style="display:block;margin:12px auto 0;max-height:60vh;width:auto;max-width:100%;border:1px solid #263043;border-radius:12px;" />

Lens : éditeur drag-and-drop simple et rapide (idéal pour démarrer).

Autres choix de la fenêtre :

- `Maps` : cartes géographiques
- `TSVB` : séries temporelles avancées
- `Custom visualization` : Vega / cas très personnalisés
- `Aggregation based` : ancien éditeur orienté agrégations
- `Text` : bloc texte dans un dashboard

---

## Étape 5 — Lens #1 : répliques par pièce

Configuration :

- Type : `Bar vertical`
- Horizontal axis : `play_name`
- Vertical axis : `Count of records`

But : compter les répliques par pièce.

---

## Étape 6 — Repère visuel dans Lens

Résultat attendu pour une visualisation barres sur `play_name`.

<img src="assets/tp-kibana-03.png" alt="Capture Kibana 3 - Lens bar chart" style="display:block;margin:12px auto 0;max-height:60vh;width:auto;max-width:100%;border:1px solid #263043;border-radius:12px;" />

---

## Étape 7 — Lens #2 : top 5 speakers

Créer une nouvelle visualisation Lens :

- Horizontal axis : `speaker`
- Vertical axis : `Count`
- Sort : `Descending`
- Limit : `5`

Question : quel speaker parle le plus ?

---

## Étape 8 — Lens #3 : moyenne des années

Créer une troisième visualisation Lens :

- Horizontal axis : `play_name`
- Vertical axis : `Average(year)`

À retenir :

- `Count` = volume
- `Average` = métrique calculée

---

## Étape 9 (option) — Timeline dans Lens

Si `year_date` existe :

- Type : `Line`
- X-axis : `Date histogram(year_date)`
- Y-axis : `Count`

Si le graphique est vide :

- élargir le time range
- vérifier que le Data View utilise bien `year_date`

---

## Étape 10 — Construire le dashboard

Dans `Dashboard` -> `Create`, ajouter :

- Répliques par pièce
- Top speakers
- Moyenne des années

Résultat attendu : un écran unique de lecture rapide.

---

## Checklist de rendu

1. Champ `year_date` créé et alimenté
2. Data View `shakespeare` prêt
3. 3 visualisations Lens minimum
4. 1 dashboard final
5. Explication claire des axes : horizontal = regroupement, vertical = calcul
