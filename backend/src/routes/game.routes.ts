import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { Player } from '../shared/types/game.types'
import { Game } from '../types/game.types';
import { generateUniqueID } from '../shared/functions'
import { MatchMakingReqSchema } from '../types/zod/game.zod';
import { UserWS } from '../types/user.types';
import {addGame, resultGame } from '../db/game';

export async function gameRoutes(app: FastifyInstance) {
    app.post('/multiplayer', async (request: FastifyRequest, reply: FastifyReply) => {
        const matchMakingReq = MatchMakingReqSchema.safeParse(request.body); //waiting, 
        console.log("reauest bodyyyyy = ", request.body);

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
            console.log("allplayersssss     ----------------------------", allPlayers);
            if (!newPlayer)
                return reply.code(404).send({ error: "Player not found" });
            
            reply.code(200).send("Successfully added to matchmaking");
            
            newPlayer.matchMaking = true;
            const playerTwo = allPlayers.find((p: Player) => p.matchMaking === true && p.ID !== newPlayer.ID);
            if (playerTwo) {
                // console.log("player 1 = ", playerTwo.ID, " player 2 = ", newPlayer.ID);
                // const gameIDforDB = await addGame(playerTwo.ID, newPlayer.ID);
                // playerTwo.matchMaking = false;
                // newPlayer.matchMaking = false;
                const playerIdx1 = allPlayers.findIndex((player: Player) => player.ID == newPlayer.ID);
                const playerIdx2 = allPlayers.findIndex((player: Player) => player.ID == playerTwo.ID);
                allPlayers.splice(playerIdx1, 1);
                allPlayers.splice(playerIdx2, 1);
                startGame(app, [newPlayer, playerTwo]);
            }
        }
        else if (matchMakingReq.data.type === "local")
        {
            console.log("////////////////va niquer ta reum");
            // if (!allPlayers.find((p: Player) => p.ID == matchMakingReq.data.playerID))
            const playerID1 = generateUniqueID(allPlayers);
            // {
                allPlayers.push(new Player(matchMakingReq.data.playerID));
                const playerID2 = generateUniqueID(allPlayers);
                allPlayers.push(new Player(playerID2));
            //     console.log(`ADDED USER ID = ${matchMakingReq.data.playerID}`);
            // }
            const newPlayer = allPlayers.find((p: Player) => p.ID == matchMakingReq.data.playerID);
            const player2 = allPlayers.find((p: Player) => p.ID == playerID2);
             console.log("allplayersssss     ----------------------------", allPlayers);
            //  exit ;
            // const playerTwo = allPlayers.find((p: Player) => p.matchMaking === true && p.ID !== newPlayer.ID);
            if (newPlayer && player2)
                startLocalGame(app, [newPlayer, player2]); //TODO: a securiser avec l id du currentuser
            // allPlayers.splice(newPlayer, 1);
        }   
        // }
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
//     app.post('/localgame', async (request: FastifyRequest, reply: FastifyReply) => {
//         // new Player = 
//         // const matchMakingReq = MatchMakingReqSchema.safeParse(request.body); //waiting, 
//         // console.log("reauest bodyyyyy = ", request.body);

//         // if (!matchMakingReq.success)
//             // return reply.code(400).send({ error: matchMakingReq.error.errors[0].message });
//         const { allPlayers } = app.lobby;
//         console.log(app.lobby);
//         if (matchMakingReq.data.type === "matchmaking_request")
//         {
//             if (!allPlayers.find((p: Player) => p.ID == matchMakingReq.data.playerID))
//             {
//                 allPlayers.push(new Player(matchMakingReq.data.playerID));
//                 console.log(`ADDED USER ID = ${matchMakingReq.data.playerID}`);
//             }
//             const newPlayer = allPlayers.find((p: Player) => p.ID == matchMakingReq.data.playerID);
//             console.log("allplayersssss     ----------------------------", allPlayers);
//             if (!newPlayer)
//                 return reply.code(404).send({ error: "Player not found" });
//             const playerTwo = allPlayers.find((p: Player) => p.matchMaking === true && p.ID !== newPlayer.ID);
//             if (playerTwo) {
//                 startLocalGame(app, [newPlayer, playerTwo]); //
//             }
//         }
//         else
//         {
//             if (allPlayers.find((p: Player) => p.ID == matchMakingReq.data.playerID))
//             {
//                 const playerIdx1 = allPlayers.findIndex((player: Player) => player.ID == matchMakingReq.data.playerID);
//                 allPlayers.splice(playerIdx1, 1);
//                 console.log(`DELETED USER ID = ${matchMakingReq.data.playerID}`);
//             }
//         }

//     })
// };

const startGame = async (app: FastifyInstance, players: Player[]) => {
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
            player.webSocket = user.WS;
        }
    }
    // const gameIDforDB = await addGame(playerTwo.ID, newPlayer.ID);
    const newGame = new Game(2, players);
    newGame.gameIDforDB = await addGame(players[0].ID, players[1].ID, false);
    allGames.push(newGame);
    newGame.initGame();
}


const startLocalGame = async (app: FastifyInstance, players: Player[]) => {
    const { usersWS } = app;
    const { allGames } = app.lobby;
    const gameID = generateUniqueID(allGames);
    const webSockets: WebSocket[] = [];

    for (const player of players) {
        const user = usersWS.find((user: UserWS) => user.id == player.ID);
        if (user && user.WS) {
            console.log("@@@@@@@@@@@@@@@@@@@@@iciiiiiiii");
            user.WS.send(JSON.stringify({
                type: "start_game",
                gameID: gameID,
            }));
            user.WS.onmessage = (event: MessageEvent) => {
                const msg: any = JSON.parse(event.data);
                if (msg.type == "movement")
                    newGame.registerInputLocal(msg.playerID, msg.key, msg.status);
            }
            player.webSocket = user.WS;
        }
    }
    console.log("suis ici");
    // const gameIDforDB = await addGame(playerTwo.ID, newPlayer.ID);
    const newGame = new Game(2, players);
    // newGame.gameIDforDB = await addGame(players[0].ID, players[1].ID, false);
    allGames.push(newGame);
    newGame.initGame();
}

// route jeu en local ? 