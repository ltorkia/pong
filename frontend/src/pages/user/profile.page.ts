import { BasePage } from '../base/base.page';
import { RouteConfig, RouteParams } from '../../types/routes.types';
import { User } from '../../shared/models/user.model';
import { Friend } from '../../shared/models/friend.model';
import { Game } from '../../shared/models/game.model';
import { Tournament } from '../../shared/models/tournament.model';
import { EVENTS } from '../../shared/config/constants.config';
import { dataApi, friendApi } from '../../api/index.api';
import { dataService, friendService, translateService, eventService } from '../../services/index.service';
import { formatDate } from '../../utils/app.utils';
import { ROUTE_PATHS } from '../../config/routes.config';
import { getHTMLElementByClass } from '../../utils/dom.utils';
import { router } from '../../router/router';

// ===========================================
// PROFILE PAGE
// ===========================================
/**
 * Page de profil, permet d'afficher les informations
 * d'un utilisateur.
 */
export class ProfilePage extends BasePage {
	private userId?: number;
	private user: User | null = null;
	private userFriends: Friend[] = [];
	private allUserGames: Game[] = [];
	private userGames: Game[] = [];
	private userTournaments: Tournament[] = [];
	private isFriend: boolean = false;
	private isCurrentUserProfile: boolean = false;

	public buttonsLine!: HTMLDivElement;
	private challengeButton!: HTMLButtonElement;
	private avatar!: HTMLElement;
	private username!: HTMLElement;
	private displayedFriends: Friend[] = [];

	private tournamentHeaderListeners: Map<HTMLElement, EventListener> = new Map();
    private challengeHandler?: (event: Event) => Promise<void>;

	/**
	 * Constructeur de la page de profil.
	 *
	 * @param {RouteConfig} config La configuration de la route.
	 * @param {RouteParams} [params] L'ID de l'utilisateur à afficher.
	 */
	constructor(config: RouteConfig, params?: RouteParams) {
		super(config);
		if (params && params.userId)
			this.userId = Number(params.userId);
	}

	// ===========================================
	// METHODES OVERRIDES DE BASEPAGE
	// ===========================================

	protected async preRenderCheck(): Promise<boolean> {
		const isPreRenderChecked = await super.preRenderCheck();
		if (!isPreRenderChecked)
			return false;
		if (!this.userId) {
			this.redirectRoute = ROUTE_PATHS.HOME;
			return false;
		}
		if (this.userId !== this.currentUser!.id) {
			const relation = await friendApi.getRelation(this.currentUser!.id, this.userId);
			if (relation && !('errorMessage' in relation) && relation.blockedBy === this.userId)
				return false;
		}
		return true;
	}
	
	protected async beforeMount(): Promise<void> {
		this.username = getHTMLElementByClass('profile-username', this.container) as HTMLElement;
		this.avatar = getHTMLElementByClass('profile-avatar', this.container) as HTMLElement;
		this.buttonsLine = getHTMLElementByClass('profile-actions', this.container) as HTMLDivElement;
		this.challengeButton = getHTMLElementByClass('challenge-button', this.container) as HTMLButtonElement;

		this.buttonsLine.setAttribute('data-user-id', this.userId!.toString());

		try {
			this.user = await dataApi.getUserStats(this.userId!);
			this.userFriends = await friendApi.getUserFriends(this.userId!);
			
			if (this.userId === this.currentUser!.id) {
				this.isCurrentUserProfile = true;
			} else if (this.userFriends.find(friend => friend.id === this.currentUser!.id)) {
				this.isFriend = true;
			}
			
			this.allUserGames = await dataApi.getUserGames(this.userId!);
			this.userGames = this.allUserGames.filter(game => 
					game.tournament === 0 
					&& (game.status === 'finished' || game.status === 'cancelled')) 
				|| [];
			this.userTournaments = await dataApi.getUserTournaments(this.userId!);
		} catch (error) {
			console.error('Erreur lors du chargement du profil:', error);
			throw error;
		}
	}

