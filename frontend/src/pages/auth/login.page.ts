import { BasePage } from '../base/base.page';
import { RouteConfig } from '../../types/routes.types';
import { authService, googleService } from '../../services/index.service';
import { TwofaModalComponent } from '../../components/twofa-modal/twofa-modal.component';
import { ComponentConfig } from '../../types/components.types';
import { PAGE_NAMES } from '../../config/routes.config';
import { COMPONENT_NAMES, HTML_COMPONENT_CONTAINERS } from '../../config/components.config';
import { getHTMLElementById } from '../../utils/dom.utils';
import { DB_CONST } from '../../shared/config/constants.config';
import { TwoFaMethod } from '../../shared/types/user.types';

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
	private form!: HTMLFormElement;
	private componentConfig?: ComponentConfig;

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

	// ===========================================
	// METHODES OVERRIDES DE BASEPAGE
	// ===========================================
	
	/**
	 * Prépare la page avant le montage des composants.
	 * 
	 * Vérifie que la configuration du composant 'twofaModal' est valide avant de le monter.
	 * Si la configuration est invalide, une erreur est lancée.
	 * 
	 * @returns {Promise<void>} Une promesse qui se résout lorsque les composants sont chargés.
	 * @throws {Error} Lance une erreur si la configuration du composant 'twofaModal' est invalide.
	 */
	protected async beforeMount(): Promise<void> {
		if (!this.components) {
			return;
		}
		const config = this.components[COMPONENT_NAMES.TWOFA_MODAL];
		if (!config || !this.shouldRenderComponent(config)
			|| !this.isValidConfig(config, false)) {
			throw new Error(`Configuration du composant '${COMPONENT_NAMES.TWOFA_MODAL}' invalide`);
		}
		this.componentConfig = config;
	}

	/**
	 * Montage de la page de connexion.
	 *
	 * Initialise le bouton de connexion Google en appelant la méthode
	 * `initGoogleSignIn()` du service d'authentification.
	 *
	 * @returns {Promise<void>} Une promesse qui se résout lorsque le bouton
	 * de connexion Google est initialisé.
	 */
	protected async mount(): Promise<void> {
		await googleService.initGoogleSignIn();
	}

	/**
	 * Attacher les gestionnaires d'événement.
	 *
	 * Ajoute un gestionnaire d'événement pour la soumission du formulaire
	 * de connexion, qui est géré par la méthode handleLoginSubmit.
	 */
	protected attachListeners(): void {
		this.form = getHTMLElementById('login-form') as HTMLFormElement;
		this.form.addEventListener('submit', this.handleLoginSubmit);
	}

	/**
	 * Supprime les gestionnaires d'événement.
	 *
	 * - pour la soumission du formulaire de connexion.
	 */
	protected removeListeners(): void {
		this.form.removeEventListener('submit', this.handleLoginSubmit);
	}

	// ===========================================
	// METHODES PUBLICS
	// ===========================================

	/**
	 * Surcharge de la méthode cleanup de BasePage
	 * (PUBLIQUE pour permettre le nettoyage des ressources dans page.service.ts)
	 * 
	 * Nettoie les ressources spécifiques à cette page (Google Sign-In),
	 * puis appelle la méthode cleanup de la classe parent.
	 */
	public async cleanup(): Promise<void> {
		console.log(`[${this.constructor.name}] Nettoyage Google sign in...`);
		googleService.cleanupGoogleSignIn();
		await super.cleanup();
	}

	// ===========================================
	// METHODES PRIVATES
	// ===========================================

	/**
	 * Injecte le composant de modal de double authentification dans la page.
	 *
	 * Cherche l'élément HTML qui contiendra le composant de modal, crée une
	 * instance du composant, l'injecte dans l'élément HTML et enregistre
	 * l'instance du composant dans la liste des instances de composants.
	 *
	 * @returns {Promise<void>} Une promesse qui se résout lorsque le composant
	 * a été injecté.
	 */
	private async injectTwofaModal(): Promise<void> {
		const twofaModalContainer = getHTMLElementById(HTML_COMPONENT_CONTAINERS.TWOFA_MODAL_ID);
		const twofaModal = new TwofaModalComponent(this.config, this.componentConfig!, twofaModalContainer);
		await twofaModal.render();
		this.addToComponentInstances(COMPONENT_NAMES.TWOFA_MODAL, twofaModal);
		console.log(`[${this.constructor.name}] Composant '${this.componentConfig!.name}' généré`);
	}

	// ===========================================
	// LISTENER HANDLERS
	// ===========================================

	/**
	 * Gestionnaire pour la soumission du formulaire de connexion.
	 *
	 * - Empêche le comportement par défaut de soumission HTML.
	 * - Extrait les données du formulaire.
	 * - Appelle le service d'authentification pour connecter l'utilisateur.
	 *
	 * @param {Event} event L'événement de soumission du formulaire.
	 * @returns {Promise<void>} Une promesse qui se résout lorsque la première étape de l'authentification est effectuée.
	 */
	private handleLoginSubmit = async (event: Event): Promise<void> => {
		event.preventDefault();
		const formData = new FormData(this.form);
		const data = Object.fromEntries(formData.entries()) as Record<string, string>;
		const loginResult = await authService.login(data);

		// Affiche le modal 2FA seulement si login OK et 2FA activé
		if (!loginResult || loginResult.errorMessage || loginResult.user!.active2Fa === DB_CONST.USER.ACTIVE_2FA.DISABLED) {
			return;
		}

		// Injecte le composant 2FA
		await this.injectTwofaModal();

		// Récupère l’instance du composant 2FA
		const modal = this.getComponentInstance<TwofaModalComponent>(COMPONENT_NAMES.TWOFA_MODAL);
		if (!modal) {
			console.error('Composant 2FA introuvable');
			return;
		}

		// Injecte les infos de l'utilisateur qui tente de se connecter au modal
		modal.setUserTwofaMethod(loginResult.user!.active2Fa);
		modal.setPageOrigin(PAGE_NAMES.LOGIN);
		modal.setUserData(data);

		// Affiche le modal
		await modal.show();
	};
}
