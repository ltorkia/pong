
import DOMPurify from "dompurify";
import { Friend } from '../../shared/models/friend.model';
import { User } from '../../shared/models/user.model';
import { friendApi } from '../../api/index.api';
import { currentService, translateService, dataService, notifService, pageService } from '../../services/index.service';
import { UserStatus } from '../../shared/types/user.types';
import { DB_CONST } from '../../shared/config/constants.config';
import { router } from '../../router/router';
import { getHTMLElementByClass } from '../../utils/dom.utils';
import { UsersPage } from '../../pages/user/users.page';
import { ProfilePage } from "../../pages/user/profile.page";

// ============================================================================
// FRIEND SERVICE
// ============================================================================
/**
 * Service de gestion des amis.
 * Centralise toutes les opérations sur les amis.
 */	
export class FriendService {
	public user?: User | null = null;
	public friend?: Friend | null = null;
	public profilePath?: string;

	private container?: HTMLElement;
	private friendLogoCell?: HTMLElement;
	private buttonCell?: HTMLElement;
	private addFriendButton?: HTMLButtonElement;
	private cancelFriendButton?: HTMLButtonElement;
	private acceptFriendButton?: HTMLButtonElement;
	private declineFriendButton?: HTMLButtonElement;
	private blockFriendButton?: HTMLButtonElement;
	private unblockFriendButton?: HTMLButtonElement;
	private unfriendButton?: HTMLButtonElement;
	private challengeButton?: HTMLButtonElement;
	private buttons?: HTMLButtonElement[] = [];
	
	// ===========================================
	// QUERIES / SELECT / POST REQUEST
	// ===========================================

	/**
	 * Vérifie si un utilisateur est ami avec l'utilisateur courant.
	 * 
	 * Récupère la liste des amis de l'utilisateur courant et vérifie si l'utilisateur
	 * d'identifiant `userId` est présent dans cette liste. Si l'utilisateur est un ami,
	 * renvoie un objet contenant les informations de l'ami et le statut d'amitié.
	 * Sinon, renvoie `null`.
	 * 
	 * @param {number} userId - Identifiant de l'utilisateur à vérifier.
	 * @returns {Promise<Friend | null>} - Promesse qui se résout
	 * avec un objet contenant l'ami ou `null` si l'utilisateur n'est pas ami.
	 */
	public async isFriendWithCurrentUser(userId: number): Promise<Friend | null> {
		const currentUserId = currentService.getCurrentUser()!.id;
		const userFriends: Friend[] = await friendApi.getUserFriends(currentUserId);
		if (!userFriends || userFriends.length === 0) {
			return null;
		}
		return userFriends.some(friend => friend.id === userId)
			? userFriends.find(friend => friend.id === userId)!
			: null;
	}

	// ============================================================================
	// MANIPULATION DES COLLECTIONS D'AMIS
	// ============================================================================

	/**
	 * Filtre les amis actifs (non supprimés).
	 * 
	 * @param {Friend[]} friends - Tableau d'instances Friend
	 * @returns {Friend[]} Tableau d'utilisateurs actifs
	 */
	public getActiveFriends(friends: Friend[]): Friend[] {
		return friends.filter(friend => friend.isActive);
	}

	/**
	 * Filtre les utilisateurs en ligne.
	 * 
	 * @param {Friend[]} friends - Tableau d'instances Friend
	 * @returns {Friend[]} Tableau d'utilisateurs en ligne
	 */
	public getOnlineFriends(friends: Friend[]): Friend[] {
		return friends.filter(friend => friend.isOnline());
	}

	/**
	 * Filtre les utilisateurs par statut.
	 * 
	 * @param {Friend[]} friends - Tableau d'instances Friend
	 * @param {friendstatus} status - Statut à filtrer
	 * @returns {Friend[]} Tableau d'utilisateurs avec le statut spécifié
	 */
	public getFriendsByStatus(friends: Friend[], status: UserStatus): Friend[] {
		return friends.filter(friend => friend.status === status);
	}

