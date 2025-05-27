Le backend écoute sur le port 3001, et le frontend sur 3000 (mais tous deux sont servis ensemble via nginx sur le port 8080).

Le backend expose une API REST sur /api/*.

Le frontend fait des requêtes vers /api/ directement grâce à la configuration nginx qui redirige /api vers le backend.

Aucun framework frontend lourd (comme React/Vue) n’est utilisé. Le rendu est fait en TypeScript pur avec injection dans le DOM (SPA légère).