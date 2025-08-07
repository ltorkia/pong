import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { TournamentSchema, TournamentReqSchema, TournamentPlayerReadySchema, StartTournamentSchema } from '../types/zod/game.zod';
import { Tournament, Player } from '../shared/types/game.types'
import { TournamentLobbyUpdate, StartSignal } from '../shared/types/websocket.types'
import { UserWS } from '../types/user.types';

export async function tournamentRoutes(app: FastifyInstance) {
    app.get("/tournaments", async (request: FastifyRequest, reply: FastifyReply) => {
        return reply.send(app.lobby.allTournaments);
    });

    app.get("/tournaments/:id", async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        const tournamentID = Number(id.slice(1));
        const allTournaments = app.lobby.allTournaments;
        const tournament = allTournaments.find((t: Tournament) => t.ID == tournamentID);
        if (tournament) {
            return reply.code(200).send(tournament);
        } else {
            return reply.code(404).send({ error: "Tournament not found" });
        }
    });

    app.post("/new_tournament", async (request: FastifyRequest, reply: FastifyReply) => {
        const tournamentParse = TournamentSchema.safeParse(request.body);

        if (!tournamentParse.success)
            return reply.code(400).send({ error: tournamentParse.error.errors[0].message });

        if (app.lobby.allTournaments.find((t: any) => t.name == tournamentParse.data.name))
            return reply.code(409).send({ error: "Tournament name already exists!" });

        const newTournament = new Tournament(
            tournamentParse.data.name,
            tournamentParse.data.maxPlayers,
            tournamentParse.data.ID,
            tournamentParse.data.masterPlayerID,
            false,
        );
        app.lobby.allTournaments.push(newTournament);
        reply.code(200).send();
    });

    app.post("/join_tournament", async (request: FastifyRequest, reply: FastifyReply) => {
        const joinTournamentReq = TournamentReqSchema.safeParse(request.body);

        if (!joinTournamentReq.success)
            return reply.code(400).send({ error: joinTournamentReq.error.errors[0].message });

        const allTournaments = app.lobby.allTournaments;
        const allPlayers = app.lobby.allPlayers;

        const tournament = allTournaments.find((t: Tournament) => t.ID == joinTournamentReq.data.tournamentID);
        if (!tournament)
            return reply.code(404).send({ error: "Tournament not found" });

        const player = allPlayers.find((p: Player) => p.ID == joinTournamentReq.data.playerID); // necessary ? req.user.id?
        if (!player)
            return reply.code(404).send({ error: "Player not found" });

        for (const tournament of allTournaments) {
            if (tournament.players.find((p: Player) => p.ID == joinTournamentReq.data.playerID))
                return reply.code(409).send({ error: "Can't join more than one tournament!" });
        }

        if (tournament.players.length == tournament.maxPlayers)
            return reply.code(409).send({ error: "Tournament is full!" });

        if (tournament && player) {
            tournament.players.push(player);
            const playerData: TournamentLobbyUpdate = {
                type: "tournament_lobby_update",
                players: tournament.players,
            };
            sendToTournamentPlayers(playerData, tournament, app);
            reply.code(200).send("Join tournament succesfully");
        }
    });

    app.post("/leave_tournament", async (request: FastifyRequest, reply: FastifyReply) => {
        let leaveTournamentReq: any;
        if (typeof request.body == "string")
            leaveTournamentReq = JSON.parse(request.body); // beacon (refresh)
        else
            leaveTournamentReq = request.body; // classic leave

        leaveTournamentReq = TournamentReqSchema.safeParse(leaveTournamentReq);
        if (!leaveTournamentReq.success)
            return reply.code(400).send({ error: leaveTournamentReq.error.errors[0].message });

        const allTournaments = app.lobby.allTournaments;

        const tournament = allTournaments.find((t: Tournament) => t.ID == leaveTournamentReq.data.tournamentID);
        if (!tournament)
            return reply.code(404).send({ error: "Tournament not found" });

        const playerIdx = tournament.players.findIndex((p: Player) => p.ID == leaveTournamentReq.data.playerID);
        if (playerIdx != -1) {
            tournament.players.splice(playerIdx, 1);
            const playerData: TournamentLobbyUpdate = {
                type: "tournament_lobby_update",
                players: tournament.players,
            };
            sendToTournamentPlayers(playerData, tournament, app);
            return reply.code(200).send("Successfully left tournament");
        } else
            console.log("DIDNT FIND PLAYER IN THIS TOURNAMENT");
    });

    app.post("/player_ready", async (request: FastifyRequest, reply: FastifyReply) => {
        const readyReq = TournamentPlayerReadySchema.safeParse(request.body);
        if (!readyReq.success)
            return reply.code(400).send({ error: readyReq.error.errors[0].message });

        const allTournaments = app.lobby.allTournaments;
        const tournament = allTournaments.find((t: Tournament) => t.ID == readyReq.data.tournamentID);
        if (!tournament)
            return reply.code(404).send({ error: "Tournament not found" });

        const player = tournament.players.find((p: Player) => p.ID == readyReq.data.playerID);
        if (!player)
            return reply.code(404).send({ error: "Player not found in tournament" });

        player.ready = readyReq.data.ready;
        const playerData: TournamentLobbyUpdate = {
            type: "tournament_lobby_update",
            players: tournament.players,
        }

        sendToTournamentPlayers(playerData, tournament, app);

        return reply.code(200).send(`Successfully marked player ${player.ID} ready`);
    });

    app.post("/start_tournament", async (request: FastifyRequest, reply: FastifyReply) => {
        const startTournamentReq = StartTournamentSchema.safeParse(request.body);
        if (!startTournamentReq.success)
            return reply.code(400).send({ error: startTournamentReq.error.errors[0].message });

        const allTournaments = app.lobby.allTournaments;
        const tournament = allTournaments.find((t: Tournament) => t.ID == startTournamentReq.data.tournamentID);
        if (!tournament)
            return reply.code(404).send({ error: "Tournament not found" });

        const player = tournament.players.find((p: Player) => p.ID == startTournamentReq.data.playerID);
        if (!player)
            return reply.code(404).send({ error: "Player not found in tournament" });

        if (player.ID != tournament.masterPlayerID)
            return reply.code(403).send({ error: "Can't start tournament if not owner" });

        if (tournament.players.length != tournament.maxPlayers)
            return reply.code(412).send({ error: "Not enough players to start!" });

        for (const player of tournament.players) {
            if (!player.ready)
                return reply.code(412).send({ error: "Not all players are ready!" });
        }

        tournament.isStarted = true;

        const startSignal: StartSignal = { type: "start_signal" };

        sendToTournamentPlayers(startSignal, tournament, app);
    });
}

const sendToTournamentPlayers = (toSend: any, tournament: Tournament, app: FastifyInstance) => {
    for (const player of tournament.players) {
        const userWS: UserWS | undefined = app.usersWS.find((user: UserWS) => user.id == player.ID);
        if (userWS)
            userWS.WS.send(JSON.stringify(toSend));
    }
};