	/**
	 * Recherche des utilisateurs par nom d'utilisateur.
	 * 
	 * @param {Friend[]} friends - Tableau d'instances Friend
	 * @param {string} searchTerm - Terme de recherche
	 * @returns {Friend[]} Tableau d'utilisateurs correspondants
	 */
	public searchFriendByFriendname(friends: Friend[], searchTerm: string): Friend[] {
		const term = searchTerm.toLowerCase();
		return friends.filter(friend => 
			friend.username.toLowerCase().includes(term)
		);
	}

	/**
	 * Trie les utilisateurs par taux de victoire décroissant.
	 * 
	 * @param {Friend[]} friends - Tableau d'instances Friend
	 * @returns {Friend[]} Tableau d'utilisateurs triés
	 */
	public sortFriendsByWinRate(friends: Friend[]): Friend[] {
		return [...friends].sort((a, b) => b.winRate - a.winRate);
	}

	/**
	 * Trie les utilisateurs par nombre de parties jouées décroissant.
	 * 
	 * @param {Friend[]} friends - Tableau d'instances Friend
	 * @returns {Friend[]} Tableau d'utilisateurs triés
	 */
	public sortFriendsByGamesPlayed(friends: Friend[]): Friend[] {
		return [...friends].sort((a, b) => b.gamePlayed - a.gamePlayed);
	}

	// ============================================================================
	// AFFICHAGE DES AMIS SUR LES PAGES (PROFIL / USER LIST)
	// ============================================================================

	/**
	 * Stocke l'utilisateur et le conteneur HTML du composant de la page des amis / profil.
	 * 
	 * @param {User} user - L'utilisateur pour lequel afficher les informations
	 * @param {HTMLElement} container - Le conteneur HTML du composant de la page des amis
	 * @param {Friend} [friend] - L'instance Friend associée à l'utilisateur (facultatif)
	 */
	public setFriendPageSettings(user: User, container: HTMLElement, friend?: Friend): void {
		this.container = container;
		this.user = user;
	}

	public setFriendButtons(): void {
		this.friendLogoCell = getHTMLElementByClass('friend-logo-cell', this.container) as HTMLElement;
		this.profilePath = `/user/${this.user!.id}`;
		this.buttonCell = getHTMLElementByClass('button-cell', this.container) as HTMLElement;
		this.addFriendButton = getHTMLElementByClass('add-friend-button', this.buttonCell) as HTMLButtonElement;
		this.cancelFriendButton = getHTMLElementByClass('cancel-friend-button', this.buttonCell) as HTMLButtonElement;
		this.acceptFriendButton = getHTMLElementByClass('accept-friend-button', this.buttonCell) as HTMLButtonElement;
		this.declineFriendButton = getHTMLElementByClass('decline-friend-button', this.buttonCell) as HTMLButtonElement;
		this.unfriendButton = getHTMLElementByClass('unfriend-button', this.buttonCell) as HTMLButtonElement;
		this.blockFriendButton = getHTMLElementByClass('block-friend-button', this.buttonCell) as HTMLButtonElement;
		this.unblockFriendButton = getHTMLElementByClass('unblock-friend-button', this.buttonCell) as HTMLButtonElement;
		this.challengeButton = getHTMLElementByClass('challenge-button', this.buttonCell) as HTMLButtonElement;

		this.buttons = [
			this.challengeButton,
			this.addFriendButton,
			this.cancelFriendButton,
			this.acceptFriendButton,
			this.declineFriendButton,
			this.blockFriendButton,
			this.unblockFriendButton,
			this.unfriendButton
		];
	}

	/**
	 * Attribue l'attribut data-friend-id à chaque bouton de la ligne utilisateur,
	 * ce qui permettra de récupérer l'ID de l'utilisateur associé au bouton
	 * lors de l'appel d'une fonction listener.
	 */
	public setButtonDataAttribut() {
		this.buttons!.forEach(btn => {
			const element = btn as HTMLButtonElement;
			if (btn) {
				element.setAttribute("data-friend-id", this.user!.id.toString());
				element.setAttribute("data-friend-name", this.user!.username);
			}
		});
	}

