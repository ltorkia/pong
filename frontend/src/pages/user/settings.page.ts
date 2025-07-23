import { BasePage } from '../base/base.page';
import { RouteConfig } from '../../types/routes.types';
import { dataService } from '../../services/index.service';
import { authApi } from '../../api/index.api';
import { toggleClass, getHTMLElementById, getHTMLElementByClass } from '../../utils/dom.utils';
import { DB_CONST } from '../../shared/config/constants.config';
import { TwoFaMethod } from '../../shared/types/user.types';
import { TwofaModalComponent } from '../../components/twofa-modal/twofa-modal.component';
import { PAGE_NAMES } from '../../config/routes.config';
import { COMPONENT_NAMES, HTML_COMPONENT_CONTAINERS } from '../../config/components.config';


// ===========================================
// SETTINGS PAGE
// ===========================================
/**
 * L'utilisateur peut changer ses informations personnelles ici, notamment son avatar, son username etc.
 */
export class SettingsPage extends BasePage {
	private avatarContainer!: HTMLElement;
	private avatarInput!: HTMLInputElement;

	private emailContent!: HTMLElement;
	private emailInput!: HTMLInputElement;

	private usernameContent!: HTMLElement;
	private usernameInput!: HTMLInputElement;

	private inputContents!: NodeListOf<HTMLHeadingElement>;
	private dropdownTitles!: NodeListOf<HTMLHeadingElement>;

	private updateEmailButton!: HTMLButtonElement;
	private updateUsernameButton!: HTMLButtonElement;
	private passwordForm!: HTMLFormElement;

	private twoFaMethods!: NodeListOf<HTMLInputElement>;
	private twoFaEmailInput!: HTMLInputElement;
	private twoFaQrInput!: HTMLInputElement;
	private twoFaDisableInput!: HTMLInputElement;

	private alertMsgEmail!: HTMLElement;
	private alertMsgUsername!: HTMLElement;
	private alertMsgPassword!: HTMLElement;
	private alertMsgTwoFa!: HTMLElement;
	private alertMsgAvatar!: HTMLElement;

	/**
	 * Constructeur de la page des paramètres.
	 *
	 * Initialise la configuration de la route et appelle le constructeur
	 * de la classe de base pour établir la configuration initiale de la page.
	 *
	 * @param {RouteConfig} config La configuration de la route actuelle.
	 */
	constructor(config: RouteConfig) {
		super(config);
	}

	// ===========================================
	// METHODES OVERRIDES DE BASEPAGE
	// ===========================================

	/**
	 * Récupère les éléments HTML de la page d'accueil avant de la monter.
	 * 
	 * @returns {Promise<void>} Une promesse qui se résout lorsque les éléments HTML ont été stockés.
	 */
	protected async beforeMount(): Promise<void> {
		if (!this.currentUser!.email) {
			this.currentUser = await authApi.getMe();
		}
		this.avatarContainer = getHTMLElementById('avatar-container', this.container) as HTMLElement;
		this.avatarInput = getHTMLElementById('avatar-input', this.container) as HTMLInputElement;
		
		this.emailContent = getHTMLElementById('email-content', this.container) as HTMLElement;
		this.emailInput = getHTMLElementById('email', this.container) as HTMLInputElement;
		this.usernameContent = getHTMLElementById('username-content', this.container) as HTMLElement;
		this.usernameInput = getHTMLElementById('username', this.container) as HTMLInputElement;

		this.inputContents = this.container.querySelectorAll('.input-content') as NodeListOf<HTMLHeadingElement>;
		this.dropdownTitles = this.container.querySelectorAll('.dropdown-title') as NodeListOf<HTMLHeadingElement>;
		
		this.updateEmailButton = getHTMLElementById('update-email-button', this.container) as HTMLButtonElement;
		this.updateUsernameButton = getHTMLElementById('update-username-button', this.container) as HTMLButtonElement;
		this.passwordForm = getHTMLElementById('password-form', this.container) as HTMLFormElement;
		
		this.twoFaMethods = this.container.querySelectorAll('input[name="twofa-method"]') as NodeListOf<HTMLInputElement>;
		this.twoFaEmailInput = getHTMLElementById('enable-2fa-email', this.container) as HTMLInputElement;
		this.twoFaQrInput = getHTMLElementById('enable-2fa-qrcode', this.container) as HTMLInputElement;
		this.twoFaDisableInput = getHTMLElementById('disable-2fa', this.container) as HTMLInputElement;
		
		this.alertMsgEmail = getHTMLElementById('email-alert', this.container) as HTMLElement;
		this.alertMsgUsername = getHTMLElementById('username-alert', this.container) as HTMLElement;
		this.alertMsgPassword = getHTMLElementById('password-alert', this.container) as HTMLElement;
		this.alertMsgTwoFa = getHTMLElementById('twofa-alert', this.container) as HTMLElement;
		this.alertMsgAvatar = getHTMLElementById('alert-avatar', this.container) as HTMLElement;
	}

