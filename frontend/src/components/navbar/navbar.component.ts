// Pour hot reload Vite
import template from './navbar.component.html?raw'

import { BaseComponent } from '../base/base.component';
import { userStore } from '../../stores/user.store';
import { uiStore } from '../../stores/ui.store';
import { userService } from '../../services/services';
import { RouteConfig } from '../../types/routes.types';
import { ComponentConfig } from '../../types/components.types';
import { routePaths, profileHTMLAnchor } from '../../config/routes.config';
import { toggleClass } from '../../utils/dom.utils';
import { getHTMLElementById, getHTMLAnchorElement, getHTMLElementByTagName } from '../../utils/dom.utils';

// ===========================================
// NAVBAR COMPONENT
// ===========================================
/**
 * Composant de la navbar.
 *
 * La navbar permet de naviguer entre les différentes pages
 * de l'application. Elle est injectée dans la balise HTML qui a l'id "navbar".
 * La navbar injecte un lien vers le profil de l'utilisateur actuel.
 * La méthode publique `setActiveLink(route)` est appelée à chaque changement de route
 * par le service de routing pour la mise à jour visuelle du lien actif.
 */
export class NavbarComponent extends BaseComponent {
	protected profilePlaceholder: string;
	protected profileLink?: string;
	protected burgerBtn?: HTMLElement;
	protected logoutLink?: HTMLAnchorElement;

	/**
	 * Constructeur du composant de la navbar.
	 *
	 * Au moment de la construction, le composant stocke la configuration de la route
	 * actuelle et l'utilisateur actuel dans ses propriétés.
	 *
	 * @param {RouteConfig} routeConfig La configuration de la route actuelle.
	 * @param {ComponentConfig} componentConfig La configuration du composant.
	 * @param {HTMLElement} container L'élément HTML qui sera utilisé comme conteneur pour le composant.
	 */
	constructor(routeConfig: RouteConfig, componentConfig: ComponentConfig, container: HTMLElement) {
		super(routeConfig, componentConfig, container);
		this.currentUser = userStore.getCurrentUser();
		this.profilePlaceholder = '{userId}';
	}

	/**
	 * Met à jour la navigation active sur la navbar.
	 * Méthode publique utilisée par routing.service.ts
	 * 
	 * - Sélectionne tous les liens avec l'attribut data-link.
	 * - Supprime la classe active de tous les liens.
	 * - Compare leur pathname avec celui passé en paramètre.
	 * - Ajoute la classe active au lien correspondant.
	 * 
	 * Permet de styliser le lien actif dans la navbar.
	 * @param {string} route Le pathname de la route actuelle.
	 */
	public setActiveLink(route: string): void {
		const navLinks = this.container.querySelectorAll('.navbar-content a[data-link]') as NodeListOf<HTMLElement>;
		navLinks.forEach(link => {
			const anchor = link as HTMLAnchorElement;
			anchor.classList.remove('active');
			const linkPath = new URL(anchor.href).pathname;
			if (linkPath === route
				|| (route === routePaths.profile && linkPath === this.profileLink)) {
				anchor.classList.add('active');
			}
		});
	}

	/**
	 * Méthode de montage du composant de la navbar.
	 * 
	 * Vérifie qu'un utilisateur est connecté si la page est privée.
	 *
	 * En mode DEV, charge le template HTML du composant en hot-reload
	 * via `template` (importé en tant que raw string par Vite).
	 * Ensuite, génère le lien du profil en remplaçant le placeholder {userId}
	 * par l'id du current user.
	 * Met à jour le lien actif de la navigation au premier chargement de la page.
	 * Enfin, ajoute un margin à la balise 'main' qui correspond à la hauteur
	 * de la navbar.
	 * 
	 * @returns {Promise<void>} Une promesse qui se résout quand le composant est monté.
	 */
	protected async mount(): Promise<void> {
		this.checkUserLogged();
		if (import.meta.env.DEV === true) {
			this.container.innerHTML = template;
			console.log(`[${this.constructor.name}] Hot-reload actif`);
		}
		this.profileLink = this.setNavLink(profileHTMLAnchor, `/user/${this.profilePlaceholder}`);
		this.setActiveLink(this.routeConfig.path);
		const main = document.querySelector('main');
		if (main) {
			main.classList.add('mt-main');
		}
	}

