// Pour hot reload Vite
import template from './user-row.component.html?raw'

import { BaseComponent } from '../base/base.component';
import { RouteConfig } from '../../types/routes.types';
import { router } from '../../router/router';
import { ComponentConfig } from '../../types/components.types';
import { dataService, notifService, friendService } from '../../services/index.service';
import { getHTMLElementByClass, getHTMLElementByTagName, showAlert } from '../../utils/dom.utils';
import { DB_CONST, FRIEND_REQUEST_ACTIONS } from '../../shared/config/constants.config';
import { User } from '../../shared/models/user.model';
import { NotificationModel } from '../../shared/types/notification.types';
import { FriendRequestAction } from '../../../../shared/types/notification.types';

// ===========================================
// USER ROW COMPONENT
// ===========================================
/**
 * Composant de la ligne d'utilisateur.
 *
 * Ce composant est utilisé pour afficher une ligne d'utilisateur dans la page
 * des utilisateurs. Il est injecté dans un élément HTML qui a l'id
 * "user-list". La ligne d'utilisateur affichera l'avatar, le lien du nom
 * d'utilisateur et le niveau de l'utilisateur fourni.
 *
 * En mode développement, utilise le hot-reload Vite pour charger le
 * template HTML du composant. Ensuite, met à jour le contenu visuel de la
 * ligne d'utilisateur avec les informations de l'utilisateur fourni.
 */
export class UserRowComponent extends BaseComponent {
	protected user?: User | null = null;
	public userline!: HTMLDivElement;
	private userCell!: HTMLAnchorElement;
	private avatarImg!: HTMLImageElement;
	private nameCell!: HTMLElement;
	private statusCell!: HTMLElement;
	private friendLogoCell!: HTMLElement;
	private levelCell!: HTMLElement;
	private logCell!: HTMLElement;
	private profilePath!: string;
	private buttonCell!: HTMLElement;
	private addFriendButton!: HTMLButtonElement;
	private acceptFriendButton!: HTMLButtonElement;
	private removeFriendButton!: HTMLButtonElement;
	private removeFriendButtonContent!: HTMLSpanElement;
	private blockFriendButton!: HTMLButtonElement;
	private unblockFriendButton!: HTMLButtonElement;
	private challengeButton!: HTMLButtonElement;

	/**
	 * Constructeur du composant de ligne d'utilisateur.
	 *
	 * Stocke la configuration de la route actuelle, la configuration du composant,
	 * le container HTML et l'utilisateur à afficher dans le composant.
	 *
	 * @param {RouteConfig} routeConfig La configuration de la route actuelle.
	 * @param {ComponentConfig} componentConfig La configuration du composant.
	 * @param {HTMLElement} container L'élément HTML qui sera utilisé comme conteneur pour le composant.
	 * @param {User | null} user L'utilisateur à afficher dans le composant (facultatif).
	 */
	constructor(routeConfig: RouteConfig, componentConfig: ComponentConfig, container: HTMLElement, user?: User | null) {
		super(routeConfig, componentConfig, container);
		this.user = user;
	}

	// ===========================================
	// METHODES OVERRIDES DE BASECOMPONENT
	// ===========================================

	/**
	 * Vérifie les préconditions avant le rendu du composant de ligne d'utilisateur.
	 *
	 * Cette méthode surcharge `preRenderCheck` de BaseComponent pour effectuer
	 * des vérifications spécifiques au composant de ligne d'utilisateur.
	 * Elle charge le template en mode développement et s'assure qu'un utilisateur
	 * est fourni. Si aucun utilisateur n'est fourni, une erreur est levée.
	 *
	 * @throws {Error} Lance une erreur si aucun utilisateur n'est fourni.
	 */
	protected async preRenderCheck(): Promise<void> {
		super.preRenderCheck();
		await this.loadTemplateDev();
		if (!this.user) {
			throw new Error('Aucun utilisateur fourni');
		}
	}

