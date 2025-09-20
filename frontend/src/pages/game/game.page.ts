import { BasePage } from '../base/base.page';
import { RouteConfig, RouteParams } from '../../types/routes.types';
import { translateService, currentService, gameService, notifService } from '../../services/index.service';
import { gameApi } from '../../api/game/game.api';
import { MatchMakingReq } from '../../shared/types/websocket.types';
import { MultiPlayerGame } from '../../components/game/BaseGame.component';
import { SafeUserModel } from '../../../../shared/types/user.types';
import { Friend } from '../../shared/models/friend.model';
import { friendApi } from '../../api/index.api';
import { loadTemplate, getHTMLElementByClass, getHTMLElementById } from '../../utils/dom.utils';

// ===========================================
// GAME PAGE
// ===========================================
export abstract class GamePage extends BasePage {
	protected game?: MultiPlayerGame;
	protected finalScore: number[] = [];
	protected controlNodesUp!: NodeListOf<HTMLElement>;
	protected controlNodesDown!: NodeListOf<HTMLElement>;
	protected isSearchingGame: boolean = false;
	protected adversary: SafeUserModel | undefined; 

	protected gameType?: string;
	protected isPartOfTournament: boolean = false;

	protected challengedFriendId?: number | RouteParams;
	protected friendId: number = 0;
	protected relation?: Friend;
	protected isInvitationGame: boolean = false;

	constructor(config: RouteConfig) {
		super(config);
	}

	// ===========================================
	// METHODES REUTILISEES DANS RENDER DE BASEPAGE
	// ===========================================
	protected async preRenderCheck(): Promise<boolean> {
		if (!super.preRenderCheck())
			return false;
		if (this.challengedFriendId) {
			this.friendId = Number(this.challengedFriendId);
			this.relation = await friendApi.getRelation(this.currentUser!.id, this.friendId);
			if (!this.relation || "errorMessage" in this.relation || !this.relation.waitingInvite)
				return false;
			this.isInvitationGame = true;
		}
		return true;
	}

	protected async beforeMount(): Promise<void> {
		if (this.isInvitationGame) {
			if (this.currentUser!.id === this.relation.challengedBy) {
				await this.sendMatchMakingRequest("invite", undefined, this.friendId, this.currentUser!.id);
				this.appendWaitText();
			} else if (this.currentUser!.id === this.relation.isChallenged) {
				await this.sendMatchMakingRequest("invite-accept", undefined, this.currentUser!.id, this.friendId);
				this.appendWaitText();
			} else {
				console.error("Erreur de matchmaking dans l'invite.");
				return;
			}
			this.gameType = "invite";
		} 
		else if (window.location.pathname === "/game/local")
			this.gameType = "local";
		else if (this.isPartOfTournament)
			// TODO: la méthode pour passer this.isPartOfTournament à true est à implémenter,
			// ? ou alors, voir avec les données du jeu si c'est pas déjà dispo quelque part.
			this.gameType = "tournament";
		else
			this.gameType = "matchmaking_request";
	}

	protected attachListeners() {
		document.addEventListener("keydown", this.handleKeyDown);
		document.addEventListener("keyup", this.handleKeyUp);
	}

	protected removeListeners(): void {
		document.removeEventListener("keydown", this.handleKeyDown);
		document.removeEventListener("keyup", this.handleKeyUp);
		document.removeEventListener("click", this.handleReplayBtnClick);
	}

	// ===========================================
	// LISTENERS HANDLERS
	// ===========================================
	protected abstract handleKeyDown(event: KeyboardEvent): Promise<void>;
    protected handleKeyUp = async (event: KeyboardEvent): Promise<void> => {
        this.controlNodesUp = document.querySelectorAll(".control");
        for (const node of this.controlNodesUp) {
            if (node.dataset.key == event.key)
                node.classList.remove("button-press");
        }
    }
	
	protected handleReplayBtnClick = async (event: MouseEvent): Promise<void> => {
		event.preventDefault();
		switch (this.gameType) {

			case "local":
				this.isSearchingGame = true;          
				await this.sendMatchMakingRequest("local");
				break;

			case "invite":
				if (!this.friendId) {
					console.error("No friend id");
					return;
				}
				try {
					await gameService.invitePlayer("invite", this.friendId);
				} catch (err) {
					console.error(err);
				}
				await notifService.handleChallengeClick(event);
				await this.sendMatchMakingRequest("invite", undefined, this.friendId, this.currentUser!.id);
				this.appendWaitText();
				break;

			case "matchmaking_request":
				this.isSearchingGame = true;              
				await this.sendMatchMakingRequest("matchmaking_request");
				this.appendWaitText();
				break;
		}
	}

	// ===========================================
	// HANDLER PUBLIC POUR MESSAGES SOCKET
	// ===========================================
	/**
	 * Gestionnaire d'événement pour les messages WebSocket reçus durant une partie.
	 * Méthode appelée dans le service centralisé dédié: `webSocketService`.
	 * 
	 * @param data Les informations de la partie à lancer.
	 * @returns La promesse qui se résout lorsque le gestionnaire d'événement a fini de traiter les informations.
	 */
	public async handleGameMessage(data: any): Promise<void> {
		switch (data.type) {

			case "start_game":
				this.adversary = data.otherPlayer; 
				// TODO : possibilite de recuperer l'avatar de l autre joueur si on veut l afficher ici
				break;

			case "decount_game":
				this.showTimer(data.message);
				if (data.message == 0) {
					await this.initGame(this.currentUser!.id, data.gameID);
					currentService.setGameRunning(true);
				}
				break;

			case "end":
				if (!this.game!.gameStarted)
					return;
				this.isSearchingGame = false;
				this.game!.setScore(data.score);
				this.game!.clearScreen();
				document.querySelector("canvas")?.remove();
				this.finalScore = this.game!.getScore();

				// ! Skip le endgame panel si la partie fait partie d'un tournoi ?
				// ! Voir comment Kiki s'organise pour l'affichage des scores dans le cadre d'un tournoi
				if (!this.isPartOfTournament) 
					await this.showEndGamePanel();

				currentService.clearCurrentGame();
				break;

			case "GameData":
				this.game!.registerGameData(data);
				this.game!.setScore(data.score);
				break;

			case "msg":
				console.log(data.msg);
				break;

			default:
				// Si le jeu est quitté ? Exemple: data.type == "hasQuit" ?
				// fetch post db changement jeu statut
				// currentService.clearCurrentGame();
		}
	}

