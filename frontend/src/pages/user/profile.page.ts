import DOMPurify from "dompurify";
import { BasePage } from '../base/base.page';
import { RouteConfig, RouteParams } from '../../types/routes.types';
import { User } from '../../shared/models/user.model';
import { Friend } from '../../shared/models/friend.model';
import { Game } from '../../shared/models/game.model';
import { Tournament } from '../../shared/models/tournament.model';
import { dataApi, friendApi } from '../../api/index.api';
import { dataService, friendService, translateService } from '../../services/index.service';
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
	private userGames: Game[] = [];
	private userTournaments: Tournament[] = [];
	private isFriend: boolean = false;
	private isCurrentUserProfile: boolean = false;

	public buttonsLine!: HTMLDivElement;
	private avatar!: HTMLElement;
	private username!: HTMLElement;
	private displayedFriends: Friend[] = [];

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
		return true;
	}
	
	protected async beforeMount(): Promise<void> {
		this.username = getHTMLElementByClass('profile-username', this.container) as HTMLElement;
		this.avatar = getHTMLElementByClass('profile-avatar', this.container) as HTMLElement;
		this.buttonsLine = getHTMLElementByClass('profile-actions', this.container) as HTMLDivElement;

		try {
			this.user = await dataApi.getUserStats(this.userId!);
			this.userFriends = await friendApi.getUserFriends(this.userId!);
			if (this.userId === this.currentUser!.id)
				this.isCurrentUserProfile = true;
			else if (this.userFriends.find(friend => friend.id === this.currentUser!.id))
				this.isFriend = true;
			this.userGames = await dataApi.getUserGames(this.userId!);
			this.userTournaments = await dataApi.getUserTournaments(this.userId!);

			console.log('this.user', this.user);
			console.log('this.userGames', this.userGames);
			console.log('this.userTournaments', this.userTournaments);
			console.log('this.userFriends', this.userFriends);
			console.log('this.isCurrentUserProfile', this.isCurrentUserProfile);
			console.log('this.isFriend', this.isFriend);
			console.log('this.userGames', this.userGames);
			console.log('this.userTournaments', this.userTournaments);

		} catch (error) {
			console.error('Erreur lors du chargement du profil:', error);
			throw error;
		}

		friendService.setFriendPageSettings(this.user!, this.container);
		friendService.setFriendButtons();
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
		await this.renderuserGames();
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

		if (!this.isCurrentUserProfile) {
			friendService.setFriendLogo();
			await friendService.toggleFriendButton();
			friendService.setButtonDataAttribut();
		}
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
		const logCell = this.container.querySelector('.log-cell') as HTMLElement;
		statusDot.innerHTML = dataService.showStatusLabel(this.user!);
		const logDate = dataService.showLogDate(this.user!);
		if (logDate) {
			logCell.classList.remove('hidden');
			logCell.innerHTML = logDate;
		} else
			logCell.classList.add('hidden');
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
			{ value: this.user.gameWin || 0, label: 'Victories', translate: "profile.winLabel" },
			{ value: this.user.gameLoose || 0, label: 'Losses', translate: "profile.lossLabel" },
			{ value: `${winRate}%`, label: 'Win Rate', translate: "profile.winRateLabel" },
			{ value: totalGames, label: 'Game played', translate: "profile.gamePlayedLabel" }
		];

		stats.forEach(stat => {
			const clone = template.content.cloneNode(true) as DocumentFragment;
			const value = clone.querySelector('.stat-value') as HTMLElement;
			const label = clone.querySelector('.stat-label') as HTMLElement;

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

		this.displayedFriends = this.userFriends.filter((f: Friend) => f.friendStatus === 'accepted');
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
			section.appendChild(clone);
		});
	}

	/**
	 * Rendu de l'historique des matchs
	 */
	private async renderuserGames(): Promise<void> {
		const section = document.getElementById('match-history-section') as HTMLDivElement;
		const template = document.getElementById('match-card-template') as HTMLTemplateElement;

		if (!section || !template || this.userGames.length === 0) 
			return;

		const recentMatches = this.userGames;
		for (const match of recentMatches) {
			const clone = template.content.cloneNode(true) as DocumentFragment;
			await this.renderMatchCard(clone, match);
			section.appendChild(clone);
		}
	}

	/**
	 * Rendu d'une carte de match
	 */
	private async renderMatchCard(clone: DocumentFragment, match: any): Promise<void> {
		const result = clone.querySelector('.match-result') as HTMLElement;
		const date = clone.querySelector('.match-date') as HTMLElement;
		const score = clone.querySelector('.match-score') as HTMLElement;
		const avatars = clone.querySelectorAll('.player-avatar');
		const names = clone.querySelectorAll('.player-name');

		// Déterminer qui a gagné
		const isWin = match.winnerId === this.user!.id;
		
		// Résultat
		result.classList.add(isWin ? 'win' : 'loss');
		result.textContent = isWin ? 'VICTORY' : 'GAME OVER';
		result.setAttribute('data-ts', isWin ? 'profile.winResult' : 'profile.lossResult');

		// Date formatée
		date.textContent = formatDate(match.end);

		const playerOneScore = isWin ? '3' : match.looserResult;
		const playerTwoScore = isWin ? match.looserResult : '3';

		// Score
		score.textContent = `${playerOneScore} - ${playerTwoScore}`;
		score.classList.add(isWin ? 'win' : 'loss');

		const player1 = this.user!
		console.log('match.otherPlayers', match.otherPlayers);
		const player2: User | null = match.otherPlayers[0] ?? null;

		// Joueur 1
		const img1 = document.createElement('img');
		img1.src = await dataService.getUserAvatarURL(player1);
		img1.alt = `${player1.username}'s avatar`;
		img1.className = 'w-full h-full object-cover';
		(avatars[0] as HTMLElement).appendChild(img1);
		(names[0] as HTMLElement).textContent = player1.username;

		// Joueur 2
		const img2 = document.createElement('img');
		const playerTwoUsername = player2 ? player2.username : 'Player';
		img2.src = await dataService.getUserAvatarURL(player2);
		img2.alt = `${playerTwoUsername}'s avatar`;
		img2.className = 'w-full h-full object-cover';
		(avatars[1] as HTMLElement).appendChild(img2);
		(names[1] as HTMLElement).textContent = playerTwoUsername;
		if (!player2)
			(names[1] as HTMLElement).setAttribute('data-ts', 'game.player');
	}

	// ===========================================
	// GESTIONNAIRES D'ÉVÉNEMENTS
	// ===========================================

	/**
	 * Configuration des gestionnaires d'événements
	 */
	protected attachListeners(): void {
		const friendCards = document.querySelectorAll('.friend-card');
		friendCards.forEach(async (friendCard) => {
			for (const f of this.displayedFriends)
				if (friendCard.querySelector('.friend-name')!.textContent === f.username) {
					friendService.profilePath = `/user/${f.id}`;
					friendCard.addEventListener('click', friendService.handleProfileClick);
				}
		});
		friendService.attachFriendButtonListeners();
	}

	protected removeListeners(): void {
		const friendCards = document.querySelectorAll('.friend-card');
		friendCards.forEach(async (friendCard) => {
			for (const f of this.displayedFriends)
				if (friendCard.querySelector('.friend-name')!.textContent === f.username) {
					friendService.profilePath = `/user/${f.id}`;
					friendCard.removeEventListener('click', friendService.handleProfileClick);
				}
		});
		friendService.removeFriendButtonListeners();
	}

	// ===========================================
	// CLEANUP
	// ===========================================

	public async cleanup(): Promise<void> {
		await super.cleanup();
		friendService.cleanup();
	}
}