	/**
	 * Méthode de montage de la page de profil utilisateur.
	 *
	 * Cette méthode vérifie d'abord la validité de l'ID utilisateur. Si l'ID 
	 * est invalide ou manquant, elle lance une erreur. Ensuite, elle récupère 
	 * les informations de l'utilisateur à partir de l'API en utilisant cet ID.
	 * 
	 * Si les éléments HTML nécessaires pour afficher le profil utilisateur 
	 * (section de profil et template utilisateur) sont présents, elle clone 
	 * le template et met à jour le contenu avec les informations de l'utilisateur 
	 * telles que l'avatar, le nom d'utilisateur et le taux de victoire.
	 * 
	 * Les informations de l'utilisateur sont ensuite insérées dans la section 
	 * de profil de la page.
	 *
	 * @returns {Promise<void>} Une promesse qui se résout lorsque le composant 
	 * est monté.
	 * @throws {Error} Si l'ID utilisateur est invalide ou manquant.
	 */
	protected async mount(): Promise<void> {
		await this.renderProfileMain();
		this.renderStats();
		this.renderFriends();
		await this.renderUserTournaments();
		await this.renderuserGames();

		// Déclencher la mise à jour initiale des boutons si ce n'est pas notre profil
		if (!this.isCurrentUserProfile) {
			await eventService.emit(EVENTS.FRIEND_UPDATED, { userId: this.userId });
			
			const buttonActions = document.querySelector('#button-actions') as HTMLDivElement;
			if (!buttonActions)
				return;
			buttonActions.classList.remove('hidden');
		}
	}

	// ===========================================
	// METHODES DE RENDU
	// ===========================================

	/**
	 * Rendu des informations principales du profil
	 */
	private async renderProfileMain(): Promise<void> {
		this.renderAvatar();
		this.username.textContent = this.user!.username;
		this.renderUserStatus();
	}

	/**
	 * Rendu de l'avatar utilisateur
	 */
	private async renderAvatar(): Promise<void> {
		const img = document.createElement('img');
		img.src = await dataService.getUserAvatarURL(this.user!);
		img.alt = `${this.user!.username}'s avatar`;
		img.addEventListener('load', () => {
			img.style.opacity = '1';
		});
		img.style.opacity = '0';
		img.style.transition = 'opacity 0.3s ease';
		this.avatar.appendChild(img);
	}

	/**
	 * Rendu du statut utilisateur (en ligne/hors ligne)
	 */
	public renderUserStatus(user?: User): void {
		if (user)
			this.user = user;
		const statusDot = this.container.querySelector('.status-cell') as HTMLElement;
		statusDot.innerHTML = dataService.showStatusLabel(this.user!);
	}

	/**
	 * Rendu des statistiques utilisateur
	 */
	private renderStats(): void {
		const section = document.getElementById('stats-section') as HTMLDivElement;
		const template = document.getElementById('stat-card-template') as HTMLTemplateElement;

		if (!section || !template || !this.user) 
			return;

		const totalGames = this.user.gamePlayed;
		const winRate = this.user.winRate;

		const stats = [
			{ icon: `<i class="fa-solid fa-trophy"></i>`, value: this.user.gameWin || 0, label: 'Victories', translate: "profile.winLabel" },
			{ icon: `<i class="fa-solid fa-circle-xmark"></i>`, value: this.user.gameLoose || 0, label: 'Losses', translate: "profile.lossLabel" },
			{ icon: `<i class="fa-solid fa-star-half-stroke"></i>`, value: `${winRate}%`, label: 'Win Rate', translate: "profile.winRateLabel" },
			{ icon: `<i class="fa-solid fa-table-tennis-paddle-ball"></i>`, value: totalGames, label: 'Game played', translate: "profile.gamePlayedLabel" }
		];

		stats.forEach(stat => {
			const clone = template.content.cloneNode(true) as DocumentFragment;
			const value = clone.querySelector('.stat-value') as HTMLElement;
			const label = clone.querySelector('.stat-label') as HTMLElement;
			const icon = clone.querySelector('.stat-icon') as HTMLElement;

			icon.innerHTML = stat.icon;

			value.textContent = stat.value.toString();
			label.textContent = stat.label;
			label.setAttribute('data-ts', stat.translate);

			section.appendChild(clone);
			translateService.updateLanguage(undefined, section);
		});
	}

