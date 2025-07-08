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
		};
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
		vAngle: number;
		vSpeed: number;
		radius: number;
		ctx: CanvasRenderingContext2D;
		draw() {
			this.ctx.beginPath();
			this.ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, true);
			this.ctx.closePath();
			this.ctx.fillStyle = "rgba(0, 0, 255)";
			this.ctx.fill();
		};
		move() {
			this.x += Math.cos(this.vAngle * 0.0174533) * this.vSpeed;
			this.y += Math.sin(this.vAngle * 0.0174533) * this.vSpeed;
		};
		verticalCollision() {
			this.vAngle = (360 - this.vAngle) % 360;
		}
		horizontalCollision() {
			this.vAngle = (180 - this.vAngle + 360) % 360;
		}
		isGoingRight() {
			if ((this.vAngle >= 0 && this.vAngle <= 90) || (this.vAngle >= 270 && this.vAngle <= 360))
				return true;
			return false;
		};
		isGoingLeft() {
			if (this.vAngle >= 90 && this.vAngle < 270)
				return true;
			return false;
		}
		constructor(ctx: CanvasRenderingContext2D) {
			this.x = 0;
			this.y = 0;
			this.vAngle = 30;
			this.vSpeed = 5;
			this.radius = 10;
			this.ctx = ctx;
		}
	}
    private gameCanvas: HTMLCanvasElement = document.createElement('canvas');
    private canvasCtx: CanvasRenderingContext2D = this.gameCanvas.getContext("2d", {alpha: true})!;
	private playerOne = new GamePage.PlayerBar(this.canvasCtx);
	private playerTwo = new GamePage.PlayerBar(this.canvasCtx);
	private ball = new GamePage.Ball(this.canvasCtx);
	private frameReq: number = 0;
	private gameStarted: boolean = false;
	private hitAnimationOn: boolean = false;
	private inputs: {[key: string]: boolean} = {
		"w": false,
		"s": false,
		"ArrowUp": false,
		"ArrowDown": false
	};

	constructor(config: RouteConfig) {
		// super() = appelle le constructeur du parent BasePage et lui transmet la config de la page Game.
		// avec le container et le chemin du template HTML pour injecter la page.
		super(config);
	}
	
	protected async mount(): Promise<void> {
		this.initGame();
	}

	// Les potentiels events de la page ?
	protected attachListeners(): void {
		document.addEventListener("keydown", (event) => {
			if (event.key in this.inputs) {
				this.inputs[event.key] = true;
			}
		});
		document.addEventListener("keyup", (event) => {
			if (event.key in this.inputs) {
				this.inputs[event.key] = false;
			}
		});
	}

	private createHitElement() {
		const x: number = this.ball.x;
		const y: number = this.ball.y;
		let radius: number = 10;

		return {
			getRadius() {
				radius += 1;
				return (radius);
			},
			getX() { return x; },
			getY() { return y; }
		}
	};

	private hitAnimation(): void {
		let hit;
		if (!this.hitAnimationOn)
		{
			this.hitAnimationOn = true;
			hit = this.createHitElement();
		}
		if (hit != undefined)
		{
			this.canvasCtx.strokeStyle = "green";
			this.canvasCtx.beginPath();
			this.canvasCtx.arc(hit.getX(), hit.getY(), hit.getRadius(), 0, Math.PI * 2, true);
			this.canvasCtx.stroke();
			console.log(hit.getRadius());
		}
	}

    private clearScreen(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void {
		this.canvasCtx.globalCompositeOperation = 'destination-out';
		this.canvasCtx.fillStyle = "rgba(0, 0, 0, 0.3)";
        this.canvasCtx.fillRect(0, 0, this.gameCanvas.width, this.gameCanvas.height);
		this.canvasCtx.globalCompositeOperation = 'source-over';
    }

	private checkCollision(): void {
		if (this.ball.isGoingRight() && this.ball.x >= this.playerTwo.x) {
			if ((this.ball.y < this.playerTwo.y - this.playerTwo.h / 2) || (this.ball.y > this.playerTwo.y + this.playerTwo.h / 2)) {
				this.gameStarted = false;
				console.log("player two lost !");
				window.cancelAnimationFrame(this.frameReq);
			}
			else
			{
				this.hitAnimation();
				this.ball.horizontalCollision();
			}
		} else if (this.ball.isGoingLeft() && this.ball.x <= this.playerOne.x + this.playerOne.w)
		{
			if ((this.ball.y < this.playerOne.y - this.playerOne.h / 2) || (this.ball.y > this.playerOne.y + this.playerOne.h / 2)) {
				this.gameStarted = false;
				console.log("player one lost !");
			}
			else
			{
				this.hitAnimation
				this.ball.horizontalCollision();
			}
		}
		else if (this.ball.y <= 0 || this.ball.y >= this.gameCanvas.height)
			this.ball.verticalCollision();
	}
	
	private checkPlayerMovement(): void {
		for (const input in this.inputs) {
			if (input === "w" && this.inputs[input] === true)
				this.playerOne.move(-10);
			else if (input === "s" && this.inputs[input] === true)
				this.playerOne.move(10);
			else if (input === "ArrowUp" && this.inputs[input] === true)
				this.playerTwo.move(-10);
			else if (input === "ArrowDown" && this.inputs[input] === true)
				this.playerTwo.move(10);
		}
	}

	private gameLoop = () => {
		if (this.gameStarted === false)
			return ;
        this.clearScreen(this.canvasCtx, this.gameCanvas);
		this.playerOne.draw();
		this.playerTwo.draw();
		this.checkCollision();
		this.checkPlayerMovement();
		this.ball.move();
		this.ball.draw();
		if (this.hitAnimationOn)
			this.hitAnimation();
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
		if (this.gameStarted === false) {	
			this.frameReq = requestAnimationFrame(this.gameLoop);
			this.gameStarted = true;
		}
	}

	// Amuse-toi biiiiiiennnnnnn ! =D
}