	/**
	 * Modifie dynamiquement un lien dans la barre de navigation.
	 * Modifie par exemple le lien du profil (/profile) dans la barre de navigation
	 * pour pointer vers la page de l'utilisateur connecté (/user/id).
	 * On utilise un placeholder {userId} qui va être remplacé par le vrai id de l'utilisateur.
	 * 
	 * @param {string} hrefValue - Valeur de l'attribut href du lien à chercher.
	 * @param {string} linkTemplate - Le template de lien qui sera modifié.
	 * @returns {string} Le lien modifié.
	 */
	protected setNavLink(hrefValue: string, linkTemplate: string): string {
		const navLink = getHTMLAnchorElement(hrefValue, this.container);
		let link = linkTemplate;
		if (this.currentUser && this.currentUser.id && linkTemplate.includes(this.profilePlaceholder)) {
			link = linkTemplate.replace(this.profilePlaceholder, this.currentUser.id.toString());
		}
		navLink.href = link;
		return link;
	}

	/**
	 * Attribue les listeners aux éléments de la navbar.
	 * 
	 * - Attribue un listener au bouton burger pour le menu mobile.
	 * - Attribue un listener au bouton de déconnexion.
	 */
	protected attachListeners(): void {
		this.burgerBtn = getHTMLElementById('burger-btn', this.container);
		this.logoutLink = getHTMLAnchorElement(routePaths.logout, this.container);

		this.burgerBtn.addEventListener('click', this.handleBurgerClick);
		this.logoutLink.addEventListener('click', this.handleLogoutClick);
	}

	/**
	 * Basculle le menu burger pour la navigation mobile.
	 *
	 * Handler pour ajouter un listener d'événement de clic au bouton burger qui:
	 * - Fait basculer l'icône entre le symbole 'bars' et 'x'.
	 * - Fait basculer la visibilité du menu de la navbar.
	 * 
	 * @param {MouseEvent} event L'événement de clic.
	 */
	protected handleBurgerClick = (event: MouseEvent): void => {
		const navbarMenu = getHTMLElementById('navbar-menu', this.container);
		const icon = getHTMLElementByTagName('i', this.burgerBtn);
		toggleClass(icon, 'fa-bars', 'fa-xmark', 'text-blue-300');
		toggleClass(navbarMenu, 'show', 'hide');
	}

	/**
	 * Listener sur le bouton logout de la navbar.
	 * 
	 * Lors d'un clic sur le bouton logout, on annule l'événement de navigation,
	 * on enclenche la destruction de la navbar, on active sa transition de sortie,
	 * et on appelle la méthode logoutUser() du UserService pour déconnecter l'utilisateur.
	 * 
	 * @param {MouseEvent} event L'événement de clic.
	 * @returns {Promise<void>} Promesse qui se résout lorsque l'opération est terminée.
	 */
	protected handleLogoutClick = async (event: MouseEvent): Promise<void> => {
		event.preventDefault();
		this.componentConfig.destroy = true;
		uiStore.animateNavbarOut = true;
		await userService.logoutUser();
	};

	/**
	 * Enlève les listeners attribués aux éléments de la navbar.
	 *
	 * - Enlève le listener du bouton burger pour le menu mobile.
	 * - Enlève le listener du bouton de déconnexion.
	 */
	protected removeListeners(): void {
		this.burgerBtn?.removeEventListener('click', this.handleBurgerClick);
		this.logoutLink?.removeEventListener('click', this.handleLogoutClick);
	}
}