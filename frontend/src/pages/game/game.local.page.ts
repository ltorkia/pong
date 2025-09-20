import { RouteConfig } from '../../types/routes.types';
import { GamePage } from './game.page';

export class GameMenuLocal extends GamePage {

    constructor(config: RouteConfig) {
        super(config);
    }

    protected handleKeyDown = async (event: KeyboardEvent): Promise<void> => {
        event.preventDefault();
        console.log(this.gameType);
        this.controlNodesDown = document.querySelectorAll(".control");
        if (event.key == " " && this.isSearchingGame === false) { 
            this.isSearchingGame = true;
            await this.sendMatchMakingRequest("local");
        }
        for (const node of this.controlNodesDown) {
            if (node.dataset.key == event.key)
                node.classList.add("button-press");
        }
    }
}