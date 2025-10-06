import { z } from 'zod';
import { FRIEND_REQUEST_ACTIONS } from '../../shared/config/constants.config';

export const PlayerSchema = z.object({
    ID: z.number().max(Number.MAX_SAFE_INTEGER),
    tabID: z.string().optional(),
    webSocket: z.undefined().optional(),
    isTemp: z.boolean(),
    inGame: z.boolean(),
    inTournament: z.boolean(),
    matchMaking: z.boolean(),
    pos: z.number(),
    height: z.number(),
    width: z.number(),
    inputUp: z.boolean(),
    inputDown: z.boolean(),
    alias: z.string(),
});

export const PlayerLocalSchema = z.object({
    id: z.number(),
    alias: z.string(),
});

export const TournamentLocalSchema = z.object({
    players: z.array(z.object({
        ID: z.number(),
        alias: z.string(), 
    })),
    masterPlayerID: z.number(),
    maxPlayers: z.number().min(4).max(4),
    tabID: z.string()
});

export const MatchMakingReqSchema = z.object({
    type: z.enum([
        "matchmaking_request", 
        "clean_request",
        "tournament_clean_request",
        FRIEND_REQUEST_ACTIONS.INVITE, 
        FRIEND_REQUEST_ACTIONS.INVITE_ACCEPT,
        "local", 
        "tournament"
    ]),
    playerID: z.number(),
    tournamentID: z.number().optional(),
    invitedID: z.number().optional(),
    inviterID: z.number().optional(),
    gameID: z.number().optional(),
    inviteToClean: z.boolean().optional(),
    tabID: z.string().optional(),
    inviterTabID: z.string().optional()
});