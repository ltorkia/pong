import { RouteConfig, RouteParams } from '../../types/routes.types';
import { GamePage } from './game.page';

export class GameMenuMulti extends GamePage {
	public challengedFriendID: number = 0;

	constructor(config: RouteConfig, params?: RouteParams) {
		super(config);
		if (params && params.userId)
			this.challengedFriendID = Number(params.userId);
	}

	protected async initMatchRequest(): Promise<void> {
		this.isSearchingGame = true;                
		await this.sendMatchMakingRequest("matchmaking_request");
		this.appendWaitText();
	}

}