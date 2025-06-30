import { BasePage } from '../base/base.page';
import { RouteConfig } from '../../types/routes.types';

/**
 * TODO: Suggestion d'orga pour cohérence avec structure actuelle
 * GamePage = vue principale basique pour injecter le template HTML, canvas + boutons dans le DOM
 * GamePage ou GameService ? = logique graphique et de rendu + poussée (canvas, animations, calculs, mouvements...)
 * GameService ou autre page ? = logique métier (WebSocket, communication serveur etc...)
 * A arranger à ta sauce selon ton inspiration...
 * 
 * NB: Les services sont des singletons instanciés une seule fois dans frontend/src/services/services.ts
 * 		et à importer dans le fichier qui t'interesse pour récupérer les méthodes de cette instance unique.
 * 		Il en est de même pour l'utilisateur actuellement connecté: userStore dans frontend/src/stores/user.store.ts
 * 
 * Fichiers utiles pour faire ta petite popote:
 * -> GameService: frontend/src/services/game.service.ts
 * -> game.css: frontend/src/styles/pages/game.css (class Tailwind dans feuille de style ou HTML directement, comme tu préfères)
 * -> game.html: frontend/public/templates/game/game.html = le template qui sera injecté dans index.html (mais ça pas besoin de t'en occuper).
 * 
 * -> config de la route: frontend/src/config/routes.config.ts
 * 		Actuellement pour la page Game:	
 *			path: routePaths.game,					= '/game'
 *			name: pageNames.game, 					= '/templates/game/game.html'
 *			pageClass: GamePage, 					= pour new GamePage() dans routing.service.ts
 *			templatePath: templatePaths.game, 		= '/templates/game/game.html'
 *			components: {
 *				[componentNames.navbar]: getComponentConfig(componentNames.navbar) = composant de la navbar
 *			},
 *			isPublic: false,						= route accessible après authentification uniquement
 *			enableParticles: false					= désactivées pour qu'on puisse se focus sur le jeu, mais tu peux réactiver si tu veux
 *
 * 	Tous les éléments de la config sont accessibles dans cette classe.
 * 	Ils sont documentés dans types/routes.types.ts
 *
 * Notes:
 * -> Si ajout de composants:
 * 		- mettre fichiers source ici: frontend/src/components/game/*.ts *.html *.css
 * 		- paramétrer config composants: frontend/src/config/components.config.ts
 * 		- mettre à jour la liste des composants de GamePage dans la config routes.config.ts
 * 		- intégrer le composant à ta page...
 */
export class GamePage extends BasePage {

	/**
	 * GamePage hérite de BasePage (frontend/src/pages/base/base.page.ts) qui:
	 * - injecte le template HTML dans la div #app
	 * - ajoute l'utilisateur connecté aux propriétés de la classe
	 * - ajoute le composant navbar ...
	 * 
	 * ! Voir les propriétés + méthodes de surcharge qui peuvent être utilisées ici.
	 */

	constructor(config: RouteConfig) {
		// super() = appelle le constructeur du parent BasePage et lui transmet la config de la page Game.
		// avec le container et le chemin du template HTML pour injecter la page.
		super(config);
	}

	// méthode mount() = Ce qu'on injecte dynamiquement dans la page après avoir injecté le template HTML dans la div #app.
	// Tout est configuré. Il restera éventuellement des composants à rajouter si besoin,
	// mais le canvas / jeu dans frontend/public/templates/game/game.html devrait suffire ?
	protected async mount(): Promise<void> {}

	// Les potentiels events de la page ?
	protected attachListeners(): void {}

	// Amuse-toi biiiiiiennnnnnn ! =D
}