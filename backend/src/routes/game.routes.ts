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
            await cleanGame(app, matchMakingReq.data.gameID);
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

        /**
         * ! ANCIEN CODE D'ELISA POUR LOCAL + REMOTE SI JAMAIS BESOIN DE RECUP
         */
        // // MATCHMAKING REQUEST POUR LOCAL
        // if (reqType === "tournament") //localtorunament
        // {
        // 	console.log("LOCAL TOURNAMENT REQUEST RECEIVED : ", matchMakingReq.data);
        // 	const tournament = app.lobby.allTournaments.find((t: Tournament) => t.ID === matchMakingReq.data.tournamentID)!;
        // 	console.log("LOBBY TOURNOI : ", tournament);
        // 	const players = tournament.players;
        // 	console.log("LOBBY PLAYERS dans tournois: ", players);
        // 	let game = tournament.stageOneGames[0];
        // 	if (tournament.stageOneGames[0].launched)
        // 	{
        // 		if (!tournament.stageOneGames[1].launched)
        // 		{
        // 			console.log("DEJA LANCE, ON CHECK LE RESULTAT POUR LANCER LE 2EME ROUND");
        // 			const result = await getResultGame(tournament.stageOneGames[0].gameID);
        // 			if (result){
        // 				console.log("RESULT TROUVE DANS LA DB POUR LE JEU 1 : ", result);
        // 				const playerWinner = players.find((p: Player) => p.ID === result.winnerId); // a foutre ailleurs
        // 				tournament.stageTwoGames[0].players.push(playerWinner!);
        // 				console.log("RESULTAT DU JEU : ", result);
        // 			}
        // 			else
        // 				return (console.log("Pas de result dans la db pour ce jeu, pb quelque part..."));
        // 			game = tournament.stageOneGames[1];
        // 		}
        // 		if(tournament.stageOneGames[1].launched)
        // 		{
        // 			await getResultGame(tournament.stageOneGames[1].gameID).then((result) => {
        // 				const playerWinner = players.find((p: Player) => p.ID === result.winnerId);
        // 				tournament.stageTwoGames[0].players.push(playerWinner!);
        // 				console.log("RESULTAT DU JEU : ", result);
        // 			});
        // 			game = tournament.stageTwoGames[0];
        // 		}
        // 	}
        // 	if ((game != tournament.stageTwoGames[0]) || (game == tournament.stageTwoGames[0] && !game.launched))
        // 	{
        // 		console.log("GAME TO LAUNCH : ", game);
        // 		startGame(app, game.players, "local", game, tournament.masterPlayerID); //pas envoye a la bnne personne : ajout de l id du chef du tournoi ?
        // 		game.launched = true;
        // 	} //add dans la db l id du tournament -> game
        // 	else
        // 		return reply.code(400).send({ error: "All games in this tournament are already launched" });
        // 	// requete speciale tournoi -> on rajoute ensuite dans le lobby tournoi ?
        // 	// chaque requete sera envoyee une fois que la personne se sera register dans le front
        // 	// dans la data : alias + user_name;
        // 	// si username : check db + register avec alias + username
        // 	// si alias : creation d un joueur avec ID unique

        // 	// on arrive ici une fois les verifs faites + recheck si bien 4 personnes de dispo dans le tournoi
        // 	// jeux deja crees ? -> lancement au fur et a mesure -> si 1er deja fait -> 2eme round...

        // 	// cote front maj du html pour afficher les joueurs
        // 	// ...

        // 	// 

        // }

        // // TOURNAMENT REQUEST POUR REMOTE
        // // TODO : Kes gens peuvent relancer un game non stop -> creer condition pour l empecher une fois le 1er jeu termine ici ou dans le front
        // // TODO : gerer les cas d abandon de tournoi (maj db + msg a l autre joueur)
        // // TODO : gerer le 2eme round du tournoi
        // if (reqType === "tournament")
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
    const game = allGames.find((game: Game) => game.gameID == gameID);
    if (game) {
        if (!game.isOver) {
            // await game.endGame();

            // ! CODE WIP pour jeu annule -> le joueur declare forfait donc 3 - ? pour l'autre joueur
            // ! voir methode endGame()         
            const cancellerID = Number(app.lobby.currentUser?.id);
            if (!cancellerID || cancellerID !== game.players[0].ID && cancellerID !== game.players[1].ID) {
                console.log("Player not found.");
                return;
            }
            await game.endGame(cancellerID);
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