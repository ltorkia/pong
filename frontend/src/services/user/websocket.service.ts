import { notifService, pageService, currentService } from '../index.service';
import { AppNotification } from '../../shared/models/notification.model';
import type { NotificationModel } from '../../shared/types/notification.types';
import { GamePage } from '../../pages/game/game.page';
import { GameTournamentLobby } from '../../pages/game/tournament/game.tournament.lobby.page';
import { isNotificationModel, isValidGameType, isGameMsg, isTournamentMsg } from '../../shared/utils/app.utils';

// export class WebSocketService {
// 	public tabID?: string;
// 	private webSocket: WebSocket | undefined;
// 	private connectionPromise: Promise<void> | null = null;
// 	private isConnecting: boolean = false;
	
// 	private _handlers: {
// 		handleMessage: (e: MessageEvent) => void;
// 		handleClose: (e: CloseEvent) => void;
// 		handleError: (e: Event) => void;
// 	} | null = null;

// 	/**
// 	 * Retourne l'ID de l'onglet actuel, en générant un nouvel ID si nécessaire.
// 	 * L'ID est stocké en session storage pour permettre une connexion
// 	 * WebSocket persistante même après fermeture du navigateur.
// 	 * @return L'ID du tab actuel.
// 	 */
// 	public getTabID(): string {
// 		let tabID = sessionStorage.getItem('tabID');
// 		if (!tabID) {
// 			tabID = crypto.randomUUID();
// 			sessionStorage.setItem('tabID', tabID);
// 		}
// 		return tabID;
// 	}

// 	/**
// 	 * Renvoie l'objet WebSocket ou undefined s'il n'est pas connecté.
// 	 * @returns WebSocket | undefined
// 	 */
// 	public getWebSocket(): WebSocket | undefined {
// 		return this.webSocket;
// 	}

// 	/**
// 	 * Ouverture du WebSocket
// 	 */
// 	public async openWebSocket(): Promise<void> {
// 		// Éviter les connexions multiples simultanées
// 		if (this.isConnecting && this.connectionPromise) {
// 			return this.connectionPromise;
// 		}

// 		// Si déjà ouvert, ne rien faire
// 		if (this.webSocket && this.webSocket.readyState === WebSocket.OPEN) {
// 			console.log("WebSocket déjà ouvert");
// 			return Promise.resolve();
// 		}

// 		// Si en cours de connexion, ne rien faire
// 		if (this.webSocket && this.webSocket.readyState === WebSocket.CONNECTING) {
// 			console.log("WebSocket déjà en cours de connexion");
// 			return Promise.resolve();
// 		}

// 		this.isConnecting = true;
// 		this.connectionPromise = new Promise<void>((resolve, reject) => {
// 			try {
// 				// Nettoyer l'ancienne connexion si elle existe
// 				this.cleanupWebSocket();

// 				this.tabID = this.getTabID();
// 				const wsUrl = `${location.origin.replace(/^http/, 'ws')}/api/ws/?tabID=${this.tabID}`;
// 				this.webSocket = new WebSocket(wsUrl);

// 				// Timeout pour éviter les blocages
// 				const timeout = setTimeout(() => {
// 					reject(new Error("WebSocket connection timeout"));
// 				}, 1000);

// 				// Handlers "open", "error", "close"
// 				const handleOpen = () => {
// 					clearTimeout(timeout);
// 					this.isConnecting = false;
// 					console.log("WEBSOCKET CONNECTED!");
// 					console.log(`-------- TabID: ${this.tabID}`);
// 					this.setupWebSocketHandlers(); // message handlers
// 					resolve();
// 				};

// 				const handleError = (err: Event) => {
// 					clearTimeout(timeout);
// 					this.isConnecting = false;
// 					console.error("Erreur WebSocket:", err);
// 					this.cleanupWebSocket();
// 					reject(err);
// 				};

// 				const handleClose = () => {
// 					clearTimeout(timeout);
// 					this.isConnecting = false;
// 					console.log("WebSocket fermé");
// 					this.webSocket = undefined;
// 				};

// 				// Ajout des listeners
// 				this.webSocket.addEventListener("open", handleOpen);
// 				this.webSocket.addEventListener("error", handleError);
// 				this.webSocket.addEventListener("close", handleClose);

// 				// Stockage pour cleanup
// 				this._handlers = {
// 					handleMessage: null as any, // sera défini dans setupWebSocketHandlers
// 					handleClose,
// 					handleError,
// 				};

