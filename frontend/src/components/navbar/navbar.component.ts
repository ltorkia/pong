// Pour hot reload Vite
import template from './navbar.component.html?raw';

import { BaseComponent } from '../base/base.component';
import { authService, animationService, currentService } from '../../services/index.service';
import { RouteConfig } from '../../types/routes.types';
import { ComponentConfig } from '../../types/components.types';
import { getHTMLElementByClass } from '../../utils/dom.utils';
import { getHTMLElementById, getHTMLAnchorElement, getHTMLElementByTagName } from '../../utils/dom.utils';
import { ROUTE_PATHS, PROFILE_HTML_ANCHOR } from '../../config/routes.config';
import { DB_CONST } from '../../shared/config/constants.config';
import { notifService } from '../../services/index.service';

// ===========================================
// NAVBAR COMPONENT
// ===========================================
/**
 * Composant de la barre de navigation.
 *
 * Ce composant permet la navigation entre les différentes pages
 * de l'application. Il est injecté dans l'élément HTML avec l'id "navbar".
 * Un lien vers le profil de l'utilisateur actuel est inclus dans la barre de navigation.
 * La méthode publique `setActiveLink(route)` est appelée à chaque changement de route
 * par le service de routage pour mettre à jour visuellement le lien actif.
 */
export class NavbarComponent extends BaseComponent {
	private homeLogoLink!: HTMLElement;
	private homeLink!: HTMLElement;
	private burgerBtn!: HTMLElement;
	private navbarMenu!: HTMLElement;
	private navLinks!: NodeListOf<HTMLAnchorElement>;
	private profilePlaceholder: string;
	private profileLink!: string;
	private settingsLink!: HTMLAnchorElement;
	private icon!: HTMLElement;
	private logoutLink!: HTMLAnchorElement;
	private notifsBtn!: HTMLElement;
	public notifsCounter!: HTMLElement;
	public notifsWindow!: HTMLElement;
	private chatBtn!: HTMLElement;
	private chatWindow!: HTMLElement;
	private mainSection!: HTMLElement;

	/**
	 * Constructeur du composant de la navbar.
	 *
	 * Stocke la configuration de la route actuelle, la configuration du composant,
	 * et le container HTML.
	 *
	 * @param {RouteConfig} routeConfig La configuration de la route actuelle.
	 * @param {ComponentConfig} componentConfig La configuration du composant.
	 * @param {HTMLElement} container L'élément HTML qui sera utilisé comme conteneur pour le composant.
	 */
	constructor(routeConfig: RouteConfig, componentConfig: ComponentConfig, container: HTMLElement) {
		super(routeConfig, componentConfig, container);
		this.profilePlaceholder = '{userId}';
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
		return true;
	}

	/**
	 * Méthode de pré-rendering du composant de la navbar.
	 * 
	 * Stocke les éléments HTML utiles pour le fonctionnement du composant
	 * dans les propriétés de l'objet.
	 * 
	 * @returns {Promise<void>} Une promesse qui se résout lorsque les éléments HTML ont été stockés.
	 */
	protected async beforeMount(): Promise<void> {
		this.homeLogoLink = getHTMLElementById('pong-navbar', this.container);
		this.homeLink = this.container.querySelector('a[href="/"]') as HTMLAnchorElement;
		this.burgerBtn = getHTMLElementById('burger-btn', this.container);
		this.navbarMenu = getHTMLElementById('navbar-menu', this.container);
		this.icon = getHTMLElementByTagName('i', this.burgerBtn);
		this.navLinks = this.container.querySelectorAll('.navbar-content a[data-link]');
		this.logoutLink = getHTMLAnchorElement(ROUTE_PATHS.LOGOUT, this.container);
		this.profileLink = this.setNavLink(PROFILE_HTML_ANCHOR, `/user/${this.profilePlaceholder}`);
		this.settingsLink = getHTMLAnchorElement(ROUTE_PATHS.SETTINGS, this.container);
		this.notifsBtn = getHTMLElementById('notifs', this.container);
		this.notifsCounter = getHTMLElementByClass('notif-count', this.container);
		this.notifsWindow = getHTMLElementById('notifs-window', this.container);
		this.chatBtn = getHTMLElementById('chat', this.container);
		this.chatWindow = getHTMLElementById('chat-window', this.container);
		this.mainSection = getHTMLElementByTagName('main');
	}

	/**
	 * Méthode de montage du composant de la navbar.
	 * 
	 * Active le lien correspondant à la route actuelle.
	 * Ajoute la classe 'mt-main' à la section principale.
	 * Active l'animation de la navbar.
	 * 
	 * @returns {Promise<void>} Une promesse qui se résout lorsque le composant est monté.
	 */
	protected async mount(): Promise<void> {
		this.toggleSettingsLink();
		this.setActiveLink(this.routeConfig.path);
		this.mainSection.classList.add('mt-main');
	}

