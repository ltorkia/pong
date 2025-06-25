import { BaseComponent } from '../BaseComponent';
import { userManager } from '../../managers/UserManager';
import { User } from '../../types/store.types';
import { toggleClass } from '../../utils/navbar.utils';
import { shouldShowNavbar } from '../../utils/navbar.utils';
import { UserController } from '../../controllers/UserController';

export class NavbarComponent extends BaseComponent {
	private currentUser: User | null = null;
	private parentTemplate: string;
	private userController: UserController;

	constructor(container: HTMLElement, parentTemplate: string, userController: UserController) {
		// super() appelle le constructeur du parent BaseComponent
		// avec le container et le chemin du template HTML pour la page home
		super(container, '/components/common/navbar.component.html');
		this.parentTemplate = parentTemplate;
		this.userController = userController;
	}

	// async render(): Promise<void> {

	// 	// On ajoute un margin à la balise 'main' qui correspond à la hauteur de la navbar
	// 	const main = document.querySelector('main');
	// 	if (main) {
	// 		main.classList.add('mt-main');
	// 	}

	// 	// Injection de la navbar
	// 	let html = await this.loadComponent();

	// 	// Personnalisation de la navbar (lien profil avec l'ID utilisateur, notifs ?)
	// 	html = this.setProfileLink(html);
	// 	this.container.innerHTML = html;
	// }

	// async mount(): Promise<void> {
	// 	await this.loadUserData();

	// 	// On return si on est sur une page publique:
	// 	// si this.parentTemplate = login ou register -> pas de navbar.
	// 	// On clean la navbar pour qu'elle ne reste pas sur la prochaine page.
	// 	// Sinon on render et on attache les listeners
	// 	const showNavbar = shouldShowNavbar(this.parentTemplate);
	// 	if (!showNavbar) {
	// 		this.cleanup();
	// 	} else if (this.currentUser && showNavbar) {
	// 		await this.render();
	// 		this.bindEvents();
	// 	}
	// }

	async render(): Promise<void> {
		// si this.parentTemplate = page publique (login ou register) -> pas de navbar.
		// On clean la navbar pour qu'elle ne reste pas sur la prochaine page
		// et on return.
		const showNavbar = shouldShowNavbar(this.parentTemplate);
		if (!showNavbar) {
			await this.cleanup();
			return;
		}

		// De même si pas de current user: on clean la navbar.
		await this.loadUserData();
		if (!this.currentUser) {
			await this.cleanup();
			return;
		}

		// Sinon on render (charge et injecte le HTML),
		// on mount et on attache les listeners.
		let html = await this.loadComponent();
		this.container.innerHTML = html;
		await this.mount();
		this.attachListeners();
	}

	protected async mount(): Promise<void> {

		// On génère le lien du profil avec l'id du current user
		this.setNavLink('a[href="/profile"]', '/user/{userId}');

		// On ajoute un margin à la balise 'main'
		// qui correspond à la hauteur de la navbar
		const main = document.querySelector('main');
		if (main) {
			main.classList.add('mt-main');
		}
	}

	protected attachListeners(): void {
		const burgerBtn = this.container?.querySelector('#burger-btn') as HTMLElement | null;
		if (!burgerBtn) {
			console.warn('Bouton burger introuvable');
			return;
		}

		burgerBtn.addEventListener('click', () => this.handleBurgerMenu(burgerBtn));
		this.listenLogout();
	}

	private async loadUserData(): Promise<void> {
		try {
			this.currentUser = await userManager.loadOrRestoreUser();
			if (!this.currentUser || !this.currentUser.id) {
				return;
			}
			// this.updateUserDisplay();
		} catch (error) {
			console.error('Error loading user data:', error);
		}
	}

	private handleBurgerMenu(burgerBtn: HTMLElement): void {
		const navbarMenu = document.getElementById('navbar-menu') as HTMLElement;
		const icon = burgerBtn.querySelector('i');

		// On transforme les trois barres en X
		toggleClass(icon, 'fa-bars', 'fa-xmark', 'text-blue-300');
		// On affiche ou on cache le menu
		toggleClass(navbarMenu, 'show', 'hide');
	}

	/**
	 * Modifie dynamiquement le lien du profil dans la barre de navigation pour pointer vers la page de l'utilisateur connecté.
	 * Récupère l'état de connexion de l'utilisateur via loadOrRestoreUser()
	 */
	private setNavLink(selector: string, linkTemplate: string): void {
		const navLink = this.container.querySelector(selector) as HTMLAnchorElement | null;
		if (navLink) {
			// Si le lien contient un placeholder {userId}, on le remplace par l'ID du currentUser
			let link = linkTemplate;
			if (this.currentUser && this.currentUser.id && linkTemplate.includes('{userId}')) {
				link = linkTemplate.replace('{userId}', this.currentUser.id.toString());
			}
			navLink.href = link;
		}
	}

	/**
	 * Listener sur le bouton logout de la navbar
	 */
	private async listenLogout(): Promise<void> {
		const logoutLink = document.querySelector('a[href="/logout"]');
		if (logoutLink) {
			logoutLink.addEventListener('click', async (e) => {
				e.preventDefault();
				await this.userController.logoutController();
			});
		}
	}
}