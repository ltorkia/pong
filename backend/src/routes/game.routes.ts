import { FastifyInstance } from 'fastify';
import { PositionObj, GameData, Player } from '../shared/types/game.types'
import { Game, GameInstance, Lobby } from '../types/game.types';

const MAX_GAMES = 100;
const MAX_PLAYERS = MAX_GAMES * 2;

function sendMsg(socket: WebSocket, content: string) {
    socket.send(JSON.stringify({ type: "msg", msg: content }));
}

function startGame(p1: Player, p2: Player, allGames: Game[]) {
    let players: Player[] = [];
    players.push(p1);
    players.push(p2);
    const gameInstance = new GameInstance(2, players);
    const gameID = Math.floor(Math.random() * MAX_GAMES);
    const game = new Game(gameID, 0, gameInstance, players);
    allGames.push(game);
    sendMsg(p1.webSocket, `player id = ${p1.playerID} and game id = ${gameID}`);
    sendMsg(p2.webSocket, `player id = ${p2.playerID} and game id = ${gameID}`);
    console.log(`GAME PLAYER LENGTH = ${game.players.length}`)
    p1.webSocket.send(JSON.stringify({
        type: "start",
        playerID: p1.playerID,
        gameID: gameID,
    }));
    p2.webSocket.send(JSON.stringify({
        type: "start",
        playerID: p2.playerID,
        gameID: gameID,
    }));
    gameInstance.initGame();
}

function matchMaking(newPlayer: Player | null, allPlayers: Player[], allGames: Game[]) {
    console.log("coucou matchmaking")
    if (!newPlayer || allPlayers.length <= 1)
        return; 
    for (const player of allPlayers) {
        if (player != newPlayer && player.ready && !player.inGame) {
            console.log("MATCHED TWO PLAYERS !")
            player.inGame = newPlayer.inGame = true;
            startGame(player, newPlayer, allGames);
        }
    }
}

const findPlayerByWebSocket = (newPlayerWebSocket: WebSocket | null, allPlayers: Player[]) => {
    for (const player of allPlayers) {
        if (player.webSocket == newPlayerWebSocket)
            return (player);
    }
    return (null);
}

export async function gameRoutes(app: FastifyInstance) {
    app.get('/ws/multiplayer', { websocket: true }, (connection: any, req: any) => {
        const allPlayers: Player[] = app.lobby.allPlayers;
        const allGames: Game[] = app.lobby.games;

        connection.on('message', (message: string) => {
            const msg: any = JSON.parse(message);
            const player: Player | null = findPlayerByWebSocket(connection, allPlayers);
            // console.log(msg);
            if (msg.type == "ready" && player) {
                player.ready = true;
                matchMaking(player, allPlayers, allGames);
            } else if (msg.type == "movement") {
                if (allGames.find(game => game.id == msg.gameID))
                    console.log("FOUND CORRESPONDING GAME")
                    allGames.find(game => game.id == msg.gameID)?.instance.registerInput(
                        msg.playerID,
                        msg.key,
                        msg.status,
                );
            }
            console.log(msg);
        });

        connection.on('close', () => {
            console.log('Connection CLOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOSED');
            const gameIdx = allGames.findIndex(game => game.players.find(player => player.webSocket == connection));
            if (gameIdx !== -1) {
                allGames[gameIdx].instance.setGameStarted(false);
                allGames[gameIdx].players.map(player => player.inGame = player.ready = false);
                allGames.splice(gameIdx, 1);
            }
            const playerLeftIdx = allPlayers.findIndex(player => player.webSocket == connection);
            if (playerLeftIdx !== -1)
                allPlayers.splice(playerLeftIdx, 1);
        });

        const newPlayer = new Player(Math.floor(Math.random() * MAX_PLAYERS), connection);

        if (allPlayers.findIndex(player => player.webSocket == connection) != -1)
            return;
        allPlayers.push(newPlayer);
        console.log(allPlayers.length);
    });
}