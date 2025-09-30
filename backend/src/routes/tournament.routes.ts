import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { TournamentSchema, TournamentReqSchema, TournamentPlayerReadySchema, StartTournamentSchema, DismantleTournamentSchema, TournamentLocalSchema } from '../types/zod/game.zod';
import { Player } from '../shared/types/game.types';
import { Game, Tournament, TournamentLocal } from '../types/game.types';
import { TournamentLobbyUpdate, StartTournamentSignal, DismantleSignal } from '../shared/types/websocket.types'
import { UserWS } from '../types/user.types';
import { generateUniqueID } from '../shared/functions'
import { addGame, addGamePlayers, getResultGame, createTournament } from '../db/game';

// Differentes routes pour differents besoins lies aux tournois en remote
// Les tournois existent en backend dans app.lobby.allTournaments
// Toutes les infos necessaires a une action sont validees avec ZOD, voir les differents schemas pour mieux comprendre les requetes
// Toutes les updates (player join, leave, ready) sont renvoyees au front via WebSocket (== broadcast(), sendToTournamentPLayers())
// pour un affichage en temps reel et pour eviter au front de faire des requetes HTTP en continu
// app.get, app.post == Requete HTTP du front, qui va en general se finir par un update via WebSocket

export async function tournamentRoutes(app: FastifyInstance) {
    // retourne tous les tournois existants
    app.get("/tournaments", async (request: FastifyRequest, reply: FastifyReply) => {
        console.log("tournament response:", app.lobby.allTournaments);
        return reply.send(app.lobby.allTournaments);
    });

    // retourne un tournoi remote en particulier
    app.get("/tournaments/:id", async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        const tournamentID = Number(id);
        const allTournaments = app.lobby.allTournaments;
        const tournament = allTournaments.find((t: Tournament) => t.ID == tournamentID);
        if (tournament) {
            return reply.code(200).send(tournament);
        } else {
            return reply.code(404).send({ error: "Tournament not found" });
        }
    });

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

    // Cree un nouveau tournoi
    app.post("/new_tournament", async (request: FastifyRequest, reply: FastifyReply) => {
        const tournamentParse = TournamentSchema.safeParse(request.body);

        // Validation de donnees
        if (!tournamentParse.success)
            return reply.code(400).send({ error: tournamentParse.error.errors[0].message });

        // Un tournoi existe deja sous ce nom ?
        if (app.lobby.allTournaments.find((t: any) => t.name == tournamentParse.data.name))
            return reply.code(409).send({ error: "Tournament name already exists!" });

        const tournamentID = await createTournament(tournamentParse.data.maxPlayers, tournamentParse.data.maxPlayers / 2);
        if (!tournamentID)
            return reply.code(500).send({ error: "Database error" });
        const newTournament: Tournament = new Tournament(
            tournamentParse.data.name,
            tournamentParse.data.maxPlayers,
            tournamentParse.data.ID,
            tournamentParse.data.masterPlayerID,
            false,
        );
        app.lobby.allTournaments.push(newTournament);
        reply.code(200).send();
    });

    app.post("/new_tournament_local", async (request: FastifyRequest, reply: FastifyReply) => {
        const tournamentParse = TournamentLocalSchema.safeParse(request.body);

        const { allPlayers } = app.lobby;

        // Validation de donnees
        if (!tournamentParse.success) {
            return reply.code(400).send({ error: tournamentParse.error.errors[0].message });
        }

        const players: Player[] = [];

        // -1 pour joueur temporaire (non enregistre, envoye par le front)
        for (const player of tournamentParse.data.players) {
            if (player.ID == -1)
                players.push(new Player(generateUniqueID(allPlayers), player.alias));
            else
                players.push(new Player(player.ID, player.alias));
        }
        const tournamentID = await createTournament(tournamentParse.data.maxPlayers, tournamentParse.data.maxPlayers / 2);
        if (!tournamentID)
            return reply.code(500).send({ error: "Database error" });
        const newTournament: TournamentLocal = new TournamentLocal(
            players,
            tournamentParse.data.maxPlayers,
            tournamentParse.data.masterPlayerID,
            tournamentID,
        );
        app.lobby.allTournamentsLocal.push(newTournament);
        await newTournament.startTournament();
        reply.code(200).send(newTournament.ID);
    });

    // Un player demande a join un tournoi
    app.post("/join_tournament", async (request: FastifyRequest, reply: FastifyReply) => {
        const joinTournamentReq = TournamentReqSchema.safeParse(request.body);

        // Validation de donnees
        if (!joinTournamentReq.success)
            return reply.code(400).send({ error: joinTournamentReq.error.errors[0].message });

        const allTournaments = app.lobby.allTournaments;

        // Le tournoi existe-t-il ?
        const tournament = allTournaments.find((t: Tournament) => t.ID == joinTournamentReq.data.tournamentID);
        if (!tournament)
            return reply.code(404).send({ error: "Tournament not found" });

        const player = new Player(joinTournamentReq.data.playerID);

        // Ce joueur existe deja dans ce tournoi ?
        if (tournament.players.find((p: Player) => p.ID == joinTournamentReq.data.playerID))
            return reply.code(404).send({ error: "Player already registered" });

        // Ce joueur fait deja partie d'un autre tournoi ?
        for (const tournamentIt of allTournaments) {
            if (tournamentIt.players.find((p: Player) => tournamentIt.ID != tournament.ID && p.ID == joinTournamentReq.data.playerID))
                return reply.code(409).send({ error: "Can't join more than one tournament!" });
        }

        if (tournament.players.length == tournament.maxPlayers)
            return reply.code(409).send({ error: "Tournament is full!" });

        // Ajout du tournoi au lobby et update de la page tournaments
        if (tournament && player) {
            tournament.players.push(player);
            const playerData: TournamentLobbyUpdate = {
                type: "tournament_lobby_update",
                playerID: player.ID!,
                tournamentID: tournament.ID!,
                players: tournament.players,
            };
            broadcast(playerData, app);
            reply.code(200).send("Join tournament succesfully");
        }
    });

    // Requete d'un joueur pour quitter le tournoi 
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

        // Le tournoi existe-t-il ?
        const tournament = allTournaments.find((t: Tournament) => t.ID == leaveTournamentReq.data.tournamentID);
        if (!tournament)
            return reply.code(404).send({ error: "Tournament not found" });

        const playerIdx = tournament.players.findIndex((p: Player) => p.ID == leaveTournamentReq.data.playerID);
        if (playerIdx != -1) { // == si le joueur existe bien dans ce tournoi il est retire et update du tournoi pour les autres joueurs
            tournament.players.splice(playerIdx, 1);
            const playerData: TournamentLobbyUpdate = {
                type: "tournament_lobby_update",
                playerID: leaveTournamentReq.data.playerID,
                tournamentID: tournament.ID!,
                players: tournament.players,
            };
            broadcast(playerData, app);
            return reply.code(200).send("Successfully left tournament");

        } else
            console.log("DIDNT FIND PLAYER IN THIS TOURNAMENT");
    });

    // Requete pour set un player ready (tous les players doivent etre ready pour start un tournoi)
    app.post("/player_ready", async (request: FastifyRequest, reply: FastifyReply) => {
        const readyReq = TournamentPlayerReadySchema.safeParse(request.body);
        if (!readyReq.success) // Validation de donnees
            return reply.code(400).send({ error: readyReq.error.errors[0].message });

        const allTournaments = app.lobby.allTournaments;

        // Le tournoi existe-t-il ?
        const tournament = allTournaments.find((t: Tournament) => t.ID == readyReq.data.tournamentID);
        if (!tournament)
            return reply.code(404).send({ error: "Tournament not found" });

        // Ce joueur fait-il partie de ce tournoi ?
        const player = tournament.players.find((p: Player) => p.ID == readyReq.data.playerID);
        if (!player)
            return reply.code(404).send({ error: "Player not found in tournament" });

        player.ready = readyReq.data.ready;

        // Update pour tous les joueurs participants au tournoi
        const playerData: TournamentLobbyUpdate = {
            type: "tournament_lobby_update",
            playerID: player.ID!,
            tournamentID: tournament.ID!,
            players: tournament.players,
        }

        sendToTournamentPlayers(playerData, tournament, app);

        return reply.code(200).send(`Successfully marked player ${player.ID} ready`);
    });

    // Requete pour demarrer un tournoi 
    app.post("/start_tournament", async (request: FastifyRequest, reply: FastifyReply) => {
        const startTournamentReq = StartTournamentSchema.safeParse(request.body);
        if (!startTournamentReq.success) // Validation de donnees
            return reply.code(400).send({ error: startTournamentReq.error.errors[0].message });

        const allTournaments = app.lobby.allTournaments;

        // Ce tournoi existe-t-il ?
        const tournament = allTournaments.find((t: Tournament) => t.ID == startTournamentReq.data.tournamentID);
        if (!tournament)
            return reply.code(404).send({ error: "Tournament not found" });

        // Ce joueur fait partie du tournoi
        const player = tournament.players.find((p: Player) => p.ID == startTournamentReq.data.playerID);
        if (!player)
            return reply.code(404).send({ error: "Player not found in tournament" });

        // Uniquement le createur du tournoi peut le demarrer (pourquoi est-ce que ce check etait desactive ?)
        if (player.ID != tournament.masterPlayerID)
            return reply.code(403).send({ error: "Can't start tournament if not owner" });

        // Le tournoi ne peut pas start sans le bon nombre de players
        if (tournament.players.length != tournament.maxPlayers)
            return reply.code(412).send({ error: "Not enough players to start!" });

        // Le tournoi ne peut pas start si tous les joueurs ne sont pas prets
        for (const player of tournament.players) {
            if (!player.ready)
                return reply.code(412).send({ error: "Not all players are ready!" });
        }

        tournament.isStarted = true;
        tournament.startTournament();

        // Update envoyee par WS pour signaler le debut du tournoi
        const startSignal: StartTournamentSignal = { type: "start_tournament_signal" };

        sendToTournamentPlayers(startSignal, tournament, app);
        // for (const game of tournament.stageOneGames)
        // {
        //     game.gameID = await addGame(game.players[0].ID, game.players[1].ID, true);
        //     tournament.stageOneGames.initGame();
        // }
    });

    // Requete pour annuler un tournoi
    app.post("/dismantle_tournament", async (request: FastifyRequest, reply: FastifyReply) => {
        const dismantleTournamentReq = DismantleTournamentSchema.safeParse(request.body);
        if (!dismantleTournamentReq.success) // Validation de donnees
            return reply.code(400).send({ error: dismantleTournamentReq.error.errors[0].message });

        const allTournaments = app.lobby.allTournaments;

        // Ce tournoi existe-t-il ?
        const tournament = allTournaments.find((t: Tournament) => t.ID == dismantleTournamentReq.data.tournamentID);
        if (!tournament)
            return reply.code(404).send({ error: "Tournament not found" });

        // const player = app.lobby.allPlayers.find((p: Player) => p.ID == dismantleTournamentReq.data.playerID);
        // const player = app.lobby.tournament.players.find((p: Player) => p.ID == dismantleTournamentReq.data.playerID);
        // if (!player)
        //     return reply.code(404).send({ error: "Player not found" });

        // if (player.ID != tournament.masterPlayerID) {

        // Ce joueur est-il le createur du tournoi ? 
        if (dismantleTournamentReq.data.playerID != tournament.masterPlayerID) {
            return reply.code(403).send({ error: "Can't dismantle tournament if not owner" });
        }

        const toDeleteIdx = allTournaments.findIndex((t: Tournament) => t.ID == tournament.ID);
        if (toDeleteIdx != -1) { // Si le tournoi est bien trouve, delete puis update a tous les joueurs du tournoi
            const stopSignal: DismantleSignal = { type: "dismantle_signal" };
            sendToTournamentPlayers(stopSignal, tournament, app);
            allTournaments.splice(toDeleteIdx, 1);
            return reply.code(200).send(`Succesfully deleted tournament ${tournament.ID}`);
        } else {
            console.log("Tournament not found and it is weird");
        }
    });

    // permet de recuperer les resultats des games du tournoi et de creer la deuxieme manche avec les winners
    app.post("/update_tournament_games", async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        const tournamentID = Number(id);
        const allTournaments = app.lobby.allTournaments;
        const tournament = allTournaments.find((t: Tournament) => t.ID == tournamentID);
        const winnerList: number[] = [];

        // let newGame = new Game(2, [new Player(1), new Player(2)], "multi");
        // recuperer les resultats des games du tournoi depuis la db
        if (!tournament)
            return reply.code(404).send({ error: "Tournament not found" });

        // const newGame = new Game(2, [new Player(1), new Player(2)], "multi");
        for (const game of tournament.stageOneGames) {
            // if (game.isOver)
            // {
            const resultgame = await getResultGame(game.gameID!);
            if (resultgame.status != "finished")
                continue;
            // tournament.stageTwoGames.push(Player(resultgame!.winnerID));
            // game.isOver = false; // pour ne pas refaire cette operation a la prochaine update
            const winner = resultgame?.winnerId;
            if (winner) {
                winnerList.push(winner);
            } else {
                return reply.code(404).send({ error: "Winner not found" });
                console.log("WINNER ID = ", winner);
            }
            // }
        }
        if (winnerList.length != 2)
            return reply.code(404).send({ error: "Not enough winners" });
        const gameID = await addGame(tournamentID);
        const player1 = new Player(winnerList[0]);
        const player2 = new Player(winnerList[1]);
        await addGamePlayers(gameID, player1.ID, player2.ID);
        tournament.stageTwoGames.push(new Game(gameID, 2, [player1, player2], tournamentID));
        // return winnerList;
        sendToTournamentPlayers({ type: "tournament_update_second_round", players: tournament?.players }, tournament!, app);
        return reply.code(200).send("Update sent to all players");
    });
}



// Update envoyee a tous les participants du tournoi
const sendToTournamentPlayers = (toSend: any, tournament: Tournament, app: FastifyInstance) => {
    for (const player of tournament.players) {
        const userWS: UserWS | undefined = app.usersWS.find((user: UserWS) => user.id == player.ID);
        if (userWS)
            userWS.WS.send(JSON.stringify(toSend));
    }
};

// Update envoyee a tous les joueurs, pour que tout le monde puisse voir en direct l'etat de chaque tournoi 
const broadcast = (toSend: any, app: FastifyInstance) => {
    for (const user of app.usersWS)
        user.WS.send(JSON.stringify(toSend));
}

// TODO : quand tournament < 2 lettres, ne s affiche pas jusqu au moment ou on ajoute un tourni + long -> fix ?
// TODO : front : si on recoit sendToTournamentPlayers -> ready 