import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { Player } from '../shared/types/game.types';
import { StartGame } from '../shared/types/websocket.types'
import { Game } from '../types/game.types';
import { generateUniqueID } from '../shared/functions'
import { MatchMakingReqSchema } from '../types/zod/game.zod';
import { UserWS } from '../types/user.types';
import {addGame, getResultGame, cancelledGame } from '../db/game';
import { getUser, getUserStats } from '../db/user';
import { Tournament } from '../types/game.types';

export async function gameRoutes(app: FastifyInstance) {
    app.post('/playgame', async (request: FastifyRequest, reply: FastifyReply) => {
        const matchMakingReq = MatchMakingReqSchema.safeParse(request.body); //waiting, 
        console.log("request bodyyyyy = ", request.body);

        if (!matchMakingReq.success)
            return reply.code(400).send({ error: matchMakingReq.error.errors[0].message });
        const { allPlayers } = app.lobby;
        console.log("LOBBY : ",app.lobby);
        if (matchMakingReq.data.type === "tournament")
        {
            console.log("TOURNAMENT REQUEST RECEIVED : ", matchMakingReq.data);
        const tournament = app.lobby.allTournaments.find((t: Tournament) => t.ID === matchMakingReq.data.tournamentID)!;
        console.log("LOBBY TOURNOI : ", tournament);
        // const { players } = tournament.players;
        console.log("LOBBY PLAYERS dans tournois: ", tournament.players);
        // console.log("LOBBY PLAYERS DANS STAGE 1: ", tournament.stageOneGames[0].players);
        // ajouter un const de is ready -> se lance quand les 2 le sont :
// Correct way with implicit return:
        let playerOne = tournament.stageOneGames[0].players.find((p: Player) => p.ID === matchMakingReq.data.playerID);
//         let playerOne = tournament.stageOneGames[0].players.find((p: Player) => { p.ID === matchMakingReq.data.playerID});

// // Or with explicit return:
// let playerOne = tournament.stageOneGames[0].players.find((p: Player) => { return p.ID === matchMakingReq.data.playerID; });
        if (!playerOne)
        {
            let playerOne = tournament.stageOneGames[1].players.find((p: Player) => p.ID === matchMakingReq.data.playerID);
            // playerOne = tournament.stageOneGames[1].players.find((p: Player) => { p.ID === matchMakingReq.data.playerID});
            if (!playerOne)
            return reply.code(404).send({ error: "Player not found in tournament" });
        }
        playerOne!.readyforTournament = true;
        console.log("PLAYER ONE READY : ", playerOne);
        reply.code(200).send("Successfully added to tournament matchmaking");
        //vérifier si tous les joueurs sont prêts
        const isReady = tournament.players.every((p: Player) => p.readyforTournament);
        if (isReady)
        {
            startGame(app, tournament.stageOneGames[0].players, "multi");
            startGame(app, tournament.stageOneGames[1].players, "multi");
        }
        // if (isReady && tournament.stageOneGames.length < 2 
        //     && tournament.players[0] === this.player.id) {
        //     tournament.stageOneGames.push(new Player(matchMakingReq.data.playerID));
        //     if (tournament.stageOneGames.length === 2) {
        //         startGame(app, tournament.stageOneGames, "multi");
        //         // tournament.stageOneGames = [];
        //     }

        //     console.log("i m heeeeeeeeeere");
        // }
        
        //     // lancer le tournoi
        // // } adapter la suite pour rentrer dans la logique matchmaking multi mais avec dans db tournoi 

        }
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
            // const { usersWS } = app;
            if (allPlayers.find((p: Player) => p.ID == matchMakingReq.data.playerID))
            {
                const playerIdx1 = allPlayers.findIndex((player: Player) => player.ID == matchMakingReq.data.playerID);
                allPlayers.splice(playerIdx1, 1);
                console.log(`DELETED USER ID = ${matchMakingReq.data.playerID}`);
                // for (const otherplayer of allPlayers) {
                //     console.log("//////////////////////////////ici");
                //     const user = usersWS.find((user: UserWS) => user.id == otherplayer.ID);
                //     if (user && user.WS) {
                //         user.WS.send(JSON.stringify({type: "has_quit_game", userID: `${matchMakingReq.data.playerID}`}));
                //     }
                // }
                // if game ! finish -> update : interrupted + send msg end to other player
            }
        }
    });
}

async function decount(app: FastifyInstance, players: Player[], gameID: number)
{
     const { usersWS } = app;
     const webSockets: WebSocket[] = [];
     for (let i = 3; i >= 0; i--)
     {
        for (const player of players)
        {
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

const startGame = async (app: FastifyInstance, players: Player[], mode: string) => {
    const { usersWS } = app;
    const { allGames } = app.lobby;
    const gameID = generateUniqueID(allGames);
    const webSockets: WebSocket[] = [];

    const newGame = new Game(2, players);
    let WSToSend = { type: "start_game", gameID: gameID} as StartGame;
    console.log("dans start game : players are", players);
    
    for (const player of players) {
        if (mode === "multi")
        {
            let otherUser;
            if (player === players[0])
                otherUser = await getUserStats(players[1].ID);
            else
                otherUser = await getUserStats(players[0].ID);
            WSToSend =  { type: "start_game", otherPlayer: otherUser ,gameID: gameID};
            console.log(WSToSend);
        }
        const user = usersWS.find((user: UserWS) => user.id == player.ID);

        if (user && user.WS) {
            user.WS.send(JSON.stringify(WSToSend));
            user.WS.onmessage = (event: MessageEvent) => {
                const msg: any = JSON.parse(event.data);
                if (msg.type == "movement")
                    {
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
    // if (mode === "multi")
    console.log("ici id 1 du players = ", players[1].ID);
        newGame.gameIDforDB = await addGame(players[0].ID, players[1].ID, false);
    allGames.push(newGame);
    console.log(allGames);
    newGame.initGame();
    const gameIdx1 = allGames.findIndex((game: Game) => game.gameIDforDB == newGame.gameIDforDB);
    allGames.splice(gameIdx1, 1);
    console.log("////////////////////////////////////////////////////////imheeeere");
    // if (msg.type == "quit")

}



// quand on appui dans le pret pour le tournoi -> fetch un playgame avec option tournament 
// -> on mate si le joueur est dans le lobby tournoi ->et game pour ca. quand le 2eme ok -> launch game