	/**
	 * Méthode de pré-rendering du composant de ligne d'utilisateur.
	 *
	 * Stocke les éléments HTML utiles pour le fonctionnement du composant
	 * dans les propriétés de l'objet.
	 *
	 * @returns {Promise<void>} Une promesse qui se résout lorsque les éléments HTML ont été stockés.
	 */
	protected async beforeMount(): Promise<void> {
		this.userline = getHTMLElementByClass('user-line', this.container) as HTMLDivElement;
		this.userCell = getHTMLElementByClass('user-cell', this.container) as HTMLAnchorElement;
		this.avatarImg = getHTMLElementByClass('avatar-img', this.container) as HTMLImageElement;
		this.nameCell = getHTMLElementByClass('name-cell', this.container) as HTMLElement;
		this.statusCell = getHTMLElementByClass('status-cell', this.container) as HTMLElement;
		this.friendLogoCell = getHTMLElementByClass('friend-logo-cell', this.container) as HTMLElement;
		this.levelCell = getHTMLElementByClass('level-cell', this.container) as HTMLElement;
		this.logCell = getHTMLElementByClass('log-cell', this.container) as HTMLElement;
		this.profilePath = `/user/${this.user!.id}`;
		this.buttonCell = getHTMLElementByClass('button-cell', this.container) as HTMLElement;
		this.addFriendButton = getHTMLElementByClass('add-friend-button', this.buttonCell) as HTMLButtonElement;
		this.acceptFriendButton = getHTMLElementByClass('accept-friend-button', this.buttonCell) as HTMLButtonElement;
		this.removeFriendButton = getHTMLElementByClass('remove-friend-button', this.buttonCell) as HTMLButtonElement;
		this.removeFriendButtonContent = getHTMLElementByTagName('span', this.removeFriendButton) as HTMLSpanElement;
		this.blockFriendButton = getHTMLElementByClass('block-friend-button', this.buttonCell) as HTMLButtonElement;
		this.unblockFriendButton = getHTMLElementByClass('unblock-friend-button', this.buttonCell) as HTMLButtonElement;
		this.challengeButton = getHTMLElementByClass('challenge-button', this.buttonCell) as HTMLButtonElement;
	}

	/**
	 * Méthode de montage du composant de la ligne d'utilisateur.
	 *
	 * Met à jour le contenu visuel de la ligne d'utilisateur avec
	 * les informations de l'utilisateur fourni,
	 * en ajustant l'avatar, le lien du nom d'utilisateur et le
	 * niveau (taux de victoire) si disponible.
	 *
	 * @returns {Promise<void>} Une promesse qui se résout lorsque le composant est monté.
	 */
	protected async mount(): Promise<void> {
		this.createAlertSpace();
		if (this.user!.id === this.currentUser!.id) {
			this.userCell.setAttribute('title', 'Your profile');
			this.avatarImg.setAttribute('alt', 'Your avatar');
		} else {
			this.userCell.setAttribute('title', `${this.user!.username}'s profile`);
			this.avatarImg.setAttribute('alt', `${this.user!.username}'s avatar`);
		}
		this.avatarImg.setAttribute('loading', 'lazy');
		const userAvatar = await dataService.getUserAvatarURL(this.user!);
		this.avatarImg.setAttribute('src', userAvatar);
		this.nameCell.textContent = this.user!.username;
		this.statusCell.innerHTML = dataService.showStatusLabel(this.user!);
		const friendLogo = dataService.showFriendLogo(this.user!);
		if (friendLogo) {
			this.friendLogoCell.innerHTML = friendLogo;
		}
		if (this.levelCell) {
			if ('winRate' in this.user! && this.user.winRate !== undefined) {
				this.levelCell.textContent = `Win rate: ${this.user.winRate}%`;
			} else {
				this.levelCell.textContent = 'No stats';
			}
		}
		const logDate = dataService.showLogDate(this.user!);
		if (logDate) {
			this.logCell.textContent = logDate;
		}
		await this.toggleFriendButton();
	}

