import { BasePage } from '../base/base.page';
import { RouteConfig, RouteParams } from '../../types/routes.types';
import { MatchMakingReq } from '../../shared/types/websocket.types';
import { MultiPlayerGame } from '../../components/game/BaseGame.component';
import { webSocketService, translateService } from '../../services/index.service';
import { friendApi } from '../../api/index.api';
import { GamePage } from './game.page';

export class GameMenuMulti extends GamePage {
	private challengedFriendId?: number | RouteParams;

	constructor(config: RouteConfig, userId?: number | RouteParams) {
		super(config);
		this.webSocket = webSocketService.getWebSocket();
		if (userId)
			this.challengedFriendId = userId;
	}

	protected async beforeMount(): Promise<void> {
		if (!this.challengedFriendId)
			return;

		const friendId: number = Number(this.challengedFriendId);
		const relation = await friendApi.getRelation(this.currentUser!.id, friendId);
		if (!relation || "errorMessage" in relation) {
			console.error(relation.errorMessage || "Relation introuvable.");
			return;
		}
		if (!relation.waitingInvite) {
			if (this.currentUser!.id === relation.challengedBy) {
				this.sendMatchMakingRequest("invite", undefined, friendId, this.currentUser!.id);
				this.appendWaitText();
			} else if (this.currentUser!.id === relation.isChallenged) {
				this.sendMatchMakingRequest("invite_accept", undefined, this.currentUser!.id, friendId);
				this.appendWaitText();

			} else {
				console.error("Erreur de matchmaking dans l'invite.");
				return;
			}
		}
	}

	private appendWaitText(): void {
		const waitDiv: HTMLElement | null = document.getElementById("wait-div");
		if (!waitDiv) {
			const lobby: HTMLElement = document.createElement("div");
			lobby.setAttribute("data-ts", "game.lobbyWaiting");
			lobby.textContent = "Waiting for other players to connect...";
			lobby.id = "wait-div";
			const pongSection = document.getElementById("pong-section")!;
			pongSection.innerHTML = "";
			pongSection.append(lobby);
			translateService.updateLanguage(undefined, pongSection);
		}
	}

	protected handleKeyDown = (event: KeyboardEvent): void => {
		this.controlNodesDown = document.querySelectorAll(".control");
		if (event.key == " " && this.isSearchingGame === false) { //TODO : creer un bouton pour lancer le jeu et replay pour sendmatchmaquingrequest pour eviter de le lancer en dehors de la page jeu
			this.isSearchingGame = true;                
			this.sendMatchMakingRequest("matchmaking_request");
			this.appendWaitText();
		}
		for (const node of this.controlNodesDown) {
			if (node.dataset.key == event.key)
				node.classList.add("button-press");
		}
	}

	protected handleKeyup = (event: KeyboardEvent): void => {
		this.controlNodesUp = document.querySelectorAll(".control");
		for (const node of this.controlNodesUp) {
			if (node.dataset.key == event.key)
				node.classList.remove("button-press");
		}
	}

}

// TODO = gerer les parties interrompues en cours de jeu -> ajout du score des 2 utilisateurs + check ? Ou juste refetch quand actualisation et maj des parties abandonnees ? jsp
// TODO = affichage result -> le remettre au milieu ? 
// TODO = CLEAN SOCKET MOI PAS COMPRENDRE