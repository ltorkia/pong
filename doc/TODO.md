TODO / problèmes rencontrés / questions / pense-bête

BACK

- Proposer de switch entre compte google et local ?
- Avatars google qui merdent à la premiere connexion parfois (erreur dans console et avatar par defaut apparait)
- Google sign en remote bug à résoudre


COMMUN

- Si on a le time faire le switch compte Google -> compte local dans settings ?
- Reutiliser systeme code 2FA pour "Mot de passe oublie" ?
- Complexifier mot de passe ?
- Google sign en remote Pelouse

FRONT

- Rajouter le nom du user connecté sur la navbar ?
- Faire page profil (stats globales user) / dashboard (match history, 1vs1, tournois etc)
- Faire un petit hover sur le bouton/icon previous de register et du modal
- Pourquoi pas besoin de mettre @layer components dans le css de modal ??

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