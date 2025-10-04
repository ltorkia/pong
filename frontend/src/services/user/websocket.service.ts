import { notifService, pageService, currentService } from '../index.service';
import { AppNotification } from '../../shared/models/notification.model';
import type { NotificationModel } from '../../shared/types/notification.types';
import { GamePage } from '../../pages/game/game.page';
import { GameTournamentLobby } from '../../pages/game/tournament/game.tournament.lobby.page';
import { isNotificationModel, isValidGameType, isGameMsg, isTournamentMsg } from '../../shared/utils/app.utils';

export class WebSocketService {
	public tabID?: string;
	private sockets: Map<string, WebSocket> = new Map();
	private connectionPromises: Map<string, Promise<void>> = new Map();
	private isConnecting: Map<string, boolean> = new Map();
	private handlers: Map<string, { 
		handleMessage: (e: MessageEvent) => void; 
		handleClose: (e: CloseEvent) => void; 
		handleError: (e: Event) => void; 
	}> = new Map();
	
	// Paramètres de reconnexion
	private reconnectTimeouts: Map<string, number> = new Map();
	private reconnectAttempts: Map<string, number> = new Map();
	private maxReconnectAttempts = 5;
	private reconnectDelay = 2000; // 2 secondes
	private shouldReconnect: Map<string, boolean> = new Map();

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

		if (this.sockets.has(id) && this.sockets.get(id)!.readyState === WebSocket.OPEN)
			return;
		if (this.isConnecting.get(id))
			return this.connectionPromises.get(id);

		this.shouldReconnect.set(id, true);
		this.isConnecting.set(id, true);

		const promise = new Promise<void>((resolve, reject) => {
			try {
				const wsUrl = `${location.origin.replace(/^http/, 'ws')}/api/ws/?tabID=${id}`;
				const ws = new WebSocket(wsUrl);

				const timeout = setTimeout(() => {
					this.isConnecting.set(id, false);
					reject(new Error("WebSocket connection timeout"));
				}, 3000);

				ws.addEventListener("open", () => {
					clearTimeout(timeout);
					this.isConnecting.set(id, false);
					this.reconnectAttempts.set(id, 0);
					console.log(`WEBSOCKET CONNECTED!`);
					console.log(`-- TabID: ${id}`);
					this.setupWebSocketHandlers(id, ws);
					resolve();
				});

				ws.addEventListener("error", (err) => {
					clearTimeout(timeout);
					this.isConnecting.set(id, false);
					console.error(`Erreur WebSocket.`);
					reject(err);
				});

				this.sockets.set(id, ws);
			} catch (error) {
				this.isConnecting.set(id, false);
				reject(error);
			}
		});

		this.connectionPromises.set(id, promise);
		try {
			await promise;
		} catch (error) {
			this.attemptReconnect(id);
			throw error;
		} finally {
			this.connectionPromises.delete(id);
		}
	}

	/**
	 * Tente de reconnecter le WebSocket après une déconnexion
	 */
	private attemptReconnect(tabID: string) {
		if (!this.shouldReconnect.get(tabID)) {
			console.log(`Reconnexion désactivée pour tab ${tabID}`);
			return;
		}

		const attempts = this.reconnectAttempts.get(tabID) || 0;
		if (attempts >= this.maxReconnectAttempts) {
			console.error(`Nombre maximum de tentatives de reconnexion atteint pour tab ${tabID}`);
			this.shouldReconnect.set(tabID, false);
			return;
		}

		// Annuler tout timeout de reconnexion précédent
		const existingTimeout = this.reconnectTimeouts.get(tabID);
		if (existingTimeout) {
			clearTimeout(existingTimeout);
		}

		// Calculer le délai
		const delay = this.reconnectDelay * Math.pow(1.5, attempts);
		console.warn(`Tentative ${attempts + 1}/${this.maxReconnectAttempts} de reconnexion websocket.`);
		
		const timeout = setTimeout(async () => {
			this.reconnectAttempts.set(tabID, attempts + 1);
			await this.openWebSocket(tabID);
		}, delay);

		this.reconnectTimeouts.set(tabID, Number(timeout));
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

		const handleClose = (event: CloseEvent) => {
			console.log(`WebSocket fermé pour tab ${tabID}`);
			this.sockets.delete(tabID);
			this.handlers.delete(tabID);
			
			// Tenter une reconnexion si ce n'est pas une fermeture normale
			if (event.code !== 1000 && this.shouldReconnect.get(tabID)) {
				console.warn(`Fermeture anormale détectée, tentative de reconnexion...`);
				this.attemptReconnect(tabID);
			}
		};

		const handleError = () => {
			console.error(`Erreur WebSocket.`);
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

		// Désactiver la reconnexion automatique
		this.shouldReconnect.set(id, false);
		
		// Annuler tout timeout de reconnexion en cours
		const timeout = this.reconnectTimeouts.get(id);
		if (timeout) {
			clearTimeout(timeout);
			this.reconnectTimeouts.delete(id);
		}

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

		ws.close(1000, "Fermeture normale");
		this.sockets.delete(id);
		this.isConnecting.delete(id);
		this.reconnectAttempts.delete(id);
		console.log(`WebSocket fermé pour tab ${id}`);
	}

	/**
	 * Vérifie si un WebSocket est connecté pour un tabID
	 */
	public isConnected(tabID: string): boolean {
		const ws = this.sockets.get(tabID);
		return !!ws && ws.readyState === WebSocket.OPEN;
	}

	/**
	 * Nettoyer toutes les ressources (à appeler lors de la destruction de l'application)
	 */
	public cleanup() {
		// Fermer toutes les connexions
		this.sockets.forEach((_, tabID) => {
			this.closeWebSocket(tabID);
		});
		
		// Nettoyer tous les timeouts
		this.reconnectTimeouts.forEach(timeout => clearTimeout(timeout));
		this.reconnectTimeouts.clear();
		
		// Nettoyer toutes les maps
		this.shouldReconnect.clear();
		this.reconnectAttempts.clear();
	}
}