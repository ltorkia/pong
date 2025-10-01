import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { Player } from '../shared/types/game.types';
import { StartGame } from '../shared/types/websocket.types'
import { Game } from '../types/game.types';
import { generateUniqueID } from '../shared/functions'
import { MatchMakingReqSchema } from '../types/zod/game.zod';
import { UserWS } from '../types/user.types';
import { getUserStats } from '../db/user';
import { FRIEND_REQUEST_ACTIONS } from '../shared/config/constants.config';
import { JwtPayload } from '../types/user.types';
import { updateInvitePlayer, getRelation } from '../db/friend';
import { insertNotification } from '../db/notification';
import { addGame, addGamePlayers } from '../db/game';
import { deleteNotificationsFrom } from '../db/notification';
import { sendToSocket } from '../helpers/notifications.helpers';
import { NotificationInput } from '../types/zod/app.zod';
import { TournamentLocal } from '../types/game.types';

export async function gameRoutes(app: FastifyInstance) {
    app.post('/playgame', async (request: FastifyRequest, reply: FastifyReply) => {
        const matchMakingReq = MatchMakingReqSchema.safeParse(request.body);
        const reqType = matchMakingReq.data!.type;
        console.log("---------- request body /playgame = ", request.body);

        if (!matchMakingReq.success)
            return reply.code(400).send({ error: matchMakingReq.error.errors[0].message });
        const { allPlayers } = app.lobby;
        console.log("LOBBY", app.lobby);

        // On vérifie que le player est bien le current user
        const playerID = matchMakingReq.data.playerID;
        const jwtUser = request.user as JwtPayload;
        if (playerID != jwtUser.id)
            return reply.status(403).send({ errorMessage: 'Forbidden' });

        if (reqType === "matchmaking_request") {
            const newPlayer = initPlayer(allPlayers, playerID);
            if (!newPlayer)
                return reply.code(404).send({ error: "Player not found" });
            newPlayer.matchMaking = true;

            const playerTwo = await findAvailableOpponent(newPlayer, allPlayers);
            if (playerTwo) {
                newPlayer.matchMaking = false;
                playerTwo.matchMaking = false;
                startGame(app, [newPlayer, playerTwo], "multi");
                return reply.code(200).send({ message: "Online game started" });
            }
            reply.code(200).send({ message: "Successfully added to matchmaking" });
        }
        else if (reqType === "local") {
            const players = initPlayers(allPlayers, playerID, generateUniqueID(allPlayers));
            if (!players || !players[0] || !players[1])
                return reply.code(404).send({ errorMessage: "Players not found" });
            startGame(app, [players[0], players[1]], "local");
            reply.code(200).send({ message: "Local game started" });
        }
        else if (reqType === "tournament") {
            const hostID = playerID;
            const gameID = matchMakingReq.data.gameID;
            if (!gameID)
                return reply.code(404).send({ errorMessage: "gameID not found" });
            startTournamentGame(app, gameID, hostID);
            reply.code(200).send({ message: "Tournament game started" });
        }
        else if (reqType === FRIEND_REQUEST_ACTIONS.INVITE) {
            const inviterID = playerID;
            const invitedID = matchMakingReq.data.invitedID;
            if (!invitedID || inviterID != matchMakingReq.data.inviterID)
                return reply.code(400).send({ errorMessage: "Invalid invite request" });
            const players = initPlayers(allPlayers, inviterID, invitedID);
            if (!players || !players[0] || !players[1])
                return reply.code(404).send({ errorMessage: "Players not found" });
            reply.code(200).send({ message: "Invite sent, waiting for acceptance" });
        }
        else if (reqType === FRIEND_REQUEST_ACTIONS.INVITE_ACCEPT) {
            const invitedID = playerID;
            const inviterID = matchMakingReq.data.inviterID;
            if (!inviterID || invitedID != matchMakingReq.data.invitedID)
                return reply.code(400).send({ errorMessage: "Invalid invite request" });
            const invited = allPlayers.find((p: Player) => p.ID == invitedID);
            const inviter = allPlayers.find((p: Player) => p.ID == inviterID);
            if (!invited || !inviter)
                return reply.code(404).send({ errorMessage: "Players not found" });
            startGame(app, [inviter, invited], "multi");
            reply.code(200).send({ message: "Game started!" });
        }
        else if (reqType === "clean_request") {
            if (matchMakingReq.data.inviteToClean)
                await cleanInvite(app, playerID, matchMakingReq.data.inviterID, matchMakingReq.data.invitedID);
            if(matchMakingReq.data.gameID != undefined)
            {
                const { allGames } = app.lobby;
                const game = allGames.find((g: Game) => g.gameID == matchMakingReq.data.gameID)
                if (game && game.isOver === false && game.gameStarted)
                    await game.endGame();
                await cleanGame(app, matchMakingReq.data.gameID);
            }
            let player = allPlayers.find((p: Player) => p.ID == playerID);
            if (!player)
                return reply.code(404).send({ errorMessage: "Player not found" });
            player.matchMaking = false;
            reply.code(200).send({ message: "Game cleaned up" });
        }
        else if (reqType === "tournament_clean_request") {
            await cleanTournament(app, matchMakingReq.data.tournamentID);
            console.log("cleaned tournament");
            console.log(app.lobby.allTournamentsLocal);
            reply.code(200).send({ message: "Tournament clean done" });
        }
    });
}

