import { RouteConfig, RouteParams } from '../../types/routes.types';
import { GamePage } from './game.page';

export class GameMenuMulti extends GamePage {

	constructor(config: RouteConfig, userId?: number | RouteParams) {
		super(config);
		if (userId)
			this.challengedFriendId = userId;
	}

	protected handleKeyDown = async (event: KeyboardEvent): Promise<void> => {
		this.controlNodesDown = document.querySelectorAll(".control");
		if (event.key == " " && this.isSearchingGame === false) {
			this.isSearchingGame = true;                
			await this.sendMatchMakingRequest("matchmaking_request");
			this.appendWaitText();
		}
		for (const node of this.controlNodesDown) {
			if (node.dataset.key == event.key)
				node.classList.add("button-press");
		}
	}

}