// 				// this.webSocket.onopen = () => {
// 				// 	clearTimeout(timeout);
// 				// 	this.isConnecting = false;
// 				// 	console.log("WEBSOCKET CONNECTED!");
// 				// 	this.setupWebSocketHandlers();
// 				// 	resolve();
// 				// };

// 				// this.webSocket.onerror = (err) => {
// 				// 	clearTimeout(timeout);
// 				// 	this.isConnecting = false;
// 				// 	console.error("Erreur WebSocket:", err);
// 				// 	this.cleanupWebSocket();
// 				// 	reject(err);
// 				// };

// 				// this.webSocket.onclose = () => {
// 				// 	clearTimeout(timeout);
// 				// 	this.isConnecting = false;
// 				// 	console.log("WebSocket fermé");
// 				// 	this.webSocket = undefined;
// 				// };

// 			} catch (error) {
// 				this.isConnecting = false;
// 				reject(error);
// 			}
// 		});

// 		try {
// 			await this.connectionPromise;
// 		} catch (error) {
// 			this.connectionPromise = null;
// 			throw error;
// 		} finally {
// 			this.connectionPromise = null;
// 		}
// 	}

// 	/**
// 	 * Configure les gestionnaires d'événements du WebSocket
// 	 */
// 	private setupWebSocketHandlers(): void {
// 		if (!this.webSocket) 
// 			return;


// 		// on stocke les handlers pour pouvoir les retirer plus tard
// 		const handleMessage = async (event: MessageEvent) => {
// 			try {
// 				const receivedData = JSON.parse(event.data);
// 				if (!receivedData) return;

// 				// NOTIFICATIONS MSG
// 				if (Array.isArray(receivedData) && receivedData.every(isNotificationModel)) {
// 					const data = receivedData as NotificationModel[];
// 					const formatedData = AppNotification.fromJSONArray(data) as AppNotification[];
// 					console.log('Notification reçue:', formatedData);
// 					await notifService.handleNotifications(formatedData);
// 					return;
// 				}

// 				// console.log('Message reçu:', receivedData);
// 				// GAME MSG
// 				if (isValidGameType(receivedData.type)) {
// 					if (isGameMsg(receivedData.type)) {
// 						const isGameInit = currentService.getGameInit();
// 						if (!isGameInit || !pageService.currentPage || !(pageService.currentPage instanceof GamePage))
// 							return;
// 						await pageService.currentPage.handleGameMessage(receivedData);
// 					} else if (isTournamentMsg(receivedData.type)) {
// 						if (!pageService.currentPage || !(pageService.currentPage instanceof GameTournamentLobby))
// 							return;
// 						await pageService.currentPage.handleTournamentMessage(receivedData);
// 					}
// 				}
// 			} catch (error) {
// 				console.error("Erreur lors du traitement du message WebSocket:", error);
// 			}
// 		};

// 		const handleClose = () => {
// 			console.log("WebSocket fermé");
// 			this.webSocket = undefined;
// 		};

// 		const handleError = (error: Event) => {
// 			console.error("Erreur WebSocket:", error);
// 		};

// 		// on enregistre les handlers
// 		this.webSocket.addEventListener("message", handleMessage);
// 		this.webSocket.addEventListener("close", handleClose);
// 		this.webSocket.addEventListener("error", handleError);

// 		// on garde une référence pour cleanup
// 		this._handlers = { handleMessage, handleClose, handleError };

// 		// /**
// 		//  * Événement déclenché lors de la réception d'un message WebSocket,
// 		//  * pour traiter les notifications et les messages liés aux jeux.
// 		//  */
// 		// // this.webSocket.onmessage = async (event: MessageEvent) => {
// 		// this.webSocket.addEventListener("message", async (event: MessageEvent) => {
// 		// 	try {
// 		// 		const receivedData = JSON.parse(event.data);
// 		// 		if (!receivedData)
// 		// 			return;

// 		// 		// NOTIFICATIONS MSG
// 		// 		if (Array.isArray(receivedData) && receivedData.every(isNotificationModel)) {
// 		// 			const data = receivedData as NotificationModel[];
// 		// 			const formatedData = AppNotification.fromJSONArray(data) as AppNotification[];
// 		// 			console.log('Notification reçue:', formatedData);
// 		// 			await notifService.handleNotifications(formatedData);
// 		// 			return;
// 		// 		}

