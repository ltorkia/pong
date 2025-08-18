import { User } from '../../shared/models/user.model';
import { SafeUserModel } from '../../shared/types/user.types';	// en rouge car dossier local 'shared' != dossier conteneur
import { Notification } from '../../shared/models/notification.model';

// ===========================================
// STORAGE SERVICE
// ===========================================
/**
 * Classe de gestion de l'utilisateur courant
 * en local storage (singleton).
 *
 * Stocke l'utilisateur courant en en local storage (sans email).
 * sous forme de JSON. Cela permet de le récupérer
 * même après fermeture du navigateur.
 */
export class StorageService {
	private storedUser: SafeUserModel | null = null;

	/**
	 * Stocke l'utilisateur courant en local storage.
	 * 
	 * - Sérialise l'utilisateur en un objet SafeUserModel (sans email) pour le stockage local.
	 * - Enregistre les données sérialisées dans le localStorage sous le nom "currentUser".
	 * 
	 * @param {User} user L'utilisateur à définir comme utilisateur courant.
	 */
	public setCurrentUser(user: User) {
		this.storedUser = user.toSafeJSON();
		localStorage.setItem('currentUser', JSON.stringify(this.storedUser));
	}

	/**
	 * Stocke les notifications de l'utilisateur courant en local storage.
	 * 
	 * - Sérialise les notifications en un tableau de JSON.
	 * - Enregistre les données sérialisées dans le localStorage sous le nom "notifs".
	 * 
	 * @param {Notification[]} notifications Les notifications à définir comme notifications courantes.
	 */
	public setCurrentNotifs(notifications: Notification[]) {
		this.storedUser.notifications = notifications.map(n => n.toJSON());
		localStorage.setItem('notifs', JSON.stringify(this.storedUser.notifications));
	}

	/**
	 * Supprime l'utilisateur courant du localStorage.
	 * 
	 * - Supprime l'entrée "currentUser".
	 * 
	 */
	public clearCurrentUser() {
		this.storedUser = null;
		localStorage.removeItem('currentUser');
		console.log(`[${this.constructor.name}] Utilisateur supprimé en local storage`);
	}

	/**
	 * Restaure l'utilisateur courant stocké en local storage.
	 * 
	 * - Tente de restaurer l'utilisateur stocké localement.
	 * - Si un utilisateur est trouvé, il est dé-sérialisé vers une instance de User.
	 * - Si aucun utilisateur n'est trouvé, l'utilisateur courant est laissé à null.
	 * 
	 * @returns {User} L'utilisateur restauré, ou null si la restaurtion a échoué.
	 */
	public restoreFromStorage(): SafeUserModel | null {
		if (this.storedUser) {
			return this.storedUser;
		}
		const storedUserStr = localStorage.getItem('currentUser');
		if (!storedUserStr) {
			return null;
		}
		this.storedUser = JSON.parse(storedUserStr);
		return this.storedUser;
	}
}
