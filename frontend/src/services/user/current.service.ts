import { User } from '../../shared/models/user.model';
import { storageService } from '../index.service';
import { UserModel, SafeUserModel } from '../../shared/types/user.types';
import { webSocketService } from '../../services/index.service';

// ===========================================
// CURRENT SERVICE
// ===========================================
/**
 * Classe de gestion de l'utilisateur courant (singleton).
 *
 * Stocke l'utilisateur courant en mémoire vive (this.currentUser)
 * et en local storage (sans email).
 * Permet de récupérer l'utilisateur courant, de l'initialiser
 * et de le mettre à jour.
 *
 * L'utilisateur courant est stocké en local storage
 * sous forme de JSON avec les propriétés de l'utilisateur
 * sauf l'email. Cela permet de récupérer l'utilisateur
 * même après fermeture du navigateur.
 *
 * La méthode setCurrentUserFromServer met à jour l'utilisateur
 * courant avec les données complètes du serveur (y compris l'email)
 * mais n'enregistre que les données sans email en local storage.
 */
export class CurrentService {
	private currentUser: User | null = null;

	/**
	 * Vérifie si l'utilisateur courant existe.
	 * 
	 * @returns {boolean} true si l'utilisateur courant existe, false sinon.
	 */
	public hasCurrentUser(): boolean {
		return this.currentUser !== null;
	}

	/**
	 * Renvoie l'utilisateur courant en mémoire vive.
	 *
	 * @returns {User | null} L'utilisateur courant, ou null si pas d'utilisateur connecté.
	 */
	public getCurrentUser(): User | null {
		return this.currentUser;
	}

	/**
	 * Définit l'utilisateur courant en mémoire vive et le stocke dans le localStorage.
	 * 
	 * - Met à jour l'utilisateur courant avec les données fournies.
	 * - Sérialise l'utilisateur en un objet SafeUserModel (sans email) pour le stockage local.
	 * - Enregistre les données sérialisées dans le localStorage sous le nom "currentUser".
	 * - Ouvre le WebSocket de l'utilisateur si pas encore ouvert.
	 * 
	 * @param {User} user L'utilisateur à définir comme utilisateur courant.
	 */
	public setCurrentUser(user: User) {
		this.currentUser = user;
		storageService.setCurrentUser(this.currentUser);

		// Ouvre WS si pas déjà ouvert
		if (!webSocketService.getWebSocket()) {
			webSocketService.openWebSocket();
		}
	}

	/**
	 * Met à jour l'utilisateur courant avec les données complètes du serveur (y compris l'email).
	 * 
	 * - Crée l'instance de l'utilisateur courant avec l'email (en mémoire).
	 * - Sauvegarde un objet SafeUserModel (sans email) dans le localStorage sous le nom "currentUser".
	 * 
	 * @param {UserModel} userData Les données de l'utilisateur courant fournies par le serveur.
	 */
	public async setCurrentUserFromServer(userData: UserModel): Promise<void> {
		this.currentUser = User.fromJSON(userData);
		storageService.setCurrentUser(this.currentUser);

		console.log(`[${this.constructor.name}] Utilisateur mis à jour depuis serveur (email en mémoire uniquement):`, this.currentUser);
	}

	/**
	 * Met à jour les propriétés de l'utilisateur avec de nouvelles données.
	 * 
	 * @param {Partial<UserModel>} updates - Objet contenant les propriétés à mettre à jour
	 * @returns {User} - Instance mise à jour (pour chaînage)
	 */
	public async updateCurrentUser(updates: Partial<UserModel>): Promise<User | null> {
		if (!this.currentUser) {
			console.warn(`[${this.constructor.name}] Aucun utilisateur courant à mettre à jour`);
			return null;
		}
		Object.assign(this.currentUser, updates);
		storageService.setCurrentUser(this.currentUser);
		console.log(`[${this.constructor.name}] Utilisateur courant mis à jour`);
		return this.currentUser;
	}

	/**
	 * Supprime l'utilisateur courant du store et du localStorage.
	 * 
	 * - Met l'utilisateur courant à null.
	 * - Supprime l'entrée "currentUser" du localStorage.
	 * 
	 */
	public clearCurrentUser() {
		if (!this.currentUser) {
			return;
		}
		this.currentUser = null;
		storageService.clearCurrentUser();
	}

	/**
	 * Restaure l'utilisateur courant stocké en local storage.
	 * 
	 * - Tente de restaurer l'utilisateur stocké localement.
	 * - Si un utilisateur est trouvé, il est dé-sérialisé vers une instance de User.
	 * - Si aucun utilisateur n'est trouvé, l'utilisateur courant est laissé à null.
	 * 
	 * @returns {User | null} L'utilisateur restauré, ou null si la restaurtion a échoué.
	 */
	public restoreUser(): User | null {
		const storedUser: SafeUserModel | null = storageService.restoreFromStorage();
		if (!storedUser) {
			console.log(`[${this.constructor.name}] Pas d'utilisateur stocké localement`);
			return null;
		}
		const user = User.fromSafeJSON(storedUser);
		this.setCurrentUser(user);
		console.log(`[${this.constructor.name}] User restauré:`, this.currentUser);
		return this.currentUser;
	}
}