// import { Tournament } from "../../shared/types/game.types";
import { showAlert } from '../../utils/dom.utils';
import { UserModel } from '../../shared/types/user.types';
import { TournamentLobbyUpdate, PlayerReadyUpdate, DismantleTournament, StartTournament } from "../../shared/types/websocket.types";
import { Game, Tournament, TournamentLocal } from "../../types/game.types";

export class TournamentAPI {

    public async leaveTournamentReq(userID: number, tournamentID: number): Promise<void> {
        const lobbyUpdate: TournamentLobbyUpdate = {
            type: "tournament_lobby_update",
            playerID: userID,
            tournamentID: tournamentID,
            players: []
        }
        const res = await fetch("/api/game/leave_tournament", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(lobbyUpdate),
            credentials: 'include',
        });
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error);
        }
    };

    public leaveTournamentBeacon(userID: number, tournamentID: number): void {
        const lobbyUpdate: TournamentLobbyUpdate = {
            type: "tournament_lobby_update",
            playerID: userID,
            tournamentID: tournamentID,
            players: []
        }
        const data = JSON.stringify(lobbyUpdate);
        navigator.sendBeacon("/api/game/leave_tournament", data);
    };

    public async joinTournament(userID: number, tournamentID: number): Promise<void> {
        const lobbyUpdate: TournamentLobbyUpdate = {
            type: "tournament_lobby_update",
            playerID: userID,
            tournamentID: tournamentID,
            players: []
        }
        const res = await fetch("/api/game/join_tournament", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(lobbyUpdate),
            credentials: 'include',
        });
        if (!res.ok) {
            const error = await res.json();
            // showAlert(error, 'Tournament'); //TODO : dans le front, check si deja dans lobby tournament players et en fonction afficher d office LEAVE et pas JOIN
            console.log(error);
            throw new Error(error.error);
        }
    };

    public async sendReadyRequest(userID: number, tournamentID: number, isReady: boolean): Promise<void> {
        const readyUpdate: PlayerReadyUpdate = {
            type: "player_ready_update",
            playerID: userID,
            tournamentID: tournamentID,
            ready: isReady
        };
        const res = await fetch("/api/game/player_ready", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(readyUpdate),
            credentials: 'include',
        });
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error);
        }
    };

    public async sendDismantleRequest(userID: number, tournamentID: number): Promise<void> {
        const dismantleReq: DismantleTournament = {
            type: "dismantle_tournament",
            playerID: userID,
            tournamentID: tournamentID,
        }
        const res = await fetch("/api/game/dismantle_tournament", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dismantleReq),
            credentials: 'include',
        });
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error);
        }
    }

    public async startTournament(userID: number, tournamentID: number): Promise<void> {
        const startTournamentReq: StartTournament = {
            type: "start_tournament",
            playerID: userID,
            tournamentID: tournamentID,
        };
        const res = await fetch("/api/game/start_tournament", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(startTournamentReq),
            credentials: 'include',
        });
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error);
        }
    }

    public async postNewTournament(newTournament: Tournament): Promise<void> {
        const res: Response = await fetch('/api/game/new_tournament', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newTournament),
            credentials: 'include',
        });
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error);
        }
    }

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

    public async fetchTournament(tournamentID: number): Promise<Tournament | undefined> {
        const res = await fetch(`/api/game/tournaments/:${tournamentID}`);
        if (res.ok) {
            const tournamentJSON: Tournament = await res.json();
            return new Tournament(
                tournamentJSON.name,
                tournamentJSON.maxPlayers,
                tournamentJSON.ID,
                tournamentJSON?.masterPlayerID,
                tournamentJSON?.stageOneGames,
                tournamentJSON?.stageTwoGames,
                tournamentJSON?.isStarted,
                tournamentJSON?.players
            );
        } else {
            console.error("Tournament not found");
            return undefined;
        }
    }

    public async fetchLocalTournamentGame(gameID: number): Promise<Game | undefined> {
        const res = await fetch(`/api/game/tournaments_local/game/:${gameID}`);
        if (res.ok) {
            const gameJSON: Game = await res.json();
            return new Game(
                gameJSON.players,
                gameJSON.gameIDforDB,
                gameJSON.playersCount,
                gameJSON.gameStarted,
                gameJSON.isOver,
                gameJSON.score,
            );
        }
    }

    public async fetchLocalTournament(tournamentID: number): Promise<TournamentLocal | undefined> {
        const res = await fetch(`/api/game/tournaments_local/:${tournamentID}`);
        if (res.ok) {
            const tournamentJSON: TournamentLocal = await res.json();
            console.log(tournamentJSON);
            return new TournamentLocal(
                tournamentJSON.maxPlayers,
                tournamentJSON.masterPlayerID,
                tournamentJSON.players,
                tournamentJSON?.stageOne,
                tournamentJSON?.stageTwo,
            );
        } else {
            console.error("Tournament not found");
            return undefined;
        }
    }

    public async fetchUser(userID: number): Promise<UserModel | undefined> {
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
