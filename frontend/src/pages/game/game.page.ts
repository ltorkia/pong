import DOMPurify from "dompurify";
import { BasePage } from '../base/base.page';
import { RouteConfig } from '../../types/routes.types';
import { ROUTE_PATHS } from '../../config/routes.config';
import { translateService, currentService, notifService } from '../../services/index.service';
import { gameApi } from '../../api/game/game.api';
import { MatchMakingReq } from '../../shared/types/websocket.types';
import { MultiPlayerGame } from '../../components/game/BaseGame.component';
import { SafeUserModel } from '../../../../shared/types/user.types';
import { Friend } from '../../shared/models/friend.model';
import { friendApi } from '../../api/index.api';
import { loadTemplate, getHTMLElementByClass, getHTMLElementById } from '../../utils/dom.utils';
import { router } from "../../router/router";

// ===========================================
// GAME PAGE
// ===========================================
export abstract class GamePage extends BasePage {
	protected game?: MultiPlayerGame;
	protected finalScore: number[] = [];
	protected controlNodesUp!: NodeListOf<HTMLElement>;
	protected controlNodesDown!: NodeListOf<HTMLElement>;
	protected playButton!: HTMLElement;
	protected endGamePanel?: Element;
	protected gameType?: string;

	protected isSearchingGame: boolean = false;
	protected adversary: SafeUserModel | undefined;

	protected gameID: number = 0;
	protected tournamentID: number = 0;
	protected requestType?: string;

	public abstract challengedFriendID: number;
	protected relation?: Friend;
	protected isInvitationGame: boolean = false;
	protected replayInvite: boolean = false;
	protected inviteToClean: boolean = true;

	constructor(config: RouteConfig) {
		super(config);
	}

	// ===========================================
	// METHODES REUTILISEES DANS RENDER DE BASEPAGE
	// ===========================================

	/**
	 * Avant le montage de la page, on vérifie que l'utilisateur est bien connecté.
	 * On vérifie aussi si le jeu n'est pas dans le cadre d'une invitation entre amis.
	 * Si c'est le cas, l'id de l'ami est présent en paramètre de l'URL courante
	 * et on charge la relation correspondante dans 'handleInviteSettings()'.
	 * Si la relation n'existe pas ou si l'invitation n'existe pas, on retourne false.
	 * Si la méthode retourne false, on redirige vers la page 'Home'.
	 * @returns {Promise<boolean>} Une promesse qui se résout lorsque les vérifications sont terminées.
	 */
	protected async preRenderCheck(): Promise<boolean> {
		const isPreRenderChecked = await super.preRenderCheck();
		if (!isPreRenderChecked)
			return false;
		if (this.challengedFriendID) {
			const isInviteSet = await this.handleInviteSettings();
			if (!isInviteSet)
				return false;
		}
		return true;
	}

	/**
	 * On définit le type de requête : local, invite, ou matchmaking_request (= online hors invite).
	 * Dans le cas d'une invitation, dans 'handleInviteRequest()' on utilise 'this.sendMatchMakingRequest' avec des paramètres adaptés
	 * différement, qui dépendent de si l'utilisateur courant est celui qui invite ou celui qui est invité.
	 * @returns {Promise<void>} Une promesse qui se résout lorsque les vérifications sont terminées.
	 */
	protected async beforeMount(): Promise<void> {
		this.playButton = getHTMLElementByClass("start-click");
		if (this.isInvitationGame) {
			const isRequestSet = await this.handleInviteRequest();
			if (!isRequestSet)
				return;
		}
	}

	protected attachListeners() {
		this.playButton.addEventListener("click", this.handlePlayClick);
		document.addEventListener("keydown", this.handleKeyDown);
		document.addEventListener("keyup", this.handleKeyUp);
	}

	protected removeListeners(): void {
		this.playButton.removeEventListener("click", this.handlePlayClick);
		document.removeEventListener("keydown", this.handleKeyDown);
		document.removeEventListener("keyup", this.handleKeyUp);

		const replayBtn = document.querySelector('.replay-button');
		if (replayBtn)
			replayBtn.removeEventListener("click", this.handleReplayBtnClick);
	}

	// ===========================================
	// LISTENERS HANDLERS
	// ===========================================
	protected abstract initMatchRequest(): Promise<void>;

