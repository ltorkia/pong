// Pour hot reload Vite
import template from './twofa-modal.component.html?raw'

import QRCode from 'qrcode';
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
	private codeInputEmail!: HTMLInputElement;
	private codeInputQrCode!: HTMLInputElement;
	private errorMsg!: HTMLElement;
	private emailContainer!: HTMLElement;
	private qrcodeContainer!: HTMLElement;
	private qrcodeImgDiv!: HTMLImageElement;
	private qrCodeSubmitBtn!: HTMLButtonElement;
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
		this.codeInputEmail = getHTMLElementById('twofa-code-email', this.form) as HTMLInputElement;
		this.codeInputQrCode = getHTMLElementById('twofa-code-qrcode', this.form) as HTMLInputElement;
		this.errorMsg = getHTMLElementById('twofa-error', this.form) as HTMLElement;
		this.emailContainer = getHTMLElementById('twofa-email-container', this.form) as HTMLElement;
		this.qrcodeContainer = getHTMLElementById('twofa-qrcode-container', this.form) as HTMLElement;
		this.qrcodeImgDiv = getHTMLElementById('twofa-qrcode', this.qrcodeContainer) as HTMLImageElement;
		this.qrCodeSubmitBtn = getHTMLElementById('twofa-qrcode-submit-btn', this.qrcodeContainer) as HTMLButtonElement;
		this.resendEmailCodeBtn = getHTMLElementById('twofa-email-resend-btn', this.emailContainer) as HTMLButtonElement;
		this.twofaBackBtn = getHTMLElementById('twofa-back-btn', this.form) as HTMLButtonElement;
	}

	/**
	 * Ajoute les gestionnaires d'événement au composant.
	 *
	 * - Attribue un gestionnaire d'événement pour le bouton de renvoi du code par email.
	 * - Attribue un gestionnaire d'événement pour le bouton de validation du code par email.
	 * - Attribue un gestionnaire d'événement pour la bouton de validation du code par QR Code.
	 * - Attribue un gestionnaire d'événement pour le clic dans le container du composant (utile pour fermer le composant).
	 * - Attribue un gestionnaire d'événement pour le bouton de retour en arrière.
	 */
	protected attachListeners(): void {
		this.resendEmailCodeBtn.addEventListener('click', this.handleResendEmailCode);
		this.form.addEventListener('submit', this.handleCodeSubmit);
		this.qrCodeSubmitBtn.addEventListener('click', this.handleCodeSubmit);
		this.container.addEventListener('click', this.handleBackgroundClick);
		this.twofaBackBtn.addEventListener('click', this.leaveOnBtnClick);
	}

	/**
	 * Supprime les gestionnaires d'événement.
	 */
	protected removeListeners(): void {
		this.resendEmailCodeBtn.removeEventListener('click', this.handleResendEmailCode);
		this.form.addEventListener('submit', this.handleCodeSubmit);
		this.qrCodeSubmitBtn.removeEventListener('click', this.handleCodeSubmit);
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
		this.codeInputEmail.value = '';
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
		this.codeInputEmail.value = '';
		this.errorMsg.classList.add('hidden');
		this.errorMsg.textContent = '';
		this.emailContainer.classList.add('hidden');
		this.qrcodeContainer.classList.add('hidden');
		this.qrcodeImgDiv.replaceChildren();
	}

	// ===========================================
	// LISTENER HANDLERS
	// ===========================================

/**
 * Le back envoie un code de vérification par email pour l'authentification à deux facteurs (2FA).
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
 * La back envoie le QrCode pour l'authentification à deux facteurs (2FA).
 * 
 * Affiche un spinner pendant que le code est generé. Si l'envoi échoue, affiche un message
 * d'erreur et cache le container Email code. Si l'envoi réussit, affiche un message de succès
 * et affiche le container pour le QrCode.
 * 
 * @returns {Promise<void>} Une promesse qui se résout une fois que le code a été traité.
 */

	private async handleSendQrCode(): Promise<void> {
		showSpinner('twofa-spinner');
		const res = await authService.send2FA(this.userData);
		if (res.errorMessage) {
			showAlert(res.errorMessage, 'twofa-error');
			this.emailContainer.classList.add('hidden');
			return;
		}
		hideSpinner('twofa-spinner');
		showAlert(`Code sent to 2FA app`, 'twofa-error', 'success');
		this.qrcodeContainer.classList.remove('hidden');
	}

	// if (res.otpauth_url) {
	// 	this.renderQrCode(res.otpauth_url!);
	// }

	/**
	 * Affiche le QrCode correspondant à l'URL d'authentification à deux facteurs (2FA) fournie.
	 * 
	 * Crée un élément `<img>` et utilise la bibliothèque `qrcode` pour générer le QR code
	 * correspondant à l'URL fournie. Si l'opération réussit, met l'attribut `src` de l'élément
	 * `<img>` à la valeur du QR code en base64. En cas d'erreur, affiche un message d'erreur
	 * dans la console.
	 * 
	 * @param {string} otpauthUrl URL d'authentification à deux facteurs (2FA) à afficher dans le QrCode.
	 * @returns {Promise<void>} Une promesse qui se résout une fois que le QrCode a été affiché.
	 */
	public async renderQrCode(otpauthUrl: string): Promise<void> {
		const img = document.createElement('img');
		try {
			const dataUrl = await QRCode.toDataURL(otpauthUrl);
			img.classList.add('m-auto');
			img.src = dataUrl;
			this.qrcodeImgDiv.appendChild(img);
		} catch (err) {
			console.error('Erreur lors de la génération du QR code :', err);
		}
	}



	/**
	 * Gère la soumission du formulaire de code 2FA par code envoyé par email ou QR Code.
	 * 
	 * Vérifie si le code saisi est valide. Si le code est valide, se connecte en tant
	 * qu'utilisateur et ferme le modal. Si le code est invalide, affiche un message
	 * d'erreur.
	 * 
	 * @param {SubmitEvent} event L'événement de soumission du formulaire.
	 * @returns {Promise<void>} Une promesse qui se résout une fois que la connexion
	 *                          est terminée.
	 */
	private handleCodeSubmit = async (event: Event | SubmitEvent): Promise<void> => {
		event.preventDefault();
		const method = (event.target as HTMLSelectElement).value;
		let code: string | null = null;
		if (method === 'email') {
			code = this.codeInputEmail.value.trim();
		} else if (method === 'qrcode') {
			code = this.codeInputQrCode.value.trim();
		}
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