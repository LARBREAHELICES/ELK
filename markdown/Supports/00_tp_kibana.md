# TP 00 — Kibana pas à pas
## Dataset `shakespeare`

Objectif du TP : construire un dashboard simple et expliquer chaque visuel.

---

## Ce que vous allez produire

1. Une visualisation Lens : répliques par pièce
2. Une visualisation Lens : top speakers
3. Une visualisation Lens : moyenne des années
4. Un dashboard qui regroupe ces visualisations

---

## Étape 1 — Vérifier les données

Dans Dev Tools :

```json
GET shakespeare/_count
```

Attendu : `count > 0`.

Si `count = 0`, corriger l'ingestion avant de continuer.

---

## Étape 2 — Ouvrir la Visualize Library

Chemin :

`Analytics` -> `Visualize Library` -> `Create new visualization`

<img src="assets/tp-kibana-01.png" alt="Capture Kibana 1 - Visualize Library" style="display:block;margin:12px auto 0;max-height:60vh;width:auto;max-width:100%;border:1px solid #263043;border-radius:12px;" />

---

## Étape 3 — Choisir Lens

Dans la fenêtre de création, sélectionner **Lens**.

<img src="assets/tp-kibana-02.png" alt="Capture Kibana 2 - Choix Lens" style="display:block;margin:12px auto 0;max-height:60vh;width:auto;max-width:100%;border:1px solid #263043;border-radius:12px;" />

---

## Étape 4 — Lens #1 : répliques par pièce

Configuration :

- Type : `Bar vertical`
- Horizontal axis : `play_name`
- Vertical axis : `Count of records`

But : compter le nombre de répliques par pièce.

---

## Étape 5 — Repère visuel dans Lens

Voici le résultat attendu pour une visualisation barres sur `play_name`.

<img src="assets/tp-kibana-03.png" alt="Capture Kibana 3 - Lens bar chart" style="display:block;margin:12px auto 0;max-height:60vh;width:auto;max-width:100%;border:1px solid #263043;border-radius:12px;" />

---

## Étape 6 — Lens #2 : Top 5 speakers

Créer une nouvelle visualisation Lens :

- Horizontal axis : `speaker`
- Vertical axis : `Count`
- Sort : `Descending`
- Limit : `5`

Question de contrôle : quel speaker parle le plus ?

---

## Étape 7 — Lens #3 : moyenne des années

Créer une troisième visualisation Lens :

- Horizontal axis : `play_name`
- Vertical axis : `Average(year)`

Message pédagogique :

- `Count` = volume
- `Average` = métrique calculée

---

## Étape 8 (option) — Préparer une timeline (mapping)

Ajouter un champ date si nécessaire :

```json
PUT shakespeare/_mapping
{
  "properties": {
    "year_date": { "type": "date" }
  }
}
```

---

## Étape 8 bis (option) — Alimenter `year_date`

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

---

## Étape 9 (option) — Lens timeline

Si `year_date` existe :

- Type : `Line`
- X-axis : `Date histogram(year_date)`
- Y-axis : `Count`

Si le graphique est vide :

- élargir le time range
- ou Data View sans champ temporel

---

## Étape 10 — Construire le dashboard

Dans `Dashboard` -> `Create` :

Ajouter :

- Répliques par pièce
- Top speakers
- Moyenne des années

Résultat attendu : un écran unique de lecture rapide.

---

## Checklist de rendu

1. Data View `shakespeare` prêt
2. 3 visualisations Lens minimum
3. 1 dashboard final
4. Capacité à expliquer chaque axe :

- axe horizontal = regroupement
- axe vertical = calcul
