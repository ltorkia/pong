import { currentService } from "./user.service";

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

		this.webSocket.onmessage = (event) => {
			try {
				const data = JSON.parse(event.data);
				if (data.type === "send" && data.from && data.to) {
					console.log(`SOCKET ADD FRIENDDDDD`, data);
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