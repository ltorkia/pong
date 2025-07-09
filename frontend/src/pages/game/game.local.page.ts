import { BasePage } from '../base.page';
import { RouteConfig } from '../../types/routes.types';

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
        const counter = document.createElement("div");
        counter.id = "counter";
        mainContainer?.append(counter);
    }

    protected attachListeners(): any {
        document.addEventListener("keydown", (event) => {
            const nodes: NodeListOf<HTMLElement> = document.querySelectorAll(".control");
            if (event.key === " ") {
                return this.launchGame();
            }
            for (const node of nodes)
            {
                if (node.dataset.key == event.key)
                    node.classList.add("button-press");
            }
        }
        );
        document.addEventListener("keyup", (event) => {
            const nodes: NodeListOf<HTMLElement> = document.querySelectorAll(".control");
            for (const node of nodes)
            {
                if (node.dataset.key == event.key)
                    node.classList.remove("button-press");
            }
        });
    }

}