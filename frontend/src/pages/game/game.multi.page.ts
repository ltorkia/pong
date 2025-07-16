import { BasePage } from '../base/base.page';
import { RouteConfig } from '../../types/routes.types';
import { PositionObj, PlayerObj, GameData } from '../shared/types/game.types'

export class GameMenuMulti extends BasePage {
    private webSocket: WebSocket | null = null;

    constructor(config: RouteConfig) {
        super(config);
    }

    protected insertNetworkError(): void {
        const errorDiv = document.createElement("div");
        errorDiv.textContent = "Network error. Please try again later";
        document.getElementById("pong-section")!.append(errorDiv);
    }
    
    protected initLobby(): void {
        const lobby = document.createElement("div").textContent = "Waiting for other players to connect...";
        document.getElementById("pong-section")?.append(lobby);
    }

    protected async mount(): Promise<void> {
        this.openWebSocket();
    }

    protected attachListeners(): void {
        this.webSocket?.addEventListener("message", (event) => {
            console.log(event.data);
        })
        this.webSocket?.addEventListener("error", (event) => {
            console.log(event);
        })
    }
    
    private openWebSocket(): void {
        this.webSocket = new WebSocket("wss://localhost:8443/api/ws/multiplayer");
        this.webSocket.onopen = () => {
            this.initLobby();
        };
        this.webSocket.onerror = (event) => {
            this.insertNetworkError();
            if (this.webSocket != null)
                this.webSocket.close();
        }
    }
}