	/**
	 * Montage du composant de la page d'accueil.
	 *
	 * Cette méthode charge l'avatar de l'utilisateur.
	 *
	 * @returns Une promesse qui se résout lorsque le composant est monté.
	 */
	protected async mount(): Promise<void> {
		this.loadAvatar();
		this.preFillForm();
	}

	/**
	 * Attribue les gestionnaires d'événement.
	 */
	protected attachListeners(): void {
		this.avatarContainer.addEventListener('click', this.onAvatarClick);
		this.avatarInput.addEventListener('change', this.onAvatarChange);
		this.inputContents.forEach((inputContent) => {
			inputContent.addEventListener('click', this.onContentClick);
		})
		this.dropdownTitles.forEach((dropdownTitle) => {
			dropdownTitle.addEventListener('click', this.onDropdownClick);
		})
		this.updateEmailButton.addEventListener('click', this.handleEmailUpdate);
		this.updateUsernameButton.addEventListener('click', this.handleUsernameUpdate);
		this.passwordForm.addEventListener('submit', this.handlePasswordSubmit);
		this.twoFaMethods.forEach((radio) => {
			radio.addEventListener('change', this.onTwoFaMethodChange);
		})
	}

	/**
	 * Supprime les gestionnaires d'événement attribués à la page d'accueil.
	 */
	protected removeListeners(): void {
		this.avatarContainer.removeEventListener('click', this.onAvatarClick);
		this.avatarInput.removeEventListener('change', this.onAvatarChange);
		this.inputContents.forEach((inputContent) => {
			inputContent.removeEventListener('click', this.onContentClick);
		})
		this.dropdownTitles.forEach((dropdownTitle) => {
			dropdownTitle.removeEventListener('click', this.onDropdownClick);
		})
		this.passwordForm.removeEventListener('submit', this.handlePasswordSubmit);
		this.twoFaMethods.forEach((radio) => {
			radio.removeEventListener('change', this.onTwoFaMethodChange);
		})
	}

	// ===========================================
	// METHODES PRIVATES
	// ===========================================

	/**
	 * Charge l'image d'avatar de l'utilisateur actuel.
	 *
	 * Recherche l'élément HTML de classe "avatar" et y applique
	 * les styles pour afficher l'image d'avatar en arrière-plan.
	 */
	private loadAvatar() {
		Object.assign(this.avatarContainer.style, {
			backgroundImage: `url('${this.currentUserAvatarURL!}')`,
			backgroundSize: "cover",
			backgroundPosition: "center"
		});
	}

	/**
	 * Pré-remplit les champs du formulaire
	 * avec les informations actuelles de l'utilisateur courant.
	 * 
	 * Remplit les champs suivants:
	 * - email: l'adresse e-mail actuelle de l'utilisateur.
	 * - username: le nom d'utilisateur actuel de l'utilisateur.
	 * - active2Fa: si l'utilisateur a activé ou non l'authentification à 2 facteurs.
	 */
	private preFillForm(): void {
		this.emailContent.textContent = this.currentUser!.email;
		this.emailInput.value = this.currentUser!.email;

		this.usernameContent.textContent = this.currentUser!.username;
		this.usernameInput.value = this.currentUser!.username;

		if (this.currentUser!.active2Fa === DB_CONST.USER.ACTIVE_2FA.EMAIL_CODE) {
			this.twoFaEmailInput.checked = true;
		} else if (this.currentUser!.active2Fa === DB_CONST.USER.ACTIVE_2FA.QR_CODE) {
			this.twoFaQrInput.checked = true;
		} else {
			this.twoFaDisableInput.checked = true;
		}
	}

	// ===========================================
	// LISTENER HANDLERS
	// ===========================================

	/**
	 * Gère l'événement de clic sur l'avatar en déclenchant
	 * un clic sur l'élément input de type fichier.
	 * Permet à l'utilisateur d'ouvrir la boîte de dialogue pour sélectionner
	 * une nouvelle image d'avatar.
	 */
	private onAvatarClick = (): void => {
		this.hideAlerts();
		this.avatarInput.click();
	};

