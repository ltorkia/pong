// Pour hot reload Vite
import template from './user-row.component.html?raw'

import { BaseComponent } from '../base/base.component';
import { RouteConfig } from '../../types/routes.types';
import { router } from '../../router/router';
import { ComponentConfig } from '../../types/components.types';
import { User } from '../../models/user.model';
import { dataApi } from '../../api/index.api';
import { dataService } from '../../services/index.service';
import { getHTMLElementById, getHTMLElementByClass } from '../../utils/dom.utils';

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
	private userFriends?: User[] | null = null;
	private userCell!: HTMLAnchorElement;
	private avatarImg!: HTMLImageElement;
	private nameCell!: HTMLElement;
	private statusCell!: HTMLElement;
	private levelCell!: HTMLElement;
	private profilePath!: string;
	private addFriendButton!: HTMLButtonElement;
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
	protected preRenderCheck(): void {
		super.preRenderCheck();
		this.loadTemplateDev();
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
		this.userFriends = await dataApi.getUserFriends(this.user!.id);
		this.userCell = getHTMLElementById('user-cell', this.container) as HTMLAnchorElement;
		this.avatarImg = getHTMLElementByClass('avatar-img', this.container) as HTMLImageElement;
		this.nameCell = getHTMLElementByClass('name-cell', this.container) as HTMLElement;
		this.statusCell = getHTMLElementByClass('status-cell', this.container) as HTMLElement;
		this.levelCell = getHTMLElementByClass('level-cell', this.container) as HTMLElement;
		this.profilePath = `/user/${this.user!.id}`;
		this.addFriendButton = getHTMLElementById('add-friend-button', this.container) as HTMLButtonElement;
		this.challengeButton = getHTMLElementById('challenge-button', this.container) as HTMLButtonElement;
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
		if (this.user!.id === this.currentUser!.id) {
			this.userCell.setAttribute('title', 'Your profile');
			this.avatarImg.setAttribute('alt', 'Your avatar');
		} else {
			this.userCell.setAttribute('title', `${this.user!.username}'s profile`);
			this.avatarImg.setAttribute('alt', `${this.user!.username}'s avatar`);
			this.challengeButton.classList.remove('hidden');
		}
		const isFriend = await dataService.isFriendWithCurrentUser(this.user!.id, this.userFriends);
		if (!isFriend && this.user!.id !== this.currentUser!.id) {
			this.addFriendButton.classList.remove('hidden');
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
	}

	/**
	 * Attribue les listeners.
	 * 
	 * - Attribue un listener au bloc avatar/username pour rediriger vers le profil.
	 */
	protected attachListeners(): void {
		this.userCell.addEventListener('click', this.handleUsercellClick);
	}

	/**
	 * Enlève les listeners.
	 */
	protected removeListeners(): void {
		this.userCell.removeEventListener('click', this.handleUsercellClick);
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
		this.loadTemplate(template);
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
}