// 		// 		// console.log('Message reçu:', receivedData);
// 		// 		// GAME MSG
// 		// 		if (isValidGameType(receivedData.type)) {
// 		// 			if (isGameMsg(receivedData.type)) {
// 		// 				const isGameInit = currentService.getGameInit();
// 		// 				if (!isGameInit || !pageService.currentPage || !(pageService.currentPage instanceof GamePage))
// 		// 					return;
// 		// 				await pageService.currentPage.handleGameMessage(receivedData);
// 		// 			} else if (isTournamentMsg(receivedData.type)) {
// 		// 				if (!pageService.currentPage || !(pageService.currentPage instanceof GameTournamentLobby))
// 		// 					return;
// 		// 				await pageService.currentPage.handleTournamentMessage(receivedData);
// 		// 			}
// 		// 		}
// 		// 	} catch (error) {
// 		// 		console.error("Erreur lors du traitement du message WebSocket:", error);
// 		// 	}
// 		// });
// 		// // };

// 		// this.webSocket.onclose = () => {
// 		// 	console.log("WebSocket fermé");
// 		// 	this.webSocket = undefined;
// 		// };

// 		// this.webSocket.onerror = (error) => {
// 		// 	console.error("Erreur WebSocket:", error);
// 		// };
// 	}

// 	/**
// 	 * Nettoie l'ancienne connexion WebSocket
// 	 */
// 	// private cleanupWebSocket(): void {
// 	// 	if (this.webSocket) {
// 	// 		// Supprimer tous les gestionnaires d'événements
// 	// 		this.webSocket.onopen = null;
// 	// 		this.webSocket.onmessage = null;
// 	// 		this.webSocket.onclose = null;
// 	// 		this.webSocket.onerror = null;

// 	// 		// Fermer si encore ouvert
// 	// 		if (this.webSocket.readyState === WebSocket.OPEN || 
// 	// 			this.webSocket.readyState === WebSocket.CONNECTING) {
// 	// 			this.webSocket.close();
// 	// 		}
// 	// 	}
// 	// }
// 	private cleanupWebSocket(): void {
// 		if (this.webSocket) {
// 			// retirer les listeners si on en a stockés
// 			if (this._handlers) {
// 				this.webSocket.removeEventListener("message", this._handlers.handleMessage);
// 				this.webSocket.removeEventListener("close", this._handlers.handleClose);
// 				this.webSocket.removeEventListener("error", this._handlers.handleError);
// 				this._handlers = null;
// 			}

// 			// fermer proprement
// 			if (this.webSocket.readyState === WebSocket.OPEN || 
// 				this.webSocket.readyState === WebSocket.CONNECTING) {
// 				this.webSocket.close();
// 			}
// 		}

// 		this.webSocket = undefined;
// 	}

// 	/**
// 	 * Fermer le WebSocket
// 	 */
// 	public closeWebSocket(): void {
// 		if (!this.webSocket) {
// 			return;
// 		}

// 		console.log("Fermeture du WebSocket...");
		
// 		// Nettoyer les gestionnaires pour éviter les événements parasites
// 		this.cleanupWebSocket();
		
// 		this.webSocket = undefined;
// 		this.isConnecting = false;
// 		this.connectionPromise = null;
		
// 		console.log("WebSocket fermé");
// 	}

// 	/**
// 	 * Vérifie si le WebSocket est connecté et opérationnel
// 	 */
// 	public isConnected(): boolean {
// 		return this.webSocket !== undefined && this.webSocket.readyState === WebSocket.OPEN;
// 	}

// 	/**
// 	 * Méthode utilitaire pour reconnecter le WebSocket
// 	 */
// 	public async reconnect(): Promise<void> {
// 		console.log("Reconnexion du WebSocket...");
// 		this.closeWebSocket();
// 		await this.openWebSocket();
// 	}
// }

export class WebSocketService {
	public tabID?: string;
	private sockets: Map<string, WebSocket> = new Map();
	private connectionPromises: Map<string, Promise<void>> = new Map();
	private isConnecting: Map<string, boolean> = new Map();
	private handlers: Map<string, { handleMessage: (e: MessageEvent) => void; handleClose: (e: CloseEvent) => void; handleError: (e: Event) => void; }> = new Map();

	/**
	 * Retourne l'ID de l'onglet actuel, en générant un nouvel ID si nécessaire.
	 */
	public getTabID(): string {
		let tabID = sessionStorage.getItem('tabID');
		if (!tabID) {
			tabID = crypto.randomUUID();
			sessionStorage.setItem('tabID', tabID);
		}
		return tabID;
	}

	/**
	 * Renvoie le WebSocket pour un tabID donné
	 */
	public getWebSocket(tabID: string): WebSocket | undefined {
		return this.sockets.get(tabID);
	}

