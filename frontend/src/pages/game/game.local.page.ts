import { BasePage } from '../base/base.page';
import { RouteConfig } from '../../types/routes.types';
import { LocalGame } from '../../components/game/Localgame.component';
import { BaseGame } from '../../components/game/BaseGame.component';

export class GameMenuLocal extends BasePage {

    constructor(config: RouteConfig) {
        super(config);
    }

    protected async mount(): Promise<void> {
    }

    private launchGame(): void {
        const mainContainer = document.querySelector("#pong-section");
        while (mainContainer?.lastChild)
            mainContainer.removeChild(mainContainer.lastChild);
        const gameInstance = new LocalGame(2);
        // const gameInstance = new BaseGame(1, );
        gameInstance.initGame();
    }

    protected attachListeners(): any {
        document.addEventListener("keydown", (event) => {
            const nodes: NodeListOf<HTMLElement> = document.querySelectorAll(".control");
            if (event.key === " ") {
                return this.launchGame();
            }
            for (const node of nodes) {
                if (node.dataset.key == event.key)
                    node.classList.add("button-press");
            }
        }
        );
        document.addEventListener("keyup", (event) => {
            const nodes: NodeListOf<HTMLElement> = document.querySelectorAll(".control");
            for (const node of nodes) {
                if (node.dataset.key == event.key)
                    node.classList.remove("button-press");
            }
        });
    }

}