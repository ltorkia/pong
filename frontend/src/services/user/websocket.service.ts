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
					console.log(`WEBSOCKET CONNECTED!`);
					console.log(`-- TabID: ${id}`);
					this.setupWebSocketHandlers(id, ws); // tous les listeners centralisés ici
					resolve();
				});

				ws.addEventListener("error", (err) => {
					clearTimeout(timeout);
					this.isConnecting.set(id, false);
					console.error(`Erreur WebSocket TabID ${id}:`, err);
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