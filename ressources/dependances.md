## PACKAGE.JSON EXPLICATIONS ##

---> BACKEND

1. dependencies

| Package                | Rôle                                                                                                                             |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **express**            | Framework web minimaliste pour construire des routes HTTP.                                                                       |
| **socket.io**          | Bibliothèque WebSocket pour le temps réel (ex. : Pong multijoueur).                                                              |
| **cors**               | Active le partage de ressources entre origines différentes (CORS), nécessaire si frontend/backend sont sur des ports différents. |
| **helmet**             | Sécurise les en-têtes HTTP (ex. : empêche certaines attaques).                                                                   |
| **dotenv**             | Permet de charger les variables d’environnement depuis un fichier `.env`.                                                        |
| **bcrypt**             | Pour le hachage des mots de passe.                                                                                               |
| **jsonwebtoken**       | Pour générer et vérifier des tokens JWT (authentification).                                                                      |
| **sqlite3**            | Driver SQLite pour la base de données embarquée.                                                                                 |
| **multer**             | Middleware pour gérer les uploads de fichiers (avatars, etc.).                                                                   |
| **express-validator**  | Pour valider et assainir les données des requêtes HTTP.                                                                          |
| **express-rate-limit** | Limite le nombre de requêtes pour protéger contre les abus (DoS, bruteforce, etc.).                                              |

2. devDependencies

| Package        | Rôle                                                               |
| -------------- | ------------------------------------------------------------------ |
| **nodemon**    | Relance automatiquement le serveur à chaque modification.          |
| **jest**       | Framework de tests pour vérifier le bon fonctionnement du backend. |
| **ts-node**    | Permet d’exécuter du TypeScript directement sans le compiler.      |
| **typescript** | Le compilateur TypeScript.                                         |

***

---> FRONTEND

1. dependencies

| Package              | Rôle                                                                   |
| -------------------- | ---------------------------------------------------------------------- |
| **socket.io-client** | Client WebSocket pour se connecter au serveur backend via `socket.io`. |

2. devDependencies

| Package          | Rôle                                                                                    |
| ---------------- | --------------------------------------------------------------------------------------- |
| **typescript**   | Le langage utilisé pour coder en frontend.                                              |
| **vite**         | Outil de build moderne et ultra-rapide pour le frontend.                                |
| **tailwindcss**  | Framework CSS utilitaire pour styliser rapidement l’interface.                          |
| **autoprefixer** | Ajoute automatiquement les préfixes CSS nécessaires pour la compatibilité navigateur.   |
| **postcss**      | Outil de transformation CSS (nécessaire pour Tailwind).                                 |
| **@types/node**  | Fournit les types TypeScript pour Node.js, utile si certains outils Node sont utilisés. |
| **vitest**       | Framework de tests rapide et intégré à Vite, pour tester le frontend.                   |