import { currentService, dataService } from "./user.service";

export class WebSocketService {
	private webSocket: WebSocket | undefined;

	public getWebSocket() {
		return this.webSocket;
	}

	public async openWebSocket() {
		// this.webSocket = new WebSocket(`${location.origin}/api/ws/`);
		const wsProtocol = location.protocol === "https:" ? "wss" : "ws";
		this.webSocket = new WebSocket(`${wsProtocol}://${location.host}/api/ws/`);

		if (!this.webSocket)
			console.log("Websocket problem");
		else
			console.log("WEBSOCKET CONNECTED!");

		this.webSocket.onmessage = async (event) => {
			console.log("TESSSSSSTING WEBSOCKET MESSAGE");
			try {
				const data = JSON.parse(event.data);
				console.log("WebSocket message received:", data);
				if (dataService.isFriendRequest(data)) {
					console.log("Handling friend request:", data);
					await dataService.handleFriendRequest(data);
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
