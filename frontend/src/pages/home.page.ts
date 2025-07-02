import { BasePage } from './base.page';
import { RouteConfig } from '../types/routes.types';
import { getHTMLElementByClass } from '../utils/dom.utils';
import { UserCrudApi } from 'src/api/user/user-crud.api';

// ===========================================
// HOME PAGE
// ===========================================
/**
 * La page d'accueil est chargée lorsque l'utilisateur se connecte.
 * Elle affiche un message de bienvenue avec le nom de l'utilisateur et
 * charge son avatar.
 */
export class HomePage extends BasePage {

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

	/**
	 * Montage du composant de la page d'accueil.
	 *
	 * Cette méthode charge l'avatar de l'utilisateur et affiche un message
	 * de bienvenue avec le nom de l'utilisateur.
	 *
	 * @returns Une promesse qui se r solve lorsque le composant est mont .
	 */
	protected async mount(): Promise<void> {
		this.loadAvatar();
		this.welcomeUser();
	}

	/**
	 * Modifie le titre de la page d'accueil pour afficher un message de
	 * bienvenue personnalis  avec le nom d'utilisateur.
	 *
	 * Récupère l'élément HTMl de classe "page-title" et le remplace par
	 * un message de bienvenue utilisant le nom d'utilisateur de l'utilisateur
	 * actuel.
	 */
	private welcomeUser() {
		const h1 = getHTMLElementByClass('page-title');
		if (this.currentUser && h1) {
			h1.textContent = `Hi ${this.currentUser.username} !`;
		}
	}

	/**
	 * Charge l'image d'avatar de l'utilisateur actuel.
	 *
	 * Recherche l'élément HTML de classe "avatar" et y applique
	 * les styles pour afficher l'image d'avatar en arrière-plan.
	 */

	public async getAvatar64(id: number): Promise<string> {
		const res = await fetch(`api/users/${id}/avatar`, { method: 'GET' });
		if (!res.ok) {
			throw new Error('Erreur de l’API');
		}
		const avatarBase64 = await res.json(); //pb inutile
		return avatarBase64.avatar;
	}

	private async loadAvatar() {
		const avatar = getHTMLElementByClass('avatar');
		const base64Image = await this.getAvatar64(this.currentUser!.id);
		console.log(base64Image);

		Object.assign(avatar.style, {
			// backgroundImage: `url('/api/avatar/${this.currentUser!.id}')`,
			backgroundImage: `data:image/jpeg;base64,${base64Image}`,
			backgroundSize: "cover",
			backgroundPosition: "center"
		});
	}
}