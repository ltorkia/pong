TODO / problemes rencontres / questions / pense-bete

BACK

- update BDD -> mettre status du current user a 1 quand il se connecte, a 0 quand il se deconnecte (= update status online/offline pour indication sur la liste des utilisateurs)
- gerer stockage des avatars dans frontend/public/img/avatars
- l'ID utilisateur semble changer periodiquement quand il s'est log via Google et se relog plus tard (l'ID devrait toujours rester le meme en bdd). Investiguer pourquoi...

FRONT

- Lier type User de Models au UserStore (au lieu de joindre un type User random) ??
Implique mise a jour des elements stockes dans token via api/me
- Commenter Router
- Mieux typer partout