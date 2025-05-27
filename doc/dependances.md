# Documentation des dépendances et scripts du projet *Transcendence*

## Structure

Ce projet est divisé en deux parties :
- **Backend** (serveur Node.js avec Fastify)
- **Frontend** (application web avec Vite)

Chaque partie possède un fichier `package.json` décrivant ses dépendances et scripts.

---

## 1. Backend – `package.json`

### Scripts

- `"start"` : exécute le serveur compilé (`dist/index.js`) avec Node.js.
- `"dev"` : démarre le serveur en mode développement avec `nodemon` et `ts-node`. Recharge automatiquement si tu modifies un fichier `.ts`.
- `"build"` : compile le TypeScript en JavaScript dans le dossier `dist/` avec `tsc`.
- `"test"` : lance les tests avec `jest`.

### Dépendances (`dependencies`)

| Nom | Utilité |
|-----|--------|
| `fastify` | Framework web léger pour créer des API HTTP rapidement. |
| `@fastify/cors` | Plugin pour gérer les CORS (Cross-Origin Resource Sharing), permet au frontend d'appeler l'API depuis un autre domaine. |
| `@fastify/helmet` | Plugin qui ajoute des en-têtes HTTP pour renforcer la sécurité. |
| `dotenv` | Charge les variables d'environnement définies dans un fichier `.env`. |
| `bcrypt` | Librairie pour chiffrer les mots de passe de manière sécurisée. |
| `sqlite` | Librairie d’abstraction pour accéder à la base de données SQLite. |
| `sqlite3` | Pilote natif pour utiliser SQLite avec Node.js. Requis pour que `sqlite` fonctionne. |

### Dépendances de développement (`devDependencies`)

| Nom | Utilité |
|-----|--------|
| `nodemon` | Surveille les fichiers et redémarre automatiquement le serveur lors d’une modification. |
| `jest` | Framework de test pour JavaScript/TypeScript. |
| `ts-node` | Permet d’exécuter du TypeScript directement sans le compiler. |
| `typescript` | Langage de programmation basé sur JavaScript avec typage statique. Utilisé pour le développement. |

---

## 2. Frontend – `package.json`

### Scripts

| Script | Description |
|--------|-------------|
| `dev` | Démarre le serveur de développement Vite accessible sur `0.0.0.0:3000`. |
| `build` | Compile les fichiers TypeScript et construit le frontend en production avec Vite. |
| `preview` | Sert le frontend compilé comme il serait en production. |
| `test` | Lance les tests unitaires avec `vitest`. |

### Dépendances (`dependencies`)

| Nom | Utilité |
|-----|--------|
| `socket.io-client` | Permet de se connecter à un serveur WebSocket utilisant Socket.IO (pour le chat ou le jeu en temps réel). |

### Dépendances de développement (`devDependencies`)

| Nom | Utilité |
|-----|--------|
| `vite` | Outil de développement rapide pour frontend, remplace Webpack ou Parcel. |
| `tailwindcss` | Framework CSS utilitaire pour construire des interfaces rapidement. |
| `autoprefixer` | Ajoute automatiquement des préfixes CSS pour assurer la compatibilité entre navigateurs. |
| `postcss` | Outil de transformation CSS, utilisé avec Tailwind et Autoprefixer. |
| `typescript` | Permet de coder en TypeScript dans le frontend. |
| `@types/node` | Fournit les types TypeScript pour utiliser les fonctions Node.js (utile si du code Node est utilisé côté dev). |
| `vitest` | Framework de tests conçu pour Vite, rapide et léger. |

---

## Notes complémentaires

- Les dépendances sont divisées entre :
  - **`dependencies`** : nécessaires à l’exécution de l’application.
  - **`devDependencies`** : utiles uniquement en développement (compilation, tests, rechargement, etc.).
