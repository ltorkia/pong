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