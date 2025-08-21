import { BasePage } from '../base/base.page';
import { RouteConfig } from '../../types/routes.types';
import { MatchMakingReq } from '../../shared/types/websocket.types';
import { MultiPlayerGame } from '../../components/game/MultiplayerGame.component';
import { webSocketService } from '../../services/user/user.service';

export class GameMenuMulti extends BasePage {
    private webSocket!: WebSocket | undefined;
    private gameStarted: boolean = false;
    private game?: MultiPlayerGame;
    private finalScore: number[] = [];

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

    private initGame(playerID: number, gameID: number): void {
        const allChildren = document.getElementById("pong-section");
        while (allChildren?.firstChild)
            allChildren.firstChild.remove();
        this.game = new MultiPlayerGame(2, playerID, gameID);
        this.game.initGame();
    }

    private showEndGamePanel(): void {
        const panel = document.getElementById("endgame-panel")!;
        panel.classList.remove("hidden");
        panel.innerText += ` ${this.finalScore[0]} : ${this.finalScore[1]}`;
    }

    protected attachListeners(): void {
        webSocketService.getWebSocket()!.addEventListener("message", (event) => {
            const msg = JSON.parse(event.data);
            if (msg.type == "start_game") {
                console.log(`game starts ! id = ${msg.gameID}`);
                this.initGame(this.currentUser.id, msg.gameID);
                this.gameStarted = true;
            } else if (msg.type == "end" && this.gameStarted) {
                this.game!.gameStarted = false;
                console.log("END GAME DETECTED")
                this.game!.clearScreen();
                document.querySelector("canvas")?.remove();
                document.querySelector("#pong-section")!.remove();
                this.finalScore = this.game!.getScore();
                this.showEndGamePanel();
            } else if (msg.type == "GameData") {
                this.game!.registerGameData(msg);
                this.game!.setScore(msg.score);
            } else if (msg.type == "msg")
                console.log(msg.msg);
        })
        this.webSocket?.addEventListener("error", (event) => {
            console.log(event);
        })

        //  document.addEventListener(" ", (event) => {
        //         this.sendMatchMakingRequest();
        //         this.appendWaitText();            
        //  })

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