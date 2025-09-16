import { User } from '../../shared/models/user.model';
import { UserModel, SafeUserModel } from '../../shared/types/user.types';
import { storageService, webSocketService, animationService, pageService } from '../index.service';

// ===========================================
// CURRENT SERVICE
// ===========================================
/**
 * Classe de gestion de l'utilisateur courant (singleton).
 */
export class CurrentService {
	private currentUser: User | null = null;

	/**
	 * Vérifie si l'utilisateur courant existe.
	 */
	public hasCurrentUser(): boolean {
		return this.currentUser !== null;
	}

	/**
	 * Renvoie l'utilisateur courant en mémoire vive.
	 */
	public getCurrentUser(): User | null {
		return this.currentUser;
	}

	/**
	 * Définit l'utilisateur courant en mémoire vive et le stocke dans le localStorage.
	 */
	public async setCurrentUser(user: User) {
		this.currentUser = user;
		storageService.setCurrentUser(this.currentUser);

		// Ouvre WS si pas déjà ouvert, avec gestion d'erreur
		await this.ensureWebSocketOpen();

		// Animation de transition des barres de navigation
		// animationService.animateNavbarOut = true;
		if (pageService.homebarInstance)
			pageService.homebarInstance.destroy();
	}

	/**
	 * Met à jour l'utilisateur courant avec les données complètes du serveur.
	 */
	public async setCurrentUserFromServer(userData: UserModel): Promise<void> {
		if (!userData)
			return;
		this.currentUser = User.fromJSON(userData);
		storageService.setCurrentUser(this.currentUser);

		// Ouvre WS après que l'utilisateur est complètement restauré et valide
		await this.ensureWebSocketOpen();

		// Animation de transition des barres de navigation
		// animationService.animateNavbarOut = true;
		if (pageService.homebarInstance)
			pageService.homebarInstance.destroy();

		console.log(`[${this.constructor.name}] Utilisateur mis à jour depuis serveur:`, this.currentUser);
	}

	/**
	 * Met à jour les propriétés de l'utilisateur avec de nouvelles données.
	 */
	public async updateCurrentUser(updates: Partial<UserModel>): Promise<User | null> {
		if (!updates) {
			console.warn(`[${this.constructor.name}] Aucune donnée utilisateur à mettre à jour`);
			return null;
		}
		if (!this.currentUser) {
			console.warn(`[${this.constructor.name}] Aucun utilisateur courant à mettre à jour`);
			return null;
		}
		Object.assign(this.currentUser, updates);
		storageService.setCurrentUser(this.currentUser);

		// Ouvre WS si pas déjà ouvert
		await this.ensureWebSocketOpen();

		// Animation de transition des barres de navigation
		// animationService.animateNavbarOut = true;
		if (pageService.homebarInstance)
			pageService.homebarInstance.destroy();

		console.log(`[${this.constructor.name}] Utilisateur courant mis à jour:`, this.currentUser);
		return this.currentUser;
	}

	/**
	 * Supprime l'utilisateur courant du store et du localStorage.
	 */
	public clearCurrentUser() {
		if (!this.currentUser) {
			return;
		}
		this.currentUser = null;
		storageService.clearCurrentUser();
		webSocketService.closeWebSocket();

		// Animation de transition des barres de navigation
		// animationService.animateHomebarOut = true;
		if (pageService.navbarInstance)
			pageService.navbarInstance.destroy();
	}

	/**
	 * Restaure l'utilisateur courant stocké en local storage.
	 * Peut être null.
	 */
	public async restoreUser(): Promise<User | null> {
		const storedUser: SafeUserModel | null = storageService.restoreFromStorage();
		if (!storedUser) {
			console.log(`[${this.constructor.name}] Pas d'utilisateur stocké localement`);
			return null;
		}

		// Vérifier que l'utilisateur restauré a un ID valide
		if (!storedUser.id) {
			console.warn(`[${this.constructor.name}] Utilisateur stocké sans ID valide`);
			storageService.clearCurrentUser();
			return null;
		}

		try {
			const user = User.fromSafeJSON(storedUser);
			this.currentUser = user;
			storageService.setCurrentUser(this.currentUser);
			this.ensureWebSocketOpen().catch(err => 
				console.warn(`[${this.constructor.name}] WebSocket non ouvert après restauration:`, err)
			);
			
			console.log(`[${this.constructor.name}] User restauré:`, this.currentUser);
			return this.currentUser;
		} catch (error) {
			console.error(`[${this.constructor.name}] Erreur lors de la restauration:`, error);
			storageService.clearCurrentUser();
			return null;
		}
	}

	/**
	 * Méthode privée pour gérer l'ouverture du WebSocket de manière sécurisée
	 */
	private async ensureWebSocketOpen(): Promise<void> {
		try {
			const ws = webSocketService.getWebSocket();
			if (!ws || ws.readyState === WebSocket.CLOSED) {
				await webSocketService.openWebSocket();
			}
		} catch (err) {
			console.warn(`[${this.constructor.name}] Impossible d'ouvrir le WebSocket:`, err);
		}
	}
}