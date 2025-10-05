
import DOMPurify from "dompurify";
import { Friend } from '../../shared/models/friend.model';
import { friendApi } from '../../api/index.api';
import { currentService, translateService, dataService, notifService, eventService, pageService } from '../../services/index.service';
import { UserStatus } from '../../shared/types/user.types';
import { DB_CONST, EVENTS } from '../../shared/config/constants.config';

// ============================================================================
// FRIEND SERVICE
// ============================================================================
/**
 * Service de gestion des amis.
 * Centralise toutes les opérations sur les amis.
 * 
 * UserRow/Profile click - NotifService.handleXClick() - API call - eventService.emit('friend:updated') 
 * - FriendService écoute - Met à jour tous les boutons concernés
 * - UserRowComponent écoute - Met à jour son propre bouton si c'est lui
 * - ProfilePage écoute - Met à jour son bouton si c'est lui
 */	
export class FriendService {
    private boundUpdateHandler?: (data: any) => Promise<void>;
	
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

	// ===========================================
	// SYSTÈME D'ÉVÉNEMENTS CENTRALISÉ
	// ===========================================

	/**
	 * S'abonne aux événements de mise à jour des amis.
	 * Gère tous les composants de la page courante qui affichent des utilisateurs.
	 */
	public subscribeToFriendEvents(): void {
		this.boundUpdateHandler = async (data: { userId: number }) => {
			console.log(`[FriendService] Mise à jour globale pour userId=${data.userId}`);
			
			// Trouver tous les containers qui affichent cet utilisateur
			const containers = document.querySelectorAll(`[data-user-id="${data.userId}"]`);
			
			for (const container of containers) {
				await this.updateButtons(container as HTMLElement, data.userId);
			}
			await notifService.deleteAllNotifsFromUser(data.userId, notifService.currentNotif?.id);
			notifService.displayDefaultNotif();
		};
		eventService.on(EVENTS.FRIEND_UPDATED, this.boundUpdateHandler);
	}

	/**
	 * Met à jour les boutons d'un container spécifique.
	 * Cette méthode contient TOUTE la logique de mise à jour des boutons.
	 */
	private async updateButtons(container: HTMLElement, userId: number): Promise<void> {
		const currentUser = currentService.getCurrentUser();
		if (!currentUser || userId === currentUser.id)
			return;
		
		// Récupérer les éléments du container
		const friendLogoCell = container.querySelector('.friend-logo-cell') as HTMLElement;
		const buttonCell = container.querySelector('.button-cell') as HTMLElement;
		
		if (!friendLogoCell || !buttonCell) {
			console.warn(`Container invalide pour userId=${userId}`);
			return;
		}

		// Récupérer tous les boutons
		const buttons = {
			challenge: buttonCell.querySelector('.challenge-button') as HTMLButtonElement,
			addFriend: buttonCell.querySelector('.add-friend-button') as HTMLButtonElement,
			cancelFriend: buttonCell.querySelector('.cancel-friend-button') as HTMLButtonElement,
			acceptFriend: buttonCell.querySelector('.accept-friend-button') as HTMLButtonElement,
			declineFriend: buttonCell.querySelector('.decline-friend-button') as HTMLButtonElement,
			blockFriend: buttonCell.querySelector('.block-friend-button') as HTMLButtonElement,
			unblockFriend: buttonCell.querySelector('.unblock-friend-button') as HTMLButtonElement,
			unfriend: buttonCell.querySelector('.unfriend-button') as HTMLButtonElement,
		};

		// Masquer tous les boutons
		Object.values(buttons).forEach(btn => btn?.classList.add('hidden'));

		// Récupérer le statut d'ami
		const friend = await this.isFriendWithCurrentUser(userId);

		// Mettre à jour le logo
		if (!friend) {
			friendLogoCell.innerHTML = DOMPurify.sanitize(`<i class="fa-solid fa-minus"></i>`);
			buttons.addFriend?.classList.remove('hidden');
			translateService.updateLanguage(undefined, container);
			return;
		}

		friendLogoCell.innerHTML = dataService.showFriendLogo(friend);

		// Afficher les boutons appropriés selon le statut
		if (friend.friendStatus === DB_CONST.FRIENDS.STATUS.PENDING) {
			if (friend.requesterId === currentUser!.id) {
				buttons.cancelFriend?.classList.remove('hidden');
			} else {
				buttons.acceptFriend?.classList.remove('hidden');
				buttons.declineFriend?.classList.remove('hidden');
			}
		} else if (friend.friendStatus === DB_CONST.FRIENDS.STATUS.ACCEPTED) {
			if (friend.isOnline() && friend.challengedBy !== currentUser!.id) {
				buttons.challenge?.classList.remove('hidden');
			}
			buttons.blockFriend?.classList.remove('hidden');
			buttons.unfriend?.classList.remove('hidden');
		} else if (friend.friendStatus === DB_CONST.FRIENDS.STATUS.BLOCKED) {
			if (friend.blockedBy === currentUser!.id) {
				buttons.unblockFriend?.classList.remove('hidden');
			}
		}

		// Mettre à jour les attributs des boutons pour que le service de notifs les récupère quand ils sont cliqués
		Object.values(buttons).forEach(btn => btn.setAttribute("data-friend-id", userId.toString()));
		translateService.updateLanguage(undefined, container);
	}

