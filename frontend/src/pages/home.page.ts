import { BasePage } from './base.page';
import { RouteConfig } from '../types/routes.types';
import { ImageService } from '../services/services';
import { IMAGE_CONST } from '../shared/config/constants.config'; // en rouge car dossier local 'shared' != dossier conteneur
import { getHTMLElementById, showAlert, hideSpinner } from '../utils/dom.utils';

// ===========================================
// HOME PAGE
// ===========================================
/**
 * La page d'accueil est chargée lorsque l'utilisateur se connecte.
 * Elle affiche un message de bienvenue avec le nom de l'utilisateur et
 * charge son avatar.
 */
export class HomePage extends BasePage {
	private welcomeContainer!: HTMLElement;
	private avatarInput!: HTMLInputElement;
	private avatarContainer!: HTMLElement;

	/**
	 * Constructeur de la page d'accueil.
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
	 * Montage du composant de la page d'accueil.
	 *
	 * Cette méthode charge l'avatar de l'utilisateur et affiche un message
	 * de bienvenue avec le nom de l'utilisateur.
	 *
	 * @returns Une promesse qui se r solve lorsque le composant est mont .
	 */
	protected async mount(): Promise<void> {
		this.welcomeUser();
		this.loadAvatar();
	}

	/**
	 * Récupère les éléments HTML de la page d'accueil avant de la monter.
	 * 
	 * Stocke les éléments HTML suivants dans les propriétés de l'objet:
	 * - welcomeContainer: le conteneur de la zone de bienvenue.
	 * - avatarInput: l'input de type file servant à sélectionner un fichier image.
	 * - avatarContainer: le conteneur de l'avatar qui sera mis à jour avec l'image sélectionnée.
	 * 
	 * @returns {Promise<void>} Une promesse qui se résout lorsque les éléments HTML ont été stockés.
	 */
	protected async beforeMount(): Promise<void> {
		this.welcomeContainer = getHTMLElementById('welcome-username');
		this.avatarInput = document.getElementById('avatar-input') as HTMLInputElement;
		this.avatarContainer = document.getElementById('avatar-container') as HTMLElement;
	}

	/**
	 * Attribue les gestionnaires d'événement pour :
	 * - Clique sur l'avatar -> déclenche l'ouverture du fichier
	 * - Changement de fichier
	 */
	protected attachListeners(): void {
		this.avatarContainer.addEventListener('click', this.onAvatarClick);
		this.avatarInput.addEventListener('change', this.onAvatarChange);
	}

	/**
	 * Supprime les gestionnaires d'événement attribués à la page d'accueil.
	 *
	 * - Supprime le gestionnaire d'événement pour le clic sur l'avatar.
	 * - Supprime le gestionnaire d'événement pour le changement de fichier.
	 */
	protected removeListeners(): void {
		this.avatarContainer.removeEventListener('click', this.onAvatarClick);
		this.avatarInput.removeEventListener('change', this.onAvatarChange);
	}

	// ===========================================
	// METHODES PRIVATES
	// ===========================================

	/**
	 * Modifie le titre de la page d'accueil pour afficher un message de
	 * bienvenue personnalisé avec le nom d'utilisateur.
	 */
	private welcomeUser() {
		this.welcomeContainer.textContent = `Hi ${this.currentUser!.username} !`;
	}

	/**
	 * Charge l'image d'avatar de l'utilisateur actuel.
	 *
	 * Recherche l'élément HTML de classe "avatar" et y applique
	 * les styles pour afficher l'image d'avatar en arrière-plan.
	 */
	private loadAvatar() {
		Object.assign(this.avatarContainer.style, {
			backgroundImage: `url('${this.currentUserAvatarURL}')`,
			backgroundSize: "cover",
			backgroundPosition: "center"
		});
	}

	/**
	 * Définit l'image d'arrière-plan de l'élément avatar avec l'URL d'image fournie.
	 * L'image est mise à l'échelle pour couvrir tout l'élément et est centrée.
	 * 
	 * @param {string} imageUrl - L'URL de l'image d'avatar.
	 */
	private setAvatarPreview(imageUrl: string): void {
		this.avatarContainer.style.backgroundImage = `url(${imageUrl})`;
		this.avatarContainer.style.backgroundSize = 'cover';
		this.avatarContainer.style.backgroundPosition = 'center';
	}

	/**
	 * Réinitialise l'avatar à sa valeur d'origine, en chargeant l'image d'avatar
	 * de l'utilisateur actuel et en remettant à zéro l'input de type fichier.
	 */
	private resetAvatar(): void {
		this.avatarContainer.style.backgroundImage = `url('${IMAGE_CONST.ROUTE_API}${this.currentUser!.avatar}')`;
		this.avatarInput.value = '';
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
			return
		};

		try {
			// Validation
			const isValidImage = ImageService.isValidImage(file);
			if (!isValidImage) {
				return;
			}

			// Prévisualisation
			const previewUrl = await ImageService.getPreviewUrl(file);
			this.setAvatarPreview(previewUrl);

			// // Upload
			// showSpinner('avatar-spinner');
			// const result = await ImageService.uploadAvatar(file);

			// if (result.errorMessage) {
			// 	showAlert(result.errorMessage || 'Couldn\'t upload image', 'alert', 'error');
			// 	this.resetAvatar();
			// } else {
			// 	showAlert('Image successfully uploaded', 'alert', 'success');
			// 	if (result.avatarUrl) {
			// 		this.setAvatarPreview(result.avatarUrl);
			// 	}
			// }

		} catch (error) {
			console.error('Erreur avatar:', error);
			showAlert('Unexpected error', 'alert', 'error');
			this.resetAvatar();
		} finally {
			hideSpinner('avatar-spinner');
		}
	}
}