import { BasePage } from '../base/base.page';
import { RouteConfig } from '../../types/routes.types';
// import { PositionObj, PlayerObj, GameData } from '../shared/types/game.types'
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
    
    protected initLobby(): void {
        const lobby = document.createElement("div").textContent = "Waiting for other players to connect...";
        document.getElementById("pong-section")?.append(lobby);
    }

    private initGame(playerID: number, gameID: number): void {
        this.game = new MultiPlayerGame(2, this.webSocket, playerID, gameID);
        this.game.initGame();
    }

    protected async mount(): Promise<void> {
        this.openWebSocket();
    }

    protected attachListeners(): void {
        this.webSocket?.addEventListener("message", (event) => {
            const msg = JSON.parse(event.data);
            if (msg.type == "start") {
                console.log(`game starts ! id = ${msg.gameID}`);
                this.initGame(msg.playerID, msg.gameID);
            } else if (msg.type == "end") {
                console.log("END GAME DETECTED")
                this.game!.clearScreen();
                document.querySelector("canvas")?.remove();
                this.initLobby();
            } else if (msg.type == "GameData") {
                this.game!.setAllPositions(msg);
            } else if (msg.type == "msg")
                console.log(msg.msg);
        })
        this.webSocket?.addEventListener("error", (event) => {
            console.log(event);
        })
    }

    private openWebSocket(): void {
        this.webSocket = new WebSocket("wss://localhost:8443/api/ws/multiplayer");
        this.webSocket.onopen = (event) => {
            console.log("Connected!");
            // this.webSocket.send("COUCOU LE SERVEUR");
            this.initLobby();
        };
        this.webSocket.onerror = (event) => {
            this.insertNetworkError();
            if (this.webSocket != null)
                this.webSocket.close();
        }
    }
}