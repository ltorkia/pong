import { BasePage } from '../base/base.page';
import { RouteConfig } from '../../types/routes.types';

export class GameMenuMulti extends BasePage {
    private webSocket: WebSocket | null = null;

    constructor(config: RouteConfig) {
        super(config);
    }
    
    protected async mount(): Promise<void> {
        this.openWebSocket();
    }

    protected attachListeners(): void {}
    
    private openWebSocket(): void {
        this.webSocket = new WebSocket("wss://localhost:8443/api/ws/multiplayer");
        this.webSocket.onopen = () => {
            console.log('Connected!');
            this.webSocket!.send('Hello Server!');
        };
        this.webSocket.onerror = (event) => {
            console.log(event.target);
        }
        const id = setInterval(() => {
            this.webSocket!.send("coucou connard");
            console.log("id = ", id);
        }, 1000);
    }
}