	protected handlePlayClick = async (event: MouseEvent): Promise<void> => {
		if (this.isSearchingGame === false)
			await this.initMatchRequest();
	}

	protected handleKeyDown = async (event: KeyboardEvent): Promise<void> => {
		this.controlNodesDown = document.querySelectorAll(".control");
		if (event.key == " " && this.isSearchingGame === false)
			await this.initMatchRequest();
		for (const node of this.controlNodesDown)
			if (node.dataset.key == event.key)
				node.classList.add("button-press");
	}

	protected handleKeyUp = async (event: KeyboardEvent): Promise<void> => {
		this.controlNodesUp = document.querySelectorAll(".control");
		for (const node of this.controlNodesUp) {
			if (node.dataset.key == event.key)
				node.classList.remove("button-press");
		}
	}

	/**
	 * Gère l'événement de clic sur le bouton "Rejouer" dans la page du jeu.
	 * 
	 * - Empêche le comportement par défaut de l'événement.
	 * - Si le jeu fait partie d'un tournoi, la fonction s'arrête immédiatement.
	 * - Adapte les requêtes de matchmaking en fonction du type de jeu.
	 * @param event - L'événement souris déclenché lors du clic sur le bouton "Rejouer".
	 * @returns {Promise<void>} - Une promesse qui se résout lorsque le traitement du replay est terminé.
	 */
	protected handleReplayBtnClick = async (event: Event): Promise<void> => {
		event.preventDefault();
		if (this.tournamentID)
			return;

		switch (this.requestType) {

			case "local":
				this.isSearchingGame = true;
				await this.sendMatchMakingRequest("local");
				break;

			case "invite":
			case "invite-accept":
				this.relation = await friendApi.getRelation(this.currentUser!.id, this.challengedFriendID);
				if (!this.relation || "errorMessage" in this.relation) {
					console.error(this.relation.errorMessage || "Problème lors de la reprise de partie.");
					return;
				}
				this.replayInvite = true;
				if (!this.relation.challengedBy)
					await notifService.handleChallengeClick(event);
				else if (this.relation.challengedBy === this.relation.id)
					await notifService.handlePlayClick(event);
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
	 * Les vérifications se font dans ce service : 
	 * - si un jeu est en cours, 
	 * - si on est bien sur la page de jeu, 
	 * - si le type de message est valide.
	 * ! Si un nouveau type de message doit être détecté par la socket 
	 * ! il faut l'ajouter dans constants.config.ts :
	 * ! GAME_TYPE_MSG = pour les messages liés au jeu
	 * ! TOURNAMENT_TYPE_MSG - pour les messages liés aux tournois
	 * 
	 * @param data Les informations de la partie à lancer.
	 * @returns La promesse qui se résout lorsque le gestionnaire d'événement a fini de traiter les informations.
	 */
	public async handleGameMessage(data: any): Promise<void> {
		switch (data.type) {

			case "start_game":
				if (!this.gameID)
					this.gameID = data.gameID;
				this.adversary = data.otherPlayer;
				this.game = new MultiPlayerGame(2, this.currentUser!.id, this.gameID);
				break;

			case "decount_game":
				this.showTimer(data.message);
				if (data.message == 0) {
					await this.initGame();
					currentService.setGameRunning(true);
				}
				break;

			case "end":
				this.isSearchingGame = false;
				this.game!.setScore(data.score);
				this.game!.clearScreen();
				document.querySelector("canvas")?.remove();
				this.finalScore = this.game!.getScore();
				await this.showEndGamePanel();

				this.game!.cleanupListeners();
				currentService.clearCurrentGame();
				break;

			case "GameData":
				this.game!.registerGameData(data);
				this.game!.setScore(data.score);
				break;

			case "msg":
				console.log(data.msg);
				break;
		}
	}

	// ===========================================
	// METHODES COMMUNES AU JEU
	// ===========================================

	/**
	 * Vérifie si l'utilisateur est bien dans le contexte d'une invitation.
	 * Procède d'abord les vérifications de base pour l'invitation.
	 * Méthode publique utilisée dans le handler du bouton 'Replay' et dans 'notifService'
	 * pour le bouton de la notification.
	 * @returns {Promise<boolean>} La promesse qui se résout lorsque les vérifications sont terminées.
	 */
	public async checkInviteReplayRequest(): Promise<boolean> {
		const isInviteSet = await this.handleInviteSettings();
		const isRequestSet = await this.handleInviteRequest();
		if (!isInviteSet || !isRequestSet)
			return false;
		return true;
	}

	/**
	 * Gère les paramètres de l'invitation.
	 * Renvoie la promesse résolue si l'utilisateur est bien dans le contexte d'une invitation.
	 * 
	 * @returns {Promise<boolean>} La promesse qui se résout lorsque les vérifications sont terminées.
	 */
	protected async handleInviteSettings(): Promise<boolean> {
		this.relation = await friendApi.getRelation(this.currentUser!.id, this.challengedFriendID);
		if (!this.relation || "errorMessage" in this.relation || !this.relation.waitingInvite)
			return false;
		switch (this.currentUser!.id) {
			case this.relation.challengedBy:
				this.requestType = "invite";
				break;
			case this.relation.isChallenged:
				this.requestType = "invite-accept";
				break;
			default:
				console.error("Invite settings not found");
				return false;
		}
		this.isInvitationGame = true;
		return true;
	}

	/**
	 * Gère les requêtes d'invitation.
	 * Si l'utilisateur courant est l'expéditeur initial, envoie une requête de type "invite".
	 * Sinon, si l'utilisateur courant est l'expéditeur ciblé, envoie une requête de type "invite-accept".
	 * Si l'utilisateur n'est pas dans le contexte d'une invitation, lance une erreur.
	 * @returns {Promise<boolean>} La promesse qui se résout lorsque les vérifications sont terminées.
	 */
	protected async handleInviteRequest(): Promise<boolean> {
		if (!this.relation) {
			console.error("Relation not found");
			return false;
		}
		if (this.currentUser!.id === this.relation.challengedBy) {
			if (this.replayInvite)
				await this.sendMatchMakingRequest("invite", this.challengedFriendID, this.currentUser!.id);
			this.appendWaitText();
		} else if (this.currentUser!.id === this.relation.isChallenged) {
			await this.sendMatchMakingRequest("invite-accept", this.currentUser!.id, this.challengedFriendID);
			this.appendWaitText();
		} else {
			console.error("Erreur de matchmaking dans l'invite.");
			return false;
		}
		return true;
	}

	/**
	 * Méthode publique appelée dans notifService lorsque l'utilisateur reçoit une nouvelle invitation,
	 * après un jeu issu d'une précédente invitation.
	 * Change le bouton 'Replay' en 'Accept new game' dans le panneau de fin de jeu.
	 */
	public changeReplayButtonForInvite(): void {
		if (!this.endGamePanel)
			return;
		const replayWithSpan = getHTMLElementById('replay-with', this.endGamePanel) as HTMLElement;
		replayWithSpan.setAttribute("data-ts", "accept-invitation-from");
	}

	/**
	 * Change le statut de nettoyage de l'invitation.
	 * Si cleanInvite est à true, l'invitation sera nettoyée au prochain changement de page.
	 * @param {boolean} [cleanInvite] Optionnel, true si l'invitation actuelle doit être nettoyée, false sinon.
	 */
	public setCleanInvite(cleanInvite: boolean = false): void {
		this.inviteToClean = cleanInvite;
	}

	protected updateInviteNotification(): void {
		notifService.notifs = notifService.notifs.filter((notif) => notif.from == this.challengedFriendID
			&& notif.content !== null && notif.content !== '');
		if (notifService.navbarInstance!.notifsWindow)
			notifService.displayDefaultNotif();
	}

	/**
	 * Insère un message d'erreur réseau dans le DOM, à l'intérieur de l'élément
	 * ayant l'ID "pong-section". Le message d'erreur est affiché dans un nouvel
	 * élément <div> avec un attribut data "data-ts" défini à "game.networkError"
	 * pour le service de traduction.
	 */
	protected insertNetworkError(): void {
		const errorDiv = document.createElement("div");
		errorDiv.setAttribute("data-ts", "game.networkError");
		errorDiv.textContent = "Network error. Please try again later";
		document.getElementById("pong-section")!.append(errorDiv);
	}

	/**
	 * Envoie une requête POST à la route API `/api/game/playgame` pour lancer une partie
	 * dans le contexte d'un matchmaking (aléatoire / invite / tournoi).
	 * 
	 * @param {string} type Le type de partie (matchmaking, invite, tournament).
	 * @param {number} [invitedID] L'ID du joueur invité si la partie est une invitation.
	 * @param {number} [inviterID] L'ID du joueur qui invite si la partie est une invitation.
	 * @param {boolean} [inviteToClean] Indique si le joueur doit se supprimer des joueurs actifs au refresh.
	 * @returns {Promise<void>} La promesse qui se résout lorsque la partie est lancée.
	 */
	protected async sendMatchMakingRequest(type: string, invitedID?: number, inviterID?: number, inviteToClean?: boolean): Promise<void> {
		const message = type;
		const matchMakingReq: MatchMakingReq = {
			type: message,
			playerID: this.currentUser!.id,
			tournamentID: this.tournamentID,
			invitedID: invitedID,
			inviterID: inviterID,
			gameID: this.gameID,
			inviteToClean: inviteToClean
		}

		try {
			await gameApi.matchMake(matchMakingReq);
		} catch (error) {
			console.error(error);
			return;
		}
	}

	/**
	 * Initialise le jeu en supprimant les éléments HTML existants dans le container #pong-section.
	 * Appelle la méthode initGame() de l'objet MultiPlayerGame pour initialiser le jeu.
	 * 
	 * @returns {Promise<void>} La promesse qui se résout lorsque le jeu est initialisé.
	 */
	protected async initGame(): Promise<void> {
		const allChildren = document.getElementById("pong-section");
		while (allChildren?.firstChild)
			allChildren.firstChild.remove();
		await this.game!.initGame();
	}

	/**
	 * Affiche un message d'attente dans le container #pong-section
	 * en fonction du type de jeu (invite, matchmaking_request).
	 * Pas de message d'attente pour un jeu local, on passe directement au décompte.
	 * TODO: Voir si besoin d'afficher un message dans le cadre d'un tournoi ?
	 * ( 'else if (this.tournamentID)' en commentaire )
	 * ! Les span avec attribut "data-ts" sont automatiquement traduits par le service de traduction.
	 * ! Si modif du texte, penser à mettre à jour les fichiers de traduction (frontend/src/services/core/translation/*.json)
	 */
	protected appendWaitText(): void {
		const waitDiv: HTMLElement | null = document.getElementById("wait-div");
		if (!waitDiv) {
			const pongSection = document.getElementById("pong-section")!;
			const lobby: HTMLElement = document.createElement("div");
			lobby.classList.add("wait-wrapper");
			lobby.id = "wait-div";

			const waitingTextBox: HTMLElement = document.createElement("div");
			waitingTextBox.classList.add("waiting-textbox");

			const waitingUsername: HTMLElement = document.createElement("span");
			const waitingText1: HTMLElement = document.createElement("span");
			const waitingText2: HTMLElement = document.createElement("span");
			waitingText1.setAttribute("data-ts", "game.waitingText1");
			waitingText2.setAttribute("data-ts", "game.waitingText2");
			if (this.requestType === "invite") {
				waitingText1.textContent = "Waiting for ";
				waitingUsername.textContent = this.relation!.username;
				waitingText2.textContent = " to connect...";
			} else {
				waitingText1.textContent = "Waiting for ";
				waitingUsername.textContent = "another player";
				waitingText2.textContent = " to connect...";
				waitingUsername.setAttribute("data-ts", "game.waitingTextPlayer");
			}
			waitingTextBox.append(waitingText1, waitingUsername, waitingText2);
			lobby.appendChild(waitingTextBox);
			pongSection.appendChild(lobby);
			translateService.updateLanguage(undefined, pongSection);
		}
	}

	/**
	 * Affiche un timer dans le container #pong-section
	 * en fonction du temps restant avant le démarrage du jeu.
	 * Le timer est affiché dans un élément <div> avec un attribut "data-ts" défini à "game.timerText"
	 * pour le service de traduction.
	 * ! Si modif du texte, penser à mettre à jour les fichiers de traduction (frontend/src/services/core/translation/*.json)
	 * 
	 * @param {number} time Le temps restant avant le démarrage du jeu en secondes.
	 */
	protected showTimer(time: number): void {
		const panel = document.getElementById("pong-section")!;
		const lobby = document.getElementById("wait-div");
		if (lobby)
			lobby.innerHTML = "";
		let wrapper = panel.querySelector(".timer-wrapper");
		if (!wrapper) {
			wrapper = document.createElement("div");
			wrapper.classList.add("timer-wrapper");
		}
		wrapper.innerHTML = "";
		const spanTime = document.createElement("span");
		spanTime.classList.add("timer-text");
		spanTime.textContent = `${time}`;

		wrapper.append(spanTime);
		panel.appendChild(wrapper);
		translateService.updateLanguage(undefined, panel);
		panel.classList.remove("hidden");
	}

	/**
	 * Affiche le panel de fin de jeu, avec les scores et un bouton pour rejouer.
	 * ! Possibilité de fetch un autre fichier HTML dans le cas d'un jeu issu d'un tournoi
	 * ! = avec un autre fichier HTML en paramètre de this.fetchEndGameItem
	 * 
	 * @returns {Promise<void>} Une promesse qui se résout lorsque le panel est affiché.
	 */
	protected async showEndGamePanel(): Promise<void> {
		const panel = document.getElementById("pong-section");
		if (!panel)
			return;

		panel.innerHTML = "";
		let endGamePanel;

		const navigateTournamentBtnHandler = () => {
			document.getElementById("navigate-btn")!.removeEventListener("click", navigateTournamentBtnHandler);
			router.navigate(`/game/tournament_local/${this.tournamentID}`);
		}

		if (this.tournamentID) {
			endGamePanel = await this.fetchEndGameItem("/templates/game/endgame_panel_tournament.html");
			document.removeEventListener("keydown", this.handleKeyDown);
			document.removeEventListener("keyup", this.handleKeyUp);
		}
		else
			endGamePanel = await this.fetchEndGameItem("/templates/game/endgame_panel_default.html");

		if (!endGamePanel) {
			console.error("Failed to fetch end game panel");
			this.insertNetworkError();
			return;
		}
		this.endGamePanel = endGamePanel.cloneNode(true) as Element;
		if (this.tournamentID)
			this.endGamePanel.querySelector("#navigate-btn")!.addEventListener("click", navigateTournamentBtnHandler);
		this.fillScoreBox();
		this.setReplayButton();

		panel.appendChild(this.endGamePanel);
		translateService.updateLanguage(undefined, panel);
		panel.classList.remove("hidden");
	}

	/**
	 * Renvoie une promesse qui se résout avec l'élément HTML représentant le panel de fin de jeu.
	 * Le panel est chargé depuis le template "/templates/game/endgame_panel.html".
	 * La méthode parse le code HTML du template et retourne l'élément HTML ayant pour classe "endgame-panel".
	 * Si le parsing échoue, la promesse se résout avec la valeur null.
	 * 
	 * @param {string} path Le chemin vers le fichier HTML du template.
	 * @returns {Promise<Element | null>} Une promesse qui se résout avec l'élément HTML représentant le panel de fin de jeu.
	 */
	private async fetchEndGameItem(path: string): Promise<Element | null> {
		const html = await loadTemplate(path);
		const parser = new DOMParser();
		const doc = parser.parseFromString(html, "text/html");
		return doc.querySelector(".endgame-panel");
	}

	/**
	 * Remplit la boîte de score dans le panneau de fin de jeu avec le message de résultat et les scores.
	 *
	 * Cette méthode met à jour l'élément `endGamePanel` fourni en :
	 * - Affichant un message de victoire ou de défaite selon les scores finaux.
	 * - Affichant le score au format "Vous : score1 - score2 : Adversaire" ou "Joueur 1 : score1 - score2 : Joueur 2" si aucun adversaire n'est présent.
	 * - Définissant les attributs data-ts et les classes CSS appropriées pour la traduction et le style.
	 * ! Si modif du texte, penser à mettre à jour les fichiers de traduction (frontend/src/services/core/translation/*.json)
	 */
	protected fillScoreBox(): void {
		if (!this.endGamePanel)
			return;
		const resMessage = getHTMLElementByClass('res-message', this.endGamePanel) as HTMLElement;
		const resScore = getHTMLElementByClass('res-score', this.endGamePanel) as HTMLElement;
		const spanRes = document.createElement("span");
		const spanScore = document.createElement("span");
		const spanAdversary = document.createElement("span");

		const gameHasBeenCancelled = this.finalScore[0] !== 3 && this.finalScore[1] !== 3;

		if (this.adversary && !gameHasBeenCancelled) {
			if (this.finalScore[0] < this.finalScore[1]) {
				resMessage.setAttribute("data-ts", "game.loseMessage");
				resMessage.textContent = "You lose !";
				resMessage.classList.add("lose-message");
			} else if (this.finalScore[0] > this.finalScore[1]) {
				resMessage.setAttribute("data-ts", "game.winMessage");
				resMessage.textContent = "You win !";
				resMessage.classList.add("win-message");
			}
		} else {
			resMessage.setAttribute("data-ts", "game.endMessage");
			resMessage.textContent = "End of game";
			resMessage.classList.add("end-message");
		}
		resMessage.classList.remove("hidden");
		const score = `<span class="final-score">${this.finalScore[0]} - ${this.finalScore[1]}</span>`
		spanScore.innerHTML = DOMPurify.sanitize(score);

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

	/**
	 * Met à jour le bouton de replay dans le panneau de fin de jeu.
	 * Si un ID d'ami est fourni (donc que le jeu est issu d'une invitation), le bouton est mis à jour avec le texte "Replay with <nom d'ami>".
	 * Sinon (dans le cas d'un matchmaking aléatoire online ou d'un jeu en local), le bouton est mis à jour avec le texte "Replay".
	 * Le bouton est également équipé d'un écouteur d'événement pour gérer le clic.
	 */
	protected setReplayButton(): void {
		if (!this.endGamePanel || this.tournamentID)
			return;
		const replayBtn = getHTMLElementById('replay-button', this.endGamePanel) as HTMLElement;
		if (this.challengedFriendID) {
			const replayWithSpan = getHTMLElementById('replay-with', this.endGamePanel) as HTMLElement;
			const friendNameSpan = getHTMLElementById('friend-username', this.endGamePanel) as HTMLElement;
			replayWithSpan.classList.remove("hidden");
			friendNameSpan.classList.remove("hidden");
			friendNameSpan.textContent = this.relation!.username;
			replayBtn.setAttribute("data-friend-id", this.challengedFriendID!.toString());
		} else {
			const replaySpan = getHTMLElementById('replay', this.endGamePanel) as HTMLElement;
			replaySpan.classList.remove("hidden");
		}
		replayBtn.addEventListener("click", this.handleReplayBtnClick);
	}

	// ===========================================
	// CLEANUP PAGE (OVERRIDE CLEANUP BASEPAGE)
	// ===========================================
	/**
	 * Nettoie la page et le jeu en cours, s'il y en a un, en envoyant une requête POST à la route API `/api/game/playgame`.
	 * Si le jeu est issu d'une invitation, cette méthode supprime aussi les notifications liées à l'invitation
	 * et l'état de l'invitation dans la relation entre les deux amis.
	 * Dans le cas d'un changement de page classique SPA, en utilise la méthode sendMatchmakingRequest(),
	 * sinon ça veut dire que la page est rafraîchie, donc on utilise 'navigator.sendBeacon()' pour envoyer la requête
	 * afin de s'assurer que celle-ci est bien exécutée sans méthode asynchrone.
	 * 
	 * @returns {Promise<void>} Une promesse qui se résout lorsque la requête POST est terminée.
	 */
	public async cleanup(): Promise<void> {
		await super.cleanup();
		let inviterID: number | undefined = undefined;
		let invitedID: number | undefined = undefined;
		const friendId = this.challengedFriendID;

		if (friendId) {
			switch (this.requestType) {
				case "invite":
					invitedID = friendId;
					inviterID = this.currentUser!.id;
					break;
			}
		}

		if (!this.isPageRefreshing) {
			notifService.notifs = notifService.notifs.filter((notif) => notif.from == this.challengedFriendID
				&& notif.content !== null && notif.content !== '');
			if (notifService.navbarInstance?.notifsWindow)
				notifService.displayDefaultNotif();
			await this.sendMatchMakingRequest("clean_request", invitedID, inviterID, this.inviteToClean);
		}
		else {
			const matchMakingReq = new Blob([JSON.stringify({
				type: "clean_request",
				playerID: this.currentUser!.id,
				tournamentID: this.tournamentID,
				invitedID: invitedID,
				inviterID: inviterID,
				gameID: this.gameID,
				inviteToClean: this.inviteToClean
			})], { type: 'application/json' });
			navigator.sendBeacon("/api/game/playgame", matchMakingReq);
		}
		currentService.clearCurrentGame();
	}
}