TODO / problèmes rencontrés / questions / pense-bête

BACK

- update BDD -> mettre status du current user a 1 quand il se connecte, a 0 quand il se deconnecte (= update status online/offline pour indication sur la liste des utilisateurs)
- gerer stockage des avatars dans frontend/public/img/avatars
- Pourquoi param de majLastlog = username et pas id ?
- first log, last log ou booleen ? A mediter
- créer un cookie pour sauvegarder l'email de l'utilisateur (à afficher sur form de connexion si l'utilisateur a cliqué sur "se souvenir de moi") ?
- Vérifier systeme middleware/hook pour auth jwt verif des routes
- Voir si on parametre 2FA pour qu il soit actif qu a la premiere connexion

COMMUN

- RAS

FRONT

- user.store: Prévoir le cas où le user est restauré sans email dans la mémoire vive (fallback api)
- Faire un middleware à wrapper dans chaque fonction qui implique de checker si le user est connecté
- Rajouter le nom du user connecté sur la navbar
- Gerer frequence validation session dans les routes
- Faire components page profil / stats
- Ajouter carré à cocher sur formulaire login pour "mémoriser les informations"
- Ajouter "Mot de passe oublie ?" avec gestion question secrete
- Intercepter l'erreur backend dans l'url si authentification google echoue
- Gerer HTML 2FA / gere redirections
- Enregistrer les champs formulaires en session au cas où crash
- Mieux typer partout
- Boucle login si erreur validate-session (load user dans start app manager à vérifier)
- scinder user.service.ts en user-auth.service.ts / user-crud.service.ts / user-session.service.ts (donc changer la doc et la logique de singleton dans services.ts)
- Déléguer logique métier de user.modele dans user.service !
- Changer typage User qui peut être null dans le constructeur de usersPage et de userRowComponent: ne devrait jamais être null ici
- Ajouter lien home sur logo pong navbar

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