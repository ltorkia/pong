import { GameModel, GameStatus } from '../types/game.types';	// en rouge car dossier local 'shared' != dossier conteneur
import { DB_CONST } from '../config/constants.config'; // en rouge car dossier local 'shared' != dossier conteneur

// ===========================================
// GAME MODEL
// ===========================================

export class Game {

	constructor(
		public id: number,
		public nParticipants: number,
		public begin: string,
		public end: string,
		public tournament: number,
		public status: GameStatus,
		public temporaryResult: number
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
			temporaryResult: this.temporaryResult
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
			data.temporaryResult ?? 0
		);
	}

	// ============================================================================
	// MÉTHODES STATIQUES SUR TABLEAUX D'UTILISATEURS
	// ============================================================================

	public static fromJSONArray(games: Partial<GameModel>[]): Game[] {
		return games.map(game => this.fromJSON(game));
	}

	public static toJSONArray(games: Game[]): GameModel[] {
		return games.map(game => game.toJSON());
	}
}