	/**
	 * Attribue le libellé correspondant au statut d'ami de l'utilisateur
	 * à la cellule HTML friend-logo-cell.
	 */
	public setFriendLogo() {
		this.friendLogoCell!.innerHTML = dataService.showFriendLogo(this.user!);
	}

	public attachFriendButtonListeners(): void {
		this.addFriendButton!.addEventListener('click', this.addFriendClick);
		this.cancelFriendButton!.addEventListener('click', this.cancelFriendRequestClick);
		this.acceptFriendButton!.addEventListener('click', this.acceptFriendClick);
		this.declineFriendButton!.addEventListener('click', this.declineFriendClick);
		this.unfriendButton!.addEventListener('click', this.unfriendClick);
		this.blockFriendButton!.addEventListener('click', this.blockFriendClick);
		this.unblockFriendButton!.addEventListener('click', this.unblockFriendClick);
		// this.challengeButton!.addEventListener('click', this.challengeClick);
	}

	public removeFriendButtonListeners(): void {
		this.addFriendButton!.removeEventListener('click', this.addFriendClick);
		this.cancelFriendButton!.removeEventListener('click', this.cancelFriendRequestClick);
		this.acceptFriendButton!.removeEventListener('click', this.acceptFriendClick);
		this.declineFriendButton!.removeEventListener('click', this.declineFriendClick);
		this.unfriendButton!.removeEventListener('click', this.unfriendClick);
		this.blockFriendButton!.removeEventListener('click', this.blockFriendClick);
		this.unblockFriendButton!.removeEventListener('click', this.unblockFriendClick);
		// this.challengeButton!.removeEventListener('click', this.challengeClick);
	}
	
	/**
	 * Masque tous les boutons d'action utilisateur en ajoutant la classe CSS 'hidden'
	 * à chaque élément bouton de la ligne utilisateur.
	 *
	 * Cette méthode est généralement utilisée pour réinitialiser l'état de l'interface
	 * ou pour empêcher les interactions utilisateur avec ces boutons dans certaines conditions.
	 */
	private hideAllButtons() {
		this.buttons!.forEach(btn => btn.classList.add('hidden'));
	}

	/**
	 * Affiche ou masque dynamiquement les boutons d'action liés à l'amitié selon le statut de la relation
	 * entre l'utilisateur courant et l'utilisateur sélectionné. La méthode commence par masquer tous les boutons,
	 * puis affiche le ou les boutons appropriés selon que les utilisateurs sont amis, qu'une demande est en attente,
	 * qu'ils sont bloqués ou qu'il n'y a aucune relation.
	 *
	 * @returns {Promise<void>} Une promesse qui se résout lorsque l'affichage des boutons est terminé.
	 */
	public async toggleFriendButton(): Promise<void> {
		if (!(pageService.currentPage instanceof UsersPage)
			&& !(pageService.currentPage instanceof ProfilePage))
			return; 
		const currentUser = currentService.getCurrentUser();
		if (this.user && this.user.id !== currentUser!.id || !this.user) {
			this.hideAllButtons();
			this.friend = await this.isFriendWithCurrentUser(this.user!.id);
			if (!this.friend) {
				this.friendLogoCell!.innerHTML = DOMPurify.sanitize(`<i class="fa-solid fa-minus"></i>`);
				this.addFriendButton!.classList.remove('hidden');
				return;
			}
			this.friendLogoCell!.innerHTML = dataService.showFriendLogo(this.friend);

			if (this.friend.friendStatus === DB_CONST.FRIENDS.STATUS.PENDING) {
				if (this.friend.requesterId === currentUser!.id) {
					this.cancelFriendButton!.classList.remove('hidden');
					return;
				}
				this.acceptFriendButton!.classList.remove('hidden');
				this.declineFriendButton!.classList.remove('hidden');
			}
			if (this.friend.friendStatus === DB_CONST.FRIENDS.STATUS.ACCEPTED) {
				if (this.friend.isOnline() && this.friend.challengedBy !== currentUser!.id)
					this.challengeButton!.classList.remove('hidden');
				this.blockFriendButton!.classList.remove('hidden');
				this.unfriendButton!.classList.remove('hidden');
			}
			if (this.friend.friendStatus === DB_CONST.FRIENDS.STATUS.BLOCKED) {
				if (this.friend.blockedBy === currentUser!.id) {
					this.unblockFriendButton!.classList.remove('hidden');
					return;
				}
			}
			translateService.updateLanguage(undefined, this.container);
		}
	}

