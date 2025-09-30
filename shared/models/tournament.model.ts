import { GameModel } from '../types/game.types';
import { TournamentModel } from '../types/game.types';

export class Tournament {

	constructor(
		// Infos User_Tournament
		public tournamentId: number,
		public alias: string | null,
		public score: number,
		public wins: number,
		public losses: number,
		public roundReached: number,
		public status: 'active' | 'eliminated' | 'finished',
		public registeredAt: string,

		// Infos Tournament
		public nParticipants: number,
		public nRound: number,
		public startedAt: string,
		public endedAt: string,
		public tournamentStatus: 'pending' | 'in_progress' | 'cancelled' | 'finished',

		// Liste des parties associées
		public games: GameModel[]
	) {}

	// ============================================================================
	// MÉTHODE DE SÉRIALISATION (OBJECT → JSON)
	// ============================================================================

	public toJSON(): TournamentModel {
		return {
			tournamentId: this.tournamentId,
			alias: this.alias,
			score: this.score,
			wins: this.wins,
			losses: this.losses,
			roundReached: this.roundReached,
			status: this.status,
			registeredAt: this.registeredAt,
			nParticipants: this.nParticipants,
			nRound: this.nRound,
			startedAt: this.startedAt,
			endedAt: this.endedAt,
			tournamentStatus: this.tournamentStatus,
			games: this.games
		};
	}

	// ============================================================================
	// MÉTHODE DE DÉSÉRIALISATION (JSON → OBJECT)
	// ============================================================================

	public static fromJSON(data: Partial<TournamentModel>): Tournament {

		if (!data.tournamentId) {
			throw new Error('ID du tournoi requis pour créer un Tournament');
		}

		return new Tournament(
			data.tournamentId,
			data.alias ?? null,
			data.score ?? 0,
			data.wins ?? 0,
			data.losses ?? 0,
			data.roundReached ?? 0,
			data.status ?? 'active',
			data.registeredAt ?? new Date().toISOString(),
			data.nParticipants ?? 4,
			data.nRound ?? 2,
			data.startedAt ?? new Date().toISOString(),
			data.endedAt ?? '',
			data.tournamentStatus ?? 'pending',
			data.games ?? []
		);
	}

	// ============================================================================
	// MÉTHODES STATIQUES SUR TABLEAUX
	// ============================================================================

	public static fromJSONArray(tournaments: Partial<TournamentModel>[]): Tournament[] {
		return tournaments.map(t => this.fromJSON(t));
	}

	public static toJSONArray(tournaments: Tournament[]): TournamentModel[] {
		return tournaments.map(t => t.toJSON());
	}
}
