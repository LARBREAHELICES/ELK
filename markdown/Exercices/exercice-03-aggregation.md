# Exercice 03 — Agrégations Elasticsearch

## Contexte

Travaillez sur l'index `shakespeare_extended`.

Objectif : pratiquer les agrégations `terms`, métriques, agrégations imbriquées, `histogram` et pipeline.

---

## Exercice 1

Compter le nombre de documents par pièce.

Attendu : une agrégation `terms` sur `play_name.keyword`.

---

## Exercice 2

Top 5 des speakers avec le plus de répliques.

Attendu : `terms` sur `speaker.keyword` avec `size: 5`.

---

## Exercice 3

Nombre de speakers différents par pièce.

Attendu : `terms` par pièce + sous-agrégation `cardinality` sur `speaker.keyword`.

---

## Exercice 4

Longueur moyenne des répliques par speaker.

Attendu : `terms` par `speaker.keyword` + calcul de moyenne de longueur.

Indice : utilisez un champ runtime `line_length` basé sur `text_entry.keyword.length()`.

---

## Exercice 5

Pièce avec la réplique la plus longue.

Attendu : regrouper par pièce et récupérer la plus grande longueur de réplique dans chaque bucket.

---

## Exercice 6

Moyenne du nombre de répliques par pièce.

Attendu : `terms` par pièce puis `avg_bucket` sur `par_piece._count`.

---

## Exercice 7

Histogramme de la longueur des répliques (intervalle 20).

Attendu : `histogram` sur la longueur, `interval: 20`.

---

## Exercice 8

Nombre de répliques par année puis par pièce (agrégations imbriquées).

Attendu : `terms` sur `year` puis `terms` sur `play_name.keyword`.
