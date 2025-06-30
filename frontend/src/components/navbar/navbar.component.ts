// Pour hot reload Vite
import template from './navbar.component.html?raw'

import { BaseComponent } from '../base/base.component';
import { toggleClass } from '../../utils/dom.utils';
import { userService } from '../../services/user.service';
import { RouteConfig } from '../../types/routes.types';
import { ComponentConfig } from '../../types/components.types';
import { User } from '../../models/user.model';
import { userStore } from '../../stores/user.store';
import { getHTMLAnchorElement } from '../../utils/dom.utils';

export class NavbarComponent extends BaseComponent {
	protected routeConfig: RouteConfig;
	protected currentUser: User | null = null;
	protected profileLink?: string;

	constructor(routeConfig: RouteConfig, componentConfig: ComponentConfig, container: HTMLElement) {
		// super() appelle le constructeur du parent BaseComponent
		// avec le container et le chemin du component HTML pour la navbar
		super(componentConfig, container);
		
		this.routeConfig = routeConfig;
		this.currentUser = userStore.getCurrentUser();
	}

	protected async mount(): Promise<void> {
		if (import.meta.env.DEV === true) {
			// code exécuté uniquement en dev pour le hot reload Vite
			// des fichiers HTML qui sont dans src au lieu de public
			this.container.innerHTML = template;
			// console.log(this.componentPath, this.container.innerHTML);
			console.log(`[${this.constructor.name}] Hot-reload actif`);
		}

		// On génère le lien du profil avec l'id du current user
		this.profileLink = this.setNavLink('a[href="/profile"]', '/user/{userId}');

		// On met à jour le lien actif
		// const currentRoute = getRouteFromPath(this.parentTemplate);
		const currentRoute = this.routeConfig.path;
		this.updateNavigation(currentRoute);

		// On ajoute un margin à la balise 'main'
		// qui correspond à la hauteur de la navbar
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

	protected attachListeners(): void {
		const burgerBtn = this.container?.querySelector('#burger-btn') as HTMLElement | null;
		if (!burgerBtn) {
			console.warn('Bouton burger introuvable');
			return;
		}
		this.handleBurgerMenu(burgerBtn);
		this.listenLogout();
	}

	protected handleBurgerMenu(burgerBtn: HTMLElement): void {
		burgerBtn.addEventListener('click', () => {
			const navbarMenu = document.getElementById('navbar-menu') as HTMLElement;
			const icon = burgerBtn.querySelector('i');

			// On transforme les trois barres en X
			toggleClass(icon, 'fa-bars', 'fa-xmark', 'text-blue-300');
			// On affiche ou on cache le menu (responsive)
			toggleClass(navbarMenu, 'show', 'hide');
		});
	}

	/**
	 * Modifie dynamiquement des liens dans la barre de navigation.
	 * Modifie par exemple le lien du profil (/profile) dans la barre de navigation pour pointer vers la page de l'utilisateur connecté (/user/id).
	 * On utilise un placeholder {userId} qui va être remplacé par le vrai id de l'utilisateur.
	 */
	protected setNavLink(selector: string, linkTemplate: string): string {
		const navLink = getHTMLAnchorElement(selector, this.container);

		// Si le lien contient un placeholder {userId}, on le remplace par l'ID du currentUser
		let link = linkTemplate;
		if (this.currentUser && this.currentUser.id && linkTemplate.includes('{userId}')) {
			link = linkTemplate.replace('{userId}', this.currentUser.id.toString());
		}
		navLink.href = link;
		return link;
	}

	/**
	 * Listener sur le bouton logout de la navbar
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