	/**
	 * Attribue les listeners aux éléments de la navbar.
	 * 
	 * - Attribue un listener au lien de logo de la navbar.
	 * - Attribue un listener au bouton burger pour le menu mobile.
	 * - Attribue un listener aux liens de navigation.
	 * - Attribue un listener au bouton de déconnexion.
	 */
	protected attachListeners(): void {
		this.homeLogoLink.addEventListener('click', this.handleHomeLogoClick);
		this.burgerBtn.addEventListener('click', this.handleBurgerClick);
		this.navLinks.forEach(link => {
			link.addEventListener('click', this.handleNavLinkClick);
		});
		this.notifsBtn.addEventListener('click', this.toggleNotifsMenu);
		this.chatBtn.addEventListener('click', this.toggleChatWindow);
		this.logoutLink.addEventListener('click', this.handleLogoutClick);
	}

	/**
	 * Enlève les listeners attribués aux éléments de la navbar.
	 *
	 * - Enlève le listener au lien de logo de la navbar.
	 * - Enlève le listener du bouton burger pour le menu mobile.
	 * - Enlève le listener aux liens de navigation.
	 * - Enlève le listener du bouton de déconnexion.
	 */
	protected removeListeners(): void {
		this.homeLogoLink.removeEventListener('click', this.handleHomeLogoClick);
		this.burgerBtn.removeEventListener('click', this.handleBurgerClick);
		this.navLinks.forEach(link => {
			link.removeEventListener('click', this.handleNavLinkClick);
		});
		this.notifsBtn.removeEventListener('click', this.toggleNotifsMenu);
		this.chatBtn.removeEventListener('click', this.toggleChatWindow);
		this.logoutLink.removeEventListener('click', this.handleLogoutClick);
		notifService.cleanupListeners();
	}