	/**
	 * Attribue les listeners.
	 * 
	 * - Attribue un listener au bloc avatar/username pour rediriger vers le profil.
	 */
	protected attachListeners(): void {
		this.userCell.addEventListener('click', this.handleUsercellClick);
		this.addFriendButton.addEventListener('click', this.addFriendClick);
		this.acceptFriendButton.addEventListener('click', this.acceptFriendClick);
		this.removeFriendButton.addEventListener('click', this.cancelFriendRequestClick);
		this.blockFriendButton.addEventListener('click', this.blockFriendClick);
		this.unblockFriendButton.addEventListener('click', this.unblockFriendClick);
		// this.challengeButton.addEventListener('click', this.challengeClick);
	}

	/**
	 * Enlève les listeners.
	 */
	protected removeListeners(): void {
		this.userCell.removeEventListener('click', this.handleUsercellClick);
		this.addFriendButton.removeEventListener('click', this.addFriendClick);
		this.acceptFriendButton.removeEventListener('click', notifService.handleAcceptClick);
		this.removeFriendButton.removeEventListener('click', this.cancelFriendRequestClick);
		this.blockFriendButton.removeEventListener('click', notifService.handleDeclineClick);
		this.unblockFriendButton.removeEventListener('click', this.unblockFriendClick);
		// this.challengeButton.removeEventListener('click', this.challengeClick);
	}

	// ===========================================
	// METHODES PUBLICS
	// ===========================================

	/**
	 * Affiche ou masque dynamiquement les boutons d'action liés à l'amitié selon le statut de la relation
	 * entre l'utilisateur courant et l'utilisateur sélectionné. La méthode commence par masquer tous les boutons,
	 * puis affiche le ou les boutons appropriés selon que les utilisateurs sont amis, qu'une demande est en attente,
	 * qu'ils sont bloqués ou qu'il n'y a aucune relation.
	 *
	 * @returns {Promise<void>} Une promesse qui se résout lorsque l'affichage des boutons est terminé.
	 */
	public async toggleFriendButton(): Promise<void> {
		if (this.user!.id !== this.currentUser!.id) {
			this.hideAllButtons();
			const friend = await friendService.isFriendWithCurrentUser(this.user!.id);
			if (!friend) {
				this.addFriendButton.classList.remove('hidden');
				return;
			}
			if (friend.friendStatus === DB_CONST.FRIENDS.STATUS.PENDING) {
				this.removeFriendButton.classList.remove('hidden');
				if (friend.requesterId === this.currentUser!.id) {
					this.removeFriendButtonContent.textContent = 'Cancel friend request';
					return;
				}
				this.acceptFriendButton.classList.remove('hidden');
			}
			if (friend.friendStatus === DB_CONST.FRIENDS.STATUS.ACCEPTED) {
				this.challengeButton.classList.remove('hidden');
				this.blockFriendButton.classList.remove('hidden');
				this.removeFriendButton.classList.remove('hidden');
				this.removeFriendButtonContent.textContent = 'Unfriend';
			}
			if (friend.friendStatus === DB_CONST.FRIENDS.STATUS.BLOCKED) {
				if (friend.blockedBy === this.currentUser!.id) {
					this.unblockFriendButton.classList.remove('hidden');
					return;
				}
			}
		}
	}

	// ===========================================
	// METHODES PRIVATES
	// ===========================================

	/**
	 * Charge le template HTML du composant en mode développement
	 * (hot-reload Vite).
	 *
	 * Si le hot-reload est actif (en mode développement), charge le
	 * template HTML du composant en remplaçant le contenu du conteneur
	 * par le template. Sinon, ne fait rien.
	 *
	 * @returns {Promise<void>} Une promesse qui se résout lorsque le
	 * template est chargé et injecté dans le conteneur.
	 */
	private async loadTemplateDev(): Promise<void> {
		await this.loadTemplate(template);
	}

