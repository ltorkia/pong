import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { Player } from '../shared/types/game.types'
import { Game } from '../types/game.types';
import { generateUniqueID } from '../shared/functions'
import { MatchMakingReqSchema } from '../types/zod/game.zod';
import { UserWS } from 'src/types/user.types';

export async function gameRoutes(app: FastifyInstance) {
    app.post('/multiplayer', (request: FastifyRequest, reply: FastifyReply) => {
        const matchMakingReq = MatchMakingReqSchema.safeParse(request.body);

        if (!matchMakingReq.success)
            return reply.code(400).send({ error: matchMakingReq.error.errors[0].message });

        const { allPlayers } = app.lobby;

        const newPlayer = allPlayers.find((p: Player) => p.ID == matchMakingReq.data.playerID);
        if (!newPlayer)
            return reply.code(404).send({ error: "Player not found" });

        reply.code(200).send("Successfully added to matchmaking");

        newPlayer.matchMaking = true;
        const playerTwo = allPlayers.find((p: Player) => p.matchMaking == true && p.ID != newPlayer.ID);
        if (playerTwo) {
            startGame(app, [newPlayer, playerTwo]);
        }
    })
};

const startGame = (app: FastifyInstance, players: Player[]) => {
    const { usersWS } = app;
    const { allGames } = app.lobby;
    const gameID = generateUniqueID(allGames);
    const webSockets: WebSocket[] = [];

    for (const player of players) {
        const user = usersWS.find((user: UserWS) => user.id == player.ID);
        if (user && user.WS) {
            user.WS.send(JSON.stringify({
                type: "start_game",
                gameID: gameID,
            }));
            user.WS.onmessage = (event: MessageEvent) => {
                const msg: any = JSON.parse(event.data);
                if (msg.type == "movement")
                    newGame.registerInput(msg.playerID, msg.key, msg.status);
            }
            webSockets.push(user.WS);
        }
    }
    const newGame = new Game(2, players, webSockets);
    allGames.push(newGame);
    newGame.initGame();
}