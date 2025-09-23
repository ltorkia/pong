import { RouteConfig, RouteParams } from '../../types/routes.types';
import { GamePage } from './game.page';

export class GameMenuMulti extends GamePage {

	constructor(config: RouteConfig, userId?: number | RouteParams) {
		super(config);
		if (userId)
			this.challengedFriendId = userId;
	}

	protected async initMatchRequest(): Promise<void> {
		this.isSearchingGame = true;                
		await this.sendMatchMakingRequest("matchmaking_request");
		this.appendWaitText();
	}

}