	/**
	 * Masque tous les boutons d'action utilisateur en ajoutant la classe CSS 'hidden'
	 * à chaque élément bouton de la ligne utilisateur.
	 *
	 * Cette méthode est généralement utilisée pour réinitialiser l'état de l'interface
	 * ou pour empêcher les interactions utilisateur avec ces boutons dans certaines conditions.
	 */
	private hideAllButtons() {
		this.challengeButton.classList.add('hidden');
		this.addFriendButton.classList.add('hidden');
		this.acceptFriendButton.classList.add('hidden');
		this.removeFriendButton.classList.add('hidden');
		this.blockFriendButton.classList.add('hidden');
		this.unblockFriendButton.classList.add('hidden');
	}

	/**
	 * Crée un élément HTML servant d'espace d'alerte pour les erreurs.
	 */
	private createAlertSpace(): HTMLDivElement {
		const div = document.createElement('div');
		div.id = `alert-${this.user.id}`;
		div.setAttribute('aria-live', 'assertive');
		div.classList.add('alert', 'mr-5', 'error-message', 'hidden');
		this.userline.appendChild(div);
		return div;
	}

	/**
	 * Retourne un modèle de notification pour une action de demande d'ami.
	 *
	 * Crée un objet `NotificationModel` contenant les informations nécessaires
	 * pour une notification liée à une action de demande d'ami. Cet objet
	 * inclut l'identifiant de l'utilisateur actuel, l'identifiant de l'utilisateur
	 * cible et le type d'action de la demande d'ami.
	 *
	 * @param {FriendRequestAction} type - Le type de l'action de la demande d'ami.
	 * @returns {NotificationModel} Un objet contenant les informations de la notification.
	 */
	private getNotifData(type: FriendRequestAction): NotificationModel {
		return {
			from: this.currentUser.id,
			to: this.user!.id,
			type: type
		}
	}

	// ===========================================
	// LISTENER HANDLERS
	// ===========================================

	/**
	 * Listener sur le bloc avatar/username pour rediriger vers le profil.
	 * 
	 * @param {MouseEvent} event L'événement de clic.
	 * @returns {Promise<void>} Une promesse qui se resout apres la redirection.
	 */
	private handleUsercellClick = async (event: MouseEvent): Promise<void> => {
		event.preventDefault();
		await router.navigate(this.profilePath);
	};

	/**
	 * Gère l'événement de clic pour l'ajout d'un ami.
	 * 
	 * Empêche le comportement par défaut de l'événement, vérifie si l'utilisateur cible existe,
	 * envoie une demande d'ami via l'API, et affiche une alerte en cas d'erreur.
	 * Si la demande réussit, rafraîchit les boutons d'amis via le service de notification
	 * et log l'action dans la console.
	 * 
	 * @param event - L'événement souris déclenché par le clic sur le bouton d'ajout d'ami.
	 * @returns Une promesse qui se résout lorsque le processus de demande d'ami est terminé.
	 */
	private addFriendClick = async (event: MouseEvent): Promise<void> => {
		event.preventDefault();
		if (!this.user) {
			return;
		}
		notifService.setNotifsData(this.user.id);
		await notifService.handleAddClick();
		console.log(`Friend request sent to ${this.user.username}`);
	}

	/**
	 * Gère l'événement de clic pour accepter une demande d'ami.
	 *
	 * Empêche le comportement par défaut de l'événement, vérifie si l'utilisateur cible existe,
	 * envoie une requête pour accepter l'ami via l'API, et affiche une alerte en cas d'erreur.
	 * Si la demande réussit, rafraîchit les boutons d'amis via le service de notification
	 * et log l'action dans la console.
	 *
	 * @param event - L'événement souris déclenché par le clic sur le bouton d'acceptation.
	 * @returns Une promesse qui se résout lorsque la demande d'ami a été traitée.
	 */
	private acceptFriendClick = async (event: MouseEvent): Promise<void> => {
		event.preventDefault();
		if (!this.user) {
			return;
		}
		notifService.setNotifsData(this.user.id, FRIEND_REQUEST_ACTIONS.ADD);
		await notifService.handleAcceptClick();
		console.log(`Friend request accepted for ${this.user.username}`);
	}