	/**
	 * Gère l'événement de changement pour l'input d'avatar, permettant à l'utilisateur
	 * de télécharger une nouvelle image d'avatar.
	 * Valide l'image, l'affiche en prévisualisation et l'envoie sur le serveur.
	 *
	 * @param {Event} event - L'événement de changement déclenché lorsque le fichier est sélectionné.
	 */
	private onAvatarChange = (event: Event): void => {
		this.handleAvatarChange(event);
	};

	/**
	 * Gère l'événement de changement pour l'input d'avatar.
	 * Valide l'image, l'affiche en prévisualisation et l'envoie sur le serveur.
	 *
	 * @param {Event} event - L'événement de changement déclenché lorsque le fichier est sélectionné.
	 *
	 * @returns {Promise<void>} - Une promesse qui se résout lorsque l'avatar est mis à jour.
	 */
	private async handleAvatarChange(event: Event): Promise<void> {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) { 
			return;
		}
		this.alertMsgPassword.classList.add('hidden');
		const result = await dataService.updateAvatar(this.currentUser!.id, file);
		if (result === false) {
			return;
		}
		this.currentUserAvatarURL = await dataService.getUserAvatarURL(this.currentUser!);
		this.loadAvatar();
	}

	/**
	 * Gestionnaire pour le clic sur le contenu modifiable (email / username).
	 * Fait apparaitre le champ de saisie pour modifier le contenu.
	 *
	 * @param {Event} event - L'événement de clic déclenché lorsque le contenu est cliqué.
	 */
	private onContentClick = (event: Event): void => {
		this.hideAlerts();
		const inputContent = event.currentTarget as HTMLElement;
		const contentUpdate = getHTMLElementByClass('content-update', inputContent);
		const inputContainer = getHTMLElementByClass('input-container', inputContent);
		if (inputContainer.classList.contains('hidden')) {
			toggleClass(contentUpdate, 'hidden', 'flex');
			toggleClass(inputContainer, 'hidden', 'flex');
			inputContent.classList.add('cursor-default');
		}
	};

	/**
	 * Cache le champ de saisie et le bouton "Mettre à jour" pour modifier le contenu (email / username).
	 * Fait apparaitre le texte de contenu initial en remplaçant le champ de saisie.
	 */
	private hideInput(inputElement: HTMLInputElement): void {
		const fieldContainer = inputElement.closest('.field-content-container');
		if (!fieldContainer) {
			return;
		}
		const contentUpdate = getHTMLElementByClass('content-update', fieldContainer);
		const inputContainer = getHTMLElementByClass('input-container', fieldContainer);
		const inputContent = getHTMLElementByClass('input-content', fieldContainer);
		toggleClass(contentUpdate, 'hidden', 'flex');
		toggleClass(inputContainer, 'hidden', 'flex');
		inputContent.classList.remove('cursor-default');
	}

	/**
	 * Cache tous les messages d'alerte sur la page des paramètres de l'utilisateur.
	 */
	private hideAlerts() {
		this.alertMsgAvatar.classList.add('hidden');
		this.alertMsgEmail.classList.add('hidden');
		this.alertMsgUsername.classList.add('hidden');
		this.alertMsgPassword.classList.add('hidden');
		this.alertMsgTwoFa.classList.add('hidden');
	}

	/**
	 * Gestionnaire pour le clic sur un dropdown (password / 2fa).
	 *
	 * - Inverse l'icône de flèche du dropdown.
	 * - Affiche ou masque le contenu du dropdown pour le mot de passe.
	 *
	 * @param {Event} event - L'événement de clic déclenché lorsque le dropdown est cliqué.
	 */
	private onDropdownClick = (event: Event): void => {
		this.hideAlerts();
		const dropdownTitle = event.currentTarget as HTMLElement;
		const dropdownContainer = dropdownTitle.closest('.dropdown-container');
		if (!dropdownContainer) {
			return;
		}
		const icon = getHTMLElementByClass('dropdown-title i', dropdownContainer);
		const dropdownContent = getHTMLElementByClass('dropdown-content', dropdownContainer);
		toggleClass(icon, 'fa-angle-down', 'fa-angle-up');
		toggleClass(dropdownContent, 'max-h-0', 'max-h-96');
	};
	

	/**
	 * Gestionnaire pour la soumission du formulaire de mot de passe.
	 *
	 * Empêche le comportement par défaut du formulaire.
	 * Récupère les données du formulaire et les envoie au service de données pour l'utilisateur courant.
	 *
	 * @param {Event} event - L'événement de soumission du formulaire.
	 *
	 * @returns {Promise<void>} - Une promesse qui se résout lorsque le mot de passe est mis à jour.
	 */
	private handlePasswordSubmit = async (event: Event): Promise<void> => {
		event.preventDefault();
		const formData = new FormData(this.passwordForm);
		const data = Object.fromEntries(formData.entries()) as Record<string, string>;
		await this.updateField(data, "password-alert");
	};
	
	/**
	 * Gestionnaire pour la mise à jour du nom d'utilisateur.
	 *
	 * Récupère la valeur du champ de saisie du nom d'utilisateur
	 * et appelle la fonction de mise à jour pour enregistrer
	 * le nouveau nom d'utilisateur en base de données.
	 *
	 * @returns {Promise<void>} - Une promesse qui se résout lorsque le nom d'utilisateur est mis à jour.
	 */
	private handleUsernameUpdate = async (event: Event): Promise<void> => {
		const username = this.usernameInput.value;
		await this.updateField({ username }, "username-alert");
		this.hideInput(this.usernameInput);
	};

	/**
	 * Gestionnaire pour la mise à jour de l'email.
	 *
	 * Récupère la valeur du champ de saisie de l'email
	 * et appelle la fonction de mise à jour pour enregistrer
	 * le nouvel email en base de données.
	 *
	 * @returns {Promise<void>} - Une promesse qui se résout lorsque l'email est mis à jour.
	 */
	private handleEmailUpdate = async (event: Event): Promise<void> => {
		const email = this.emailInput.value;
		await this.updateField({ email }, "email-alert");
		this.hideInput(this.emailInput);
	};
	
	/**
	 * Met à jour un champ spécifique de l'utilisateur.
	 *
	 * Masque les messages d'alerte pour l'avatar, l'email, le nom d'utilisateur et le mot de passe.
	 * Envoie les données mises à jour au service de données pour l'utilisateur courant.
	 * Si la mise à jour est réussie, les champs du formulaire sont pré-remplis avec les nouvelles informations.
	 *
	 * @param {Record<string, string>} data - Les données à mettre à jour pour l'utilisateur.
	 * @param {string} [alertDivId] - L'identifiant de la div contenant l'alerte à afficher.
	 * @returns {Promise<void>} - Une promesse qui se résout lorsque l'opération est terminée.
	 */
	private async updateField(data: Record<string, string>, alertDivId?: string): Promise<void> {
		this.hideAlerts();
		const result = await dataService.updateUser(this.currentUser!.id, data, alertDivId);
		if (result === true) {
			this.preFillForm();
		}
	}

	/**
	 * Gestionnaire pour la mise à jour de la méthode de double authentification.
	 *
	 * Lorsque l'utilisateur change la méthode de double authentification,
	 * injecte le modal si la méthode de double authentification est différente de "disabled".
	 * Si le composant est injecté, récupère l'instance du composant,
	 * enregistre les informations de l'utilisateur courant et la page
	 * actuelle, puis affiche le modal avec le QR code ou l'email en fonction de la sélection.
	 * Enfin, met à jour la méthode de double authentification pour
	 * l'utilisateur courant en base de données.
	 *
	 * @param {Event} event - L'événement déclenché par le changement de la méthode de double authentification.
	 * @returns {Promise<void>} - Une promesse qui se résout lorsque l'opération est terminée.
	 */
	private onTwoFaMethodChange = async (event: Event): Promise<void> => {
		this.hideAlerts();
		const target = event.target as HTMLInputElement;
		const method = target.value as TwoFaMethod;

		if (method !== DB_CONST.USER.ACTIVE_2FA.DISABLED) {
			await this.injectTwofaModal();

			// Récupère l’instance du composant 2FA
			const modal = this.getComponentInstance<TwofaModalComponent>(COMPONENT_NAMES.TWOFA_MODAL);
			if (!modal) {
				console.error('Composant 2FA introuvable');
				return;
			}
			modal.setUserTwofaMethod(method);
			modal.setPageOrigin(PAGE_NAMES.SETTINGS);
			modal.setUserData({email: this.currentUser!.email, pageName: PAGE_NAMES.SETTINGS});

			// Affiche le modal
			await modal.show();
		}
		await this.updateField({ twoFaMethod: method }, "twofa-alert");
	};

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
		const componentConfig = this.components![COMPONENT_NAMES.TWOFA_MODAL];
		const twofaModalContainer = getHTMLElementById(HTML_COMPONENT_CONTAINERS.TWOFA_MODAL_ID);
		const twofaModal = new TwofaModalComponent(this.config, componentConfig!, twofaModalContainer);
		await twofaModal.render();
		this.addToComponentInstances(COMPONENT_NAMES.TWOFA_MODAL, twofaModal);
		console.log(`[${this.constructor.name}] Composant '${componentConfig!.name}' généré`);
	}
}