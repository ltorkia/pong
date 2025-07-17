import { BasePage } from '../base/base.page';
import { RouteConfig } from '../../types/routes.types';
import { getHTMLElementById, getHTMLElementByClass } from '../../utils/dom.utils';

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
	 * Récupère les éléments HTML de la page d'accueil avant de la monter.
	 * 
	 * Stocke les éléments HTML suivants dans les propriétés de l'objet:
	 * - welcomeContainer: le conteneur de la zone de bienvenue.
	 * - avatarContainer: le conteneur de l'avatar qui sera mis à jour avec l'image sélectionnée.
	 * 
	 * @returns {Promise<void>} Une promesse qui se résout lorsque les éléments HTML ont été stockés.
	 */
	protected async beforeMount(): Promise<void> {
		this.welcomeContainer = getHTMLElementById('welcome-username');
		this.avatarContainer = getHTMLElementByClass('avatar') as HTMLElement;
	}

	/**
	 * Montage du composant de la page d'accueil.
	 *
	 * Cette méthode charge l'avatar de l'utilisateur et affiche un message
	 * de bienvenue avec le nom de l'utilisateur.
	 *
	 * @returns Une promesse qui se résout lorsque le composant est monté.
	 */
	protected async mount(): Promise<void> {
		this.welcomeUser();
		this.loadAvatar();
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
			backgroundImage: `url('${this.currentUserAvatarURL!}')`,
			backgroundSize: "cover",
			backgroundPosition: "center"
		});
	}
}