import { User } from '../models/user.model';
import { UserModel, SafeUserModel } from '../shared/types/user.types';	// en rouge car dossier local 'shared' != dossier conteneur

// ===========================================
// USER STORE
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
export class UserStore {
	
	/**
	 * L'utilisateur courant en mémoire vive.
	 * Stocke l'utilisateur connecté ou null si pas d'utilisateur connecté.
	 */
	private currentUser: User | null = null;

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
	 * 
	 * @param {User} user L'utilisateur à définir comme utilisateur courant.
	 */
	public setCurrentUser(user: User) {
		this.currentUser = user;

		// Stockage complet avec email pour l'utilisateur connecté
		const userData: SafeUserModel = user.toSafeJSON();
		localStorage.setItem('currentUser', JSON.stringify(userData));
		console.log(`[${this.constructor.name}] Utilisateur stocké :`, user.id);
	}

	/**
	 * Met à jour l'utilisateur courant avec les données complètes du serveur (y compris l'email).
	 * 
	 * - Crée l'instance de l'utilisateur courant avec l'email (en mémoire).
	 * - Sauvegarde un objet SafeUserModel (sans email) dans le localStorage sous le nom "currentUser".
	 * 
	 * @param {UserModel} userData Les données de l'utilisateur courant fournies par le serveur.
	 */
	public setCurrentUserFromServer(userData: UserModel): void {
		// Crée l'instance avec email (en mémoire)
		this.currentUser = User.fromJSON(userData);
		
		// Mais sauvegarde sans email (localStorage)
		const safeUserData: SafeUserModel = this.currentUser.toSafeJSON();
		localStorage.setItem('currentUser', JSON.stringify(safeUserData));
		console.log(`[${this.constructor.name}] Utilisateur mis à jour depuis serveur (email en mémoire uniquement)`);
	}

	/**
	 * Met à jour l'utilisateur courant avec les données fournies.
	 * Si l'utilisateur courant n'existe pas, renvoie null.
	 * 
	 * - Met à jour l'instance de l'utilisateur courant en mémoire avec les données fournies.
	 * - Sauvegarde l'utilisateur courant sans email dans le localStorage.
	 * 
	 * @param {Partial<UserModel>} updates Les données à mettre à jour.
	 * @returns {User | null} L'utilisateur mis à jour, ou null si l'utilisateur courant n'existe pas.
	 */
	public updateCurrentUser(updates: Partial<UserModel>): User | null {
		if (!this.currentUser) {
			return null;
		}
		this.currentUser.update(updates);
		this.setCurrentUser(this.currentUser);
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
		localStorage.removeItem('currentUser');
		console.log(`[${this.constructor.name}] Utilisateur supprimé`);
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
	// TODO: Prévoir le cas où le user est restauré sans email dans la mémoire vive (fallback api)
	public restoreFromStorage(): User | null {
		this.currentUser = null;
		const userJSON = localStorage.getItem('currentUser');
		if (userJSON) {
			const userData: SafeUserModel = JSON.parse(userJSON);
			this.currentUser = User.fromSafeJSON(userData);
			console.log(`[${this.constructor.name}] User restauré :`, this.currentUser.id);
		}
		return this.currentUser;
	}

	/**
	 * Vérifie si l'utilisateur courant existe.
	 * 
	 * @returns {boolean} true si l'utilisateur courant existe, false sinon.
	 */
	public hasCurrentUser(): boolean {
		return this.currentUser !== null;
	}

	/**
	 * Remplace l'utilisateur courant par une nouvelle instance.
	 * 
	 * Utile après une re-synchronisation avec le serveur.
	 * 
	 * @param {User} user La nouvelle instance de User à utiliser comme utilisateur courant.
	 */
	public replaceCurrentUser(user: User): void {
		this.setCurrentUser(user);
	}

	// ============================================================================
	// MÉTHODES PROXY - DÉLÈGUENT À L'UTILISATEUR COURANT
	// ============================================================================

	/**
	 * Indique si l'utilisateur courant est connecté (en ligne).
	 * Renvoie false si l'utilisateur courant n'existe pas.
	 * @returns {boolean} true si l'utilisateur courant est connecté, false sinon.
	 */
	public get isCurrentUserOnline(): boolean {
		return this.currentUser?.isOnline() ?? false;
	}

	/**
	 * Renvoie le taux de victoire de l'utilisateur courant.
	 * Renvoie 0 si l'utilisateur courant n'existe pas.
	 * @returns {number} Taux de victoire de l'utilisateur courant, ou 0 si l'utilisateur n'existe pas.
	 */
	public get currentUserWinRate(): number {
		return this.currentUser?.winRate ?? 0;
	}

	/**
	 * Proxy vers currentUser.displayName avec vérification null.
	 * Renvoie le nom d'affichage de l'utilisateur courant, ou une string vide si l'utilisateur n'existe pas.
	 * @returns {string} Le nom d'affichage de l'utilisateur courant, ou une string vide si l'utilisateur n'existe pas.
	 */
	public get currentUserDisplayName(): string {
		return this.currentUser?.displayName ?? '';
	}

	/**
	 * Proxy vers currentUser.formattedTimePlayed avec vérification null.
	 * Renvoie le temps total de jeu formaté en heures et minutes, ou "0h 0m" si l'utilisateur courant n'existe pas.
	 * @returns {string} Le temps total de jeu formaté, ou "0h 0m" si l'utilisateur n'existe pas.
	 */
	public get currentUserFormattedTimePlayed(): string {
		return this.currentUser?.formattedTimePlayed ?? '0h 0m';
	}

	/**
	 * Accès sécurisé à l'email de l'utilisateur courant.
	 * L'email est stockée en mémoire vive uniquement, et non en localStorage.
	 * Si l'utilisateur courant n'existe pas, renvoie une string vide.
	 * @returns {string} L'email de l'utilisateur courant, ou une string vide si l'utilisateur n'existe pas.
	 */
	public get currentUserEmail(): string {
		return this.currentUser?.email ?? '';
	}
}

/**
 * Instance unique du store d'etat de l'utilisateur.
 * 
 * Stocke l'utilisateur courant en mémoire vive et en local storage.
 * 
 * Permet de gérer la connexion et la déconnexion de l'utilisateur,
 * ainsi que la mise à jour de l'utilisateur courant.
 */
export const userStore = new UserStore();
