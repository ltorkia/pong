TODO / problèmes rencontrés / questions / pense-bête

BACK

- update BDD -> mettre status du current user a 1 quand il se connecte, a 0 quand il se deconnecte (= update status online/offline pour indication sur la liste des utilisateurs)
- créer un cookie pour sauvegarder l'email de l'utilisateur (à afficher sur form de connexion si l'utilisateur a cliqué sur "se souvenir de moi") ?
- Vérifier systeme middleware/hook pour auth jwt verif des routes
- Voir si on parametre 2FA pour qu il soit actif qu a la premiere connexion
- QR code


COMMUN

- RAS

FRONT

- user.store: Prévoir le cas où le user est restauré sans email dans la mémoire vive (fallback api)
- Faire un middleware à wrapper dans chaque fonction qui implique de checker si le user est connecté
- Rajouter le nom du user connecté sur la navbar ?
- Gerer frequence validation session dans les routes
- Faire components page profil / stats
- Ajouter "Mot de passe oublie ?" avec gestion question secrete dans modal
- Intercepter l'erreur backend dans l'url si authentification google echoue
- Boucle login si erreur validate-session (load user dans start app service à vérifier)
- Déléguer logique métier de user.modele dans user.service !
- Changer typage User qui peut être null dans le constructeur de usersPage et de userRowComponent: ne devrait jamais être null ici
- Faire un petit hover sur le bouton/icon previous de register et du modal
- Déplacer des méthodes de base.page.ts pour alléger (updateNavigation, checkUserLogged, méthodes relatives aux components,
getContainerApp, getErrorMessage() etc)

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