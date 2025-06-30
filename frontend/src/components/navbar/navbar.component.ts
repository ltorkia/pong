// Pour hot reload Vite
import template from './navbar.component.html?raw'

import { BaseComponent } from '../base/base.component';
import { RouteConfig } from '../../types/routes.types';
import { ComponentConfig } from '../../types/components.types';
import { User } from '../../models/user.model';
import { userStore } from '../../stores/user.store';
import { userService } from '../../services/services';
import { toggleClass } from '../../utils/dom.utils';
import { getHTMLElementById, getHTMLAnchorElement } from '../../utils/dom.utils';

// ===========================================
// NAVBAR COMPONENT
// ===========================================
/**
 * Composant de la navbar.
 *
 * La navbar permet de naviguer entre les différentes pages
 * de l'application. Elle est injectée dans la balise HTML qui a l'id "navbar".
 * La navbar injecte un lien vers le profil de l'utilisateur actuel.
 *
 * La navbar est définie par un template HTML qui est injecté dans la page
 * par le composant. Le template HTML est défini dans le fichier
 * ./navbar.component.html.
 */
export class NavbarComponent extends BaseComponent {
	protected routeConfig: RouteConfig;
	protected currentUser: User | null = null;
	protected profileLink?: string;

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
		super(componentConfig, container);
		
		this.routeConfig = routeConfig;
		this.currentUser = userStore.getCurrentUser();
	}

	/**
	 * Méthode de montage du composant de la navbar.
	 *
	 * En mode DEV, charge le template HTML du composant en hot-reload
	 * via `template` (importé en tant que raw string par Vite).
	 *
	 * Ensuite, génère le lien du profil en remplaçant le placeholder {userId}
	 * par l'id du current user.
	 *
	 * Enfin, met à jour le lien actif en fonction de la route actuelle
	 * et ajoute un margin à la balise 'main' qui correspond à la hauteur
	 * de la navbar.
	 * 
	 * @returns {Promise<void>} Une promesse qui se résout quand le composant est monté.
	 */
	protected async mount(): Promise<void> {
		if (import.meta.env.DEV === true) {
			this.container.innerHTML = template;
			console.log(`[${this.constructor.name}] Hot-reload actif`);
		}
		this.profileLink = this.setNavLink('a[href="/profile"]', '/user/{userId}');

		const currentRoute = this.routeConfig.path;
		this.updateNavigation(currentRoute);

		const main = document.querySelector('main');
		if (main) {
			main.classList.add('mt-main');
		}
	}

	/**
	 * Met à jour la navigation active sur la navbar.
	 * 
	 * - Sélectionne tous les liens avec l'attribut data-link.
	 * - Supprime la classe active de tous les liens.
	 * - Compare leur pathname avec celui passé en paramètre.
	 * - Ajoute la classe active au lien correspondant.
	 * 
	 * Permet de styliser le lien actif dans la navbar.
	 * @param {string} route Le pathname de la route actuelle.
	 */
	protected updateNavigation(route: string): void {
		const navLinks = document.querySelectorAll('.navbar-content a[data-link]') as NodeListOf<HTMLElement>;
		navLinks.forEach(link => {
			const anchor = link as HTMLAnchorElement;
			anchor.classList.remove('active');
			const linkPath = new URL(anchor.href).pathname;
			if (linkPath === route
				|| route === '/user/:id' && linkPath === this.profileLink) {
				anchor.classList.add('active');
			}
		});
	}

	/**
	 * Attribue les listeners aux éléments de la navbar.
	 * 
	 * - Attribue un listener au bouton burger pour le menu mobile.
	 * - Attribue un listener au bouton de déconnexion.
	 */
	protected attachListeners(): void {
		const burgerBtn = getHTMLElementById('burger-btn', this.container);
		this.handleBurgerMenu(burgerBtn);
		this.listenLogout();
	}

	/**
	 * Basculle le menu burger pour la navigation mobile.
	 *
	 * Ajoute un listener d'événement de clic au bouton burger qui:
	 * - Fait basculer l'icône entre le symbole 'bars' et 'x'.
	 * - Fait basculer la visibilité du menu de la navbar.
	 *
	 * @param {HTMLElement} burgerBtn - L'élément bouton qui déclenche le basculement du menu.
	 */
	protected handleBurgerMenu(burgerBtn: HTMLElement): void {
		burgerBtn.addEventListener('click', () => {
			const navbarMenu = document.getElementById('navbar-menu') as HTMLElement;
			const icon = burgerBtn.querySelector('i');
			toggleClass(icon, 'fa-bars', 'fa-xmark', 'text-blue-300');
			toggleClass(navbarMenu, 'show', 'hide');
		});
	}

	/**
	 * Modifie dynamiquement un lien dans la barre de navigation.
	 * Modifie par exemple le lien du profil (/profile) dans la barre de navigation
	 * pour pointer vers la page de l'utilisateur connecté (/user/id).
	 * On utilise un placeholder {userId} qui va être remplacé par le vrai id de l'utilisateur.
	 * 
	 * @param {string} selector - Le sélecteur CSS du lien à modifier.
	 * @param {string} linkTemplate - Le template de lien qui sera modifié.
	 * @returns {string} Le lien modifié.
	 */
	protected setNavLink(selector: string, linkTemplate: string): string {
		const navLink = getHTMLAnchorElement(selector, this.container);
		let link = linkTemplate;
		if (this.currentUser && this.currentUser.id && linkTemplate.includes('{userId}')) {
			link = linkTemplate.replace('{userId}', this.currentUser.id.toString());
		}
		navLink.href = link;
		return link;
	}

	/**
	 * Listener sur le bouton logout de la navbar.
	 * 
	 * Lors d'un clic sur le bouton logout, on annule l'événement de navigation
	 * et on appelle la méthode logoutUser() du UserService pour déconnecter l'utilisateur.
	 * 
	 * @returns {Promise<void>} Promesse qui se résout lorsque l'opération est terminée.
	 */
	protected async listenLogout(): Promise<void> {
		const logoutLink = document.querySelector('a[href="/logout"]');
		if (logoutLink) {
			logoutLink.addEventListener('click', async (e) => {
				e.preventDefault();
				await userService.logoutUser();
			});
		}
	}
}