	/**
	 * Rendu de la liste des amis
	 */
	private renderFriends(): void {
		const section = document.getElementById('friends-section') as HTMLDivElement;
		const template = document.getElementById('friend-card-template') as HTMLTemplateElement;
		const countElement = document.getElementById('friends-count') as HTMLElement;

		if (!section || !template || !countElement) 
			return;

		this.displayedFriends = this.userFriends.filter((f: Friend) => f.friendStatus !== 'pending');
		countElement.textContent = `(${this.displayedFriends.length})`;

		if (this.displayedFriends.length === 0)
			return;

		this.displayedFriends.forEach(async (friend) => {
			const clone = template.content.cloneNode(true) as DocumentFragment;
			const card = clone.querySelector('.friend-card') as HTMLElement;
			const avatar = clone.querySelector('.friend-avatar') as HTMLElement;
			const name = clone.querySelector('.friend-name') as HTMLElement;

			// Avatar de l'ami
			const img = document.createElement('img');
			img.src = await dataService.getUserAvatarURL(friend);
			img.alt = `${friend.username}'s avatar`;
			img.title = `${friend.username}'s profile`;
			img.className = 'w-full h-full object-cover';
			avatar.appendChild(img);

			name.textContent = friend.username;
			card.setAttribute('data-friend-id', (friend.id).toString());
			section.appendChild(clone);
		});

		const friendSection = document.getElementById('friends') as HTMLDivElement;
		if (!friendSection)
			return;
		friendSection.classList.remove('hidden');
	}

	/**
	 * Rendu de l'historique des matchs
	 */
	private async renderuserGames(): Promise<void> {
		const section = document.getElementById('match-history-section') as HTMLDivElement;
		const template = document.getElementById('match-card-template') as HTMLTemplateElement;
		const countElement = document.getElementById('match-count') as HTMLElement;
		const historyBox = document.querySelector("#historyBox");

		if (!section || !template || !countElement || !historyBox) 
			return;

		countElement.textContent = `(${this.userGames.length})`;
		if (this.userGames.length > 0 || this.userTournaments.length > 0) {
			historyBox.classList.remove('hidden');

			if (!this.userGames || !this.userGames.length)
				return;
			for (const match of this.userGames) {
				const clone = template.content.cloneNode(true) as DocumentFragment;
				await this.renderMatchCard(clone, match);
				section.appendChild(clone);
			}
		}
	}

	/**
	 * Rendu d'une carte de match
	 */
	private async renderMatchCard(clone: DocumentFragment, match: any, round?: number): Promise<void> {
		const matchStatus = clone.querySelector('.match-status') as HTMLElement;
		const result = clone.querySelector('.match-result') as HTMLElement;
		const date = clone.querySelector('.match-date') as HTMLElement;
		const score = clone.querySelector('.match-score') as HTMLElement;
		const matchWinner = clone.querySelector('.match-winner') as HTMLElement;
		const avatars = clone.querySelectorAll('.player-avatar');
		const names = clone.querySelectorAll('.player-name');

		const isTournament = round !== undefined;
		const user = this.user!;

		// Joueurs
		let player1 = user;
		let player2 = match.otherPlayers[0] ?? null;
		if (isTournament) {
			player1 = match.otherPlayers[0] ?? null;
			player2 = match.otherPlayers[1] ?? null;
		}

		let isPlayerInMatch = true;
		if (isTournament)
			isPlayerInMatch = match.otherPlayers.some((p: any) => p.id === user.id);
		const isWin = match.winnerId === user.id;

		if (isTournament) {
			const roundBox = clone.querySelector('.match-round') as HTMLElement;
			const span = document.createElement('span');
			const spanNumber = document.createElement('span');
			span.setAttribute('data-ts', 'profile.roundLabel');
			spanNumber.textContent = ` ${round + 1}`;
			roundBox.append(span, spanNumber);
			roundBox.classList.remove('hidden');
		}

		// Résultat principal
		if (isPlayerInMatch && !isTournament) {
			result.classList.add(isWin ? 'win' : 'loss');
			result.textContent = isWin ? 'VICTORY' : 'GAME OVER';
			result.setAttribute('data-ts', isWin ? 'profile.winResult' : 'profile.lossResult');
			result.classList.remove('hidden');
		}

		if (match.status === 'cancelled') {
			matchStatus.classList.add('cancelled');
			matchStatus.setAttribute('data-ts', 'profile.cancelled');
		}

		if (match.status === 'finished' || match.status === 'cancelled') {
			const i = document.createElement('i');
			i.classList.add('fa-solid', 'fa-medal');
			const span = document.createElement('span');
			span.textContent = this.getWinnerName([match]);
			matchWinner.append(i, span);
		}

		// Date formatée
		if (!isTournament)
			date.textContent = formatDate(match.end);

		// Scores
		let playerOneScore: string;
		let playerTwoScore: string;

		if (isPlayerInMatch) {
			playerOneScore = isWin ? '3' : match.looserResult;
			playerTwoScore = isWin ? match.looserResult : '3';
		} else {
			playerOneScore = match.winnerId ? '3' : '-';
			playerTwoScore = match.looserResult ?? '-';
		}

		score.textContent = `${playerOneScore} : ${playerTwoScore}`;
		if (isPlayerInMatch)
			score.classList.add(isWin ? 'win' : 'loss');

		// Si le joueur courant fait partie du match, il doit être affiché en premier
		if (isPlayerInMatch && player2 && player2.id === user.id) {
			[player1, player2] = [player2, player1];
		}

		const playerOneUsername = isTournament ? (player1.alias || player1.username) : player1.username;
		const playerTwoUsername = isTournament ? (player2.alias || player2.username) : (player2.username || 'Player');

		// Avatar + nom - joueur 1
		const img1 = document.createElement('img');
		img1.src = await dataService.getUserAvatarURL(player1);
		img1.alt = `${playerOneUsername}'s avatar`;
		img1.className = 'w-full h-full object-cover';
		avatars[0].appendChild(img1);
		(names[0] as HTMLElement).textContent = playerOneUsername;

		// Avatar + nom - joueur 2
		const img2 = document.createElement('img');
		img2.src = await dataService.getUserAvatarURL(player2);
		img2.alt = `${playerTwoUsername}'s avatar`;
		img2.className = 'w-full h-full object-cover';
		avatars[1].appendChild(img2);
		(names[1] as HTMLElement).textContent = playerTwoUsername;
		if (playerTwoUsername === 'Player')
			(names[1] as HTMLElement).setAttribute('data-ts', 'game.player');

		if (player1.id === user.id)
			(names[0] as HTMLElement).classList.add('font-bold', 'text-blue-800');
		if (player2.id === user.id)
			(names[1] as HTMLElement).classList.add('font-bold', 'text-blue-800');
	}


