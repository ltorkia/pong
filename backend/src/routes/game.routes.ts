import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { Player } from '../shared/types/game.types';
import { StartGame } from '../shared/types/websocket.types'
import { Game } from '../types/game.types';
import { generateUniqueID } from '../shared/functions'
import { MatchMakingReqSchema } from '../types/zod/game.zod';
import { getUserStats } from '../db/user';
import { FRIEND_REQUEST_ACTIONS } from '../shared/config/constants.config';
import { JwtPayload } from '../types/user.types';
import { updateInvitePlayer, getRelation } from '../db/friend';
import { insertNotification } from '../db/notification';
import { addGame, addGamePlayers } from '../db/game';
import { sendToSocket } from '../helpers/notifications.helpers';
import { NotificationInput } from '../types/zod/app.zod';
import { TournamentLocal } from '../types/game.types';
import { getUserWS } from '../helpers/query.helpers';
import { attachWSHandler } from '../routes/websocket.routes';

export async function gameRoutes(app: FastifyInstance) {
    app.post('/playgame', async (request: FastifyRequest, reply: FastifyReply) => {
        const matchMakingReq = MatchMakingReqSchema.safeParse(request.body);
        if (!matchMakingReq.success) {
            return reply.code(400).send({ error: matchMakingReq.error.errors[0].message });
        }
        const reqType = matchMakingReq.data.type;
        console.log("---------- request body /playgame = ", request.body);

        const allPlayers: Map<number, Player[]> = app.lobby.allPlayers;
        console.log("LOBBY", app.lobby);

        // On vérifie que le player est bien le current user
        const playerID = matchMakingReq.data.playerID;
        const jwtUser = request.user as JwtPayload;
        if (playerID != jwtUser.id)
            return reply.status(403).send({ errorMessage: 'Forbidden' });

        if (reqType === "matchmaking_request") {
            const newPlayer = initPlayer(allPlayers, playerID, matchMakingReq.data.tabID);
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
            const player = initPlayer(allPlayers, playerID, matchMakingReq.data.tabID);
            const tempPlayer = initPlayer(allPlayers, generateUniqueID(Array.from(allPlayers.keys())), matchMakingReq.data.tabID, true);
            startGame(app, [player, tempPlayer], "local");
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
            if (!invitedID || inviterID != matchMakingReq.data.inviterID || !matchMakingReq.data.tabID)
                return reply.code(400).send({ errorMessage: "Invalid invite request" });
            initPlayer(allPlayers, invitedID); // invited
            initPlayer(allPlayers, inviterID, matchMakingReq.data.tabID); // inviter
            reply.code(200).send({ message: "Invite sent, waiting for acceptance" });
        }
        else if (reqType === FRIEND_REQUEST_ACTIONS.INVITE_ACCEPT) {
            const invitedID = playerID;
            const inviterID = matchMakingReq.data.inviterID;
            if (!inviterID || invitedID != matchMakingReq.data.invitedID || !matchMakingReq.data.tabID || !matchMakingReq.data.inviterTabID)
                return reply.code(400).send({ errorMessage: "Invalid invite request" });
            const invited = allPlayers.get(invitedID);
            const inviter = allPlayers.get(inviterID);
            if (!invited || !inviter)
                return reply.code(409).send({ errorMessage: "Players not found" });
            const inviterPlayer = inviter.find(p => p.tabID === matchMakingReq.data.inviterTabID);
            if (!inviterPlayer)
                return reply.code(409).send({ errorMessage: "Inviter player not found" });
            const invitedPlayer = initPlayer(allPlayers, invitedID, matchMakingReq.data.tabID);
            startGame(app, [inviterPlayer, invitedPlayer], "multi");
            reply.code(200).send({ message: "Game started!" });
        }
        else if (reqType === "clean_request") {
            if (matchMakingReq.data.inviteToClean)
                await cleanInvite(app, playerID, matchMakingReq.data.inviterID, matchMakingReq.data.invitedID);
            await cleanGame(app, playerID, matchMakingReq.data.gameID);
            const players = allPlayers.get(playerID);
            if (players && matchMakingReq.data.tabID) {
                const player = players.find(p => p.tabID === matchMakingReq.data.tabID);
                if (player)
                    player.matchMaking = false;
            }
            reply.code(200).send({ message: "Game cleaned up" });
        }
        else if (reqType === "tournament_clean_request") {
            await cleanTournament(app.lobby.allTournamentsLocal, matchMakingReq.data.tournamentID!);
            console.log("cleaned tournament");
            console.log(app.lobby.allTournamentsLocal);
            reply.code(200).send({ message: "Tournament clean done" });
        }
    });
}

async function findAvailableOpponent(newPlayer: Player, allPlayers: Map<number, Player[]>): Promise<Player | null> {
    for (const playerArray of allPlayers.values()) {
        for (const candidate of playerArray) {
            if (!candidate.matchMaking || candidate.ID === newPlayer.ID)
                continue;
            const relation = await getRelation(newPlayer.ID, candidate.ID);
            if (relation?.friendStatus === "blocked")
                continue;
            return candidate;
        }
    }
    return null;
}

