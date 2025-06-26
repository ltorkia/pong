TODO / problèmes rencontrés / questions / pense-bête

BACK

- update BDD -> mettre status du current user a 1 quand il se connecte, a 0 quand il se deconnecte (= update status online/offline pour indication sur la liste des utilisateurs)
- gerer stockage des avatars dans frontend/public/img/avatars
- Pourquoi param de majLastlog = username et pas id ?

COMMUN

- Regrouper types back et front (doublons), peut-être faire dossier 'shared' ?
- Simplifier tree (components css etc) ça commence à être long + raccorder les noms (miroirs)

FRONT

- Faire migrer updateNavigation de RouteManager vers NavbarComponent avec setActiveLink et suppression de getProfilePath() maintenant qu'on utilise le userStore ??
- Mettre les events Popstate dans navbar component ?
- Rajouter le nom du user connecté sur la navbar
- Faire components page profil / stats
- Ajouter carré à cocher sur formulaire login pour "mémoriser les informations"
- Enregistrer les champs formulaires en session au cas où crash
- Mieux typer partout
- Boucle login si erreur validate-session (load user dans start app manager à vérifier)
- Etoffer RouteConfig avec les liens templates et components

- check MAJ package.json :
 @tsparticles/engine         ^3.0.2  →   ^3.8.1
 @types/node              ^22.15.24  →  ^24.0.4
 postcss                     ^8.5.3  →   ^8.5.6
 rollup                     ^3.29.4  →  ^4.44.1
 tailwindcss                ^3.4.17  →  ^4.1.11
 tsparticles                 ^3.0.2  →   ^3.8.1
 vite                        ^6.3.5  →   ^7.0.0