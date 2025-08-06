// Pour hot reload Vite
import template from './user-row.component.html?raw'

import { BaseComponent } from '../base/base.component';
import { RouteConfig } from '../../types/routes.types';
import { router } from '../../router/router';
import { ComponentConfig } from '../../types/components.types';
import { User } from '../../shared/models/user.model';
import { Friend } from '../../shared/models/friend.model';
import { dataApi } from '../../api/index.api';
import { dataService } from '../../services/index.service';
import { getHTMLElementByClass, showAlert } from '../../utils/dom.utils';
import { DB_CONST } from '../../shared/config/constants.config';

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
	private currentUserFriends: Friend[] | null = null;
	private currentFriend?: Friend | null = null;
	private userline!: HTMLDivElement;
	private userCell!: HTMLAnchorElement;
	private avatarImg!: HTMLImageElement;
	private nameCell!: HTMLElement;
	private statusCell!: HTMLElement;
	private levelCell!: HTMLElement;
	private profilePath!: string;
	private buttonCell!: HTMLElement;
	private addFriendButton!: HTMLButtonElement;
	private cancelFriendRequestButton!: HTMLButtonElement;
	private acceptedFriend!: HTMLButtonElement;
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
		this.levelCell = getHTMLElementByClass('level-cell', this.container) as HTMLElement;
		this.profilePath = `/user/${this.user!.id}`;
		this.buttonCell = getHTMLElementByClass('button-cell', this.container) as HTMLElement;
		this.addFriendButton = getHTMLElementByClass('add-friend-button', this.buttonCell) as HTMLButtonElement;
		this.cancelFriendRequestButton = getHTMLElementByClass('cancel-friend-request-button', this.buttonCell) as HTMLButtonElement;
		this.acceptedFriend = getHTMLElementByClass('accepted-friend', this.buttonCell) as HTMLButtonElement;
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
			this.challengeButton.classList.remove('hidden');
		}
		this.avatarImg.setAttribute('loading', 'lazy');
		const userAvatar = await dataService.getUserAvatarURL(this.user!);
		console.log(`Avatar URL: ${userAvatar}`, this.user);
		this.avatarImg.setAttribute('src', userAvatar);
		this.nameCell.textContent = this.user!.username;
		this.statusCell.innerHTML = dataService.showStatusLabel(this.user!);
		if (this.levelCell) {
			if ('winRate' in this.user! && this.user.winRate !== undefined) {
				this.levelCell.textContent = `Win rate: ${this.user.winRate}%`;
			} else {
				this.levelCell.textContent = 'No stats';
			}
		}
		await this.toggleFriendButton();
		console.log("MOUNT", this.currentUserFriends);
	}

	/**
	 * Attribue les listeners.
	 * 
	 * - Attribue un listener au bloc avatar/username pour rediriger vers le profil.
	 */
	protected attachListeners(): void {
		this.userCell.addEventListener('click', this.handleUsercellClick);
		this.addFriendButton.addEventListener('click', this.addFriendClick);
		this.cancelFriendRequestButton.addEventListener('click', this.cancelFriendRequestClick);
		this.acceptedFriend.addEventListener('click', this.unblockFriendClick);
		this.unblockFriendButton.addEventListener('click', this.unblockFriendClick);
		// this.challengeButton.addEventListener('click', this.challengeClick);
	}

	/**
	 * Enlève les listeners.
	 */
	protected removeListeners(): void {
		this.userCell.removeEventListener('click', this.handleUsercellClick);
		this.addFriendButton.removeEventListener('click', this.addFriendClick);
		this.cancelFriendRequestButton.removeEventListener('click', this.cancelFriendRequestClick);
		this.acceptedFriend.removeEventListener('click', this.unblockFriendClick);
		this.unblockFriendButton.removeEventListener('click', this.unblockFriendClick);
		// this.challengeButton.removeEventListener('click', this.challengeClick);
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
	 * Vérifie le statut d'amitié entre l'utilisateur courant et l'utilisateur affiché
	 * dans la ligne d'utilisateur.
	 *
	 * Si l'utilisateur n'est pas ami, affiche le bouton d'envoi de demande d'amitié.
	 * Si l'utilisateur est en attente de validation, affiche le bouton d'annulation
	 * de la demande d'amitié.
	 * Si l'utilisateur est ami, affiche le bouton de débloquage.
	 * Si l'utilisateur est bloqué, affiche le bouton de débloquage.
	 */
	private async toggleFriendButton(): Promise<void> {
		if (this.user!.id !== this.currentUser!.id) {
			this.hideAllButtons();
			const friend = await dataService.isFriendWithCurrentUser(this.user!.id, this.currentUserFriends);
			if (!friend) {
				console.log("ON EST LA");
				this.addFriendButton.classList.remove('hidden');
				return;
			}
			console.log("Friend status:", friend.status);
			if (friend.status === DB_CONST.FRIENDS.STATUS.PENDING) {
				this.cancelFriendRequestButton.classList.remove('hidden');
			}
			if (friend.status === DB_CONST.FRIENDS.STATUS.ACCEPTED) {
				this.acceptedFriend.classList.remove('hidden');
			}
			if (friend.status === DB_CONST.FRIENDS.STATUS.BLOCKED) {
				this.unblockFriendButton.classList.remove('hidden');
			}
			this.currentFriend = friend.friend;
			console.log("Current friend set:", this.currentFriend);
		}
	}

	private hideAllButtons() {
		this.addFriendButton.classList.add('hidden');
		this.cancelFriendRequestButton.classList.add('hidden');
		this.acceptedFriend.classList.add('hidden');
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

	// ===========================================
	// METHODES PUBLICS
	// ===========================================

	public setFriends(friends: Friend[]): void {
		this.currentUserFriends = friends;
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

	private addFriendClick = async (event: MouseEvent): Promise<void> => {
		event.preventDefault();
		if (!this.user) {
			return;
		}
		console.log("BEFORE ADD", this.currentUserFriends);
		const res = await dataApi.addFriend(this.currentUser.id, this.user.id);
		if (res.errorMessage) {
			showAlert(res.errorMessage, `alert-${this.user.id}`, 'error');
			return;
		}
		await this.toggleFriendButton();
		if (this.currentFriend) {
			this.currentUserFriends?.push(this.currentFriend!);
			this.currentFriend = null;
		}
		console.log("AFTER ADD", this.currentUserFriends);
		console.log(`Friend request sent to ${this.user.username}`);
	}

	private unblockFriendClick = async (event: MouseEvent): Promise<void> => {
		event.preventDefault();
		if (!this.user) {
			return;
		}
		const res = await dataApi.acceptFriend(this.currentUser.id, this.user.id);
		if (res.errorMessage) {		
			showAlert(res.errorMessage, `alert-${this.user.id}`, 'error');
			return;
		}
		await this.toggleFriendButton();
		console.log(`Friend request sent to ${this.user.username}`);
	}

	private cancelFriendRequestClick = async (event: MouseEvent): Promise<void> => {
		event.preventDefault();
		if (!this.user) {
			return;
		}
		const res = await dataApi.removeFriend(this.currentUser.id, this.user.id);
		if (res.errorMessage) {
			showAlert(res.errorMessage, `alert-${this.user.id}`, 'error');
			return;
		}
		await this.toggleFriendButton();
		this.currentUserFriends?.splice(this.currentUserFriends.indexOf(this.currentFriend!), 1);
		console.log(`Friend request canceled for ${this.currentFriend!.username}`);
	}

	// private challengeClick = async (event: MouseEvent): Promise<void> => {
	// 	event.preventDefault();
	// 	if (!this.user) {
	// 		return;
	// 	}
	// 	const res = await dataApi.challengeUser(this.currentUser.id, this.user.id);
	// 	if (res.errorMessage) {
	// 		showAlert(res.errorMessage, `alert-${this.user.id}`, 'error');
	// 		return;
	// 	}
	// 	console.log(`Challenge sent to ${this.user.username}`);
	// 	await router.navigate(`/game/${res.gameId}`);
	// }
}