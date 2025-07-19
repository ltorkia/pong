import { FastifyInstance } from 'fastify';
// import websocket from '@fastify/websocket';
import { PositionObj, GameData, Player } from '../shared/types/game.types'
import { Game, GameInstance, Lobby } from '../types/game.types';
// import { Player } from '../types/game.types'

function sendMsg(socket: WebSocket, content: string) {
    socket.send(JSON.stringify({type: "msg", msg: content}));
}

function startGame(p1: Player, p2: Player, lobby: Lobby) {
    let players: Player[] = [];
    players.push(p1);
    players.push(p2);
    const game = new GameInstance(2, players);
    const gameID = lobby.games.length;
    lobby.games.push(new Game(lobby.games.length, 0, game));
    sendMsg(p1.webSocket, `player id = ${p1.playerID} and game id = ${gameID}`);
    sendMsg(p2.webSocket, `player id = ${p2.playerID} and game id = ${gameID}`);
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
    // p1.webSocket.send(`player id = ${p1.playerID} and game id = ${gameID}`);
    // p2.webSocket.send(`player id = ${p2.playerID} and game id = ${gameID}`);
    game.initGame();
}

function matchMaking(allPlayers: Player[], newPlayer: Player, app: FastifyInstance) {
    for (const player of allPlayers) {
        if (player.playerID != newPlayer.playerID && player.inGame == false) {
            console.log(player.playerID, newPlayer.playerID);
            player.inGame = newPlayer.inGame = true;
            startGame(player, newPlayer, app.lobby);
        }
    }
}

export async function gameRoutes(app: FastifyInstance) {
    app.get('/ws/multiplayer', { websocket: true }, (connection: any, req: any) => {
        const allPlayers: Player[] = app.lobby.allPlayers;
        // connection.send("CONNECTED!");
        // connection.on('open', () => {
        //     console.log("OPEEEN");
        // })
        connection.on('message', (message: string) => {
            const playerMvt: any = JSON.parse(message);
            for (const game of app.lobby.games) {
                if (game.id == playerMvt.gameID) game.instance.registerInput(
                    playerMvt.playerID,
                    playerMvt.key,
                    playerMvt.status,
                )
            }
            console.log(playerMvt);
        });
 
        connection.on('close', () => {
            console.log('Connection CLOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOSED');
            for (let i = 0; i < allPlayers.length; i++) {
                if (allPlayers[i].webSocket == connection)
                    allPlayers.splice(i, 1);
            }
        });
        const newPlayer = new Player(allPlayers.length, connection);
        for (const player of allPlayers) {
            if (player.webSocket == connection) {
                console.log("player already in");
                return ;
            }
        }
        allPlayers.push(new Player(allPlayers.length, connection));
        if (allPlayers.length > 1)
            matchMaking(allPlayers, newPlayer, app);
        console.log(allPlayers.length);
    });
}