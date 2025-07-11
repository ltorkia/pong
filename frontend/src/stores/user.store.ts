import { User } from '../models/user.model';
import { SafeUserModel } from '../shared/types/user.types';	// en rouge car dossier local 'shared' != dossier conteneur

// ===========================================
// USER STORE
// ===========================================
/**
 * Classe de gestion de l'utilisateur courant
 * en local storage (singleton).
 *
 * Stocke l'utilisateur courant en en local storage (sans email).
 * sous forme de JSON. Cela permet de le récupérer
 * même après fermeture du navigateur.
 */
export class UserStore {
	private storedUser: SafeUserModel | null = null;

	/**
	 * Stovke l'utilisateur courant en local storage.
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
	 * Supprime l'utilisateur courant du localStorage.
	 * 
	 * - Supprime l'entrée "currentUser".
	 * 
	 */
	public clearCurrentUser() {
		this.storedUser = null;
		localStorage.removeItem('currentUser');
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
	// TODO: Prévoir le cas où le user est restauré sans email dans la mémoire vive (faire un fallback api)
	public restoreFromStorage(): SafeUserModel | null {
		const storedUserStr = localStorage.getItem('currentUser');
		if (this.storedUser || !storedUserStr) {
			return null;
		}
		this.storedUser = JSON.parse(storedUserStr);
		return this.storedUser;
	}
}

/**
 * Instance unique du store d'état de l'utilisateur.
 * 
 * Stocke l'utilisateur courant en local storage.
 * 
 * Permet de gérer la connexion et la déconnexion de l'utilisateur,
 * ainsi que la mise à jour de l'utilisateur courant.
 */
export const userStore = new UserStore();
