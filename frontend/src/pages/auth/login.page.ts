import { BasePage } from '../base/base.page';
import { RouteConfig } from '../../types/routes.types';
import { userService } from '../../services/services';
import { getHTMLElementById } from '../../utils/dom.utils';

// ===========================================
// LOGIN PAGE
// ===========================================
/**
 * La page de connexion, qui permet à un utilisateur de se connecter.
 *
 * La page de connexion est une page de base qui se charge de la connexion
 * d'un utilisateur. Elle interagit avec le service d'authentification pour
 * effectuer la connexion.
 */
export class LoginPage extends BasePage {
	protected form!: HTMLFormElement;

	/**
	 * Constructeur de la page de connexion.
	 *
	 * Initialise la page de connexion avec la configuration de route fournie.
	 *
	 * @param {RouteConfig} config La configuration complète de la route, 
	 * qui inclut les informations nécessaires pour initialiser la page.
	 */
	constructor(config: RouteConfig) {
		super(config);
	}

	/**
	 * Ajoute les gestionnaires d'événement à la page de connexion.
	 *
	 * Ajoute un gestionnaire d'événement pour la soumission du formulaire
	 * de connexion, qui est géré par la méthode handleLoginSubmit.
	 */
	protected attachListeners(): void {
		this.form = getHTMLElementById('login-form') as HTMLFormElement;
		this.form.addEventListener('submit', this.handleLoginSubmit);
	}

	/**
	 * Gestionnaire pour la soumission du formulaire de connexion.
	 *
	 * - Empêche le comportement par défaut de soumission HTML.
	 * - Extrait les données du formulaire.
	 * - Appelle le service d'authentification pour connecter l'utilisateur.
	 *
	 * @param {Event} event L'événement de soumission du formulaire.
	 */
	protected handleLoginSubmit = async (event: Event): Promise<void> => {
		event.preventDefault();
		const formData = new FormData(this.form);
		const data = Object.fromEntries(formData.entries()) as Record<string, string>;
		await userService.loginUser(data);
	};

	/**
	 * Supprime les gestionnaires d'événement ajoutés par la page de connexion.
	 *
	 * Supprime le gestionnaire d'événement pour la soumission du formulaire
	 * de connexion.
	 */
	protected removeListeners(): void {
		this.form.removeEventListener('submit', this.handleLoginSubmit);
	}
}
