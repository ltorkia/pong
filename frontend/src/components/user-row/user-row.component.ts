// Pour hot reload Vite
import template from './user-row.component.html?raw'

import { BaseComponent } from '../base/base.component';
import { RouteConfig } from '../../types/routes.types';
import { ComponentConfig } from '../../types/components.types';
import { dataService, friendService, eventService } from '../../services/index.service';
import { getHTMLElementByClass, userRowsUtils } from '../../utils/dom.utils';
import { User } from '../../shared/models/user.model';
import { Friend } from '../../shared/models/friend.model';
import { dataApi } from '../../api/index.api';
import { EVENTS } from '../../shared/config/constants.config';
import { router } from '../../router/router';

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
	protected friend?: Friend | null = null;
	public userline!: HTMLDivElement;
	private avatarImg!: HTMLImageElement;
	private nameCell!: HTMLElement;
	private statusCell!: HTMLElement;
	private levelCell!: HTMLElement;
	private winrate!: HTMLElement;
	private profileButton!: HTMLElement;
	private logCell!: HTMLElement;
	private challengeButton!: HTMLButtonElement;
	private boundUpdateHandler?: (data: any) => Promise<void>;

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
		const isPreRenderChecked = await super.preRenderCheck();
		if (!isPreRenderChecked)
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
		this.user = await dataApi.getUserStats(this.user!.id);
		this.userline = getHTMLElementByClass('user-line', this.container) as HTMLDivElement;
		this.avatarImg = getHTMLElementByClass('avatar-img', this.container) as HTMLImageElement;
		this.nameCell = getHTMLElementByClass('name-cell', this.container) as HTMLElement;
		this.statusCell = getHTMLElementByClass('status-cell', this.container) as HTMLElement;
		this.levelCell = getHTMLElementByClass('level-cell', this.container) as HTMLElement;
		this.winrate = getHTMLElementByClass('winrate-cell .winrate', this.levelCell) as HTMLElement;
		this.profileButton = getHTMLElementByClass('profile-button', this.levelCell) as HTMLElement;
		this.logCell = getHTMLElementByClass('log-cell', this.container) as HTMLElement;
		this.challengeButton = getHTMLElementByClass('challenge-button', this.container) as HTMLButtonElement;

        friendService.setFriendPageSettings(this.user!, this.container);
        userRowsUtils.set(this.routeConfig!.path, this.user!.id, this.userline);

        // S'abonner aux mises à jour pour cet utilisateur
        this.boundUpdateHandler = async (data: { userId: number }) => {
            if (data.userId === this.user!.id) {
                await this.updateButtons();
            }
        };
        eventService.on(EVENTS.FRIEND_UPDATED, this.boundUpdateHandler);
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
		const userAvatar = await dataService.getUserAvatarURL(this.user!);
		this.avatarImg.setAttribute('src', userAvatar);
		this.nameCell.textContent = this.user!.username;
		if (this.user!.id !== this.currentUser!.id)
			this.statusCell.innerHTML = dataService.showStatusLabel(this.user!);
		friendService.setFriendLogo();
		this.winrate.textContent = `${this.user!.winRate}%`;
		if (this.user!.id !== this.currentUser!.id) {
			const logDate = dataService.showLogDate(this.user!);
			if (logDate)
				this.logCell.innerHTML = logDate;
		}
		const element = userRowsUtils.get(this.routeConfig.path, this.user!.id) as HTMLDivElement;
		friendService.setFriendPageSettings(this.user, element);
		await friendService.toggleFriendButton();
		friendService.setButtonDataAttribut();
	}

	/**
	 * Attribue les listeners.
	 * 
	 * - Attribue un listener au bloc avatar/username pour rediriger vers le profil.
	 */
	protected attachListeners(): void {
		this.profileButton.addEventListener('click', this.handleProfileClick);
		this.challengeButton.addEventListener('click', this.handleChallengeClick);
		friendService.attachFriendButtonListeners();
	}

	/**
	 * Enlève les listeners.
	 */
	protected removeListeners(): void {
		this.profileButton.removeEventListener('click', this.handleProfileClick);
		this.challengeButton.removeEventListener('click', this.handleChallengeClick);
		friendService.removeFriendButtonListeners();
	}

	// ===========================================
	// METHODES PRIVATES
	// ===========================================

    private async updateButtons(): Promise<void> {
        console.log(`[UserRowComponent] Mise à jour des boutons pour ${this.user!.username}`);
        const element = userRowsUtils.get(this.routeConfig.path, this.user!.id) as HTMLDivElement;
        friendService.setFriendPageSettings(this.user, element);
        await friendService.toggleFriendButton();
        friendService.setButtonDataAttribut();
    }

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

	public handleProfileClick = async (event: Event): Promise<void> => {
		event.preventDefault();
		await router.navigate(`/user/${this.user!.id}`);
	};

	private handleChallengeClick = async (event: Event): Promise<void> => {
		event.preventDefault();
		await friendService.challengeClick(event);
	}

	// ===========================================
	// CLEANUP
	// ===========================================

    public async cleanup(): Promise<void> {
        if (this.boundUpdateHandler) {
            eventService.off(EVENTS.FRIEND_UPDATED, this.boundUpdateHandler);
            this.boundUpdateHandler = undefined;
        }
        await super.cleanup();
        friendService.cleanup();
    }
}