	/**
	 * Rendu de l'historique des tournois
	 */
	private async renderUserTournaments(): Promise<void> {
		const section = document.getElementById('tournament-history-section') as HTMLDivElement;
		const template = document.getElementById('tournament-card-template') as HTMLTemplateElement;
		const countElement = document.getElementById('tournament-count') as HTMLElement;
		const historyBox = document.querySelector("#historyBox");

		if (!section || !template || !countElement || !historyBox) 
			return;

		countElement.textContent = `(${this.userTournaments.length})`;
		if (this.userTournaments.length > 0 || this.userGames.length > 0) {
			historyBox.classList.remove('hidden');

			if (!this.userTournaments || !this.userTournaments.length)
				return;

			for (const tournament of this.userTournaments) {
				const clone = template.content.cloneNode(true) as DocumentFragment;
				await this.renderTournamentCard(clone, tournament);
				section.appendChild(clone);
			}
		}
	}

	/**
	 * Rendu de l'historique des tournois
	 */
	private async renderTournamentCard(clone: DocumentFragment, tournament: any): Promise<void> {
		const header = clone.querySelector('.tournament-header') as HTMLElement;
		if (!header) 
			return;

		const result = clone.querySelector('.tournament-result') as HTMLElement;
		const date = clone.querySelector('.tournament-date') as HTMLElement;
		const matchWinner = clone.querySelector('.match-winner') as HTMLElement;

		if (tournament.wins == 2) {
			result.classList.add('win');
			result.setAttribute('data-ts', 'profile.winResult');
		} else if (tournament.tournamentStatus !== 'finished') {
			result.classList.add('in-progress');
			result.setAttribute('data-ts', 'profile.inProgress');
		} else {
			result.classList.add('loss');
			result.setAttribute('data-ts', 'profile.lossResult');
		}

		if (tournament.tournamentStatus === 'finished') {
			const i = document.createElement('i');
			i.classList.add('fa-solid', 'fa-trophy');
			const span = document.createElement('span');
			span.textContent = this.getWinnerName(tournament.games);
			matchWinner.append(i, span);
		}

		date.textContent = formatDate(tournament.endedAt);

		// Ajouter le bouton "+"
		if (tournament.games.length !== 0) {
			const div = document.createElement('div');
			div.classList.add('see-more');
			const i = document.createElement('i');
			i.classList.add('fa-solid', 'fa-plus');
			div.appendChild(i);
			header.appendChild(div);
		}

		// Créer le container des matchs
		const container = document.createElement('div');
		container.classList.add('tournament-match-container', 'hidden'); // caché par défaut
		container.id = `tournament-${tournament.tournamentId}`;

		const template = document.getElementById('match-card-template') as HTMLTemplateElement;
		let games = tournament.games.filter((game: Game) => game.status === 'finished' || game.status === 'cancelled');
		for (let i = 0; i < games.length; i++) {
			const matchClone = template.content.cloneNode(true) as DocumentFragment;
			await this.renderMatchCard(matchClone, games[i], i);
			container.appendChild(matchClone);
		}

		// Ajouter le container juste après le header
		header.insertAdjacentElement('afterend', container);
	}

