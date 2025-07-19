// Pour hot reload Vite
import template from './twofa-modal.component.html?raw'

import { authService } from '../../services/index.service';
import { BaseComponent } from '../base/base.component';
import { RouteConfig } from '../../types/routes.types';
import { ComponentConfig } from '../../types/components.types';
import { showAlert, showSpinner, hideSpinner, getHTMLElementById } from '../../utils/dom.utils';

// ===========================================
// TWOFA MODAL COMPONENT
// ===========================================

export class TwofaModalComponent extends BaseComponent {
	private userData!: Record<string, string>;
	private form!: HTMLFormElement;
	private codeInput!: HTMLInputElement;
	private errorMsg!: HTMLElement;
	private twofaMethodSelect!: HTMLSelectElement;
	private emailContainer!: HTMLElement;
	private qrcodeContainer!: HTMLElement;
	private resendEmailCodeBtn!: HTMLButtonElement;
	private twofaBackBtn!: HTMLButtonElement;

	/**
	 * Constructeur.
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
	 * @returns {Promise<void>} Une promesse qui se résout lorsque les vérifications sont terminées.
	 */
	protected async preRenderCheck(): Promise<void> {
		super.preRenderCheck();
		await this.loadTemplateDev();
	}

	/**
	 * Prépare les éléments du composant avant le montage.
	 *
	 * Récupère les éléments HTML du composant pour les stocker en tant que propriétés.
	 * Cela permettra d'y accéder plus facilement plus tard.
	 *
	 * @returns {Promise<void>} Une promesse qui se résout lorsque les éléments ont été stockés.
	 */
	protected async beforeMount(): Promise<void> {
		this.form = getHTMLElementById('twofa-form', this.container) as HTMLFormElement;
		this.codeInput = getHTMLElementById('twofa-code', this.form) as HTMLInputElement;
		this.errorMsg = getHTMLElementById('twofa-error', this.form) as HTMLElement;
		this.twofaMethodSelect = getHTMLElementById('twofa-method', this.form) as HTMLSelectElement;
		this.emailContainer = getHTMLElementById('twofa-email-container', this.form) as HTMLElement;
		this.qrcodeContainer = getHTMLElementById('twofa-qrcode-container', this.form) as HTMLElement;
		this.resendEmailCodeBtn = getHTMLElementById('twofa-email-resend-btn', this.emailContainer) as HTMLButtonElement;
		this.twofaBackBtn = getHTMLElementById('twofa-back-btn', this.form) as HTMLButtonElement;
	}

	/**
	 * Ajoute les gestionnaires d'événement au composant.
	 *
	 * - Attribue un gestionnaire d'événement pour le changement de méthode 2FA.
	 * - Attribue un gestionnaire d'événement pour le bouton de renvoi du code par email.
	 * - Attribue un gestionnaire d'événement pour le bouton de validation du code par email.
	 * - Attribue un gestionnaire d'événement pour le clic dans le container du composant (utile pour fermer le composant).
	 * - Attribue un gestionnaire d'événement pour le bouton de retour en arrière.
	 */
	protected attachListeners(): void {
		this.twofaMethodSelect.addEventListener('change', this.handleMethodChange);
		this.resendEmailCodeBtn.addEventListener('click', this.handleResendEmailCode);
		this.form.addEventListener('submit', this.handleSubmit);
		this.container.addEventListener('click', this.handleBackgroundClick);
		this.twofaBackBtn.addEventListener('click', this.leaveOnBtnClick);
	}

	/**
	 * Supprime les gestionnaires d'événement.
	 */
	protected removeListeners(): void {
		this.twofaMethodSelect.removeEventListener('change', this.handleMethodChange);
		this.resendEmailCodeBtn.removeEventListener('click', this.handleResendEmailCode);
		this.form.addEventListener('submit', this.handleSubmit);
		this.container.removeEventListener('click', this.handleBackgroundClick);
		this.twofaBackBtn.removeEventListener('click', this.leaveOnBtnClick);
	}

	// ===========================================
	// METHODES PUBLICS
	// ===========================================

	public setUserData(userData: Record<string, string>): void {
		this.userData = userData;
	}

	public async show(): Promise<void> {
		this.container.classList.remove('hidden');
		this.codeInput.value = '';
		this.errorMsg.classList.add('hidden');
		await this.modalTransitionIn();
	}

	public async hide(): Promise<void> {
		await this.modalTransitionOut();
		this.container.classList.add('hidden');
		this.reset();
	}

	// ===========================================
	// METHODES PRIVATE
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
	 * Transition du modal à l'entrée.
	 * 
	 * @returns {Promise<void>} Une promesse qui se résout lorsque la transition est terminée.
	 */
	private async modalTransitionIn(): Promise<void> {
		this.container.classList.add('modal-active');
		await new Promise(resolve => setTimeout(resolve, 200));
	}

	/**
	 * Transition du modal en sortie.
	 * 
	 * @returns {Promise<void>} Une promesse qui se résout lorsque la transition est terminée.
	 */
	private async modalTransitionOut(): Promise<void> {
		this.container.classList.remove('modal-active');
		await new Promise(resolve => setTimeout(resolve, 200));
	}

