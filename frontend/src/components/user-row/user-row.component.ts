// Pour hot reload Vite
import template from './user-row.component.html?raw'

import { BaseComponent } from '../base/base.component';
import { RouteConfig } from '../../types/routes.types';
import { ComponentConfig } from '../../types/components.types';
import { AVATARS_ROUTE_API } from '../../config/routes.config';
import { User } from '../../models/user.model';

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

	/**
	 * Méthode de montage du composant de la ligne d'utilisateur.
	 *
	 * Vérifie qu'un utilisateur est bien authentifié.
	 * En mode développement, utilise le hot-reload Vite pour charger
	 * le template HTML du composant. Ensuite, met à jour le contenu visuel
	 * de la ligne d'utilisateur avec les informations de l'utilisateur
	 * fourni, en ajustant l'avatar, le lien du nom d'utilisateur et le
	 * niveau (taux de victoire) si disponible.
	 *
	 * @returns {Promise<void>} Une promesse qui se résout lorsque le composant est monté.
	 */
	protected async mount(): Promise<void> {
		this.checkUserLogged();
		if (import.meta.env.DEV === true) {
			this.container.innerHTML = template;
			console.log(`[${this.constructor.name}] Hot-reload actif`);
		}

		const avatarImg = this.container.querySelector('.avatar-img') as HTMLImageElement;
		const usernameLink = this.container.querySelector('.username-link') as HTMLAnchorElement;
		const levelCell = this.container.querySelector('.level-cell') as HTMLElement;

		if (this.user) {
			if (avatarImg) {
				avatarImg.setAttribute('src', `${AVATARS_ROUTE_API}${this.user.avatar}`);
				avatarImg.setAttribute('alt', `${this.user.username}'s avatar`);
			}

			if (usernameLink) {
				usernameLink.setAttribute('href', `/user/${this.user.id}`);
				usernameLink.textContent = this.user.username;
			}

			if (levelCell) {
				if ('winRate' in this.user && this.user.winRate !== undefined) {
					levelCell.textContent = `Win rate: ${this.user.winRate}%`;
				} else {
					levelCell.textContent = 'No stats';
				}
			}
		}
	}
}