import { BasePage } from './base.page';
import { RouteConfig } from '../types/routes.types';

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
 * 		Il en est de même pour l'utilisateur actuellement connecté: userStore dans frontend/src/stores/user.store.ts
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

	static PlayerBar = class {
		x: number;
		y: number;
		w: number;
		h: number;
		ctx: CanvasRenderingContext2D;
		draw() {
			this.ctx.fillStyle = "rgba(255, 0, 0)";
			this.ctx.fillRect(this.x, this.y - (this.h / 2), this.w, this.h);
			this.ctx.fillStyle = "rgba(0, 255, 0)";
			this.ctx.fillRect(this.x, this.y, 1, 1);
		};
		move(newY: number) {
			if (newY > 0 && this.y + newY + (this.h / 2) < this.ctx.canvas.clientHeight
			|| newY < 0 && this.y + newY - (this.h / 2) > 0)
				this.y += newY;
		}
		constructor(ctx: CanvasRenderingContext2D) {
			this.x = 0;
			this.y = 0;
			this.w = 20;
			this.h = 100;
			this.ctx = ctx;
		}
	}

	static Ball = class {
		x: number;
		y: number;
		vx: number;
		vy: number;
		radius: number;
		ctx: CanvasRenderingContext2D;
		draw() {
			this.ctx.beginPath();
			this.ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, true);
			this.ctx.closePath();
			this.ctx.fillStyle = "rgba(0, 0, 255)";
			this.ctx.fill();
		};
		constructor(ctx: CanvasRenderingContext2D) {
			this.x = 0;
			this.y = 0;
			this.vx = 5;
			this.vy = 2;
			this.radius = 10;
			this.ctx = ctx;
		}
	}

    private gameCanvas: HTMLCanvasElement = document.createElement('canvas');
    private canvasCtx: CanvasRenderingContext2D = this.gameCanvas.getContext("2d", {alpha: true})!;
	private playerOne = new GamePage.PlayerBar(this.canvasCtx);
	private playerTwo = new GamePage.PlayerBar(this.canvasCtx);
	private ball = new GamePage.Ball(this.canvasCtx);
	private frameReq: number;

	constructor(config: RouteConfig) {
		// super() = appelle le constructeur du parent BasePage et lui transmet la config de la page Game.
		// avec le container et le chemin du template HTML pour injecter la page.
		super(config);
		// this.frameReq = 0;
	}
	
	// méthode mount() = Ce qu'on injecte dynamiquement dans la page après avoir injecté le template HTML dans la div #app.
	// Tout est configuré. Il restera éventuellement des composants à rajouter si besoin,
	// mais le canvas / jeu dans frontend/public/templates/game.html devrait suffire ?
	protected async mount(): Promise<void> {
		this.initGame();
	}

	// Les potentiels events de la page ?
	protected attachListeners(): void {
		document.addEventListener("keydown", (event) => {});
		onkeydown = (event) => {
			console.log(event);
			if (event.key == "w")
				this.playerOne.move(-10);
			else if (event.key == "s")
				this.playerOne.move(10);
			if (event.key == "ArrowUp")
				this.playerTwo.move(-10);
			else if (event.key == "ArrowDown")
				this.playerTwo.move(10);
		}
	}

    private clearScreen(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void {
		this.canvasCtx.globalCompositeOperation = 'destination-out';
		this.canvasCtx.fillStyle = "rgba(0, 0, 0, 0.3)";
        this.canvasCtx.fillRect(0, 0, this.gameCanvas.width, this.gameCanvas.height);
		this.canvasCtx.globalCompositeOperation = 'source-over';
    }

	private checkCollision(): void {
		if (this.ball.x < 0 && this.ball.x <= this.playerOne.x + this.playerOne.w || this.ball.x >= this.playerTwo.x) {
			if (this.ball.y > this.playerOne.y + this.playerOne.h / 2
				|| this.ball.y < this.playerOne.y - this.playerOne.h / 2) {
					console.log("cancel !");
					cancelAnimationFrame(this.frameReq);
					return;
				}
			else
				this.ball.vx *= -1;
		}
		if (this.ball.y <= 0 || this.ball.y >= this.canvasCtx.canvas.height)
				this.ball.vy *= -1;
	}
	
	private gameLoop = () => {
        this.clearScreen(this.canvasCtx, this.gameCanvas);
		this.playerOne.draw();
		this.playerTwo.draw();
		this.checkCollision();
		this.ball.x += this.ball.vx;
		this.ball.y += this.ball.vy;
		this.ball.draw();
		this.canvasCtx.filter = 'none';
        requestAnimationFrame(this.gameLoop);
	}

	private initGame(): void {
        const canvasContainer: HTMLElement = document.getElementById("pong-section")!;
        canvasContainer.style.border = "1px solid black";
		this.gameCanvas.height = canvasContainer.getBoundingClientRect().height;    // will need to update that every frame later (responsiveness)
		this.gameCanvas.width = canvasContainer.getBoundingClientRect().width;
		this.playerOne.y = this.playerTwo.y = this.gameCanvas.height / 2;
		this.playerTwo.x = this.gameCanvas.width - this.playerTwo.w;
		this.ball.x = this.gameCanvas.width / 2;
		this.ball.y = this.gameCanvas.height / 2;
		this.gameCanvas.style.border = "1px solid black";
        canvasContainer.append(this.gameCanvas);
        this.frameReq = requestAnimationFrame(this.gameLoop);
	}

	// Amuse-toi biiiiiiennnnnnn ! =D
}