	/**
	 * Ouverture du WebSocket pour un onglet donné
	 */
	public async openWebSocket(tabID?: string): Promise<void> {
		const id = tabID || this.getTabID();
		this.tabID = id;

		if (this.sockets.has(id) && this.sockets.get(id)!.readyState === WebSocket.OPEN) {
			return;
		}
		if (this.isConnecting.get(id)) {
			return this.connectionPromises.get(id);
		}

		this.isConnecting.set(id, true);

		const promise = new Promise<void>((resolve, reject) => {
			try {
				const wsUrl = `${location.origin.replace(/^http/, 'ws')}/api/ws/?tabID=${id}`;
				const ws = new WebSocket(wsUrl);

				const timeout = setTimeout(() => reject(new Error("WebSocket connection timeout")), 3000);

				const handleOpen = () => {
					clearTimeout(timeout);
					this.isConnecting.set(id, false);
					console.log(`WEBSOCKET CONNECTED! TabID: ${id}`);
					this.setupWebSocketHandlers(id, ws);
					resolve();
				};

				const handleError = (err: Event) => {
					clearTimeout(timeout);
					this.isConnecting.set(id, false);
					console.error(`Erreur WebSocket TabID ${id}:`, err);
					ws.close();
					reject(err);
				};

				const handleClose = () => {
					console.log(`WebSocket fermé pour tab ${id}`);
					this.sockets.delete(id);
					this.handlers.delete(id);
				};

				ws.addEventListener("open", handleOpen);
				ws.addEventListener("error", handleError);
				ws.addEventListener("close", handleClose);

				this.sockets.set(id, ws);
			} catch (error) {
				this.isConnecting.set(id, false);
				reject(error);
			}
		});

		this.connectionPromises.set(id, promise);
		try {
			await promise;
		} finally {
			this.connectionPromises.delete(id);
		}
	}

	/**
	 * Configure les gestionnaires d'événements du WebSocket
	 */
	private setupWebSocketHandlers(tabID: string, ws: WebSocket) {
		const handleMessage = async (event: MessageEvent) => {
			try {
				const receivedData = JSON.parse(event.data);
				if (!receivedData) return;

				// Notifications
				if (Array.isArray(receivedData) && receivedData.every(isNotificationModel)) {
					const data = receivedData as NotificationModel[];
					const formatedData = AppNotification.fromJSONArray(data) as AppNotification[];
					console.log('Notification reçue:', formatedData);
					await notifService.handleNotifications(formatedData);
					return;
				}

				// Game messages
				if (isValidGameType(receivedData.type)) {
					if (isGameMsg(receivedData.type)) {
						const isGameInit = currentService.getGameInit();
						if (!isGameInit || !pageService.currentPage || !(pageService.currentPage instanceof GamePage)) return;
						await pageService.currentPage.handleGameMessage(receivedData);
					} else if (isTournamentMsg(receivedData.type)) {
						if (!pageService.currentPage || !(pageService.currentPage instanceof GameTournamentLobby)) return;
						await pageService.currentPage.handleTournamentMessage(receivedData);
					}
				}
			} catch (error) {
				console.error(`Erreur lors du traitement du message WebSocket TabID ${tabID}:`, error);
			}
		};

		const handleClose = () => {
			console.log(`WebSocket fermé pour tab ${tabID}`);
			this.sockets.delete(tabID);
			this.handlers.delete(tabID);
		};

		const handleError = (error: Event) => {
			console.error(`Erreur WebSocket pour tab ${tabID}:`, error);
		};

		ws.addEventListener("message", handleMessage);
		ws.addEventListener("close", handleClose);
		ws.addEventListener("error", handleError);

		this.handlers.set(tabID, { handleMessage, handleClose, handleError });
	}

	/**
	 * Fermer le WebSocket pour un onglet donné
	 */
	public closeWebSocket(tabID?: string) {
		const id = tabID || this.tabID;
		if (!id) return;

		const ws = this.sockets.get(id);
		if (!ws) return;

		console.log(`Fermeture du WebSocket pour tab ${id}...`);

		const handler = this.handlers.get(id);
		if (handler) {
			ws.removeEventListener("message", handler.handleMessage);
			ws.removeEventListener("close", handler.handleClose);
			ws.removeEventListener("error", handler.handleError);
			this.handlers.delete(id);
		}

		ws.close();
		this.sockets.delete(id);
		this.isConnecting.delete(id);
		console.log(`WebSocket fermé pour tab ${id}`);
	}

	/**
	 * Vérifie si un WebSocket est connecté pour un tabID
	 */
	public isConnected(tabID: string): boolean {
		const ws = this.sockets.get(tabID);
		return !!ws && ws.readyState === WebSocket.OPEN;
	}
}