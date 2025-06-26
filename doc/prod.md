## Setup de production
On veut tout accessible via http://localhost:8080 (une seule URL pour frontend + backend).  
On utilise :  
- Build statique du frontend (Vite) : fichiers HTML, CSS, JS compilés et optimisés.  
- Serveur backend Fastify : exécute l'API et la logique métier.  
- NGINX (reverse proxy) : sert les fichiers statiques du frontend et redirige les appels API vers le backend.  

---

## Comment tout fonctionne ensemble

1. Frontend (build statique)  
- Le frontend est compilé en fichiers statiques optimisés (HTML, CSS, JS).  
- Ces fichiers sont servis directement par NGINX, sans serveur de développement.  
- On retrouve ces fichiers statiques dans le container nginx : `/usr/share/nginx/html/dist`.  
- Pas de hot reload, car c'est une version stable prête pour la production.  

2. Backend Fastify  
- Le backend écoute sur un port (3001).  
- Il gère toutes les requêtes API (`/api/users` etc.).  
- Il est lancé via Node.js, sans nodemon ni recompilation automatique.  
- Les fichiers TypeScript sont compilés en JavaScript dans le container backend, dans le dossier `./dist`.  
- Le serveur exécute le code JavaScript compilé (ex: `node dist/index.js`).  

3. NGINX (Reverse Proxy)  
- NGINX écoute sur le port 8080.  
- Il sert les fichiers statiques du frontend (depuis le dossier build de Vite).  
- Il redirige les requêtes commençant par `/api/**` vers le backend Fastify (port 3001).  
- Tout passe par le même point d’entrée (localhost:8080).  

---

## Résultat  
- Le site frontend est accessible sur http://localhost:8080.  
- Les appels API sur `/api/...` sont automatiquement relayés au backend.  
- Pas de recompilation automatique ni hot reload, la version est optimisée pour la production.  

---

## Processus de build et déploiement  

- Le frontend est compilé avec la commande `vite build`, générant un dossier `dist` avec les fichiers statiques.  
- Ces fichiers `dist` sont copiés ou montés dans le container NGINX pour être servis.  
- Le backend est compilé en JavaScript (depuis TypeScript) dans le container backend, dans le dossier `dist`.  
- Le backend est ensuite lancé avec Node.js sur ces fichiers compilés.  
- NGINX est configuré pour servir les fichiers statiques et faire proxy_pass vers le backend.  
