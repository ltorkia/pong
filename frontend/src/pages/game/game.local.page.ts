import { RouteConfig } from '../../types/routes.types';
import { GamePage } from './game.page';

export class GameMenuLocal extends GamePage {

	constructor(config: RouteConfig) {
		super(config);
	}

	protected async initMatchRequest(): Promise<void> {
		this.isSearchingGame = true;
		await this.sendMatchMakingRequest("local");
	}
}