import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { TournamentSchema, TournamentReqSchema } from '../types/zod/game.zod';
import { Tournament, Player } from '../shared/types/game.types'
import { TournamentLobbyUpdate } from '../shared/types/websocket.types'
import { UserWS } from 'src/types/user.types';

export async function tournamentRoutes(app: FastifyInstance) {
    app.get("/tournaments", async (request: FastifyRequest, reply: FastifyReply) => {
        return reply.send(app.lobby.allTournaments);
    })

    app.get("/tournaments/:id", async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        const tournamentID = Number(id.slice(1));
        const allTournaments = app.lobby.allTournaments;
        const tournament = allTournaments.find((t: Tournament) => t.ID == tournamentID);
        console.log("LOOKING FOR TOURNAMENT")
        if (tournament) {
            return reply.code(200).send(tournament);
        } else {
            return reply.code(404).send({ error: "Tournament not found" });
        }
    })

    app.post("/new_tournament", async (request: FastifyRequest, reply: FastifyReply) => {
        const tournamentParse = TournamentSchema.safeParse(request.body);

        if (!tournamentParse.success)
            return reply.code(400).send({ error: tournamentParse.error.errors[0].message });

        if (app.lobby.allTournaments.find((t: any) => t.name == tournamentParse.data.name))
            return reply.code(409).send({ error: "Tournament name already exists!" });

        console.log("new tournament !");
        console.log(app.usersWS);

        // const newPlayer = new Player(tournamentParse.data.masterPlayerID);
        const newTournament = new Tournament(
            tournamentParse.data.name,
            tournamentParse.data.maxPlayers,
            tournamentParse.data.ID,
            tournamentParse.data.masterPlayerID,
            false,
        );
        // newTournament.players.push(newPlayer);
        app.lobby.allTournaments.push(newTournament);
        reply.code(200).send();
    });

    app.post("/join_tournament", async (request: FastifyRequest, reply: FastifyReply) => {
        console.log("JOINED TOUURNAMENENNTNNTNT");
        const joinTournamentReq = TournamentReqSchema.safeParse(request.body);

        if (!joinTournamentReq.success)
            return reply.code(400).send({ error: joinTournamentReq.error.errors[0].message });

        const allTournaments = app.lobby.allTournaments;
        const allPlayers = app.lobby.allPlayers;

        const tournament = allTournaments.find((t: Tournament) => t.ID == joinTournamentReq.data.tournamentID);
        if (!tournament) {
            console.log(`TOURNAMENT ${joinTournamentReq.data.tournamentID} NOT FOUND`);
            return reply.code(404).send({ error: "Tournament not found" });
        }

        const player = allPlayers.find((p: Player) => p.ID == joinTournamentReq.data.playerID); // necessary ? req.user.id?
        if (!player) {
            console.log(`PLAYER ${joinTournamentReq.data.playerID} NOT FOUND`);
            console.log(allPlayers);
            return reply.code(404).send({ error: "Player not found" });
        }

        for (const tournament of allTournaments) {
            if (tournament.players.find((p: Player) => p.ID == joinTournamentReq.data.playerID))
                return reply.code(409).send({ error: "Can't join more than one tournament!" });
        }

        if (tournament.players.length == tournament.maxPlayers)
            return reply.code(409).send({ error: "Tournament is full!" });

        if (tournament && player) {
            tournament.players.push(player);
            reply.code(200).send("Join tournament succesfully");
            for (const player of tournament.players) {
                const userWS: UserWS | undefined = app.usersWS.find((user: UserWS) => user.id == player.ID);
                const playerData: TournamentLobbyUpdate = {
                    type: "tournament_lobby_update",
                    players: tournament.players,
                };
                console.log("SENDING MESSAGE");
                console.log(playerData);
                if (userWS)
                    userWS.WS.send(JSON.stringify(playerData));
            }
        }
    })

    app.post("/leave_tournament", async (request: FastifyRequest, reply: FastifyReply) => {
        console.log("LEAVE TOURNAMENT REQUEST !");
        console.log(app.usersWS);

        let leaveTournamentReq: any;
        if (typeof request.body == "string") {
            leaveTournamentReq = JSON.parse(request.body); // beacon (refresh)
            console.log("BEACON DETECTED");
        }
        else
            leaveTournamentReq = request.body; // classic leave
        leaveTournamentReq = TournamentReqSchema.safeParse(leaveTournamentReq);
        if (!leaveTournamentReq.success)
            return reply.code(400).send({ error: leaveTournamentReq.error.errors[0].message });

        console.log(`leaving player id = ${leaveTournamentReq.data.playerID}`);

        const allTournaments = app.lobby.allTournaments;

        const tournament = allTournaments.find((t: Tournament) => t.ID == leaveTournamentReq.data.tournamentID);
        if (!tournament) {
            console.log(`TOURNAMENT ${leaveTournamentReq.data.tournamentID} NOT FOUND`);
            return reply.code(404).send({ error: "Tournament not found" });
        } 
        
        console.log(tournament.players);

        const playerIdx = tournament.players.findIndex((p: Player) => p.ID == leaveTournamentReq.data.playerID);
        if (playerIdx != -1) {
            tournament.players.splice(playerIdx, 1);
            console.log(tournament.players);
            console.log(app.usersWS);
            for (const player of tournament.players) {
                const userWS: UserWS | undefined = app.usersWS.find((user: UserWS) => user.id == player.ID);
                console.log("USER WS :");
                console.log(userWS);
                const playerData: TournamentLobbyUpdate = {
                    type: "tournament_lobby_update",
                    players: tournament.players,
                };
                if (userWS) {
                    userWS.WS.send(JSON.stringify(playerData));
                    console.log("SOMEONE LEFT MESSAGE SENT");
                } else {
                    console.log("DIDNT FIND ANY PLAYER TO SEND MESG");
                }
            }
            console.log("PLAYER SUCCESSFULLY DELETED FORM TOURNAmENT ")
            return reply.code(200).send("Successfully left tournament");
        } else {
            console.log("DIDNT FIND PLAYER IN THIS TOURNAMENT");
        }
    })
}