	/**
	 * Gère l'événement de clic pour bloquer un ami.
	 * 
	 * Empêche le comportement par défaut de l'événement, vérifie si l'utilisateur cible existe,
	 * envoie une requête pour bloquer l'ami via l'API, et affiche une alerte en cas d'erreur.
	 * Si la demande réussit, rafraîchit les boutons d'amis via le service de notification
	 * et log l'action dans la console.
	 *
	 * @param event - L'événement souris déclenché par le clic sur le bouton de blocage.
	 * @returns Une promesse qui se résout lorsque l'opération de blocage est terminée.
	 */
	private blockFriendClick = async (event: MouseEvent): Promise<void> => {
		event.preventDefault();
		if (!this.user) {
			return;
		}
		notifService.setNotifsData(this.user.id, FRIEND_REQUEST_ACTIONS.ACCEPT);
		await notifService.handleBlockClick();
		console.log(`Friend ${this.user.username} blocked`);
	}

	/**
	 * Gère l'événement de clic pour débloquer un ami.
	 *
	 * Empêche le comportement par défaut de l'événement, vérifie si l'utilisateur cible existe,
	 * envoie une requête pour débloquer l'ami via l'API, et affiche une alerte en cas d'erreur.
	 * Si la demande réussit, rafraîchit les boutons d'amis via le service de notification
	 * et log l'action dans la console.
	 *
	 * @param event - L'événement souris déclenché par le clic sur le bouton de déblocage.
	 * @returns Une promesse qui se résout lorsque l'opération de déblocage est terminée.
	 */
	private unblockFriendClick = async (event: MouseEvent): Promise<void> => {
		event.preventDefault();
		if (!this.user) {
			return;
		}
		notifService.setNotifsData(this.user.id, FRIEND_REQUEST_ACTIONS.BLOCK);
		await notifService.handleAcceptClick();
		console.log(`Friend request sent to ${this.user.username}`);
	}

	/**
	 * Gère l'annulation d'une demande d'ami lors du clic sur le bouton correspondant.
	 * 
	 * Empêche le comportement par défaut de l'événement, vérifie si l'utilisateur cible existe,
	 * et tente de supprimer la demande d'ami via l'API. En cas d'erreur, affiche une alerte
	 * avec le message d'erreur. En cas de succès, met à jour l'interface utilisateur
	 * en rafraîchissant les boutons d'amis et log l'annulation dans la console.
	 * 
	 * @param event - L'événement souris déclenché par le clic sur le bouton d'annulation de la demande d'ami.
	 * @returns Une promesse qui se résout lorsque l'opération est terminée.
	 */
	private cancelFriendRequestClick = async (event: MouseEvent): Promise<void> => {
		event.preventDefault();
		if (!this.user) {
			return;
		}
		notifService.setNotifsData(this.user.id);
		await notifService.handleCancelClick();
		console.log(`Friend request canceled for ${this.user.username}`);
	}

	// private challengeClick = async (event: MouseEvent): Promise<void> => {
	// 	event.preventDefault();
	// 	if (!this.user) {
	// 		return;
	// 	}
	// 	const res = await friendApi.challengeUser(this.currentUser.id, this.user.id);
	// 	if (res.errorMessage) {
	// 		showAlert(res.errorMessage, `alert-${this.user.id}`, 'error');
	// 		return;
	// 	}
	// 	console.log(`Challenge sent to ${this.user.username}`);
	// 	await router.navigate(`/game/${res.gameId}`);
	// }
}