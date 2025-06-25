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

	async render(): Promise<void> {

		// On ajoute un margin à la balise 'main' qui correspond à la hauteur de la navbar
		const main = document.querySelector('main');
		if (main) {
			main.classList.add('mt-main');
		}

		// Injection de la navbar
		let html = await this.loadComponent();

		// Personnalisation de la navbar (lien profil avec l'ID utilisateur, notifs ?)
		html = this.setProfileLink(html);
		this.container.innerHTML = html;
	}

	async mount(): Promise<void> {
		await this.loadUserData();

		// On return si on est sur une page publique:
		// si this.parentTemplate = login ou register -> pas de navbar.
		// On clean la navbar pour qu'elle ne reste pas sur la prochaine page.
		// Sinon on render et on attache les listeners
		const showNavbar = shouldShowNavbar(this.parentTemplate);
		if (!showNavbar) {
			this.cleanup();
		} else if (this.currentUser && showNavbar) {
			await this.render();
			this.bindEvents();
		}
	}

	private bindEvents(): void {
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
	private setProfileLink(navbarComponent: string): string {
		const profilePath = this.currentUser ? `/user/${this.currentUser.id}` : '#';
		return navbarComponent.replace(/\{\{profilePath\}\}/g, profilePath);
	}

	/**
	 * Listener sur le bouton logout de la navbar
	 */
	protected async listenLogout(): Promise<void> {
		const logoutLink = document.querySelector('a[href="/logout"]');
		if (logoutLink) {
			logoutLink.addEventListener('click', async (e) => {
				e.preventDefault();
				await this.userController.logoutController();
			});
		}
	}
}