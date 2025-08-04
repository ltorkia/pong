TODO / problèmes rencontrés / questions / pense-bête

BACK

- QR code
- Faire un autre majLastlog() à mettre dans route logout pour mettre le status à offline et le timestamp de déconnexion
- Formater les dates (le fuseau horaire ne semble pas bon dans beginLog et registration)
- Proposer de switch entre compte google et local
- Gerer proxy pour avatars Google
- Faire route pour get tournois


COMMUN

- Ajuster conf nginx prod pour websockets
- Si on a le time faire le switch compte Google -> compte local dans settings ?
- Reutiliser systeme code 2FA pour "Mot de passe oublie"
- Complexifier mot de passe
- Faire sockets pour statut online / demandes d'amis
- Pour chaque route avec userId (ex: `/api/users/${userId}/friends/remove`), faire une verif userId == id du current user avec le token, sinon faille de secu
- Formater dates avant de les rentrer en db
- Google sign en remote Pelouse

FRONT

- Rajouter le nom du user connecté sur la navbar ?
- Faire page profil (stats globales user) / dashboard (match history, 1vs1, tournois etc)
- Faire un petit hover sur le bouton/icon previous de register et du modal

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