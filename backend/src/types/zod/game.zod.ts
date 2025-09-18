import { z } from 'zod';
import { FRIEND_REQUEST_ACTIONS } from '../../shared/config/constants.config';

export const PlayerSchema = z.object({
    ID: z.number().max(Number.MAX_SAFE_INTEGER),
    webSocket: z.undefined(),
    inGame: z.boolean(),
    ready: z.boolean(),
    pos: z.number(),
    height: z.number(),
    width: z.number(),
    inputUp: z.boolean(),
    inputDown: z.boolean(),
    alias: z.string(),
});

export const TournamentSchema = z.object({
    name: z.string().min(1).max(16),
    ID: z.number().max(Number.MAX_SAFE_INTEGER),
    isStarted: z.boolean(),
    masterPlayerID: z.number(),
    // player: z.array(PlayerSchema),
    maxPlayers: z.number().min(4).max(4),
});

export const TournamentReqSchema = z.object({
    // type: z.literal("tournament_lobby_update"),
    playerID: z.number(),
    tournamentID: z.number(),
});

export const TournamentPlayerReadySchema = z.object({
    type: z.literal("player_ready_update"),
    playerID: z.number(),
    ready: z.boolean(),
    tournamentID: z.number(),
});


export const StartTournamentSchema = z.object({
    type: z.literal("start_tournament"),
    playerID: z.number(),
    tournamentID: z.number(),
});

export const DismantleTournamentSchema = z.object({
    type: z.literal("dismantle_tournament"),
    playerID: z.number(),
    tournamentID: z.number(),
});

export const MatchMakingReqSchema = z.object({
    type: z.enum([
        "matchmaking_request", 
        "no_matchmaking_request", 
        FRIEND_REQUEST_ACTIONS.INVITE, 
        FRIEND_REQUEST_ACTIONS.INVITE_ACCEPT, 
        "local", 
        "tournament"
    ]),
    playerID: z.number(),
    tournamentID: z.number().optional(),
    invitedId: z.number().optional(),
});
 