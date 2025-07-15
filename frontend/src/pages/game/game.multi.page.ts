import { BasePage } from '../base/base.page';
import { RouteConfig } from '../../types/routes.types';
import { PositionObj, PlayerObj, GameData } from '../shared/types/game.types'

export class GameMenuMulti extends BasePage {
    private webSocket: WebSocket | null = null;

    constructor(config: RouteConfig) {
        super(config);
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
            console.log('Connected!');
            // this.webSocket!.send('Hello Server!');
        };
        this.webSocket.onerror = (event) => {
            console.log(event.target);
        }
        const id = setInterval(() => {
            const player: PositionObj = {x: 0, y: 1};
            this.webSocket!.send(JSON.stringify(player));
        }, 1000);
    }
}