// Pour hot reload Vite
import template from './twofa-modal.component.html?raw'

import QRCode from 'qrcode';
import { authService } from '../../services/index.service';
import { BaseComponent } from '../base/base.component';
import { RouteConfig } from '../../types/routes.types';
import { ComponentConfig } from '../../types/components.types';
import { animationService } from '../../services/index.service';
import { showAlert, showSpinner, hideSpinner, getHTMLElementById, getHTMLElementByClass } from '../../utils/dom.utils';
import { PAGE_NAMES } from '../../config/routes.config';
import { DB_CONST } from '../../shared/config/constants.config';
import { TwoFaMethod } from '../../shared/types/user.types';

// ===========================================
// TWOFA MODAL COMPONENT
// ===========================================

export class TwofaModalComponent extends BaseComponent {
	private resolveShowPromise: ((result: { success: boolean; errorMessage?: string | null }) => void) | null = null;
	private originalPageName!: string;
	private userTwofaMethod!: TwoFaMethod;
	private userData!: Record<string, string>;
	private pageTitle!: HTMLElement;
	private form!: HTMLDivElement;
	private codeInputEmail!: HTMLInputElement;
	private codeInputQrCode!: HTMLInputElement;
	private errorMsg!: HTMLElement;
	private emailContainer!: HTMLElement;
	private qrcodeContainer!: HTMLElement;
	private qrcodeImgDiv!: HTMLImageElement;
	private emailCodeSubmitBtn!: HTMLFormElement;
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
	 * Prépare les éléments du composant avant le montage.
	 *
	 * Récupère les éléments HTML du composant pour les stocker en tant que propriétés.
	 * Cela permettra d'y accéder plus facilement plus tard.
	 *
	 * @returns {Promise<void>} Une promesse qui se résout lorsque les éléments ont été stockés.
	 */
	protected async beforeMount(): Promise<void> {
		this.pageTitle = getHTMLElementByClass('under-title', this.container) as HTMLElement;
		this.form = getHTMLElementById('twofa-form', this.container) as HTMLDivElement;
		this.codeInputEmail = getHTMLElementById('twofa-code-email', this.form) as HTMLInputElement;
		this.codeInputQrCode = getHTMLElementById('twofa-code-qrcode', this.form) as HTMLInputElement;
		this.errorMsg = getHTMLElementById('twofa-error', this.form) as HTMLElement;
		this.emailContainer = getHTMLElementById('twofa-email-container', this.form) as HTMLElement;
		this.qrcodeContainer = getHTMLElementById('twofa-qrcode-container', this.form) as HTMLElement;
		this.qrcodeImgDiv = getHTMLElementById('twofa-qrcode', this.qrcodeContainer) as HTMLImageElement;
		this.emailCodeSubmitBtn = getHTMLElementById('twofa-email-code-submit-btn', this.container) as HTMLFormElement;
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
		this.emailCodeSubmitBtn.addEventListener('click', this.handleCodeSubmit);
		this.qrCodeSubmitBtn.addEventListener('click', this.handleCodeSubmit);
		this.container.addEventListener('click', this.handleBackgroundClick);
		this.twofaBackBtn.addEventListener('click', this.leaveOnBtnClick);
	}

	/**
	 * Supprime les gestionnaires d'événement.
	 */
	protected removeListeners(): void {
		this.resendEmailCodeBtn.removeEventListener('click', this.handleResendEmailCode);
		this.emailCodeSubmitBtn.addEventListener('click', this.handleCodeSubmit);
		this.qrCodeSubmitBtn.removeEventListener('click', this.handleCodeSubmit);
		this.container.removeEventListener('click', this.handleBackgroundClick);
		this.twofaBackBtn.removeEventListener('click', this.leaveOnBtnClick);
	}

	// ===========================================
	// METHODES PUBLICS
	// ===========================================

	/**
	 * Enregistre le nom de la méthode de double authentification
	 * choisie par l'utilisateur.
	 *
	 * @param {TwoFaMethod} twofaMethod Le nom de la méthode de double authentification.
	 */
	public setUserTwofaMethod(twofaMethod: TwoFaMethod): void {
		this.userTwofaMethod = twofaMethod;
	}

	/**
	 * Enregistre le nom de la page d'origine ('login' ou 'settings')
	 * pour adapter le contenu du modal 2fa en fonction.
	 *
	 * @param {string} pageName Le nom de la page d'origine.
	 */
	public setPageOrigin(pageName: string): void {
		this.originalPageName = pageName;
	}

	/**
	 * Stocke les données de l'utilisateur courant pour les utiliser plus tard
	 * dans le composant.
	 *
	 * @param {Record<string, string>} userData Les données de l'utilisateur courant.
	 */
	public setUserData(userData: Record<string, string>): void {
		this.userData = userData;
	}

