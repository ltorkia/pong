import DOMPurify from "dompurify";
import { BasePage } from '../base/base.page';
import { RouteConfig, RouteParams } from '../../types/routes.types';
import { User } from '../../shared/models/user.model';
import { Friend } from '../../shared/models/friend.model';
import { Game } from '../../shared/models/game.model';
import { Tournament } from '../../shared/models/tournament.model';
import { dataApi, friendApi } from '../../api/index.api';
import { dataService } from '../../services/index.service';
import { formatDate } from '../../utils/app.utils';
import { ROUTE_PATHS } from '../../config/routes.config';

// ===========================================
// PROFILE PAGE
// ===========================================
/**
 * Page de profil, permet d'afficher les informations
 * d'un utilisateur.
 */
export class ProfilePage extends BasePage {
	private userId?: number;
	private user: User = null;
	private userFriends: Friend[] = [];
	private userGames: Game[] = [];
	private userTournaments: Tournament[] = [];
	private isFriend: boolean = false;
	private isCurrentUserProfile: boolean = false;

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

		this.renderProfileMain();
		this.renderStats();
		this.renderFriends();
		this.renderuserGames();
		this.setupEventListeners();
	}

	// ===========================================
	// METHODES PRIVATES
	// ===========================================

	// ===========================================
	// METHODES DE RENDU
	// ===========================================

	/**
	 * Rendu des informations principales du profil
	 */
	private renderProfileMain(): void {
		const section = document.getElementById('profile-main-section') as HTMLDivElement;
		const template = document.getElementById('profile-main-template') as HTMLTemplateElement;
		
		if (!section || !template || !this.user) return;

		const clone = template.content.cloneNode(true) as DocumentFragment;

		// Avatar
		this.renderAvatar(clone);

		// Nom d'utilisateur
		const username = clone.querySelector('.profile-username') as HTMLElement;
		username.textContent = this.user.username;

		// Statut (en ligne/hors ligne)
		this.renderUserStatus(clone);

		// Actions (boutons ami, etc.)
		this.renderProfileActions(clone);

		section.appendChild(clone);
	}

	/**
	 * Rendu de l'avatar utilisateur
	 */
	private async renderAvatar(clone: DocumentFragment): Promise<void> {
		const avatar = clone.querySelector('.profile-avatar') as HTMLElement;
		const img = document.createElement('img');
		img.src = await dataService.getUserAvatarURL(this.user!);
		img.alt = `${this.user!.username}'s avatar`;
		img.addEventListener('load', () => {
			img.style.opacity = '1';
		});
		img.style.opacity = '0';
		img.style.transition = 'opacity 0.3s ease';
		avatar.appendChild(img);
	}

	/**
	 * Rendu du statut utilisateur (en ligne/hors ligne)
	 */
	private renderUserStatus(clone: DocumentFragment): void {
		const status = clone.querySelector('.profile-status') as HTMLElement;
		const statusDot = status.querySelector('div') as HTMLElement;
		const statusText = status.querySelector('.status-text') as HTMLElement;
		
		// TODO: Implémenter la logique pour récupérer le statut en ligne
		const isOnline = this.user!.isOnline || false;
		
		if (isOnline) {
			status.classList.add('online');
			statusDot.classList.add('bg-green-400');
			statusText.textContent = 'online';
		} else {
			status.classList.add('offline');
			statusDot.classList.add('bg-gray-400');
			statusText.textContent = 'offline';
		}
	}

	/**
	 * Rendu des actions du profil (boutons ami, etc.)
	 */
	private renderProfileActions(clone: DocumentFragment): void {
		const actions = clone.querySelector('.profile-actions') as HTMLElement;
		
		// Si c'est notre propre profil, ne pas afficher de boutons
		if (this.currentUser && this.currentUser.id === this.user!.id) {
			return;
		}

		// Bouton ajouter/retirer ami
		const friendButton = document.createElement('button');
		friendButton.className = 'btn-friend';
		
		if (this.isFriend) {
			friendButton.className += ' btn-remove-friend';
			friendButton.textContent = 'Remove';
			friendButton.setAttribute('data-action', 'remove-friend');
		} else {
			friendButton.className += ' btn-add-friend';
			friendButton.textContent = 'Add friend';
			friendButton.setAttribute('data-action', 'add-friend');
		}

		actions.appendChild(friendButton);

		// TODO: Ajouter d'autres boutons si nécessaire (défier, bloquer, etc.)
	}

	/**
	 * Rendu des statistiques utilisateur
	 */
	private renderStats(): void {
		const section = document.getElementById('stats-section') as HTMLDivElement;
		const template = document.getElementById('stat-card-template') as HTMLTemplateElement;

		if (!section || !template || !this.user) 
			return;

		// Calcul du win rate
		const totalGames = this.user.gamePlayed;
		const winRate = this.user.winRate;

		const stats = [
			{ value: this.user.gameWin || 0, label: 'Victories' },
			{ value: this.user.gameLoose || 0, label: 'Losses' },
			{ value: `${winRate}%`, label: 'Win Rate' },
			{ value: totalGames, label: 'Game played' }
		];

		// TODO: Ajouter d'autres stats (niveau, rang...)
		// if (this.user.level) {
		// 	stats.push({ value: this.user.level, label: 'Niveau' });
		// }

		stats.forEach(stat => {
			const clone = template.content.cloneNode(true) as DocumentFragment;
			const value = clone.querySelector('.stat-value') as HTMLElement;
			const label = clone.querySelector('.stat-label') as HTMLElement;

			value.textContent = stat.value.toString();
			label.textContent = stat.label;

			section.appendChild(clone);
		});
	}

	/**
	 * Rendu de la liste des amis
	 */
	private renderFriends(): void {
		const section = document.getElementById('friends-section') as HTMLDivElement;
		const template = document.getElementById('friend-card-template') as HTMLTemplateElement;
		const countElement = document.getElementById('friends-count') as HTMLElement;

		if (!section || !template || !countElement) return;

		countElement.textContent = `(${this.userFriends.length})`;

		// État vide
		if (this.userFriends.length === 0) {
			// this.renderEmptyState(section, 'friends');
			return;
		}

		// Limitation d'affichage (ex: 12 premiers amis)
		const displayedFriends = this.userFriends.slice(0, 12);

		displayedFriends.forEach(async (friend) => {
			const clone = template.content.cloneNode(true) as DocumentFragment;
			const card = clone.querySelector('.friend-card') as HTMLElement;
			const avatar = clone.querySelector('.friend-avatar') as HTMLElement;
			const name = clone.querySelector('.friend-name') as HTMLElement;

			// Avatar de l'ami
			const img = document.createElement('img');
			img.src = await dataService.getUserAvatarURL(friend);
			img.alt = `${friend.username}'s avatar`;
			img.className = 'w-full h-full object-cover';
			avatar.appendChild(img);

			// Nom de l'ami
			name.textContent = friend.username;

			// Navigation vers le profil de l'ami
			card.addEventListener('click', () => {
				// TODO: Implémenter la navigation
				console.log(`Naviguer vers le profil de ${friend.username}`);
				// Exemple: this.router.navigate(`/profile/${friend.id}`);
			});

			section.appendChild(clone);
		});

		// Afficher "Voir plus" si il y a plus d'amis
		if (this.userFriends.length > 12) {
			const viewMoreCard = document.createElement('div');
			viewMoreCard.className = 'friend-card bg-white/5 border-dashed cursor-pointer hover:bg-white/10';
			viewMoreCard.innerHTML = DOMPurify.sanitize(`
				<div class="text-center text-white/60 py-2">
					<div class="text-2xl mb-2">+</div>
					<div class="text-xs">Voir plus</div>
				</div>
			`);
			viewMoreCard.addEventListener('click', () => {
				// TODO: Implémenter l'affichage de tous les amis
				console.log('Afficher tous les amis');
			});
			section.appendChild(viewMoreCard);
		}
	}

	/**
	 * Rendu de l'historique des matchs
	 */
	private renderuserGames(): void {
		const section = document.getElementById('match-history-section') as HTMLDivElement;
		const template = document.getElementById('match-card-template') as HTMLTemplateElement;

		if (!section || !template) return;

		// État vide
		if (this.userGames.length === 0) {
			// this.renderEmptyState(section, 'matches');
			return;
		}

		// Limitation d'affichage (ex: 10 derniers matchs)
		const recentMatches = this.userGames.slice(0, 10);

		recentMatches.forEach(async (match) => {
			const clone = template.content.cloneNode(true) as DocumentFragment;
			
			await this.renderMatchCard(clone, match);
			section.appendChild(clone);
		});

		// Bouton "Voir plus" si il y a plus de matchs
		if (this.userGames.length > 10) {
			const viewMoreButton = document.createElement('button');
			viewMoreButton.className = 'w-full mt-4 py-3 bg-white/5 hover:bg-white/10 rounded-lg border border-white/20 text-white/70 hover:text-white transition-all duration-200';
			viewMoreButton.textContent = `See ${this.userGames.length - 10} more matchs`;
			viewMoreButton.addEventListener('click', () => {
				// TODO: Implémenter l'affichage de tous les matchs
				console.log('Charger plus de matchs');
			});
			section.appendChild(viewMoreButton);
		}
	}

	/**
	 * Rendu d'une carte de match
	 */
	private async renderMatchCard(clone: DocumentFragment, match: any): Promise<void> {
		const result = clone.querySelector('.match-result') as HTMLElement;
		const date = clone.querySelector('.match-date') as HTMLElement;
		const score = clone.querySelector('.match-score') as HTMLElement;
		const playerInfos = clone.querySelectorAll('.player-info');
		const avatars = clone.querySelectorAll('.player-avatar');
		const names = clone.querySelectorAll('.player-name');

		// Déterminer qui a gagné
		const isWin = match.winnerId === this.user!.id;
		
		// Résultat
		result.classList.add(isWin ? 'win' : 'loss');
		result.textContent = isWin ? 'VICTORY' : 'GAME OVER';

		// Date formatée
		date.textContent = formatDate(match.createdAt || match.date);

		// Score
		score.textContent = match.score || `${match.player1Score} - ${match.player2Score}`;

		// TODO: Adapter selon la structure de vos données de match
		const player1 = this.user!
		console.log('match.otherPlayers', match.otherPlayers);
		const player2: User = match.otherPlayers[0];

		// Joueur 1
		const img1 = document.createElement('img');
		img1.src = await dataService.getUserAvatarURL(player1);
		img1.alt = `${player1.username}'s avatar`;
		img1.className = 'w-full h-full object-cover';
		(avatars[0] as HTMLElement).appendChild(img1);
		(names[0] as HTMLElement).textContent = player1.username;

		// Joueur 2
		const img2 = document.createElement('img');
		img2.src = await dataService.getUserAvatarURL(player2);
		img2.alt = `${player2.username}'s avatar`;
		img2.className = 'w-full h-full object-cover';
		(avatars[1] as HTMLElement).appendChild(img2);
		(names[1] as HTMLElement).textContent = player2.username;
	}

	/**
	 * Rendu d'un état vide
	 */
	private renderEmptyState(section: HTMLElement, type: 'friends' | 'matches'): void {
		const emptyTemplate = document.getElementById('empty-state-template') as HTMLTemplateElement;
		const clone = emptyTemplate.content.cloneNode(true) as DocumentFragment;
		const icon = clone.querySelector('.empty-icon') as SVGElement;
		const text = clone.querySelector('.empty-text') as HTMLElement;

		if (type === 'friends') {
			icon.innerHTML = DOMPurify.sanitize('<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>');
			text.textContent = 'No friends';
		} else if (type === 'matches') {
			icon.innerHTML = DOMPurify.sanitize('<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>');
			text.textContent = 'No match';
		}

		section.appendChild(clone);
	}

	// ===========================================
	// GESTIONNAIRES D'ÉVÉNEMENTS
	// ===========================================

	/**
	 * Configuration des gestionnaires d'événements
	 */
	private setupEventListeners(): void {
		// Gestionnaire pour les boutons d'ami
		document.addEventListener('click', this.handleFriendActions.bind(this));
	}

	/**
	 * Gestionnaire des actions sur les amis
	 */
	private async handleFriendActions(event: Event): Promise<void> {
		const target = event.target as HTMLElement;
		const action = target.getAttribute('data-action');

		if (!action || !this.user || !this.currentUser) return;

		try {
			if (action === 'add-friend') {
				await this.addFriend();
			} else if (action === 'remove-friend') {
				await this.removeFriend();
			}
		} catch (error) {
			console.error('Erreur lors de l\'action ami:', error);
			// TODO: Afficher un message d'erreur à l'utilisateur
		}
	}

	/**
	 * Ajouter en ami
	 */
	private async addFriend(): Promise<void> {
		// const success = await dataApi.sendFriendRequest(this.user!.id); // TODO: Implémenter
		
		// if (success) {
		// 	this.isFriend = true;
		// 	this.updateFriendButton();
		// 	// TODO: Afficher un message de succès
		// }
	}

	/**
	 * Retirer des amis
	 */
	private async removeFriend(): Promise<void> {
		// const success = await dataApi.removeFriend(this.user!.id); // TODO: Implémenter
		
		// if (success) {
		// 	this.isFriend = false;
		// 	this.updateFriendButton();
		// 	// TODO: Afficher un message de succès
		// }
	}

	/**
	 * Mise à jour du bouton ami
	 */
	private updateFriendButton(): void {
		const button = document.querySelector('[data-action*="friend"]') as HTMLButtonElement;
		
		if (!button) return;

		button.className = 'btn-friend';
		
		if (this.isFriend) {
			button.className += ' btn-remove-friend';
			button.textContent = 'Remove';
			button.setAttribute('data-action', 'remove-friend');
		} else {
			button.className += ' btn-add-friend';
			button.textContent = 'add friend';
			button.setAttribute('data-action', 'add-friend');
		}
	}
}