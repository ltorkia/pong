import { User } from '../models/user.model';
import { UserModel, SafeUserModel } from '../../../shared/types/user.types';

// Classe de gestion de l’utilisateur courant (singleton)
export class UserStore {
	private currentUser: User | null = null;

	public getCurrentUser(): User | null {
		return this.currentUser;
	}

	public setCurrentUser(user: User) {
		this.currentUser = user;

		// Stockage complet avec email pour l'utilisateur connecté
		const userData: SafeUserModel = user.toSafeJSON();
		localStorage.setItem('currentUser', JSON.stringify(userData));
		console.log(`[${this.constructor.name}] Utilisateur stocké :`, user.id);
	}

	/**
	 * Met à jour l'utilisateur courant avec les données complètes du serveur
	 * L'email reste en mémoire mais n'est pas sauvegardé
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
	 * Met à jour l'utilisateur courant et le sauvegarde automatiquement
	 * L'email reste en mémoire mais n'est pas sauvegardé
	 */
	public updateCurrentUser(updates: Partial<UserModel>): User | null {
		if (!this.currentUser) {
			return null;
		}
		this.currentUser.update(updates);
		this.setCurrentUser(this.currentUser);
		return this.currentUser;
	}
	
	public clearCurrentUser() {
		if (!this.currentUser) {
			return;
		}
		this.currentUser = null;
		localStorage.removeItem('currentUser');
		console.log(`[${this.constructor.name}] Utilisateur supprimé`);
	}

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
	 * Vérifie si un utilisateur connecté existe
	 */
	public hasCurrentUser(): boolean {
		return this.currentUser !== null;
	}

	/**
	 * Remplace l'utilisateur courant par une nouvelle instance
	 * Utile après une re-synchronisation avec le serveur
	 */
	public replaceCurrentUser(user: User): void {
		this.setCurrentUser(user);
	}

	// ============================================================================
	// MÉTHODES PROXY - DÉLÈGUENT À L'UTILISATEUR COURANT
	// ============================================================================

	/**
	 * Proxy vers currentUser.isOnline() avec vérification null
	 */
	public get isCurrentUserOnline(): boolean {
		return this.currentUser?.isOnline() ?? false;
	}

	/**
	 * Proxy vers currentUser.winRate avec vérification null
	 */
	public get currentUserWinRate(): number {
		return this.currentUser?.winRate ?? 0;
	}

	/**
	 * Proxy vers currentUser.displayName avec vérification null
	 */
	public get currentUserDisplayName(): string {
		return this.currentUser?.displayName ?? '';
	}

	/**
	 * Proxy vers currentUser.formattedTimePlayed avec vérification null
	 */
	public get currentUserFormattedTimePlayed(): string {
		return this.currentUser?.formattedTimePlayed ?? '0h 0m';
	}

	/**
	 * Accès sécurisé à l'email - uniquement disponible en mémoire
	 * Renvoie une string vide si l'utilisateur a été restauré depuis localStorage
	 */
	public get currentUserEmail(): string {
		return this.currentUser?.email ?? '';
	}
}

export const userStore = new UserStore();