	/**
	 * Affiche le modal de double authentification.
	 * 
	 * Retire la classe 'hidden' pour rendre le modal visible, réinitialise le champ
	 * de saisie de code email et cache le message d'erreur. Effectue une transition
	 * d'entrée pour le modal.
	 * 
	 * @returns {Promise<boolean>} Une promesse qui se résout lorsque la transition
	 * d'entrée du modal est terminée.
	 */
	public async show(): Promise<{ success: boolean; errorMessage?: string | null }> {
		return new Promise<{ success: boolean; errorMessage?: string | null }>(async (resolve) => {
			this.resolveShowPromise = resolve;
			this.codeInputEmail.value = '';
			this.codeInputQrCode.value = '';

			if (this.userTwofaMethod === DB_CONST.USER.ACTIVE_2FA.DISABLED) {
				resolve({success: true});
				return;
			}
			if (this.userTwofaMethod === DB_CONST.USER.ACTIVE_2FA.EMAIL_CODE) {
				this.pageTitle.setAttribute("data-ts", "twofa.emailcodeLabel");
				this.pageTitle.textContent = 'Code by email';
				await this.handleSendEmailCode();
				this.emailContainer.classList.remove('hidden');
			}
			if (this.userTwofaMethod === DB_CONST.USER.ACTIVE_2FA.QR_CODE) {
				this.pageTitle.setAttribute("data-ts", "twofa.qrcodeLabel");
				this.pageTitle.textContent = 'QR code';
				await this.handleSendQrCode();
				this.qrcodeContainer.classList.remove('hidden');
			}
			await animationService.modalTransitionIn(this.container);
		});
	}

	/**
	 * Cache le modal de double authentification.
	 * 
	 * Effectue une transition de sortie pour le modal, cache le modal
	 * en ajoutant la classe 'hidden' et réinitialise les éléments du
	 * composant.
	 * 
	 * @returns {Promise<void>} Une promesse qui se résout lorsque la
	 * transition de sortie du modal est terminée.
	 */
	public async hide(): Promise<void> {
		await animationService.modalTransitionOut(this.container);
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
		await this.loadTemplate(template);
	}

	/**
	 * Prépare les données utilisateur à envoyer selon la page d'origine.
	 * 
	 * Si la page d'origine est 'login' et que le mot de passe utilisateur est présent,
	 * retourne un objet contenant l'email, le mot de passe, et le nom de la page.
	 * Si la page d'origine n'est pas 'login' et que le mot de passe utilisateur est
	 * absent, retourne un objet contenant uniquement l'email et le nom de la page.
	 * 
	 * @returns {Record<string, string>} Un objet contenant les données utilisateur
	 * à envoyer.
	 */
	private getUserDataToSend(): Record<string, string> {
		let dataToSend = {};
		if (this.originalPageName === PAGE_NAMES.LOGIN && this.userData.password) {
			dataToSend = {
				email: this.userData.email,
				password: this.userData.password,
				pageName: this.originalPageName
			}
		} else if (this.originalPageName === PAGE_NAMES.SETTINGS && !this.userData.password) {
			dataToSend = {
				email: this.userData.email,
				pageName: this.originalPageName
			}
		}
		return dataToSend;
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
		const dataToSend = this.getUserDataToSend();
		const res = await authService.send2FA(dataToSend, this.userTwofaMethod);
		if (res.errorMessage) {
			showAlert(res.errorMessage, 'twofa-error');
			return;
		}
		hideSpinner('twofa-spinner');
		showAlert(`Code sent to ${this.userData.email}`, 'twofa-error', 'success');
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
		const dataToSend = this.getUserDataToSend();
		const res = await authService.send2FA(dataToSend, this.userTwofaMethod);
		if (res.errorMessage) {
			showAlert(res.errorMessage, 'twofa-error');
			return;
		}
		hideSpinner('twofa-spinner');
		if (this.originalPageName === PAGE_NAMES.SETTINGS) {
			if (!res.otpauth_url) {
				showAlert(`otpauth_url missing !`, 'twofa-error');
			}
			this.renderQrCode(res.otpauth_url!);
		}
		if (this.originalPageName === PAGE_NAMES.LOGIN) {
			showAlert(`Code sent to 2FA app`, 'twofa-error', 'success');
		}
	}

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
	 * @param {Event} event L'événement de soumission des données.
	 * @returns {Promise<void>} Une promesse qui se résout une fois que la connexion
	 *                          est terminée.
	 */
	private handleCodeSubmit = async (event: Event): Promise<void> => {
		event.preventDefault();
		let code: string | null = null;
		if (this.userTwofaMethod === DB_CONST.USER.ACTIVE_2FA.EMAIL_CODE) {
			code = this.codeInputEmail.value.trim();
		} else if (this.userTwofaMethod === DB_CONST.USER.ACTIVE_2FA.QR_CODE) {
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
			pageName: this.originalPageName
		}, this.userTwofaMethod);
		if (res.errorMessage) {
			showAlert(res.errorMessage, 'twofa-error');
			this.errorMsg.classList.remove('hidden');
			return;
		}
		await this.hide();
		if (this.resolveShowPromise) {
			this.resolveShowPromise?.({success: true});
			this.resolveShowPromise = null;
		}
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
			this.resolveShowPromise?.({success: false, errorMessage: 'Proccess interrupted.'});
			this.resolveShowPromise = null;
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
		this.resolveShowPromise?.({success: false, errorMessage: 'Proccess interrupted.'});
		this.resolveShowPromise = null;
	};

}