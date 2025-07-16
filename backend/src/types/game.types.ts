import { Player } from "../shared/types/game.types"

export class Lobby {
    public allPlayers: Player[];

    constructor() {
        this.allPlayers = [];
    }
}

export interface Game {
	id: number;
	status_win: boolean;
	duration: number;
}
