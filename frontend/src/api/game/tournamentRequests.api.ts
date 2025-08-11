import { Tournament } from "../../../../shared/types/game.types";
import { TournamentLobbyUpdate, PlayerReadyUpdate, DismantleTournament, StartTournament } from "../../shared/websocket.types";

export async function leaveTournamentReq(userID: number, tournamentID: number): Promise<void> {
    const lobbyUpdate: TournamentLobbyUpdate = {
        type: "tournament_lobby_update",
        playerID: userID,
        tournamentID: tournamentID,
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

export function leaveTournamentBeacon(userID: number, tournamentID: number): void {
    const lobbyUpdate: TournamentLobbyUpdate = {
        type: "tournament_lobby_update",
        playerID: userID,
        tournamentID: tournamentID,
    }
    const data = JSON.stringify(lobbyUpdate);
    navigator.sendBeacon("/api/game/leave_tournament", data);
};

export async function joinTournament(userID: number, tournamentID: number): Promise<void> {
    const lobbyUpdate: TournamentLobbyUpdate = {
        type: "tournament_lobby_update",
        playerID: userID,
        tournamentID: tournamentID,
    }
    const res = await fetch("/api/game/join_tournament", {
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

export async function sendReadyRequest(userID: number, tournamentID: number, isReady: boolean): Promise<void> {
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

export async function sendDismantleRequest(userID: number, tournamentID: number): Promise<void> {
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

export async function startTournament(userID: number, tournamentID: number): Promise<void> {
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

export async function postNewTournament(newTournament: Tournament): Promise<void> {
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