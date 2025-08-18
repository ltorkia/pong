import { z } from 'zod';

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
    maxPlayers: z.number().min(4).max(16),
});

export const TournamentReqSchema = z.object({
    playerID: z.number(),
    tournamentID: z.number(),
});

