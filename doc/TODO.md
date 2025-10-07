TODO / problèmes rencontrés / questions / pense-bête

BACK

- Proposer de switch entre compte google et local ?
- Avatars google qui merdent à la premiere connexion parfois (erreur dans console et avatar par defaut apparait)
- Google sign en remote bug à résoudre quand on se connecte d un autre ordi
- Jeu : pb de socket a verifier quand on se connecte, joue en remote et se r=deco pour rejouer avec un autre compte
- Jeu : remettre counter() en fonction -> 


COMMUN

- Si on a le time faire le switch compte Google -> compte local dans settings ?
- Reutiliser systeme code 2FA pour "Mot de passe oublie" ?
- Complexifier mot de passe ?

FRONT

- Rajouter le nom du user connecté sur la navbar ?
- Faire page profil (stats globales user) / dashboard (match history, 1vs1, tournois etc)
- Faire un petit hover sur le bouton/icon previous de register et du modal
- Pourquoi pas besoin de mettre @layer components dans le css de modal ??
- Rajouter un bouton pour quitter le jeu
- Jeu + responsive : bouton a faire pour le responsive du jeu en mode sans clavier
- Jeu : esthetique pour dire qui a gagne, qui est a gauche ou a droite 

<!-- URGENT
! Alias à afficher dans la table de jeu lors d'une partie issue d'un tournoi
! Passer l'overview du tournoi en responsive (passer l'arbre en colonne si mode mobile ou tablet)
! Dashboard à finir ?
! Rajouter status cencelled dans resultGame quand jeu annulé
! Prendre en compte ce statut dans l'affichage des parties du profil
 -->

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

<!-- MEMO ELISA -->
<!-- 
TODO : GoogleSigne Avatar -> ? Lee quand ca bug ? 
TODO : mettre nb de points dans les regles dans front
TODO : erase les players fictifs dans game local DONE - check multi - check post merge a faire
TODO : DB jeu interrompu - DOne - need more tests
TODO : en tournoi -> mettre les alias + noms correspondants aussi dans les jeux
TODO : ajouter dans la db : maj user tournament au fur et a me sure ou a la fin du tournoi + revoir les links users tournament -> utile pour les ID inconnus ?
-->