	// ===========================================
	// METHODES COMMUNES AU JEU
	// ===========================================
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
		if (type !== "clean_request")
			currentService.setGameInit(true);
    }

	protected async initGame(playerID: number, gameID: number): Promise<void> {
		const allChildren = document.getElementById("pong-section");
		while (allChildren?.firstChild)
			allChildren.firstChild.remove();
		this.game = new MultiPlayerGame(2, playerID, gameID);
		await this.game.initGame();
	}

	protected appendWaitText(): void {
		const waitDiv: HTMLElement | null = document.getElementById("wait-div");
		if (!waitDiv) {
			const pongSection = document.getElementById("pong-section")!;
			pongSection.innerHTML = "";
			const lobby: HTMLElement = document.createElement("div");
			const waitingUsername: HTMLElement = document.createElement("span");
			const waitingText1: HTMLElement = document.createElement("span");
			const waitingText2: HTMLElement = document.createElement("span");
			waitingText1.setAttribute("data-ts", "game.waitingText1");
			waitingText2.setAttribute("data-ts", "game.waitingText2");
			if (this.gameType === "invite") {
				waitingText1.textContent = "Waiting for ";
				waitingUsername.textContent = this.relation!.username;
				waitingText2.textContent = " to connect...";
			} else {
				waitingText1.textContent = "Waiting for ";
				waitingUsername.textContent = "another player";
				waitingText2.textContent = " to connect...";
				waitingUsername.setAttribute("data-ts", "game.waitingTextPlayer");
			}
			lobby.append(waitingText1, waitingUsername, waitingText2);
			lobby.id = "wait-div";
			pongSection.append(lobby);
			translateService.updateLanguage(undefined, pongSection);
		}
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
	
	protected async showEndGamePanel(): Promise<void> {
		const panel = document.getElementById("pong-section")!;
		panel.innerHTML = "";

		let endGamePanel = await this.fetchEndGameItem();
		if (!endGamePanel) {
			console.error("Failed to fetch end game panel");
			this.insertNetworkError();
			return;
		}
		endGamePanel = endGamePanel.cloneNode(true) as Element;
		this.fillScoreBox(endGamePanel);
		this.setReplayButton(endGamePanel);

		panel.appendChild(endGamePanel);
		translateService.updateLanguage(undefined, panel);
		panel.classList.remove("hidden");
	}

	private async fetchEndGameItem(): Promise<Element | null> {
		const html = await loadTemplate("/templates/game/endgame_panel.html");
		const parser = new DOMParser();
		const doc = parser.parseFromString(html, "text/html");
		return doc.querySelector(".endgame-panel");
	}


	// Les span avec attribut "data-ts" sont automatiquement traduits par le service de traduction
	// ! Si modif du texte, penser à mettre à jour les fichiers de traduction (frontend/src/services/core/translation/*.json)
	protected fillScoreBox(endGamePanel: Element): void {
		const resMessage = getHTMLElementByClass('res-message', endGamePanel) as HTMLElement;
		const resScore = getHTMLElementByClass('res-score', endGamePanel) as HTMLElement;
		const spanRes = document.createElement("span");
		const spanScore = document.createElement("span");
		const spanAdversary = document.createElement("span");

		if (this.adversary) {
			if (this.finalScore[0] < this.finalScore[1]) {
				resMessage.setAttribute("data-ts", "game.loseMessage");
				resMessage.textContent = "You lose !";
				resMessage.classList.add("lose-message");
			} else if (this.finalScore[0] > this.finalScore[1]) {
				resMessage.setAttribute("data-ts", "game.winMessage");
				resMessage.textContent = "You win !";
				resMessage.classList.add("win-message");
			}
			resMessage.classList.remove("hidden");
		}

		spanScore.textContent = ` : ${this.finalScore[0]} - ${this.finalScore[1]} : `;

		if (this.finalScore[0] !== this.finalScore[1]) {
			if (this.adversary) {
				spanRes.setAttribute("data-ts", "game.resultText");
				spanRes.textContent = "You";
				spanAdversary.textContent = `${this.adversary?.username}`;
			} else {
				spanRes.setAttribute("data-ts", "game.player1");
				spanRes.textContent = "Player 1";
				spanAdversary.setAttribute("data-ts", "game.player2");
				spanAdversary.textContent = `Player 2`;
			}
		}
		resScore.append(spanRes, spanScore, spanAdversary);
	}

	protected setReplayButton(endGamePanel: Element): void {
		const replayBtn = getHTMLElementById('replay-button', endGamePanel) as HTMLElement;
		if (this.friendId)
			replayBtn.setAttribute("data-friend-id", this.friendId!.toString());
		document.addEventListener("click", this.handleReplayBtnClick);
	}

	// ===========================================
	// CLEANUP PAGE (OVERRIDE CLEANUP BASEPAGE)
	// ===========================================
	public async cleanup(): Promise<void> {
		super.cleanup();
		await this.sendMatchMakingRequest("clean_request", undefined, this.friendId, this.currentUser!.id);
		currentService.clearCurrentGame();
	}
}