	// ===========================================
	// MÉTHODES POUR ATTACHER LES LISTENERS (UserRow/Profile)
	// ===========================================

	/**
	 * Configure les event listeners sur les boutons d'un container.
	 * À appeler dans attachListeners() de chaque composant.
	 * 
	 * Note : Les boutons des notifications sont gérés directement par NotifService
	 * car il a déjà this.friendId et this.friendName en contexte.
	 */
	public attachButtonListeners(container: HTMLElement, userId: number, username: string): void {
		const buttonCell = container.querySelector('.button-cell') as HTMLElement;
		if (!buttonCell) return;

		// Créer les handlers avec closure pour capturer userId/username
		const handlers = {
			add: this.createHandler(userId, username, notifService.handleAddClick),
			cancel: this.createHandler(userId, username, notifService.handleCancelClick),
			accept: this.createHandler(userId, username, notifService.handleAcceptClick),
			decline: this.createHandler(userId, username, notifService.handleDeclineClick),
			block: this.createHandler(userId, username, notifService.handleBlockClick),
			unblock: this.createHandler(userId, username, notifService.handleUnblockClick),
			unfriend: this.createHandler(userId, username, notifService.handleUnfriendClick),
		};

		// Attacher les handlers aux boutons
		buttonCell.querySelector('.add-friend-button')?.addEventListener('click', handlers.add);
		buttonCell.querySelector('.cancel-friend-button')?.addEventListener('click', handlers.cancel);
		buttonCell.querySelector('.accept-friend-button')?.addEventListener('click', handlers.accept);
		buttonCell.querySelector('.decline-friend-button')?.addEventListener('click', handlers.decline);
		buttonCell.querySelector('.block-friend-button')?.addEventListener('click', handlers.block);
		buttonCell.querySelector('.unblock-friend-button')?.addEventListener('click', handlers.unblock);
		buttonCell.querySelector('.unfriend-button')?.addEventListener('click', handlers.unfriend);

		// Stocker les handlers sur l'élément pour pouvoir les retirer plus tard
		(buttonCell as any).friendHandlers = handlers;
	}

	/**
	 * Crée un handler qui injecte le contexte utilisateur avant d'appeler le handler de NotifService.
	 */
	private createHandler(userId: number, username: string, notifHandler: (event: Event) => Promise<void>) {
		return async (event: Event) => {
			// Injecter le contexte dans NotifService
			notifService.friendId = userId;
			notifService.friendName = username;

			// Appeler le handler de NotifService
			await notifHandler.call(notifService, event);
		};
	}

	/**
	 * Retire les event listeners d'un container.
	 * À appeler dans removeListeners() de chaque composant.
	 */
	public removeButtonListeners(container: HTMLElement): void {
		const buttonCell = container.querySelector('.button-cell') as HTMLElement;
		if (!buttonCell) return;

		const handlers = (buttonCell as any).friendHandlers;
		if (!handlers) return;

		// Retirer tous les handlers
		buttonCell.querySelector('.add-friend-button')?.removeEventListener('click', handlers.add);
		buttonCell.querySelector('.cancel-friend-button')?.removeEventListener('click', handlers.cancel);
		buttonCell.querySelector('.accept-friend-button')?.removeEventListener('click', handlers.accept);
		buttonCell.querySelector('.decline-friend-button')?.removeEventListener('click', handlers.decline);
		buttonCell.querySelector('.block-friend-button')?.removeEventListener('click', handlers.block);
		buttonCell.querySelector('.unblock-friend-button')?.removeEventListener('click', handlers.unblock);
		buttonCell.querySelector('.unfriend-button')?.removeEventListener('click', handlers.unfriend);

		delete (buttonCell as any).friendHandlers;
	}

	// ===========================================
	// HANDLER POUR CHALLENGE (partagé)
	// ===========================================

	/**
	 * Crée un handler pour le bouton Challenge.
	 * Utilisé à la fois dans UserRow, Profile et potentiellement ailleurs.
	 */
	public createChallengeHandler(userId: number) {
		return async (event: Event) => {
			event.preventDefault();
			const currentUser = currentService.getCurrentUser();
			const relation = await friendApi.getRelation(currentUser!.id, userId);
			
			if (!relation || "errorMessage" in relation || !relation.isOnline) {
				console.error("errorMessage" in relation ? relation.errorMessage : "Invitation invalide.");
				return;
			}
			
			// Injecter le contexte dans NotifService
			notifService.friendId = userId;
			notifService.friendName = relation.username;
			
			if (!relation.challengedBy) {
				await notifService.handleChallengeClick(event);
			} else if (relation.challengedBy === relation.id) {
				await notifService.handlePlayClick(event);
			}
		};
	}

	// ===========================================
	// CLEANUP
	// ===========================================

	public cleanup(): void {
		if (this.boundUpdateHandler) {
			eventService.off(EVENTS.FRIEND_UPDATED, this.boundUpdateHandler);
			this.boundUpdateHandler = undefined;
		}
	}
}