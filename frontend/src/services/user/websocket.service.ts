export class WebSocketService {
    private webSocket: WebSocket | undefined;

    public getWebSocket() {
        return this.webSocket;
    }

    public openWebSocket() {
        this.webSocket = new WebSocket(`${location.origin}/api/ws/`);
        if (!this.webSocket)
            console.log("Websocket problem");
        else
            console.log("WEBSOCKET CONNECTED!");
    }

    public webSocketHandler() {
        if (this.webSocket)
            this.webSocket.onclose = () => console.log("websocket closed");
    }
    
    constructor() {
        this.openWebSocket();
    }
}