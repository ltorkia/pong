import { BasePage } from '../base/base.page';
import { RouteConfig } from '../../types/routes.types';
import { webSocketService } from '../../services/user/user.service';
import { MatchMakingReq } from '../../shared/types/websocket.types';
import { MultiPlayerGame } from '../../components/game/MultiplayerGame.component';


// ===========================================
// GAME PAGE
// ===========================================

/**
 * TODO: Suggestion d'orga pour cohérence avec structure actuelle
 * GamePage = vue principale basique pour injecter le template HTML, canvas + boutons dans le DOM
 * GamePage ou GameService ? = logique graphique et de rendu + poussée (canvas, animations, calculs, mouvements...)
 * GameService ou autre page ? = logique métier (WebSocket, communication serveur etc...)
 * A arranger à ta sauce selon ton inspiration...
 * 
 * NB: Les services sont des singletons instanciés une seule fois dans frontend/src/services/services.ts
 * 		et à importer dans le fichier qui t'interesse pour récupérer les méthodes de cette instance unique.
 * 		Il en est de même pour l'utilisateur actuellement connecté: storageService dans frontend/src/stores/user.store.ts
 * 
 * Fichiers utiles pour faire ta petite popote:
 * -> GameService: frontend/src/services/game.service.ts
 * -> game.css: frontend/src/styles/pages/game.css (class Tailwind dans feuille de style ou HTML directement, comme tu préfères)
 * -> game.html: frontend/public/templates/game.html = le template qui sera injecté dans index.html (mais ça pas besoin de t'en occuper).
 * 
 * -> config de la route: frontend/src/config/routes.config.ts
 * 		Actuellement pour la page Game:	
 *			path: routePaths.game,					= '/game'
 *			name: pageNames.game, 					= '/templates/game.html'
 *			pageClass: GamePage, 					= pour new GamePage() dans routing.service.ts
 *			templatePath: templatePaths.game, 		= '/templates/game.html'
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
	 * GamePage hérite de BasePage (frontend/src/pages/base.page.ts) qui:
	 * - injecte le template HTML dans la div #app
	 * - ajoute l'utilisateur connecté aux propriétés de la classe
	 * - ajoute le composant navbar ...
	 * 
	 * ! Voir les propriétés + méthodes de surcharge qui peuvent être utilisées ici.
	 */
    protected webSocket!: WebSocket | undefined;
	protected gameStarted: boolean = false;
	protected game?: MultiPlayerGame;
	protected finalScore: number[] = [];
	protected controlNodesUp!: NodeListOf<HTMLElement>;
	protected controlNodesDown!: NodeListOf<HTMLElement>;
	protected isSearchingGame: boolean = false;


    protected insertNetworkError(): void {
        const errorDiv = document.createElement("div");
        errorDiv.textContent = "Network error. Please try again later";
        document.getElementById("pong-section")!.append(errorDiv);
    }

    protected async sendMatchMakingRequest(type : string): Promise<void> {
        const message = type;         
        const matchMakingReq: MatchMakingReq = {
            type: message,
            playerID: this.currentUser!.id,
        }
        console.log("matchMakingReq = ", matchMakingReq);
        const res = await fetch("/api/game/playgame", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(matchMakingReq),
            credentials: 'include',
        });
        if (!res.ok) {
            const error = await res.json();
            console.error(error.error);
            return;
        }
    }


    protected async initGame(playerID: number, gameID: number): Promise<void> {
        const allChildren = document.getElementById("pong-section");
        while (allChildren?.firstChild)
            allChildren.firstChild.remove();
        this.game = new MultiPlayerGame(2, playerID, gameID);
        // await this.game.counter(); //a voir ou le rajouter
        await this.game.initGame();
    }

    protected showEndGamePanel(): void {
        const panel = document.getElementById("endgame-panel")!;
        panel.classList.remove("hidden");
        panel.innerText = `Result = ${this.finalScore[0]} : ${this.finalScore[1]}`;
    }

	constructor(config: RouteConfig) {
		super(config);
		this.webSocket = webSocketService.getWebSocket();
	}
	
	protected async mount(): Promise<void> {
		// this.initGame();
	}

	protected handleKeyDown = (event: KeyboardEvent): void => {};
	protected handleKeyup = (event: KeyboardEvent): void => {};


    protected attachListeners() {
        webSocketService.getWebSocket()!.addEventListener("message", async (event) => {
            const msg = JSON.parse(event.data);
            // console.log("@@@@@@@@@@@@@@@@@@@@@@msg = ", msg);
            if (msg.type == "start_game") {
                console.log(`game starts ! id = ${msg.gameID}`);
                // this.game!.clearScreen(); 
                // document.querySelector("endgame-panel")?.remove();
                this.gameStarted = true;
                await this.initGame(this.currentUser!.id, msg.gameID);
            } else if (msg.type == "end" && this.gameStarted) {
                this.game!.gameStarted = false;
                this.isSearchingGame = false;
                this.game!.setScore(msg.score);
                console.log("END GAME DETECTED")
                this.game!.clearScreen();
                document.querySelector("canvas")?.remove();
                // document.querySelector("#pong-section")!.remove(); //pour permettre de voir le jeu si on decide de le relancer direct avec le meme joueur
                this.finalScore = this.game!.getScore(); //TODO = clean le final score je sais pas ou et le show en haut
                this.showEndGamePanel();
            } else if (msg.type == "GameData") {
                this.game!.registerGameData(msg);
                this.game!.setScore(msg.score);
            } else if (msg.type == "msg")
                console.log(msg.msg);
        })
        this.webSocket?.addEventListener("error", (event) => {
            console.log(event);
        })
        document.addEventListener("keydown", this.handleKeyDown);
        document.addEventListener("keyup", this.handleKeyup);
    }

    protected removeListeners(): void {
        document.removeEventListener("keydown", this.handleKeyDown);
        document.removeEventListener("keyup", this.handleKeyup);
        this.sendMatchMakingRequest("no_matchmaking_request"); //peut etre optionnel
        console.log("@@@@@@@@@@@@@@@@@@@ romove");

    }

	// Amuse-toi biiiiiiennnnnnn ! =D
}