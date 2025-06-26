import { BaseComponent } from '../BaseComponent';
import { toggleClass } from '../../utils/dom.utils';
import { shouldShowNavbar } from '../../utils/navbar.utils';
import { UserController } from '../../controllers/UserController';
import { OptionalUser } from '../../types/user.types';

export class NavbarComponent extends BaseComponent {
	private parentTemplate: string;
	private userController: UserController;

	// TODO: Ajouter les listeners popstate ici ???

	constructor(container: HTMLElement, parentTemplate: string, userController: UserController, currentUser: OptionalUser) {
		// super() appelle le constructeur du parent BaseComponent
		// avec le container et le chemin du component HTML pour la navbar
		super(container, '/components/common/navbar.component.html');
		this.parentTemplate = parentTemplate;
		this.userController = userController;
		this.currentUser = currentUser;
	}

	protected async beforeMount(): Promise<void> {
		// si this.parentTemplate = page publique (login ou register) -> pas de navbar.
		// On clean la navbar pour qu'elle ne reste pas sur la prochaine page
		// et on return.
		const showNavbar = shouldShowNavbar(this.parentTemplate);
		if (!showNavbar) {
			this.shouldRender = false;
		}
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
		this.handleBurgerMenu(burgerBtn);
		this.listenLogout();
	}

	private handleBurgerMenu(burgerBtn: HTMLElement): void {
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
}