# 🏓 Pong Game - projet 42

## Architecture générale

### Contraintes techniques
- **Application mono-page (SPA)** : Navigation fluide avec support des boutons Précédent/Suivant du navigateur
- **Containerisation Docker** : Application lancée avec une seule commande: `docker compose up --build`

### Technologies
- **Frontend** : TypeScript + Tailwind CSS
- **Backend** : Fastify avec Node.js
- **Base de données** : SQLite
- **Containerisation** : Docker

## Jeu Pong

### Fonctionnalités de jeu
- **Jeu en direct** : Deux joueurs peuvent participer à une partie de Pong en direct sur le site web
- **Contrôles partagés** : En mode local, les deux joueurs utilisent le même clavier
- **Module remote Players** : Les deux joueurs peuvent jouer ensemble à distance, sur une machine différente
- **Règle stricte** : Vitesse de raquette identique pour tous les joueurs

### Système de tournoi complet en local
- **Tournoi multi-joueurs** : Système permettant à plusieurs joueurs de jouer à tour de rôle les uns contre les autres
- **Interface claire** : Affichage explicite de qui joue contre qui et dans quel ordre
- **Système d'inscription de base** : 
  - Chaque joueur doit saisir son alias au début du tournoi
  - Un alias peut être lié à un compte
- **Matchmaking automatique** : 
  - Organisation automatique des participants
  - Annonce du prochain match
  - Gestion de l'ordre des parties

### Sécurité
- **Hashage des mots de passe** : Utilisation de brypt pour tous les mots de passe stockés
- **Protection contre les attaques** : 
  - Protection XSS (Cross-Site Scripting)
  - Protection contre les injections SQL
- **HTTPS universel** : 
  - Connexion HTTPS
  - Utilisation de `wss` pour les WebSockets
- **Validation des entrées** : 
  - Mécanismes de validation pour toutes les entrées utilisateur
- **Gestion des credentials** : 
  - Variables d'environnement, clés API, credentials dans fichiers `.env` local
  - Fichiers `.env` ignorés par git

### Contraintes de développement strictes
- **Interdiction** : Aucune librairie/outil fournissant une solution immédiate et complète pour une fonctionnalité ou module entier
- **Autorisations limitées** : Petites librairies pour tâches simples et uniques représentant un sous-composant d'une fonctionnalité plus large

## Modules validés

- **Backend avec Framework Fastify**
- **Frontend avec Tailwind CSS et TypeScript**
- **Base de données SQLite**
- **Gestion utilisateur standard et authentification**
- **Authentification à deux facteurs (2FA) et JWT**
- **Authentification distante Google Sign-in**
- **Implémentation du jeu server-side avec API**
- **Joueurs distants**
- **Support multi-appareils**
- **Compatibilité navigateur étendue**
- **Support multilingue**

## Structure du projet

<pre>
.
├── backend
│   ├── Dockerfile
│   ├── Dockerfile.dev
│   ├── package.json
│   ├── sql
│   │   └── init.sql
│   ├── src
│   │   ├── db
│   │   ├── helpers
│   │   ├── index.ts
│   │   ├── routes
│   │   └── types
│   ├── tsconfig.json
│   └── uploads
│       └── avatars
├── doc
│   ├── en.subject.pdf
│   └── reference_cli_register_and_game.md
├── docker-compose.dev.yml
├── docker-compose.yml
├── frontend
│   ├── Dockerfile.dev
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.mjs
│   ├── public
│   │   ├── assets
│   │   └── templates
│   ├── src
│   │   ├── api
│   │   ├── app.ts
│   │   ├── components
│   │   ├── config
│   │   ├── pages
│   │   ├── router
│   │   ├── services
│   │   ├── styles
│   │   ├── types
│   │   └── utils
│   ├── tailwind.config.mjs
│   ├── tsconfig.json
│   └── vite.config.ts
├── Makefile
├── nginx
│   ├── Dockerfile
│   ├── Dockerfile.dev
│   ├── generate-cert.sh
│   ├── nginx.conf
│   └── nginx.dev.conf
├── README.md
├── shared
│   ├── config
│   ├── functions.ts
│   ├── models
│   ├── types
│   └── utils
└── sync-env.sh

</pre>