	/**
	 * Réinitialise les éléments du composant.
	 * 
	 * Réinitialise les champs, cache les messages d'erreur, réinitialise la sélection,
	 * et cache les champs de saisie d'email et de QR code si ils sont visibles.
	 */
	private reset(): void {
		this.codeInput.value = '';
		this.errorMsg.classList.add('hidden');
		this.errorMsg.textContent = '';
		this.twofaMethodSelect.value = '-';
		this.emailContainer.classList.add('hidden');
		this.qrcodeContainer.classList.add('hidden');
	}

	// ===========================================
	// LISTENER HANDLERS
	// ===========================================

	/**
	 * Gère le changement de méthode de 2FA.
	 * 
	 * Lorsque le champ de sélection de la méthode de 2FA change, cache les champs
	 * de saisie d'email et de QR code suivant la méthode sélectionnée, et
	 * affiche le champ correspondant. Si la méthode est "email", envoie un code
	 * 2FA par email.
	 * 
	 * @param {Event} event L'événement de changement de champ de sélection.
	 * @returns {Promise<void>} Une promesse qui se résout lorsque la méthode est
	 *                          appliquée.
	 */
	private handleMethodChange = async (event: Event): Promise<void> => {
		const method = (event.target as HTMLSelectElement).value;
		if (method === 'email') {
			this.qrcodeContainer.classList.add('hidden');
			this.errorMsg.classList.add('hidden');
			this.handleSendEmailCode();
		}
		if (method === 'qrcode') {
			this.emailContainer.classList.add('hidden');
			this.errorMsg.classList.add('hidden');
			this.qrcodeContainer.classList.remove('hidden');
		}
	};

/**
 * Envoie un code de vérification par email pour l'authentification à deux facteurs (2FA).
 * 
 * Affiche un spinner pendant que le code est envoyé. Si l'envoi échoue, affiche un message
 * d'erreur et cache le container QR code. Si l'envoi réussit, affiche un message de succès
 * et affiche le container pour le code email.
 * 
 * @returns {Promise<void>} Une promesse qui se résout une fois que le code a été traité.
 */

	private async handleSendEmailCode(): Promise<void> {
		showSpinner('twofa-spinner');
		const res = await authService.send2FA(this.userData);
		if (res.errorMessage) {
			showAlert(res.errorMessage, 'twofa-error');
			this.qrcodeContainer.classList.add('hidden');
			return;
		}
		hideSpinner('twofa-spinner');
		showAlert(`Code sent to ${this.userData.email}`, 'twofa-error', 'success');
		this.emailContainer.classList.remove('hidden');
	}

	/**
	 * Gère la soumission du formulaire de code 2FA.
	 * 
	 * Vérifie si le code saisi est valide. Si le code est valide, se connecte en tant
	 * qu'utilisateur et ferme le modal. Si le code est invalide, affiche un message
	 * d'erreur.
	 * 
	 * @param {SubmitEvent} event L'événement de soumission du formulaire.
	 * @returns {Promise<void>} Une promesse qui se résout une fois que la connexion
	 *                          est terminée.
	 */
	private handleSubmit = async (event: SubmitEvent): Promise<void> => {
		event.preventDefault();
		const code = this.codeInput.value.trim();
		if (!code) {
			showAlert('Code required', 'twofa-error');
			this.errorMsg.classList.remove('hidden');
			return;
		}
		const res = await authService.twofaConnect({
			email: this.userData.email,
			password: code,
		});
		if (res.errorMessage) {
			showAlert(res.errorMessage, 'twofa-error');
			this.errorMsg.classList.remove('hidden');
			return;
		}
		await this.hide();
	};

	/**
	 * Gère le clic sur le bouton de renvoi du code par email.
	 * 
	 * Envoie un nouveau code de vérification par email pour l'authentification à deux facteurs (2FA).
	 * 
	 * @param {MouseEvent} event L'événement de clic sur le bouton.
	 * @returns {Promise<void>} Une promesse qui se résout une fois que le code a été traité.
	 */
	private handleResendEmailCode = async (event: MouseEvent): Promise<void> => {
		event.preventDefault();
		this.errorMsg.classList.add('hidden');
		this.handleSendEmailCode();
	}

	/**
	 * Gère le clic sur le fond du modal.
	 * 
	 * Si le clic est sur le fond (et non sur un élément du modal), ferme le modal.
	 * 
	 * @param {MouseEvent} event L'événement de clic sur le fond.
	 * @returns {Promise<void>} Une promesse qui se résout une fois que le modal est fermé.
	 */
	private handleBackgroundClick = async (event: MouseEvent): Promise<void> => {
		if (event.target === this.container) {
			await this.hide();
		}
	};

	/**
	 * Gère le clic sur le bouton de retour en arrière.
	 * 
	 * Ferme le modal.
	 * 
	 * @param {MouseEvent} event L'événement de clic sur le bouton.
	 * @returns {Promise<void>} Une promesse qui se résout une fois que le modal est fermé.
	 */
	private leaveOnBtnClick = async (event: MouseEvent): Promise<void> => {
		event.preventDefault();
		await this.hide();
	};

}