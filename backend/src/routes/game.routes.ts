import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { Player } from '../shared/types/game.types'
import { Game } from '../types/game.types';
import { generateUniqueID } from '../shared/functions'
import { MatchMakingReqSchema } from '../types/zod/game.zod';
import { UserWS } from '../types/user.types';
import {addGame, resultGame } from '../db/game';

export async function gameRoutes(app: FastifyInstance) {
    app.post('/playgame', async (request: FastifyRequest, reply: FastifyReply) => {
        const matchMakingReq = MatchMakingReqSchema.safeParse(request.body); //waiting, 
        console.log("request bodyyyyy = ", request.body);

        if (!matchMakingReq.success)
            return reply.code(400).send({ error: matchMakingReq.error.errors[0].message });
        const { allPlayers } = app.lobby;
        console.log(app.lobby);
        if (matchMakingReq.data.type === "matchmaking_request")
        {
            if (!allPlayers.find((p: Player) => p.ID == matchMakingReq.data.playerID))
            {
                allPlayers.push(new Player(matchMakingReq.data.playerID));
                console.log(`ADDED USER ID = ${matchMakingReq.data.playerID}`);
            }
            const newPlayer = allPlayers.find((p: Player) => p.ID == matchMakingReq.data.playerID);
            // console.log("allplayersssss     ----------------------------", allPlayers);
            if (!newPlayer)
                return reply.code(404).send({ error: "Player not found" });
            
            reply.code(200).send("Successfully added to matchmaking");
            
            newPlayer.matchMaking = true;
            const playerTwo = allPlayers.find((p: Player) => p.matchMaking === true && p.ID !== newPlayer.ID);
            if (playerTwo) {
                // playerTwo.matchMaking = false;
                // newPlayer.matchMaking = false;
                const playerIdx1 = allPlayers.findIndex((player: Player) => player.ID == newPlayer.ID);
                const playerIdx2 = allPlayers.findIndex((player: Player) => player.ID == playerTwo.ID);
                allPlayers.splice(playerIdx1, 1);
                allPlayers.splice(playerIdx2, 1);
                startGame(app, [newPlayer, playerTwo], "multi");
            }
        }
        else if (matchMakingReq.data.type === "local")
        {
            const playerOne = new Player(matchMakingReq.data.playerID);
            const playerID2 = generateUniqueID(allPlayers);
            const playerTwo = new Player(playerID2);
            if (playerOne && playerTwo)
                startGame(app, [playerOne, playerTwo], "local"); //TODO: a securiser avec l id du currentuser
        } 
        else
        {
            if (allPlayers.find((p: Player) => p.ID == matchMakingReq.data.playerID))
            {
                const playerIdx1 = allPlayers.findIndex((player: Player) => player.ID == matchMakingReq.data.playerID);
                allPlayers.splice(playerIdx1, 1);
                console.log(`DELETED USER ID = ${matchMakingReq.data.playerID}`);
            }
        }
    });
}

const startGame = async (app: FastifyInstance, players: Player[], mode: string) => {
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
                {
                    // console.log("mode = ", mode);
                    if (mode === "multi")
                        newGame.registerInput(msg.playerID, msg.key, msg.status);
                    if (mode === "local")
                        newGame.registerInputLocal(msg.playerID, msg.key, msg.status);
                }
            }
            player.webSocket = user.WS;
        }
    }
    const newGame = new Game(2, players);
    if (mode === "local")
        newGame.gameIDforDB = await addGame(players[0].ID, players[1].ID, false);
    allGames.push(newGame);
    console.log(allGames);
    newGame.initGame();
    const gameIdx1 = allGames.findIndex((game: Game) => game.gameIDforDB == newGame.gameIDforDB);
    allGames.splice(gameIdx1, 1);
    console.log("////////////////////////////////////////////////////////imheeeere");
}
