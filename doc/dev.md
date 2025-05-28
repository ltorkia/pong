## Setup de développement
On veut tout accessible via http://localhost:8080 (une seule URL pour frontend + backend).  
On utilise :  
- Vite : pour le frontend (HTML + TypeScript + Tailwind CSS) avec hot reload.  
- Nodemon : pour le backend (Fastify) avec redémarrage automatique.  
- NGINX (reverse proxy): pour faire le lien entre les deux via un seul point d’entrée (localhost:8080).

---

## Comment tout fonctionne ensemble

1. Vite (Frontend) — port 3000  
   - Sert les fichiers HTML, CSS, et TypeScript du frontend.  
   - Gère le hot module replacement (HMR) pour recharger instantanément le navigateur quand on modifie un fichier.  
   - Compile à la volée le TypeScript en JavaScript dans le navigateur.  
   - Écoute sur le port 3000, mais caché derrière NGINX.

2. Fastify + Nodemon (Backend) — port 3001  
   - Nodemon surveille les fichiers `.ts` du backend.  
   - À chaque modification, il recompile et redémarre automatiquement le serveur.  
   - Fastify expose les routes API, par exemple `/api/users`.  
   - Écoute sur le port 3001, masqué par NGINX.

3. NGINX (Reverse Proxy) — port 8080  
   - Écoute sur le port 8080.  
   - Redirige automatiquement :  
     - `/api/**` vers le backend Fastify (port 3001)  
     - `/` vers Vite (port 3000)

---

## Résultat  
Tout passe par `localhost:8080` : HTML, JS, WebSocket, API REST.

---

## Compilation  
- Vite compile le frontend TypeScript à la volée dans le navigateur, sans build final (tout passe par ES modules).  
- Nodemon redémarre le serveur backend à chaque changement, utilisant `ts-node` pour éviter une compilation manuelle.

---