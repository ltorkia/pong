## En gros
- Le backend écoute sur le port 3001, et le frontend sur 3000 (mais tous deux sont servis ensemble via nginx sur le port 8080).
- Le backend expose une API REST sur /api/*.
- Le frontend fait des requêtes vers /api/ directement grâce à la configuration nginx qui redirige /api vers le backend.
- Aucun framework frontend lourd (comme React/Vue) n’est utilisé. Le rendu est fait en TypeScript pur avec injection dans le DOM (SPA légère).

## Setup de développement (résumé global)
On veut tout accessible via http://localhost:8080 (une seule URL pour frontend + backend).
On utilise :
- Vite : pour le frontend (HTML + TypeScript + Tailwind CSS) avec hot reload.
- Nodemon : pour le backend (Fastify) avec redémarrage auto.
- NGINX (reverse proxy) : pour faire le lien entre les deux via un seul point d’entrée (localhost:8080).

## Comment tout fonctionne ensemble
1. Vite (Frontend)
- Sert les fichiers HTML, CSS, et TypeScript du frontend.
- Gère le hot module replacement (HMR) pour recharger le navigateur instantanément quand on modifie un fichier.
- Compile à la volée le TypeScript en JavaScript (dans le navigateur, en dev).
- Vite écoute sur le port comme 3000 chez nous, mais on le cache derrière NGINX.

2. Fastify + Nodemon (Backend)
- Nodemon surveille tes fichiers .ts du backend.
- Si on modifie le code, il recompile (avec ts-node ou tsc) et redémarre automatiquement le serveur.
- Fastify expose des routes API, par exemple sur /api/users, /api/match, etc.
- Il écoute sur un autre port (ici 3001), mais là encore NGINX le masque.

3. NGINX (Reverse Proxy)
- Il écoute sur le port 8080.
- Il redirige automatiquement:
/api/** ⟶ vers le backend Fastify (port 3001).
/ ⟶ vers Vite (port 3000).

Résultat: tout passe par localhost:8080, que ce soit HTML, JS, WebSocket, ou API REST.

Cycle complet: de l’écriture à l'affichage
On écrit :
du HTML/TypeScript/CSS côté frontend,
du TypeScript côté backend.

* Compilation en mode dev :
- Vite compile le frontend TypeScript à la volée dans le navigateur. Il ne crée pas de build final. Tout passe par ES modules.
- Nodemon redémarre le serveur backend à chaque changement et peut utiliser ts-node pour ne pas avoir à compiler à la main.

## Test :
Aller http://localhost:8080.
NGINX nous envoie vers Vite, qui sert la page HTML.
Les appels à /api/... sont automatiquement redirigés vers Fastify via NGINX.
Si on modifie un fichier frontend, Vite recharge automatiquement la page (HMR).
Si on modifie un fichier backend, Nodemon redémarre le serveur.