	// ===========================================
	// METHODES PUBLICS
	// ===========================================

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
				|| (route === ROUTE_PATHS.PROFILE && linkPath === this.profileLink)) {
				anchor.classList.add('active');
			}
		});
	}
	
	/**
	 * Animate la barre de navigation hors de l'écran.
	 * 
	 * - Définit la propriété "destroy" de la configuration du composant à true.
	 * - Définit la propriété "animateNavbarOut" du service d'animation à true.
	 * - Définit la propriété "animateHomebarIn" du service d'animation à true.
	 */
	public destroy(): void {
		if (!currentService.getCurrentUser()) {
			this.componentConfig.destroy = true;
			animationService.animateNavbarOut = true;
			animationService.animateHomebarIn = true;
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
		this.loadTemplate(template);
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
	private setNavLink(hrefValue: string, linkTemplate: string): string {
		const navLink = getHTMLAnchorElement(hrefValue, this.container);
		let link = linkTemplate;
		if (this.currentUser && this.currentUser.id && linkTemplate.includes(this.profilePlaceholder)) {
			link = linkTemplate.replace(this.profilePlaceholder, this.currentUser.id.toString());
		}
		navLink.href = link;
		return link;
	}

	/**
	 * Si l'utilisateur est enregistré via Google, cache le lien "Settings" dans la navbar.
	 * Les utilisateurs enregistrés via Google n'ont pas accces aux parametres de l'application.
	 */
	private toggleSettingsLink(): void {
		if (this.currentUser!.registerFrom === DB_CONST.USER.REGISTER_FROM.GOOGLE) {
			this.settingsLink.setAttribute("style", "display: none");
		}
	}

	/**
	 * Met à jour l'icône du burger menu.
	 * 
	 * Si le menu est ouvert, remplace l'icône "fa-bars" par "fa-xmark"
	 * et ajoute la classe "text-blue-300".
	 * 
	 * Si le menu est fermé, remplace l'icône "fa-xmark" par "fa-bars"
	 * et supprime la classe "text-blue-300".
	 */
	private updateBurgerIcon(): void {
		if (this.navbarMenu.classList.contains('show')) {
			this.icon.classList.remove('fa-bars');
			this.icon.classList.add('fa-xmark', 'text-blue-300');
		} else {
			this.icon.classList.remove('fa-xmark', 'text-blue-300');
			this.icon.classList.add('fa-bars');
		}
	}

	/**
	 * Handler pour basculer la visibilité d'un élément.
	 * 
	 * Identifie les autres éléments à fermer (navbar, notifs, chat)
	 * et les ferme si l'élément sélectionné s'ouvre.
	 * 
	 * @param {HTMLElement} element L'élément à basculer.
	 */
	private toggleWindow(element: HTMLElement): void {
		const otherElements: any[] = [this.notifsWindow, this.chatWindow, this.navbarMenu]
			.filter(elm => elm !== element);
		
		const isOpening = element.classList.contains('hide');
		if (isOpening) {
			otherElements.forEach(elm => {
				if (elm.classList.contains('show')) {
					elm.classList.remove('show');
					elm.classList.add('hide');
					if (elm === this.notifsWindow) 
						elm.classList.remove('scrolled');
				}
			});
			element.classList.remove('hide');
			if (element === this.notifsWindow) {
				this.notifsWindow.classList.remove('scrolled');
				this.notifsWindow.addEventListener('transitionend', this.onNotifsTransitionEnd, { once: true });
			}
			element.classList.add('show');
		} else {
			element.classList.remove('show');
			element.classList.add('hide');
			if (element === this.notifsWindow)
				this.notifsWindow.classList.remove('scrolled');
		}
		this.updateBurgerIcon();
	}

	/**
	 * Handler pour la transition de la fenêtre des notifications.
	 * Ajoute le scroll uniquement si la fenêtre est toujours ouverte.
	 * (empêche l'apparition de la barre de scroll pendant la transition)
	 * 
	 * @param {TransitionEvent} ev L'objet de transition.
	 */
	private onNotifsTransitionEnd = (ev: TransitionEvent) => {
		if (ev.propertyName !== 'max-height') 
			return;
		if (this.notifsWindow.classList.contains('show')) {
			this.notifsWindow.classList.add('scrolled');
		}
	};

	/**
	 * Ferme toutes les fenêtres de la navbar (menu, notifs, chat).
	 */
	private closeAllWindows(): void {
		[this.navbarMenu, this.notifsWindow, this.chatWindow].forEach(window => {
			if (!window.classList.contains('hide')) {
				window.classList.remove('show');
				window.classList.add('hide');
			}
		});
		this.updateBurgerIcon();
	}

	// ===========================================
	// LISTENER HANDLERS
	// ===========================================

	/**
	 * Listener sur le logo de la navbar.
	 * 
	 * Gère le clic sur le logo de la navbar pour rediriger vers la page d'accueil.
	 * 
	 * @param {MouseEvent} event L'événement de clic.
	 */
	private handleHomeLogoClick = (event: MouseEvent): void => {
		event.preventDefault();
		this.homeLink.click();
		this.closeAllWindows();
	};

	/**
	 * Bascule le menu burger pour la navigation mobile.
	 *
	 * Handler pour ajouter un listener d'événement de clic au bouton burger qui:
	 * - Fait basculer l'icône entre le symbole 'bars' et 'x'.
	 * - Fait basculer la visibilité du menu de la navbar.
	 * 
	 * @param {MouseEvent} event L'événement de clic.
	 */
	private handleBurgerClick = (event: MouseEvent): void => {
		this.toggleWindow(this.navbarMenu);
	}

	/**
	 * Handler qui gère le clic sur un lien de la navbar en mode tablet/mobile.
	 * 
	 * @param {MouseEvent} event L'événement de clic.
	 */
	private handleNavLinkClick = (event: MouseEvent): void => {
		this.closeAllWindows();
	};

	/**
	 * Bascule la visibilité de la fenêtre des notifications.
	 *
	 * Handler qui gère le clic sur le bouton des notifications.
	 * La méthode toggleWindow est appelée pour afficher ou masquer la fenêtre.
	 * Si la fenêtre est affichée, toutes les notifications sont rendues visibles
	 * et le compteur de notifications est mis à jour.
	 * 
	 * @param {MouseEvent} event L'événement de clic.
	 * @returns {Promise<void>} Une promesse qui se résout lorsque la fenêtre est basculée.
	 */
	private toggleNotifsMenu = async (event: MouseEvent): Promise<void> => {
		const allNotifs = this.notifsWindow.querySelectorAll('.notif-item');
		const defaultNotif = this.notifsWindow.querySelector('.default-notif');
		if (allNotifs && allNotifs.length > 0 && defaultNotif) {
			defaultNotif.remove();
		}
		const allNewNotifs = this.notifsWindow.querySelectorAll('.new-notif');
		this.toggleWindow(this.notifsWindow);
		if (this.notifsWindow.classList.contains('hide') 
			&& allNewNotifs && allNewNotifs.length > 0) {
			for (const notif of allNewNotifs) {
				notif.classList.remove('new-notif');
				const notifId = Number(notif.id.replace("notif-", ""));
				await notifService.markAsRead(notifId);
			}
			notifService.updateNotifsCounter();
		}
	}

	/**
	 * Bascule la visibilité de la fenêtre de chat.
	 * 
	 * Alterne entre les classes "show" et "hide" pour afficher ou masquer la fenêtre de chat.
	 */
	private toggleChatWindow = async (event: Event): Promise<void> => {
		this.toggleWindow(this.chatWindow);
	}

	/**
	 * Listener sur le bouton logout de la navbar.
	 * 
	 * Lors d'un clic sur le bouton logout, on annule l'événement de navigation,
	 * on enclenche la destruction de la navbar, on active sa transition de sortie,
	 * et on appelle la méthode logout() du authService pour déconnecter l'utilisateur.
	 * 
	 * @param {MouseEvent} event L'événement de clic.
	 * @returns {Promise<void>} Promesse qui se résout lorsque l'opération est terminée.
	 */
	private handleLogoutClick = async (event: MouseEvent): Promise<void> => {
		event.preventDefault();
		await authService.logout();
	};
}