async function findAvailableOpponent(newPlayer: Player, allPlayers: Player[]): Promise<Player | null> {
    for (const candidate of allPlayers) {
        if (!candidate.matchMaking || candidate.ID === newPlayer.ID)
            continue;
        const relation = await getRelation(newPlayer.ID, candidate.ID);
        if (relation?.friendStatus === "blocked")
            continue;
        return candidate;
    }
    return null;
}

function initPlayers(allPlayers: Player[], currentPlayerId: number, adversaryId: number) {
    const playerOne = initPlayer(allPlayers, currentPlayerId);
    const payerTwo = initPlayer(allPlayers, adversaryId);
    return [playerOne, payerTwo];
}

function initPlayer(allPlayers: Player[], playerID: number) {
    let player = allPlayers.find((p: Player) => p.ID == playerID);
    if (!player) {
        player = new Player(playerID);
        allPlayers.push(player);
        console.log(`ADDED PLAYER ID = ${playerID}`);
    }
    return player;
}

function cleanPlayers(allPlayers: Player[], currentPlayer: Player, adversary: Player) {
    cleanPlayer(allPlayers, currentPlayer.ID);
    cleanPlayer(allPlayers, adversary.ID);
}

function cleanPlayer(allPlayers: Player[], playerID: number) {
    const playerIdx = allPlayers.findIndex((p: Player) => p.ID === playerID);
    if (playerIdx !== -1)
        allPlayers.splice(playerIdx, 1);
}

async function cleanGame(app: FastifyInstance, gameID?: number) {
    if (!gameID)
        return;
    const { allGames } = app.lobby;
    const { allPlayers } = app.lobby;
    const game = allGames.find((game: Game) => game.gameID == gameID);
    if (game) {
        if (!game.isOver) {
            await game.endGame();
        cleanPlayers(allPlayers, game.players[0], game.players[1]); //clean les users une fois la partie terminee

            // ! CODE WIP pour jeu annule -> le joueur declare forfait donc 3 - ? pour l'autre joueur
            // ! voir methode endGame()         
            // const cancellerID = Number(app.lobby.currentUser?.id);
            // if (!cancellerID || cancellerID !== game.players[0].ID && cancellerID !== game.players[1].ID) {
            //     console.log("Player not found.");
            //     return;
            // }
            // await game.endGame(cancellerID);
        }
        const idx = allGames.indexOf(game);
        if (idx !== -1)
            allGames.splice(idx, 1);
    }
}

async function cleanTournament(app: FastifyInstance, tournamentID?: number) {
    if (!tournamentID)
        return;
    const { allTournamentsLocal } = app.lobby;
    const tournament = allTournamentsLocal.find((t: TournamentLocal) => t.ID === tournamentID);
    if (tournament) {
        const idx = allTournamentsLocal.indexOf(tournament);
        if (idx !== -1)
            allTournamentsLocal.splice(idx, 1);
    }
}

async function cleanInvite(app: FastifyInstance, playerID: number, inviterID?: number, invitedID?: number) {
    if (!inviterID || !invitedID || playerID != inviterID)
        return;
    await deleteNotificationsFrom(invitedID);
    await updateInvitePlayer(invitedID, playerID, true);
    let notifData: NotificationInput = {
        type: FRIEND_REQUEST_ACTIONS.INVITE_CANCEL,
        from: playerID,
        to: invitedID,
        read: 1
    };
    const notif = await insertNotification(notifData);
    if (!notif || 'errorMessage' in notif)
        return;
    sendToSocket(app, [notif]);
}

