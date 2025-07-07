import { BasePage } from './base.page';
import { RouteConfig } from '../types/routes.types';
import { userService } from '../services/services';
import { getHTMLElementById } from '../utils/dom.utils';

// ===========================================
// REGISTER PAGE
// ===========================================
/**
 * La page d'inscription.
 * 
 * Gère la page d'inscription en ajouter des gestionnaires d'événement.
 */
export class RegisterPage extends BasePage {
	protected form!: HTMLFormElement;

	/**
	 * Constructeur de la page d'inscription.
	 *
	 * @param {RouteConfig} config - La configuration de la route.
	 */
	constructor(config: RouteConfig) {
		super(config);
	}

	/**
	 * Méthode de montage de la page d'inscription.
	 *
	 * Initialise le bouton de connexion Google en appelant la méthode
	 * `initGoogleSignIn()` du service d'authentification.
	 *
	 * @returns {Promise<void>} Une promesse qui se résout lorsque le bouton
	 * de connexion Google est initialisé.
	 */
	protected async mount(): Promise<void> {
		userService.initGoogleSignIn();
	}

	/**
	 * Ajoute les gestionnaires d'événement à la page d'inscription.
	 *
	 * Attribue un gestionnaire d'événement pour la soumission du formulaire
	 * d'inscription, qui est géré par la méthode handleRegisterSubmit.
	 */
	protected attachListeners(): void {
		this.form = getHTMLElementById('register-form') as HTMLFormElement;
		this.form.addEventListener('submit', this.handleRegisterSubmit);
	}

	/**
	 * Gestionnaire pour la soumission du formulaire d'inscription.
	 *
	 * - Empêche le comportement par défaut de soumission HTML.
	 * - Extrait les données du formulaire.
	 * - Appelle le service d'authentification pour enregistrer l'utilisateur.
	 *
	 * @param {Event} event L'événement de soumission du formulaire.
	 */
	protected handleRegisterSubmit = async (event: Event): Promise<void> => {
		event.preventDefault();
		const formData = new FormData(this.form);
		const data = Object.fromEntries(formData.entries()) as Record<string, string>;
		await userService.registerUser(data);
	};

	/**
	 * Supprime les gestionnaires d'événement ajoutés par la page d'inscription.
	 *
	 * Supprime le gestionnaire d'événement pour la soumission du formulaire
	 * d'inscription.
	 */
	protected removeListeners(): void {
		this.form.removeEventListener('submit', this.handleRegisterSubmit);
	}
}
