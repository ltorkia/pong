import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { TournamentSchema } from '../types/zod/game.zod';
import { Tournament, Player } from '../shared/types/game.types'
import { generateUniqueID } from '../shared/functions'
import { z } from "zod";

export async function tournamentRoutes(app: FastifyInstance) {
    app.get("/tournaments", async (request: FastifyRequest, reply: FastifyReply) => {
        return reply.send(app.lobby.allTournaments);
    })

    app.post("/new_tournament", async (request: FastifyRequest, reply: FastifyReply) => {
        const tournamentParse = TournamentSchema.safeParse(request.body);

        if (!tournamentParse.success)
            return reply.code(400).send({error: tournamentParse.error.errors[0].message});

        if (app.lobby.allTournaments.find((t: any) => t.name == tournamentParse.data.name))
            return reply.code(409).send({error: "Tournament name already exists!"});

        const newPlayer = new Player(generateUniqueID(app.lobby.allPlayers), undefined);
        const newTournament = new Tournament(
            tournamentParse.data.name,
            tournamentParse.data.maxPlayers,
            newPlayer.ID,
        );
        newTournament.ID = generateUniqueID(app.lobby.allTournaments);
        newTournament.players.push(newPlayer);
        app.lobby.allTournaments.push(newTournament);
    })
}
