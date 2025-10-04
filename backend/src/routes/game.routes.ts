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
import { deleteNotificationsFrom } from '../db/notification';
import { sendToSocket } from '../helpers/notifications.helpers';
import { NotificationInput } from '../types/zod/app.zod';
import { TournamentLocal } from '../types/game.types';
import { getUserWS } from '../helpers/query.helpers';

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
            const newPlayer = initPlayer(allPlayers, playerID, matchMakingReq.data.tabID!);
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
            let players = initPlayers(allPlayers, playerID, generateUniqueID(Array.from(allPlayers.keys())));
            if (!players || !players[0] || !players[1] || !matchMakingReq.data.tabID)
                return reply.code(404).send({ errorMessage: "Players not found" });
            players = initPlayers(allPlayers, players[0].ID, players[1].ID, matchMakingReq.data.tabID);
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
            if (!invitedID || inviterID != matchMakingReq.data.inviterID || !matchMakingReq.data.tabID)
                return reply.code(400).send({ errorMessage: "Invalid invite request" });
            let players = initPlayers(allPlayers, inviterID, invitedID);
            if (!players || !players[0] || !players[1])
                return reply.code(409).send({ errorMessage: "Players not found" });
            players[0] = initPlayer(allPlayers, inviterID, matchMakingReq.data.tabID);
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
            await cleanTournament(app, matchMakingReq.data.tournamentID);
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

export function initPlayers(allPlayers: Map<number, Player[]>, currentPlayerId: number, adversaryId: number, tabID?: string): [Player, Player] {
    const playerOne = initPlayer(allPlayers, currentPlayerId, tabID);
    const playerTwo = initPlayer(allPlayers, adversaryId, tabID);
    return [playerOne, playerTwo];
}

export function initPlayer(allPlayers: Map<number, Player[]>, playerID: number, tabID?: string, alias?: string) {
    let players = allPlayers.get(playerID) || [];

    // Cherche si un player pour ce tabID existe déjà
    let player = tabID ? players.find(p => p.tabID === tabID) : undefined;
    
    if (!player) {
        player = new Player(playerID);
        if (tabID) player.tabID = tabID;
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

function cleanPlayer(allPlayers: Map<number, Player[]>, playerID: number) {
    allPlayers.delete(playerID);
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
    const { allGames } = app.lobby;
    const isOnlineGame = mode === "multi" ? true : false;
    const gameID = await addGame(undefined, isOnlineGame);
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
        }
        console.log("-------------- Looking for user", player.ID, "with tabID", player.tabID);
        const user = getUserWS(app, player.ID, player.tabID);
        if (user && user.WS) {
            try {
                user.WS.send(JSON.stringify(WSToSend));
            } catch (err) {
                console.warn("Could not send start_game to user:", err);
            }
            user.WS.onmessage = (event: MessageEvent) => {
                const msg: any = JSON.parse(event.data);
                if (msg.type === "movement") {
                    if (mode === "multi") 
                        newGame.registerInput(msg.playerID, msg.key, msg.status);
                    if (mode === "local") 
                        newGame.registerInputLocal(msg.playerID, msg.key, msg.status);
                }
            };
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
    const hostWS = getUserWS(app, hostID, game.players[0].tabID)?.WS;
    if (!hostWS) {
        console.log("Host not found. bye");
        return;
    }

    const startGameWs: StartGame = { type: "start_game", gameID: gameID, mode: "tournament" };
    try {
        hostWS.send(JSON.stringify(startGameWs));
    } catch (err) {
        console.error("Erreur WebSocket.send() :", err);
    }

    hostWS.onmessage = (event: MessageEvent) => {
        const msg: any = JSON.parse(event.data);
        if (msg.type === "movement")
            game.registerInputLocalTournament(msg.key, msg.status);
    };
    game.players[0].webSocket = hostWS;
    await decountWS(hostWS, gameID);

    // Vérifier si le jeu ou le tournoi a été supprimé par une clean_request pendant le décompte
    const gameIndex = allGames.findIndex((g: Game) => g.gameID === gameID);
    if (gameIndex === -1)
        return;

    game.initGame();
}