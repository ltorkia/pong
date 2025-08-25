import { currentService, notifService } from './user.service';
import { AppNotification } from '../../shared/models/notification.model';
import type { NotificationModel } from '../../shared/types/notification.types';
import { isNotificationModel } from '../../shared/utils/app.utils';

export class WebSocketService {
	private webSocket: WebSocket | undefined;
	private connectionPromise: Promise<void> | null = null;
	private isConnecting: boolean = false;

	
	/**
	 * Renvoie l'objet WebSocket ou undefined s'il n'est pas connecté.
	 * @returns WebSocket | undefined
	 */
	public getWebSocket(): WebSocket | undefined {
		return this.webSocket;
	}

	/**
	 * Ouverture du WebSocket
	 */
	public async openWebSocket(): Promise<void> {
		// Éviter les connexions multiples simultanées
		if (this.isConnecting && this.connectionPromise) {
			return this.connectionPromise;
		}

		// Si déjà ouvert, ne rien faire
		if (this.webSocket && this.webSocket.readyState === WebSocket.OPEN) {
			console.log("WebSocket déjà ouvert");
			return Promise.resolve();
		}

		// Si en cours de connexion, ne rien faire
		if (this.webSocket && this.webSocket.readyState === WebSocket.CONNECTING) {
			console.log("WebSocket déjà en cours de connexion");
			return Promise.resolve();
		}

		this.isConnecting = true;
		this.connectionPromise = new Promise<void>((resolve, reject) => {
			try {
				// Nettoyer l'ancienne connexion si elle existe
				this.cleanupWebSocket();

				const wsUrl = `${location.origin.replace(/^http/, 'ws')}/api/ws/`;
				this.webSocket = new WebSocket(wsUrl);

				// Timeout pour éviter les blocages
				const timeout = setTimeout(() => {
					reject(new Error("WebSocket connection timeout"));
				}, 10000); // 10 secondes

				this.webSocket.onopen = () => {
					clearTimeout(timeout);
					this.isConnecting = false;
					console.log("WEBSOCKET CONNECTED!");
					this.setupWebSocketHandlers();
					resolve();
				};

				this.webSocket.onerror = (err) => {
					clearTimeout(timeout);
					this.isConnecting = false;
					console.error("Erreur WebSocket:", err);
					this.cleanupWebSocket();
					reject(err);
				};

				this.webSocket.onclose = () => {
					clearTimeout(timeout);
					this.isConnecting = false;
					console.log("WebSocket fermé");
					this.webSocket = undefined;
				};

			} catch (error) {
				this.isConnecting = false;
				reject(error);
			}
		});

		try {
			await this.connectionPromise;
		} catch (error) {
			this.connectionPromise = null;
			throw error;
		} finally {
			this.connectionPromise = null;
		}
	}

	/**
	 * Configure les gestionnaires d'événements du WebSocket
	 */
	private setupWebSocketHandlers(): void {
		if (!this.webSocket) 
			return;

		/**
		 * Événement déclenché lors de la réception d'un message WebSocket,
		 * pour traiter les notifications.
		 */
		this.webSocket.onmessage = async (event) => {
			try {
				const dataArray = JSON.parse(event.data);
				if (Array.isArray(dataArray) && dataArray.every(isNotificationModel)) {
					const data = dataArray as NotificationModel[];
					const formatedData = AppNotification.fromJSONArray(data) as AppNotification[];
					console.log('Notification reçue:', formatedData);
					await notifService.handleNotifications(formatedData);
				}
			} catch (error) {
				console.error("Erreur lors du traitement du message WebSocket:", error);
			}
		};

		this.webSocket.onclose = () => {
			console.log("WebSocket fermé");
			this.webSocket = undefined;
		};

		this.webSocket.onerror = (error) => {
			console.error("Erreur WebSocket:", error);
		};
	}

	/**
	 * Nettoie l'ancienne connexion WebSocket
	 */
	private cleanupWebSocket(): void {
		if (this.webSocket) {
			// Supprimer tous les gestionnaires d'événements
			this.webSocket.onopen = null;
			this.webSocket.onmessage = null;
			this.webSocket.onclose = null;
			this.webSocket.onerror = null;

			// Fermer si encore ouvert
			if (this.webSocket.readyState === WebSocket.OPEN || 
				this.webSocket.readyState === WebSocket.CONNECTING) {
				this.webSocket.close();
			}
		}
	}

	/**
	 * Fermer le WebSocket
	 */
	public closeWebSocket(): void {
		if (!this.webSocket) {
			return;
		}

		console.log("Fermeture du WebSocket...");
		
		// Nettoyer les gestionnaires pour éviter les événements parasites
		this.cleanupWebSocket();
		
		this.webSocket = undefined;
		this.isConnecting = false;
		this.connectionPromise = null;
		
		console.log("WebSocket fermé");
	}

	/**
	 * Vérifie si le WebSocket est connecté et opérationnel
	 */
	public isConnected(): boolean {
		return this.webSocket !== undefined && this.webSocket.readyState === WebSocket.OPEN;
	}

	/**
	 * Méthode utilitaire pour reconnecter le WebSocket
	 */
	public async reconnect(): Promise<void> {
		console.log("Reconnexion du WebSocket...");
		this.closeWebSocket();
		await this.openWebSocket();
	}
}