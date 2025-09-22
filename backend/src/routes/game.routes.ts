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




        // MATCHMAKING REQUEST POUR LOCAL
        if (matchMakingReq.data.type === "tournament") //localtorunament
        {
            console.log("LOCAL TOURNAMENT REQUEST RECEIVED : ", matchMakingReq.data);
            const tournament = app.lobby.allTournaments.find((t: Tournament) => t.ID === matchMakingReq.data.tournamentID)!;
            console.log("LOBBY TOURNOI : ", tournament);
            const players = tournament.players;
            console.log("LOBBY PLAYERS dans tournois: ", players);
            let game = tournament.stageOneGames[0];
            if (tournament.stageOneGames[0].launched)
            {
                if (!tournament.stageOneGames[1].launched)
                {
                    console.log("DEJA LANCE, ON CHECK LE RESULTAT POUR LANCER LE 2EME ROUND");
                    const result = await getResultGame(tournament.stageOneGames[0].gameIDforDB);
                    if (result){
                        console.log("RESULT TROUVE DANS LA DB POUR LE JEU 1 : ", result);
                        const playerWinner = players.find((p: Player) => p.ID === result.winnerId); // a foutre ailleurs
                        tournament.stageTwoGames[0].players.push(playerWinner!);
                        console.log("RESULTAT DU JEU : ", result);
                    }
                    else
                        return (console.log("Pas de result dans la db pour ce jeu, pb quelque part..."));
                    game = tournament.stageOneGames[1];
                }
                if(tournament.stageOneGames[1].launched)
                {
                    await getResultGame(tournament.stageOneGames[1].gameIDforDB).then((result) => {
                        const playerWinner = players.find((p: Player) => p.ID === result.winnerId);
                        tournament.stageTwoGames[0].players.push(playerWinner!);
                        console.log("RESULTAT DU JEU : ", result);
                    });
                    game = tournament.stageTwoGames[0];
                }
            }
            if ((game != tournament.stageTwoGames[0]) || (game == tournament.stageTwoGames[0] && !game.launched))
            {
                console.log("GAME TO LAUNCH : ", game);
                startGame(app, game.players, "local", game, tournament.masterPlayerID); //pas envoye a la bnne personne : ajout de l id du chef du tournoi ?
                game.launched = true;
            } //add dans la db l id du tournament -> game
            else
                return reply.code(400).send({ error: "All games in this tournament are already launched" });
            // requete speciale tournoi -> on rajoute ensuite dans le lobby tournoi ?
            // chaque requete sera envoyee une fois que la personne se sera register dans le front
            // dans la data : alias + user_name;
            // si username : check db + register avec alias + username
            // si alias : creation d un joueur avec ID unique

            // on arrive ici une fois les verifs faites + recheck si bien 4 personnes de dispo dans le tournoi
            // jeux deja crees ? -> lancement au fur et a mesure -> si 1er deja fait -> 2eme round...

            // cote front maj du html pour afficher les joueurs
            // ...

            // 

        }


        // // TOURNAMENT REQUEST POUR REMOTE
        // // TODO : Kes gens peuvent relancer un game non stop -> creer condition pour l empecher une fois le 1er jeu termine ici ou dans le front
        // // TODO : gerer les cas d abandon de tournoi (maj db + msg a l autre joueur)
        // // TODO : gerer le 2eme round du tournoi
        // if (matchMakingReq.data.type === "tournament")
        // {
        //     console.log("TOURNAMENT REQUEST RECEIVED : ", matchMakingReq.data);
        //     const tournament = app.lobby.allTournaments.find((t: Tournament) => t.ID === matchMakingReq.data.tournamentID)!;
        //     console.log("LOBBY TOURNOI : ", tournament);
        //     // const { players } = tournament.players;
        //     console.log("LOBBY PLAYERS dans tournois: ", tournament.players);
        //     // if(tournament.stageTwoGames[0].players.length === 2) // TODO : lancer la 2eme manche
        //     // {
        //     //     console.log("DEJA EN STAGE 2, ON LANCE LE JEU DIRECT");
        //     //     startGame(app, tournament.stageTwoGames[0].players, "multi", tournament.stageTwoGames[0]);
        //     //     return ;
        //     // }
        //     console.log("LOBBY PLAYERS DANS STAGE 1: ", tournament.stageOneGames[0].players);
        //     let playerOne = tournament.stageOneGames[0].players.find((p: Player) => p.ID === matchMakingReq.data.playerID);
        //     if (!playerOne)
        //     {
        //         playerOne = tournament.stageOneGames[1].players.find((p: Player) => p.ID === matchMakingReq.data.playerID);
        //         if (!playerOne)
        //         return reply.code(404).send({ error: "Player not found in tournament" });
        //     }
        //     playerOne!.readyforTournament = true;
        //     console.log("PLAYER ONE READY : ", playerOne);
        //     reply.code(200).send("Successfully added to tournament matchmaking");
        //     //vérifier si tous les joueurs sont prêts // a ajuster pour bloquer si 1ere manche deja faite ptet en regardantsi dj resultat dans la db ? 
        //     const isReady = tournament.players.every((p: Player) => p.readyforTournament);
        //     if (isReady)
        //     {
        //         startGame(app, tournament.stageOneGames[0].players, "multi", tournament.stageOneGames[0]);
        //         startGame(app, tournament.stageOneGames[1].players, "multi", tournament.stageOneGames[1]);
        //         for (const player of tournament.players) {
        //             player.readyforTournament = false;
        //         }
        //     }
        // //     // lancer le tournoi
        // // // } adapter la suite pour rentrer dans la logique matchmaking multi mais avec dans db tournoi 

        // }
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
        else if (matchMakingReq.data.type === "local") //jeu en local
        {
            const playerOne = new Player(matchMakingReq.data.playerID);
            const playerID2 = generateUniqueID(allPlayers);
            const playerTwo = new Player(playerID2);
            if (playerOne && playerTwo)
                startGame(app, [playerOne, playerTwo], "local"); //TODO: a securiser avec l id du currentuser
        } 
        else //si on quitte la page de matchmaking
        {
            // const { usersWS } = app;
            if (allPlayers.find((p: Player) => p.ID == matchMakingReq.data.playerID))
            {
                const playerIdx1 = allPlayers.findIndex((player: Player) => player.ID == matchMakingReq.data.playerID);
                allPlayers.splice(playerIdx1, 1);
                console.log(`DELETED USER ID = ${matchMakingReq.data.playerID}`);
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

const startGame = async (app: FastifyInstance, players: Player[], mode: string, gameCreated?: Game, masterPlayerID?: number) => {
    const { usersWS } = app;
    const { allGames } = app.lobby;
    const gameID = generateUniqueID(allGames);
    const webSockets: WebSocket[] = [];
    const newGame = gameCreated || new Game(2, players);

    // const newGame = new Game(2, players);
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
        let user = usersWS.find((user: UserWS) => user.id == player.ID);
        if (mode === "local" && masterPlayerID && masterPlayerID)
        {
            let userId1 = await getUserStats(players[0].ID);
            let userId2 = await getUserStats(players[1].ID);
            WSToSend =  { type: "start_game", userId1: userId1, userId2: userId2 ,gameID: gameID};
            console.log(WSToSend);
            user = usersWS.find((user: UserWS) => user.id == masterPlayerID);
        }

        if (user && user.WS) {
            user.WS.send(JSON.stringify(WSToSend));
            user.WS.onmessage = (event: MessageEvent) => {
                let msg;
                try {
                    msg = JSON.parse(event.data); 
                } catch (err) {
                    console.error("Invalid JSON received from WebSocket:", event.data, err);
                    return; // Ignore invalid messages
                }
                // const msg: any = JSON.parse(event.data);
                if (msg.type == "movement")
                    {
                        // console.log("message recu dans game.routes : ", msg);
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

// TODO : faire une securite si on game ou no ?
// TODO : securser les ids playgame
// TODO : gerer ws quand ferme ou jeu interrompu

// quand on appui dans le pret pour le tournoi -> fetch un playgame avec option tournament 
// -> on mate si le joueur est dans le lobby tournoi ->et game pour ca. quand le 2eme ok -> launch game