#  Elasticsearch + Jupyter avec Docker

## Objectif

Nous voulons :

- Elasticsearch (base de recherche)
- Kibana (interface graphique)
- Jupyter (Python pour faire des requêtes)

Architecture :

```text
Jupyter → HTTP → Elasticsearch → données
                    ↓
                  Kibana
```

---

# Récupérer le docker compose 

Installer Docker Desktop (si non présent sur vos machines)

* [https://www.docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop)

Vérifier :

```bash
docker --version
docker compose version
```

---

# Fichier docker-compose.yml

Placez dans `sandbox`

---

# Démarrer les conteneurs

```bash
docker compose up -d
```

Vérifier :

```bash
docker ps
```

---

Vous devez voir :

| Service       | URL                                            |
| ------------- | ---------------------------------------------- |
| Elasticsearch | [http://localhost:9200](http://localhost:9200) |
| Kibana        | [http://localhost:5601](http://localhost:5601) |
| Jupyter       | [http://localhost:8888](http://localhost:8888) |

---

# Tester Elasticsearch

Dans un navigateur :

```text
http://localhost:9200
```

Vous devez voir un JSON.

---

#  Accéder à Jupyter

Dans un navigateur :

```text
http://localhost:8888
```

Copier le token dans le terminal Docker.

---

# Depuis Jupyter, se connecter à Elasticsearch

Très important :

Comme Jupyter est dans Docker, il faut utiliser le nom du service :

```python
import requests

url = "http://elasticsearch:9200"

response = requests.get(url)
print(response.text)
```

---

# Exemple de requête depuis Jupyter

```python
import requests
import json

url = "http://elasticsearch:9200/shakespeare/_search"

query = {
    "query": {
        "match_all": {}
    }
}

response = requests.get(url, json=query)
print(json.dumps(response.json(), indent=2))
```

---

# Schéma réseau Docker

```text
Conteneur Jupyter
        ↓
http://elasticsearch:9200
        ↓
Conteneur Elasticsearch
```

---

Important :

| Depuis              | URL                |
| ------------------- | ------------------ |
| Machine             | localhost:9200     |
| Jupyter (conteneur) | elasticsearch:9200 |

---

# Commandes utiles

| Action          | Commande                  |
| --------------- | ------------------------- |
| Démarrer        | docker compose up -d      |
| Arrêter         | docker compose down       |
| Voir conteneurs | docker ps                 |
| Voir logs       | docker logs elasticsearch |

---

#  Architecture finale

```text
           Navigateur
           /       \
      Kibana      Jupyter
          \        /
           Elasticsearch
```
