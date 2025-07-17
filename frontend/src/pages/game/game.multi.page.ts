import { BasePage } from '../base/base.page';
import { RouteConfig } from '../../types/routes.types';
import { PositionObj, PlayerObj, GameData } from '../shared/types/game.types'
import { MultiPlayerGame } from '../../components/game/MultiplayerGame.component';

export class GameMenuMulti extends BasePage {
    private webSocket!: WebSocket;
    private gameStarted: boolean = false;
    private game?: MultiPlayerGame;

    constructor(config: RouteConfig) {
        super(config);
    }

    protected insertNetworkError(): void {
        const errorDiv = document.createElement("div");
        errorDiv.textContent = "Network error. Please try again later";
        document.getElementById("pong-section")!.append(errorDiv);
    }
    
    protected initLobby(playerID: number): void {
        const lobby = document.createElement("div").textContent = "Waiting for other players to connect...";
        document.getElementById("pong-section")?.append(lobby);
    }

    private initGame(playerID: number): void {
        const game = new MultiPlayerGame(2, this.webSocket, playerID);
        game.initGame();
    }

    protected async mount(): Promise<void> {
        this.openWebSocket();
    }

    protected attachListeners(): void {
        this.webSocket?.addEventListener("message", (event) => {
            console.log(event.data);
            const msg = JSON.parse(event.data);
            if (msg.type == "start") {
                console.log(`game starts ! id = ${msg.ID}`);
                this.initGame(msg.ID);
            } else if (msg.type == "GameData") {
                this.game?.setBallPos(msg.ball.x, msg.ball.y);
            }
        })
        this.webSocket?.addEventListener("error", (event) => {
            console.log(event);
        })
    }
    
    private openWebSocket(): void {
        this.webSocket = new WebSocket("wss://localhost:8443/api/ws/multiplayer");
        this.webSocket.onopen = (event) => {
            console.log("Connected!");
        };
        this.webSocket.onerror = (event) => {
            this.insertNetworkError();
            if (this.webSocket != null)
                this.webSocket.close();
        }
    }
}