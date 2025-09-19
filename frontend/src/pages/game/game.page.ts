import { BasePage } from '../base/base.page';
import { RouteConfig } from '../../types/routes.types';
import { webSocketService, translateService, currentService } from '../../services/index.service';
import { gameApi } from '../../api/game/game.api';
import { MatchMakingReq } from '../../shared/types/websocket.types';
import { MultiPlayerGame } from '../../components/game/BaseGame.component';
import { SafeUserModel } from '../../../../shared/types/user.types';


// ===========================================
// GAME PAGE
// ===========================================
export class GamePage extends BasePage {
	protected gameStarted: boolean = false;
	protected game?: MultiPlayerGame;
	protected finalScore: number[] = [];
	protected controlNodesUp!: NodeListOf<HTMLElement>;
	protected controlNodesDown!: NodeListOf<HTMLElement>;
	protected isSearchingGame: boolean = false;
	protected adversary: SafeUserModel | undefined; 
	protected webSocket: WebSocket | undefined;
	protected friendId: number = 0;

	protected insertNetworkError(): void {
		const errorDiv = document.createElement("div");
		errorDiv.setAttribute("data-ts", "game.networkError");
		errorDiv.textContent = "Network error. Please try again later";
		document.getElementById("pong-section")!.append(errorDiv);
	}

    protected async sendMatchMakingRequest(type : string, tournamentID?: number, invitedId?: number, inviterId?: number): Promise<void> {
        const message = type;
        const matchMakingReq: MatchMakingReq = {
            type: message,
            playerID: this.currentUser!.id,
            tournamentID: tournamentID,
			invitedId: invitedId,
			inviterId: inviterId
        }
		await gameApi.matchMake(matchMakingReq);
    }

	protected async initGame(playerID: number, gameID: number): Promise<void> {
		const allChildren = document.getElementById("pong-section");
		while (allChildren?.firstChild)
			allChildren.firstChild.remove();
		this.game = new MultiPlayerGame(2, playerID, gameID);
		currentService.setCurrentGame(this.game);
		await this.game.initGame();
	}

	// Les span avec attribut "data-ts" sont automatiquement traduits par le service de traduction
	// ! Si modif du texte, penser à mettre à jour les fichiers de traduction (frontend/src/services/core/translation/*.json)
	protected showEndGamePanel(): void {
		const panel = document.getElementById("pong-section")!;
		panel.innerHTML = "";

		const wrapper = document.createElement("div");
		const divWinLose = document.createElement("span");
		const divResScore = document.createElement("div");
		const spanRes = document.createElement("span");
		const spanScore = document.createElement("span");
		const spanAdversary = document.createElement("span");

		if (this.adversary && this.finalScore[0] < this.finalScore[1]) {
			divWinLose.setAttribute("data-ts", "game.loseMessage");
			divWinLose.textContent = "You lose !";
			divWinLose.classList.add("lose-message");
		} else if (this.adversary && this.finalScore[0] > this.finalScore[1]) {
			divWinLose.setAttribute("data-ts", "game.winMessage");
			divWinLose.textContent = "You win !";
			divWinLose.classList.add("win-message");
		}

		if (this.adversary && this.finalScore[0] !== this.finalScore[1]) {
			spanRes.setAttribute("data-ts", "game.resultText");
			spanRes.textContent = "You ";
		}
		spanScore.textContent = `${this.finalScore[0]} : ${this.finalScore[1]}`;
		if (this.adversary && this.finalScore[0] !== this.finalScore[1]) {
			spanAdversary.textContent = ` ${this.adversary?.username}`;
		}

		wrapper.classList.add("end-game-panel");
		divResScore.append(spanRes, spanScore, spanAdversary);
		wrapper.append(divWinLose, divResScore);
		panel.appendChild(wrapper);
		translateService.updateLanguage(undefined, panel);
		panel.classList.remove("hidden");
	}

	protected showTimer(time: number): void {
		const panel = document.getElementById("pong-section")!;
		panel.innerHTML = "";

		const wrapper = document.createElement("div");
		const spanTimerText = document.createElement("span");
		spanTimerText.setAttribute("data-ts", "game.timerText");
		spanTimerText.textContent = "Lets play in ... ";

		const spanTime = document.createElement("span");
		spanTime.textContent = `${time}`;

		wrapper.append(spanTimerText, spanTime);
		panel.appendChild(wrapper);
		translateService.updateLanguage(undefined, panel);
		panel.classList.remove("hidden");
	}

	constructor(config: RouteConfig) {
		super(config);
		this.webSocket = webSocketService.getWebSocket();
	}

	protected handleKeyDown = (event: KeyboardEvent): void => {};
	protected handleKeyup = (event: KeyboardEvent): void => {};

	protected attachListeners() {
		document.addEventListener("keydown", this.handleKeyDown);
		document.addEventListener("keyup", this.handleKeyup);
	}

	protected removeListeners(): void {
		document.removeEventListener("keydown", this.handleKeyDown);
		document.removeEventListener("keyup", this.handleKeyup);
	}

	/**
	 * Gestionnaire d'événement pour les messages WebSocket reçus durant une partie.
	 * Méthode appelée dans le service centralisé dédié: `webSocketService`.
	 * 
	 * @param data Les informations de la partie à lancer.
	 * @returns La promesse qui se résout lorsque le gestionnaire d'événement a fini de traiter les informations.
	 */
	public async handleGameMessage(data: any): Promise<void> {
		if (data.type == "start_game") {
			console.log(`game starts ! id = ${data.gameID}`);
			console.log("message is :", data);
			
			this.adversary = data.otherPlayer; // TODO : possibilite de recuperer l'avatar de l autre joueur si on veut l afficher ici
			// this.game!.clearScreen(); 
			// document.querySelector("endgame-panel")?.remove();
			// this
			this.gameStarted = true;
		}
		else if (data.type == "decount_game") 
		{
			this.showTimer(data.message);
			if (data.message == 0)
				await this.initGame(this.currentUser!.id, data.gameID);
		} else if (data.type == "end" && this.gameStarted) {
			this.game!.gameStarted = false;
			this.isSearchingGame = false;
			this.game!.setScore(data.score);
			console.log("END GAME DETECTED")
			this.game!.clearScreen();
			document.querySelector("canvas")?.remove();
			// document.querySelector("#pong-section")!.remove(); //pour permettre de voir le jeu si on decide de le relancer direct avec le meme joueur
			this.finalScore = this.game!.getScore(); //TODO = clean le final score je sais pas ou et le show en haut
			this.showEndGamePanel();
		} else if (data.type == "GameData") {
			this.game!.registerGameData(data);
			this.game!.setScore(data.score);
		} else if (data.type == "msg")
			console.log(data.msg);
		// else if (data.type == "hasQuit")
		// {
			// fetch post db changement jeu statut

		// }
	}

	public async cleanup(): Promise<void> {
		super.cleanup();
		this.sendMatchMakingRequest("no_matchmaking_request", undefined, this.friendId, this.currentUser!.id);
	}
}