async function decount(app: FastifyInstance, players: Player[], gameID: number) {
    const { usersWS } = app;
    for (let i = 3; i >= 0; i--) {

        // Vérifier si le jeu ou le tournoi a été supprimé par une clean_request pendant le décompte
        const gameIndex = app.lobby.allGames.findIndex((g: Game) => g.gameID === gameID);
        if (gameIndex === -1)
            return;

        for (const player of players) {
            const user = usersWS.find((user: UserWS) => user.id == player.ID);
            if (user && user.WS) {
                user.WS.send(JSON.stringify({
                    type: "decount_game",
                    message: i,
                    gameID: gameID,
                }));
            }
        }
        if (i !== 0)
            await new Promise(resolve => setTimeout(resolve, 1000));
    }
}
async function decountWS(ws: WebSocket, gameID: number) {
    for (let i = 3; i >= 0; i--) {
        ws.send(JSON.stringify({
            type: "decount_game",
            message: i,
            gameID: gameID,
        }));
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
}

const startGame = async (app: FastifyInstance, players: Player[], mode: string, gameCreated?: Game) => {
    const { usersWS } = app;
    const { allGames } = app.lobby;

    // pour checker si joueur deja en jeu et eviter de relancer le jeu si conflit de socket --> peut etre desactiver le alluser qui supprime de nouveaux  sockets d un meme utilisateur si fonctionne
    for (const game of allGames)
    {
        console.log("gaaaame", game);
        console.log("gaaaamecreated ", gameCreated);
        if (gameCreated && game.gameID === gameCreated.gameID)
        {
            console.log("heeeeere");
            continue ;
        }
        if (players[0].ID === game.players[0].ID || players[1].ID === game.players[1].ID ||
            players[1].ID === game.players[0].ID || players[0].ID === game.players[1].ID)
            return ;
    }
    const gameID = await addGame();
    await addGamePlayers(gameID, players[0].ID, players[1].ID);
    const newGame = gameCreated || new Game(gameID, 2, players);
    allGames.push(newGame);

    let WSToSend = { type: "start_game", gameID: gameID, mode: mode } as StartGame;
    for (const player of players) {
        if (mode === "multi") {
            const adversary = (player.ID === players[0].ID)
                ? await getUserStats(players[1].ID)
                : await getUserStats(players[0].ID);

            WSToSend = { type: "start_game", otherPlayer: adversary, gameID: gameID, mode: mode };
            // console.log(WSToSend);
        }

        const user = usersWS.find((user: UserWS) => user.id == player.ID);
        if (user && user.WS) {
            user.WS.send(JSON.stringify(WSToSend));
            user.WS.onmessage = (event: MessageEvent) => {
                const msg: any = JSON.parse(event.data);
                if (msg.type == "movement") {
                    if (mode === "multi")
                        newGame.registerInput(msg.playerID, msg.key, msg.status);
                    if (mode === "local")
                        newGame.registerInputLocal(msg.playerID, msg.key, msg.status);
                }
            }
            player.webSocket = user.WS;
        }
    }
    await decount(app, players, gameID);

    // Vérifier si le jeu a été supprimé par une clean_request pendant le décompte
    const gameIndex = allGames.findIndex((g: Game) => g.gameID === gameID);
    if (gameIndex === -1)
        return;

    newGame.initGame();
}

const startTournamentGame = async (app: FastifyInstance, gameID: number, hostID: number) => {
    const { allTournamentsLocal, allPlayers, allGames } = app.lobby;
    let tournament, game;

    console.log("started tournament game");
    // cherche l'id de la game dans les tournois locaux
    for (const tournamentLocal of allTournamentsLocal) {
        if (tournamentLocal.stageTwo && tournamentLocal.stageTwo.gameID == gameID) {
            game = tournamentLocal.stageTwo;
            tournament = tournamentLocal;
            break;
        }
        const foundGame = tournamentLocal.stageOne.find((g: Game) => g.gameID == gameID);
        if (foundGame) {
            game = foundGame;
            tournament = tournamentLocal;
            break;
        }
    }
    if (!game) {
        console.log("Game not found. bye");
        return;
    }

    allGames.push(game);
    const host = app.usersWS.find((u: UserWS) => u.id == hostID);
    if (!host || !host.WS) {
        console.log("Host not found. bye");
        return;
    }

    // console.log(host);
    const startGame: StartGame = { type: "start_game", gameID: gameID, mode: "tournament" };
    // console.log({ type: "start_game", gameID: gameID, mode: "tournament"});
    try {
        host.WS.send(JSON.stringify(startGame));
    } catch (err) {
        if (err instanceof DOMException) {
            console.error("Erreur WebSocket.send() :", err.name, err.message);
            // Par exemple : "InvalidStateError" si le socket est fermé
        } else {
            console.error("Erreur inattendue :", err);
        }
    }
    host.WS.onmessage = (event: MessageEvent) => {
        const msg: any = JSON.parse(event.data);
        if (msg.type == "movement") {
            game.registerInputLocalTournament(msg.key, msg.status);
        }
    }
    game.players[0].webSocket = host.WS;
    await decountWS(host.WS, gameID);

    // Vérifier si le jeu ou le tournoi a été supprimé par une clean_request pendant le décompte
    const gameIndex = allGames.findIndex((g: Game) => g.gameID === gameID);
    if (gameIndex === -1)
        return;

    // ! à insérer quelque part
    // const tournamentIndex = allTournamentsLocal.findIndex((g: Game) => g.tournamentID === game.tournamentID);
    // if (tournamentIndex === -1)
    //     return;

    game.initGame();
}