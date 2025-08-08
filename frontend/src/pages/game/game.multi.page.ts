import { BasePage } from '../base/base.page';
import { RouteConfig } from '../../types/routes.types';
// import { PositionObj, PlayerObj, GameData } from '../shared/types/game.types'
import { MatchMakingReq } from '../../shared/types/websocket.types'
import { MultiPlayerGame } from '../../components/game/MultiplayerGame.component';
import { webSocketService } from '../../services/user/user.service';

export class GameMenuMulti extends BasePage {
    private webSocket!: WebSocket | undefined;
    private gameStarted: boolean = false;
    private game?: MultiPlayerGame;

    constructor(config: RouteConfig) {
        super(config);
        this.webSocket = webSocketService.getWebSocket();
    }

    protected insertNetworkError(): void {
        const errorDiv = document.createElement("div");
        errorDiv.textContent = "Network error. Please try again later";
        document.getElementById("pong-section")!.append(errorDiv);
    }

    private appendWaitText(): void {
        const waitDiv: HTMLElement | null = document.getElementById("wait-div");
        if (!waitDiv) {
            const lobby: HTMLElement = document.createElement("div");
            lobby.textContent = "Waiting for other players to connect...";
            lobby.id = "wait-div";
            document.getElementById("pong-section")?.append(lobby);
        }
    }

    private async sendMatchMakingRequest(): Promise<void> {
        const matchMakingReq: MatchMakingReq = {
            type: "matchmaking_request",
            playerID: this.currentUser.id,
        }
        const res = await fetch("/api/game/multiplayer", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(matchMakingReq),
            credentials: 'include',
        });
        if (!res.ok) {
            const error = await res.json();
            console.error(error.error);
            return;
        }
    }

    protected initLobby(): void {

    }

    private initGame(playerID: number, gameID: number): void {
        const allChildren = document.getElementById("pong-section");
        while (allChildren?.firstChild)
            allChildren.firstChild.remove();
        this.game = new MultiPlayerGame(2, playerID, gameID);
        this.game.initGame();
    }

    protected async mount(): Promise<void> {
    }

    protected attachListeners(): void {
        webSocketService.getWebSocket()!.addEventListener("message", (event) => {
            const msg = JSON.parse(event.data);
            if (msg.type == "start_game") {
                console.log(`game starts ! id = ${msg.gameID}`);
                this.initGame(this.currentUser.id, msg.gameID);
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

        document.addEventListener("keydown", (event) => {
            if (event.key == " ") {
                this.sendMatchMakingRequest();
                this.appendWaitText();
            }
            const nodes: NodeListOf<HTMLElement> = document.querySelectorAll(".control");
            for (const node of nodes) {
                if (node.dataset.key == event.key)
                    node.classList.add("button-press");
            }
        });

        document.addEventListener("keyup", (event) => {
            const nodes: NodeListOf<HTMLElement> = document.querySelectorAll(".control");
            for (const node of nodes) {
                if (node.dataset.key == event.key)
                    node.classList.remove("button-press");
            }
        });
    }
}