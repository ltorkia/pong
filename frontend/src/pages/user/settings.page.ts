import { BasePage } from '../base/base.page';
import { RouteConfig } from '../../types/routes.types';
import { dataService } from '../../services/index.service';
import { authApi } from '../../api/index.api';
import { toggleClass, getHTMLElementById, getHTMLElementByClass, showAlert } from '../../utils/dom.utils';

// ===========================================
// SETTINGS PAGE
// ===========================================
/**
 * L'utilisateur peut changer ses informations personnelles ici, notamment son avatar, son username etc.
 */
export class SettingsPage extends BasePage {
	private avatarContainer!: HTMLElement;
	private avatarInput!: HTMLInputElement;
	private emailInput!: HTMLInputElement;
	private usernameInput!: HTMLInputElement;
	private questionInput!: HTMLInputElement;
	private dropdownTitles!: NodeListOf<HTMLHeadingElement>;
	private form!: HTMLFormElement;
	private alertMsgForm!: HTMLElement;
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
	 * Stocke les éléments HTML suivants dans les propriétés de l'objet:
	 * - avatarContainer: le conteneur de l'avatar qui sera mis à jour avec l'image sélectionnée.
	 * - *Input: tous les input du formulaire.
	 * - dropdownTitles: tous les dropdowns du formulaire.
	 * - form: le formulaire de paramètres de l'utilisateur.
	 * 
	 * @returns {Promise<void>} Une promesse qui se résout lorsque les éléments HTML ont été stockés.
	 */
	protected async beforeMount(): Promise<void> {
		if (!this.currentUser!.email || !this.currentUser!.secretQuestionNumber) {
			this.currentUser = await authApi.getMe();
		}
		this.avatarContainer = getHTMLElementById('avatar-container', this.container) as HTMLElement;
		this.avatarInput = getHTMLElementById('avatar-input', this.container) as HTMLInputElement;
		this.emailInput = getHTMLElementById('email', this.container) as HTMLInputElement;
		this.usernameInput = getHTMLElementById('username', this.container) as HTMLInputElement;
		this.questionInput = getHTMLElementById('question', this.container) as HTMLInputElement;
		this.dropdownTitles = this.container.querySelectorAll('.dropdown-title') as NodeListOf<HTMLHeadingElement>;
		this.form = getHTMLElementById('settings-form', this.container) as HTMLFormElement;
		this.alertMsgForm = getHTMLElementById('alert', this.container) as HTMLElement;
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
	 * Attribue les gestionnaires d'événement pour :
	 * - Clique sur l'avatar -> déclenche l'ouverture du fichier
	 * - Clique sur le dropdown -> ouvre le contenu du dropdown
	 * - Changement de fichier
	 */
	protected attachListeners(): void {
		this.avatarContainer.addEventListener('click', this.onAvatarClick);
		this.avatarInput.addEventListener('change', this.onAvatarChange);
		this.dropdownTitles.forEach((dropdownTitle) => {
			dropdownTitle.addEventListener('click', this.onDropdownClick);
		})
		this.form.addEventListener('submit', this.handleSettingsSubmit);
	}

	/**
	 * Supprime les gestionnaires d'événement attribués à la page d'accueil.
	 *
	 * - Supprime le gestionnaire d'événement pour le clic sur l'avatar.
	 * - Supprime le gestionnaire d'événement pour le clic sur le dropdown.
	 * - Supprime le gestionnaire d'événement pour le changement de fichier.
	 */
	protected removeListeners(): void {
		this.avatarContainer.removeEventListener('click', this.onAvatarClick);
		this.avatarInput.removeEventListener('change', this.onAvatarChange);
		this.dropdownTitles.forEach((dropdownTitle) => {
			dropdownTitle.removeEventListener('click', this.onDropdownClick);
		})
		this.form.removeEventListener('submit', this.handleSettingsSubmit);
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

	private preFillForm(): void {
		this.emailInput.value = this.currentUser!.email;
		this.usernameInput.value = this.currentUser!.username;
		this.questionInput.value = this.currentUser!.secretQuestionNumber.toString();
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

	private async handleAvatarChange(event: Event): Promise<void> {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) { 
			return;
		}
		this.alertMsgForm.classList.add('hidden');
		const result = await dataService.updateAvatar(this.currentUser!.id, file);
		if (result === false) {
			return;
		}
		this.currentUserAvatarURL = await dataService.getUserAvatarURL(this.currentUser!);
		this.loadAvatar();
	}

	/**
	 * Gestionnaire pour le clic sur un dropdown.
	 *
	 * - Inverse l'icône de flèche du dropdown.
	 * - Affiche ou masque le contenu du dropdown.
	 *
	 * @param {Event} event - L'événement de clic déclenché lorsque le dropdown est cliqué.
	 */
	private onDropdownClick = (event: Event): void => {
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
	 * Gestionnaire pour la soumission du formulaire.
	 *
	 * - Empêche le comportement par défaut de soumission HTML.
	 * - Extrait les données du formulaire.
	 * - Appelle le service d'authentification pour enregistrer l'utilisateur.
	 *
	 * @param {Event} event L'événement de soumission du formulaire.
	 */
	protected handleSettingsSubmit = async (event: Event): Promise<void> => {
		event.preventDefault();
		this.alertMsgAvatar.classList.add('hidden');
		const formData = new FormData(this.form);
		const data = Object.fromEntries(formData.entries()) as Record<string, string>;
		await dataService.updateUser(this.currentUser!.id, data);
	};
}