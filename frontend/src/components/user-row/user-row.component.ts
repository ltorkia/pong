// Pour hot reload Vite
import template from './user-row.component.html?raw'

import { BaseComponent } from '../base/base.component';
import { RouteConfig } from '../../types/routes.types';
import { router } from '../../router/router';
import { ComponentConfig } from '../../types/components.types';
import { dataService, notifService, friendService } from '../../services/index.service';
import { getHTMLElementByClass } from '../../utils/dom.utils';
import { DB_CONST } from '../../shared/config/constants.config';
import { User } from '../../shared/models/user.model';

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
	private avatarImg!: HTMLImageElement;
	private nameCell!: HTMLElement;
	private statusCell!: HTMLElement;
	private friendLogoCell!: HTMLElement;
	private levelCell!: HTMLElement;
	private winrate!: HTMLElement;
	private profileButton!: HTMLElement;
	private logCell!: HTMLElement;
	private profilePath!: string;
	private buttonCell!: HTMLElement;
	private addFriendButton!: HTMLButtonElement;
	private cancelFriendButton!: HTMLButtonElement;
	private acceptFriendButton!: HTMLButtonElement;
	private declineFriendButton!: HTMLButtonElement;
	private blockFriendButton!: HTMLButtonElement;
	private unblockFriendButton!: HTMLButtonElement;
	private unfriendButton!: HTMLButtonElement;
	private challengeButton!: HTMLButtonElement;
	private buttons: HTMLButtonElement[] = [];

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
	 * Procède aux vérifications nécessaires avant le montage du composant.
	 *
	 * Exécute les vérifications de base de la classe parente (`BaseComponent`).
	 * Charge le template HTML du composant en mode développement via `loadTemplateDev()`.
	 *
	 * @returns {Promise<boolean>} Une promesse qui se résout lorsque les vérifications sont terminées.
	 */
	protected async preRenderCheck(): Promise<boolean> {
		if (!super.preRenderCheck())
			return false;
		await this.loadTemplateDev();
		if (!this.user) {
			console.error('Aucun utilisateur fourni pour le composant de ligne d\'utilisateur');
			return false;
		}
		return true;
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
		this.avatarImg = getHTMLElementByClass('avatar-img', this.container) as HTMLImageElement;
		this.nameCell = getHTMLElementByClass('name-cell', this.container) as HTMLElement;
		this.statusCell = getHTMLElementByClass('status-cell', this.container) as HTMLElement;
		this.friendLogoCell = getHTMLElementByClass('friend-logo-cell', this.container) as HTMLElement;
		this.levelCell = getHTMLElementByClass('level-cell', this.container) as HTMLElement;
		this.winrate = getHTMLElementByClass('winrate-cell .winrate', this.levelCell) as HTMLElement;
		this.profileButton = getHTMLElementByClass('profile-button', this.levelCell) as HTMLElement;
		this.logCell = getHTMLElementByClass('log-cell', this.container) as HTMLElement;
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
			this.profileButton.setAttribute('title', 'Your profile');
			this.avatarImg.setAttribute('alt', 'Your avatar');
		} else {
			this.profileButton.setAttribute('title', `${this.user!.username}'s profile`);
			this.avatarImg.setAttribute('alt', `${this.user!.username}'s avatar`);
		}
		this.avatarImg.setAttribute('loading', 'lazy');
		const userAvatar = await dataService.getUserAvatarURL(this.user!);
		this.avatarImg.setAttribute('src', userAvatar);
		this.nameCell.textContent = this.user!.username;
		if (this.user!.id !== this.currentUser!.id)
			this.statusCell.innerHTML = dataService.showStatusLabel(this.user!);
		this.friendLogoCell.innerHTML = dataService.showFriendLogo(this.user!);
		if ('winRate' in this.user! && this.user.winRate !== undefined)
			this.winrate.textContent = `${this.user.winRate}%`;
		else
			this.winrate.textContent = 'No stats';
		if (this.user!.id !== this.currentUser!.id) {
			const logDate = dataService.showLogDate(this.user!);
			if (logDate)
				this.logCell.textContent = logDate;
		}
		this.setButtonDataAttribut();
		await this.toggleFriendButton();
	}

	/**
	 * Attribue l'attribut data-friend-id à chaque bouton de la ligne utilisateur,
	 * ce qui permettra de récupérer l'ID de l'utilisateur associé au bouton
	 * lors de l'appel d'une fonction listener.
	 */
	private setButtonDataAttribut() {
		this.buttons.forEach(btn => {
			const element = btn as HTMLButtonElement;
			if (btn)
				element.setAttribute("data-friend-id", this.user!.id.toString());
		});
	}

	/**
	 * Attribue les listeners.
	 * 
	 * - Attribue un listener au bloc avatar/username pour rediriger vers le profil.
	 */
	protected attachListeners(): void {
		this.profileButton.addEventListener('click', this.handleProfileClick);
		this.addFriendButton.addEventListener('click', this.addFriendClick);
		this.cancelFriendButton.addEventListener('click', this.cancelFriendRequestClick);
		this.acceptFriendButton.addEventListener('click', this.acceptFriendClick);
		this.declineFriendButton.addEventListener('click', this.declineFriendClick);
		this.unfriendButton.addEventListener('click', this.unfriendClick);
		this.blockFriendButton.addEventListener('click', this.blockFriendClick);
		this.unblockFriendButton.addEventListener('click', this.unblockFriendClick);
		// this.challengeButton.addEventListener('click', this.challengeClick);
	}

	/**
	 * Enlève les listeners.
	 */
	protected removeListeners(): void {
		this.profileButton.removeEventListener('click', this.handleProfileClick);
		this.addFriendButton.removeEventListener('click', this.addFriendClick);
		this.cancelFriendButton.removeEventListener('click', this.cancelFriendRequestClick);
		this.acceptFriendButton.removeEventListener('click', this.acceptFriendClick);
		this.declineFriendButton.removeEventListener('click', this.declineFriendClick);
		this.unfriendButton.removeEventListener('click', this.unfriendClick);
		this.blockFriendButton.removeEventListener('click', this.blockFriendClick);
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
		if (this.user && this.user.id !== this.currentUser!.id || !this.user) {
			this.hideAllButtons();
			const friend = await friendService.isFriendWithCurrentUser(this.user!.id);
			if (!friend) {
				this.friendLogoCell.innerHTML = `<i class="fa-solid fa-minus"></i>`;
				this.addFriendButton.classList.remove('hidden');
				return;
			}
			this.friendLogoCell.innerHTML = dataService.showFriendLogo(friend);

			if (friend.friendStatus === DB_CONST.FRIENDS.STATUS.PENDING) {
				if (friend.requesterId === this.currentUser!.id) {
					this.cancelFriendButton.classList.remove('hidden');
					return;
				}
				this.acceptFriendButton.classList.remove('hidden');
				this.declineFriendButton.classList.remove('hidden');
			}
			if (friend.friendStatus === DB_CONST.FRIENDS.STATUS.ACCEPTED) {
				this.challengeButton.classList.remove('hidden');
				this.blockFriendButton.classList.remove('hidden');
				this.unfriendButton.classList.remove('hidden');
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
		this.buttons.forEach(btn => btn.classList.add('hidden'));
	}

	/**
	 * Crée un élément HTML servant d'espace d'alerte pour les erreurs.
	 */
	private createAlertSpace(): HTMLDivElement {
		const div = document.createElement('div');
		div.id = `alert-${this.user!.id}`;
		div.setAttribute('aria-live', 'assertive');
		div.classList.add('alert', 'mr-5', 'error-message', 'hidden');
		this.userline.appendChild(div);
		return div;
	}

	// ===========================================
	// LISTENER HANDLERS
	// ===========================================

	private handleProfileClick = async (event: Event): Promise<void> => {
		event.preventDefault();
		await router.navigate(this.profilePath);
	};

	private addFriendClick = async (event: Event): Promise<void> => {
		event.preventDefault();
		await notifService.handleAddClick(event);
		console.log(`Friend request sent to ${this.user!.username}`);
	}

	private acceptFriendClick = async (event: Event): Promise<void> => {
		event.preventDefault();
		await notifService.handleAcceptClick(event);
		console.log(`Friend request accepted for ${this.user!.username}`);
	}

	private declineFriendClick = async (event: Event): Promise<void> => {
		event.preventDefault();
		await notifService.handleDeclineClick(event);
		console.log(`Friend request sent to ${this.user!.username}`);
	}

	private blockFriendClick = async (event: Event): Promise<void> => {
		event.preventDefault();
		await notifService.handleBlockClick(event);
		console.log(`Friend ${this.user!.username} blocked`);
	}

	private unblockFriendClick = async (event: Event): Promise<void> => {
		event.preventDefault();
		await notifService.handleUnblockClick(event);
		console.log(`Friend ${this.user!.username} unblocked`);
	}

	private unfriendClick = async (event: Event): Promise<void> => {
		event.preventDefault();
		await notifService.handleUnfriendClick(event);
		console.log(`Friend ${this.user!.username} unfriended`);
	}

	private cancelFriendRequestClick = async (event: Event): Promise<void> => {
		event.preventDefault();
		await notifService.handleCancelClick(event);
		console.log(`Friend request canceled for ${this.user!.username}`);
	}

	/**
	 * CHALLENGER UN AMI -
	 * FRIEND_REQUEST_ACTIONS.INVITE sera une constante utilisée durant le processus.
	 * L'ébauche ci-dessous date un peu. Il faudrait plutôt s'inspirer des méthodes ci-dessus :
	 * chacune appelle une méthode de notifService (qu'il faudra créer dans notre cas).
	 * C'est dans notifService qu'on gère à la fois les relations et les notifs en db 
	 * via les boutons cliquables de la liste des utilisateurs (ici même), et du centre de notifications.
	 */

	// private challengeClick = async (event: Event): Promise<void> => {
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