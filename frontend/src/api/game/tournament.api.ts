import { UserModel } from '../../shared/types/user.types';
import { TournamentLobbyUpdate, PlayerReadyUpdate, DismantleTournament, StartTournament } from "../../shared/types/websocket.types";
import { Game, Tournament, TournamentLocal } from "../../types/game.types";

export class TournamentAPI {

    public async postNewLocalTournament(newTournament: TournamentLocal): Promise<void> {
        const res: Response = await fetch('/api/game/new_tournament_local', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newTournament),
            credentials: 'include',
        });
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error);
        }
        const tournamentID = await res.json();
        return tournamentID;
    }

    public async fetchLocalTournamentGame(gameID: number): Promise<Game | undefined> {
        const res = await fetch(`/api/game/tournaments_local/game/${gameID}`);
        if (res.ok) {
            const gameJSON: Game = await res.json();
            return new Game(
                gameJSON.players,
                gameJSON.gameID,
                gameJSON.playersCount,
                gameJSON.gameStarted,
                gameJSON.isOver,
                gameJSON.score,
            );
        }
        else
            return undefined;
    }

    public async fetchLocalTournament(tournamentID: number): Promise<TournamentLocal | undefined> {
        const res = await fetch(`/api/game/tournaments_local/${tournamentID}`);
        if (res.ok) {
            const tournamentJSON: TournamentLocal = await res.json();
            return new TournamentLocal(
                tournamentJSON.maxPlayers,
                tournamentJSON.winner ?? undefined,
                tournamentJSON.masterPlayerID,
                tournamentJSON.players,
                tournamentJSON.tabID,
                tournamentJSON?.stageOne,
                tournamentJSON?.stageTwo,
            );
        } else {
            console.error("Tournament not found");
            return undefined;
        }
    }

    public async fetchUser(userID: number): Promise<UserModel | undefined | null> {
        const res = await fetch(`/api/users/${userID}`)
        if (res.status === 404)
            return null;
        if (!res.ok)
            console.error("Erreur serveur");
        if (res.ok) {
            const user: UserModel = await res.json();
            return user;
        }
        console.error("User fetch failed");
        return undefined;
    }
}
