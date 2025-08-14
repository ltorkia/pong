import { currentService, notifService } from "./user.service";
import { NotificationModel } from "../../shared/models/notification.model";

export class WebSocketService {
	private webSocket: WebSocket | undefined;

	public getWebSocket() {
		return this.webSocket;
	}

	public async openWebSocket() {
		this.webSocket = new WebSocket(`${location.origin}/api/ws/`);

		if (!this.webSocket)
			console.log("Websocket problem");
		else
			console.log("WEBSOCKET CONNECTED!");

		this.webSocket.onmessage = async (event) => {
			try {
				const data = JSON.parse(event.data) as NotificationModel;
				notifService.setNotifData(data);
				if (notifService.isFriendRequest()) {
					console.log("Handling friend request:", data);
					await notifService.handleFriendRequest();
				}
			} catch (err) {
				console.error("Erreur de parsing WebSocket message :", err);
			}
		};
	}

	public webSocketHandler() {
		if (this.webSocket)
			this.webSocket.onclose = () => console.log("websocket closed");
	}
	
	constructor() {
		if (currentService.getCurrentUser())
			this.openWebSocket();
	}
}