	private getWinnerName(games: any): string {
		if (!games?.length) 
			return '';

		if (games.length === 1)
			return (this.user!.id === games[0].winnerId) ? ' ' + this.user!.username : ' ' + (games[0].otherPlayers[0].username || 'Player');

		// Trouver le match avec la date la plus récente
		const lastGame = games.reduce((latest: Game | null, current: Game) => {
			if (!latest) 
				return current;
			if (!latest.end)
				return current;
			if (!current.end)
				return latest;
			return new Date(current.end) > new Date(latest.end) ? current : latest;
		}, null as Game | null);

		if (!lastGame || !lastGame.winnerId) 
			return '';

		// Trouver le joueur gagnant dans la liste des joueurs des games
		for (const game of games) {
			for (const player of game.otherPlayers || []) {
				if (player.userId === lastGame.winnerId || player.id === lastGame.winnerId) {
					return ' ' + player.alias || player.username || `Player #${player.userId}`;
				}
			}
		}
		return ` Player #${lastGame.winnerId}`;
	}

	// ===========================================
	// GESTIONNAIRES D'ÉVÉNEMENTS
	// ===========================================

	/**
	 * Configuration des gestionnaires d'événements
	 */
	protected attachListeners(): void {
		const friendsSection = document.getElementById('friends-section');
		if (friendsSection)
			friendsSection.addEventListener('click', this.handleFriendCardClick);
        this.challengeHandler = friendService.createChallengeHandler(this.userId!);
        this.challengeButton.addEventListener('click', this.challengeHandler);
		if (!this.isCurrentUserProfile)
			friendService.attachButtonListeners(this.buttonsLine, this.userId!, this.user!.username);
		this.setupTournamentToggles();
	}

	protected removeListeners(): void {
		const friendsSection = document.getElementById('friends-section');
		if (friendsSection)
			friendsSection.removeEventListener('click', this.handleFriendCardClick);
		if (this.challengeButton && this.challengeHandler)
			this.challengeButton.removeEventListener('click', this.challengeHandler);
		if (!this.isCurrentUserProfile)
			friendService.removeButtonListeners(this.buttonsLine);
		this.tournamentHeaderListeners.forEach((handler, header) => {
			header.removeEventListener('click', handler);
		});
		this.tournamentHeaderListeners.clear();
	}
	
	// ===========================================
	// LISTENER HANDLERS
	// ===========================================

	private handleFriendCardClick = async (event: Event): Promise<void> => {
		const card = (event.target as HTMLElement).closest('.friend-card') as HTMLElement | null;
		if (!card)
			return;
		
		event.preventDefault();
		const friendId = card.getAttribute('data-friend-id');
		
		if (friendId)
			await router.navigate(`/user/${friendId}`);
	};
	
private tournamentSeeMoreClickHandler = (event: Event) => {
		const button = (event.target as HTMLElement).closest('.see-more') as HTMLElement;
		if (!button) 
			return;

		// Cherche le container juste après le header
		const header = button.closest('.tournament-header') as HTMLElement;
		if (!header) 
			return;

		const container = header.nextElementSibling as HTMLElement;
		if (!container) 
			return;

		if (container.classList.contains('animate-fade-in-up')) {
			container.classList.remove('animate-fade-in-up');
			container.classList.add('animate-fade-out-down');
			container.classList.add('hidden');
		} else {
			container.classList.remove('hidden');
			container.classList.remove('animate-fade-out-down');
			container.classList.add('animate-fade-in-up');
		}
		// container.classList.toggle('hidden');
	};
	
	private setupTournamentToggles(): void {
		const headers = this.container.querySelectorAll<HTMLElement>('.tournament-card .tournament-header .see-more');
		headers.forEach(header => {
			// On garde une référence pour pouvoir le remove
			header.addEventListener('click', this.tournamentSeeMoreClickHandler);
			this.tournamentHeaderListeners.set(header, this.tournamentSeeMoreClickHandler);
		});
	}
}