import { GameModel, GameStatus } from '../types/game.types';
import { SafeUserBasic } from '../types/user.types';
import { DB_CONST } from '../config/constants.config';

export class Game {

	constructor(
		public id: number,
		public nParticipants: number,
		public begin: string,
		public end: string,
		public tournament: number,
		public status: GameStatus,
		public winnerId: number,
		public looserResult: number,
		public statusWin: 0 | 1 | null,
		public duration: number,
		public otherPlayers: SafeUserBasic[] = []
	) {}

	// ============================================================================
	// MÉTHODE DE SÉRIALISATION (OBJECT → JSON)
	// ============================================================================

	public toJSON(): GameModel {
		return {
			id: this.id,
			nParticipants: this.nParticipants,
			begin: this.begin,
			end: this.end,
			tournament: this.tournament,
			status: this.status,
			winnerId: this.winnerId,
			looserResult: this.looserResult,
			statusWin: this.statusWin,
			duration: this.duration,
			otherPlayers: this.otherPlayers
		};
	}

	// ============================================================================
	// MÉTHODE DE DÉSÉRIALISATION (JSON → OBJECT)
	// ============================================================================

	public static fromJSON(data: Partial<GameModel>): Game {
		if (!data.id) {
			throw new Error('ID requis pour créer un jeu');
		}

		return new Game(
			data.id,
			data.nParticipants ?? 0,
			data.begin ?? new Date().toISOString(),
			data.end ?? '',
			data.tournament ?? 0,
			data.status ?? DB_CONST.GAME.STATUS.WAITING,
			data.winnerId ?? 0,
			data.looserResult ?? 0,
			data.statusWin ?? null,
			data.duration ?? 0,
			data.otherPlayers ?? []
		);
	}

	// ============================================================================
	// MÉTHODES STATIQUES SUR TABLEAUX
	// ============================================================================

	public static fromJSONArray(games: Partial<GameModel>[]): Game[] {
		return games.map(game => this.fromJSON(game));
	}

	public static toJSONArray(games: Game[]): GameModel[] {
		return games.map(game => game.toJSON());
	}
}
