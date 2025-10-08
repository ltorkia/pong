import { User } from '../../shared/models/user.model';
import { UserModel, SafeUserModel } from '../../shared/types/user.types';
import { storageService, webSocketService, pageService } from '../index.service';

// ===========================================
// CURRENT SERVICE
// ===========================================
/**
 * Classe de stockage / gestion de l'utilisateur courant
 * en local storage, activation du WebSocket 
 * et affichage des éléments de navigation en fonction de l'état de connexion.
 * Si un jeu online est en cours, il est stocké en mémoire vive.
 */
export class CurrentService {
	private currentUser: User | null = null;
	private userReadyDispatched: number | null = null;
	private isCurrentGameInit: Map<string, boolean> = new Map();

	// -------------------------------
	// USER
	// -------------------------------

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
		this.dispatchUserReadyOnce();

		// Ouvre WS si pas déjà ouvert, avec gestion d'erreur
		await this.ensureWebSocketOpen();

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
		this.dispatchUserReadyOnce();

		// Ouvre WS après que l'utilisateur est complètement restauré et valide
		await this.ensureWebSocketOpen();

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
		this.dispatchUserReadyOnce();

		// Ouvre WS si pas déjà ouvert
		await this.ensureWebSocketOpen();

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
		this.userReadyDispatched = null;
		storageService.clearCurrentUser();
		webSocketService.closeWebSocket();

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
			this.dispatchUserReadyOnce();
			
			console.log(`[${this.constructor.name}] User restauré:`, this.currentUser);
			return this.currentUser;
		} catch (error) {
			console.error(`[${this.constructor.name}] Erreur lors de la restauration:`, error);
			storageService.clearCurrentUser();
			return null;
		}
	}

	private dispatchUserReadyOnce(): void {
		if (!this.currentUser) 
			return;
		if (this.userReadyDispatched && this.userReadyDispatched === this.currentUser.id)
			return;
		this.userReadyDispatched = this.currentUser.id;
		document.dispatchEvent(new CustomEvent('user:ready'));
	}

	// -------------------------------
	// WEBSOCKET
	// -------------------------------

	/**
	 * Méthode privée pour gérer l'ouverture du WebSocket de manière sécurisée
	 */
	private async ensureWebSocketOpen(): Promise<void> {
		try {
			const tabID = webSocketService.getTabID();
			const ws = webSocketService.getWebSocket(tabID);
			if (!ws || ws.readyState === WebSocket.CLOSED) {
				await webSocketService.openWebSocket();
			}
		} catch (err) {
			console.warn(`[${this.constructor.name}] Impossible d'ouvrir le WebSocket:`, err);
		}
	}

	// -------------------------------
	// CURRENT GAME
	// -------------------------------

	public setGameInit(isInit: boolean = false) {
		const tabID = webSocketService.getTabID();
		this.isCurrentGameInit.set(tabID, isInit);
	}
	public getGameInit(): boolean {
		const tabID = webSocketService.getTabID();
		return this.isCurrentGameInit.get(tabID) || false;
	}
	public clearCurrentGame() {
		const tabID = webSocketService.getTabID();
		if (this.isCurrentGameInit.has(tabID)) {
			this.isCurrentGameInit.delete(tabID);
		}
	}
}