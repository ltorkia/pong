TODO / problèmes rencontrés / questions / pense-bête

BACK

- QR code
- Faire un autre majLastlog() à mettre dans route logout pour mettre le status à offline et le timestamp de déconnexion
- Formater les dates (le fuseau horaire ne semble pas bon dans beginLog et registration)
- Gérer form settings
- Gerer proxy pour avatars Google


COMMUN

- Ajuster conf nginx prod pour websockets

FRONT

- Faire un middleware à wrapper dans chaque fonction qui implique de checker si le user est connecté
- Rajouter le nom du user connecté sur la navbar ?
- Faire page profil (stats globales user) / dashboard (match history, 1vs1, tournois etc)
- Ajouter "Mot de passe oublie ?" avec gestion question secrete dans modal
- Faire un petit hover sur le bouton/icon previous de register et du modal
- Ajouter filtres dans barre de recherche de user list
- Gerer affichage userlist bouton add to friend / friend / self
- Mieux organiser les updateAvatar etc... (on se perd entre api / user service / image service / data service)
- Ajuster logique pour getAvatarUrl Google quand le back a fini l'affaire de proxy

- check MAJ package.json :
 @tsparticles/engine         ^3.0.2  →   ^3.8.1
 @types/node              ^22.15.24  →  ^24.0.4
 postcss                     ^8.5.3  →   ^8.5.6
 rollup                     ^3.29.4  →  ^4.44.1
 tailwindcss                ^3.4.17  →  ^4.1.11
 tsparticles                 ^3.0.2  →   ^3.8.1
 vite                        ^6.3.5  →   ^7.0.0

- docType:	npm install -g typedoc
			npm run doc

------------------------------------------------------------------------
- POUR L'EVAL:
Copier les fichiers .env du back et du front manuellement et:
docker compose up --build
------------------------------------------------------------------------