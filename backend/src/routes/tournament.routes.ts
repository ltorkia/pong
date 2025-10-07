import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { TournamentLocalSchema } from '../types/zod/game.zod';
import { Player } from '../shared/types/game.types';
import { Game, TournamentLocal } from '../types/game.types';
import { generateUniqueID } from '../shared/functions'
import { createTournament } from '../db/game';
import { initPlayer } from './game.routes';

export async function tournamentRoutes(app: FastifyInstance) {

    // retourne un tournoi local en particulier
    app.get("/tournaments_local/:id", async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        const tournamentID = Number(id);

        const { allTournamentsLocal } = app.lobby;
        const tournament = allTournamentsLocal.find((t: TournamentLocal) => t.ID == tournamentID);
        if (tournament) {
            return reply.code(200).send(tournament);
        } else {
            return reply.code(404).send({ error: "Tournament not found" });
        }
    });

    // retourne une game de tournoi local en particulier
    app.get("/tournaments_local/game/:id", async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        const gameID = Number(id);

        const { allTournamentsLocal } = app.lobby;

        let game;

        // cherche l'id de la game dans les tournois locaux
        for (const tournamentLocal of allTournamentsLocal) {
            if (tournamentLocal.stageTwo && gameID == tournamentLocal.stageTwo.gameID) {
                game = tournamentLocal.stageTwo;
                break;
            }
            game = tournamentLocal.stageOne.find((g: Game) => g.gameID == gameID);
        }

        if (game)
            return reply.code(200).send(game);
        else
            return reply.code(404).send({ error: "Game not found in local tournaments" });
    })

    app.post("/new_tournament_local", async (request: FastifyRequest, reply: FastifyReply) => {
        const tournamentParse = TournamentLocalSchema.safeParse(request.body);

        const { allPlayers, allGames } = app.lobby;

        // Validation de donnees
        if (!tournamentParse.success) {
            return reply.code(400).send({ error: tournamentParse.error.errors[0].message });
        }

        const players: Player[] = [];

        // -1 pour joueur temporaire (non enregistre, envoye par le front)
        for (const player of tournamentParse.data.players) {
            let newPlayer: Player;
            if (player.ID === -1)
                newPlayer = initPlayer(allPlayers, generateUniqueID(Array.from(allPlayers.keys())), tournamentParse.data.tabID, true, player.alias);
            else
                newPlayer = initPlayer(allPlayers, player.ID, tournamentParse.data.tabID, false, player.alias);
            newPlayer.inTournament = true;
            players.push(newPlayer);
        }
        const tournamentID = await createTournament(tournamentParse.data.maxPlayers, tournamentParse.data.maxPlayers / 2);
        if (!tournamentID)
            return reply.code(500).send({ error: "Database error" });
        const newTournament: TournamentLocal = new TournamentLocal(
            players,
            tournamentParse.data.maxPlayers,
            tournamentParse.data.masterPlayerID,
            tournamentID,
            [allPlayers, allGames]
        );
        app.lobby.allTournamentsLocal.push(newTournament);
        await newTournament.startTournament();
        reply.code(200).send(newTournament.ID);
    });
}