	/**
	 * Retourne l'identifiant de l'ami associé au bouton ou parent HTMLElement ou
	 * directement l'identifiant de l'ami si c'est un nombre.
	 * 
	 * Si le bouton ne contient pas d'attribut data-friend-id, log un message d'erreur et
	 * retourne 0.
	 * 
	 * @param {HTMLElement | number} target - Bouton ou parent HTMLElement ou identifiant de l'ami.
	 * @returns {number} L'identifiant de l'ami.
	 */
	private getFriendId(target: HTMLElement | number): number { 
		if (typeof target === 'number')
			return target;
		const button = target.closest('button[data-friend-id]') as HTMLElement | null;
		if (!button) {
			console.error("Pas de friendId sur le bouton ou parent");
			return 0;
		}
		const friendId = button.getAttribute("data-friend-id");
		return Number(friendId);
	}

	/**
	 * Réinitialise les attributs de l'objet FriendService.
	 * Tous les attributs sont remis à leur valeur par défaut (null, undefined, etc.).
	 * Cette méthode est appelée lorsque l'objet n'est plus utilisé.
	 */
	public cleanup(): void {
		this.user = null;
		this.friend = null;
		this.container = undefined;
		this.profilePath = undefined;
		this.buttons = undefined;
		this.addFriendButton = undefined;
		this.cancelFriendButton = undefined;
		this.acceptFriendButton = undefined;
		this.declineFriendButton = undefined;
		this.unfriendButton = undefined;
		this.blockFriendButton = undefined;
		this.unblockFriendButton = undefined;
		this.challengeButton = undefined;
		this.friendLogoCell = undefined;
	}
	
	// ===========================================
	// LISTENER HANDLERS
	// ===========================================

	public handleProfileClick = async (event: Event): Promise<void> => {
		event.preventDefault();
		await router.navigate(this.profilePath!);
	};

	private addFriendClick = async (event: Event): Promise<void> => {
		event.preventDefault();
		await notifService.handleAddClick(event);
	}

	private acceptFriendClick = async (event: Event): Promise<void> => {
		event.preventDefault();
		await notifService.handleAcceptClick(event);
	}

	private declineFriendClick = async (event: Event): Promise<void> => {
		event.preventDefault();
		await notifService.handleDeclineClick(event);
	}

	private blockFriendClick = async (event: Event): Promise<void> => {
		event.preventDefault();
		await notifService.handleBlockClick(event);
	}

	private unblockFriendClick = async (event: Event): Promise<void> => {
		event.preventDefault();
		await notifService.handleUnblockClick(event);
	}

	private unfriendClick = async (event: Event): Promise<void> => {
		event.preventDefault();
		await notifService.handleUnfriendClick(event);
	}

	private cancelFriendRequestClick = async (event: Event): Promise<void> => {
		event.preventDefault();
		await notifService.handleCancelClick(event);
	}

	public challengeClick = async (event: Event): Promise<void> => {
		event.preventDefault();
		const target = event.target as HTMLElement;
		const friendId = this.getFriendId(target);
		const currentUser = currentService.getCurrentUser();
		const relation = await friendApi.getRelation(currentUser!.id, friendId!);
		if (!relation || "errorMessage" in relation || !relation.isOnline) {
			console.error("errorMessage" in relation ? relation.errorMessage : "Invitation invalide.");
			return;
		}
		if (!relation.challengedBy) 
			await notifService.handleChallengeClick(event);
		else if (relation.challengedBy === relation.id) {
			await notifService.handlePlayClick(event);
		}
	}
}