export function initPlayer(allPlayers: Map<number, Player[]>, playerID: number, tabID?: string, isTemp?: boolean, alias?: string) {
    const players = allPlayers.get(playerID) || [];
    let player = tabID ? players.find(p => p.tabID === tabID) : undefined;
    
    if (!player) {
        player = new Player(playerID);
        if (tabID) player.tabID = tabID;
        if (isTemp) player.isTemp = isTemp;
        if (alias) player.alias = alias;
        players.push(player);
        allPlayers.set(playerID, players);
    } else {
        if (tabID) player.tabID = tabID;
        if (alias) player.alias = alias;
    }

    console.log(`PLAYER ID=${playerID} TABID=${tabID} ALIAS=${alias}`);
    return player;
}

async function cleanGame(app: FastifyInstance, playerID: number, gameID?: number) {
    if (!gameID)
        return;
    const { allGames } = app.lobby;
    const game = allGames.find((game: Game) => game.gameID == gameID);
    if (game) {
        if (!game.isOver) {
            game.cancellerID = playerID;
            await game.endGame();
        }
        const idx = allGames.indexOf(game);
        if (idx !== -1)
            allGames.splice(idx, 1);
    }
}

export function cleanPlayers(allPlayers: Map<number, Player[]>, game: Game) {
    for (const player of game.players) {
        if (game.isOver) { 
            if (game.tournamentID && player.inTournament) {
                player.matchMaking = false;
                player.webSocket = undefined;
            } else {
                resetPlayer(player);
                if (allPlayers.has(player.ID) && player.isTemp)
                    allPlayers.delete(player.ID);
            }
        }
    }
}

export function resetPlayer(player: Player) {
    player.matchMaking = false;
    player.inGame = false;
    player.webSocket = undefined;
    player.pos = { x: 0, y: 0 };
    player.width = 0.02;
    player.height = 0.40;
}

async function cleanInvite(app: FastifyInstance, playerID: number, inviterID?: number, invitedID?: number) {
    if (!inviterID || !invitedID || playerID != inviterID)
        return;
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
    sendToSocket(app, [ notif ], notif.to);
    sendToSocket(app, [ notif ], notif.from);
}

async function cleanTournament(tournamentsLocal: TournamentLocal[], tournamentID: number) {
    const tournament = tournamentsLocal.find((t: TournamentLocal) => t.ID === tournamentID);
    if (tournament) {
        const idx = tournamentsLocal.indexOf(tournament);
        if (idx !== -1)
            tournamentsLocal.splice(idx, 1);
    }
}

async function decount(app: FastifyInstance, players: Player[], gameID: number) {
    for (let i = 3; i >= 0; i--) {

        // Vérifier si le jeu ou le tournoi a été supprimé par une clean_request pendant le décompte
        const gameIndex = app.lobby.allGames.findIndex((g: Game) => g.gameID === gameID);
        if (gameIndex === -1)
            return;

        for (const player of players) {
            if (!player.tabID || !player.webSocket) 
                continue;
            player.webSocket.send(JSON.stringify({
                type: "decount_game",
                message: i,
                gameID: gameID,
            }));
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
    const { allGames, allPlayers } = app.lobby;
    const isOnlineGame = mode === "multi" ? true : false;
    const gameID = await addGame(undefined, isOnlineGame);
    await addGamePlayers(gameID, players[0].ID, players[1].ID);
    const newGame = gameCreated || new Game(gameID, 2, players, allPlayers);
    allGames.push(newGame);

    let WSToSend = { type: "start_game", gameID: gameID, mode: mode } as StartGame;
    for (const player of players) {
        if (mode === "multi") {
            const adversary = (player.ID === players[0].ID)
                ? await getUserStats(players[1].ID)
                : await getUserStats(players[0].ID);

            WSToSend = { type: "start_game", otherPlayer: adversary, gameID: gameID, mode: mode };
        }
        
        const user = getUserWS(app, player.ID, player.tabID);
        if (user && user.WS) {
            try {
                user.WS.send(JSON.stringify(WSToSend));
            } catch (err) {
                console.warn("Could not send start_game to user:", err);
            }
            attachWSHandler(user, player, newGame, mode);
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

    if (!game.players[0] || !game.players[0].tabID) {
        console.log("Host tabID missing. bye");
        return;
    }
    const host = getUserWS(app, hostID, game.players[0].tabID);
    if (!host || !host.WS) {
        console.log("Host not found. bye");
        return;
    }

    const startGameWS: StartGame = { type: "start_game", gameID: gameID, mode: "tournament" };
    try {
        host.WS.send(JSON.stringify(startGameWS));
    } catch (err) {
        console.error("Erreur WebSocket.send() :", err);
    }
    attachWSHandler(host, game.players[0], game, "tournament");
    game.players[0].webSocket = host.WS;
    await decountWS(host.WS, gameID);

    // Vérifier si le jeu ou le tournoi a été supprimé par une clean_request pendant le décompte
    const gameIndex = allGames.findIndex((g: Game) => g.gameID === gameID);
    if (gameIndex === -1)
        return;

    game.initGame();
}