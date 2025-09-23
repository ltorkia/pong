import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { Player } from '../shared/types/game.types';
import { StartGame } from '../shared/types/websocket.types'
import { Game } from '../types/game.types';
import { generateUniqueID } from '../shared/functions'
import { MatchMakingReqSchema } from '../types/zod/game.zod';
import { UserWS } from '../types/user.types';
import { getUserStats } from '../db/user';
import { Tournament } from '../types/game.types';
import { FRIEND_REQUEST_ACTIONS } from '../shared/config/constants.config';
import { JwtPayload } from '../types/user.types';
import { updateInvitePlayer } from '../db/friend';
import { insertNotification } from '../db/notification';
import { addGame, addGamePlayers } from '../db/game';
import { deleteNotificationsFrom } from '../db/notification';
import { sendToSocket } from '../helpers/notifications.helpers';
import { NotificationInput } from '../types/zod/app.zod';

export async function gameRoutes(app: FastifyInstance) {
	app.post('/playgame', async (request: FastifyRequest, reply: FastifyReply) => {
		const matchMakingReq = MatchMakingReqSchema.safeParse(request.body); //waiting, 
		console.log("request bodyyyyy = ", request.body);

		if (!matchMakingReq.success)
			return reply.code(400).send({ error: matchMakingReq.error.errors[0].message });
		const { allPlayers } = app.lobby;
		console.log("LOBBY : ",app.lobby);

		// On vérifie que le player est bien le current user
		const playerID = matchMakingReq.data.playerID;
		const jwtUser = request.user as JwtPayload;
		if (playerID != jwtUser.id)
			return reply.status(403).send({ errorMessage: 'Forbidden' });

		// TOURNAMENT REQUEST POUR REMOTE
		if (matchMakingReq.data.type === "tournament")
		{
			console.log("TOURNAMENT REQUEST RECEIVED : ", matchMakingReq.data);
			const tournament = app.lobby.allTournaments.find((t: Tournament) => t.ID === matchMakingReq.data.tournamentID)!;
			console.log("LOBBY TOURNOI : ", tournament);
			// const { players } = tournament.players;
			console.log("LOBBY PLAYERS dans tournois: ", tournament.players);
			// if(tournament.stageTwoGames[0].players.length === 2) // TODO : lancer la 2eme manche
			// {
			//     console.log("DEJA EN STAGE 2, ON LANCE LE JEU DIRECT");
			//     startGame(app, tournament.stageTwoGames[0].players, "multi", tournament.stageTwoGames[0]);
			//     return ;
			// }
			console.log("LOBBY PLAYERS DANS STAGE 1: ", tournament.stageOneGames[0].players);
			let playerOne = tournament.stageOneGames[0].players.find((p: Player) => p.ID === matchMakingReq.data.playerID);
			if (!playerOne)
			{
				playerOne = tournament.stageOneGames[1].players.find((p: Player) => p.ID === matchMakingReq.data.playerID);
				if (!playerOne)
				return reply.code(404).send({ error: "Player not found in tournament" });
			}
			playerOne!.readyforTournament = true;
			console.log("PLAYER ONE READY : ", playerOne);
			reply.code(200).send({ message: "Successfully added to tournament matchmaking" });
			//vérifier si tous les joueurs sont prêts // a ajuster pour bloquer si 1ere manche deja faite ptet en regardantsi dj resultat dans la db ? 
			const isReady = tournament.players.every((p: Player) => p.readyforTournament);
			if (isReady)
			{
				startGame(app, tournament.stageOneGames[0].players, "multi", tournament.stageOneGames[0]);
				startGame(app, tournament.stageOneGames[1].players, "multi", tournament.stageOneGames[1]);
				for (const player of tournament.players) {
					player.readyforTournament = false;
				}
			}
		}

		if (matchMakingReq.data.type === "matchmaking_request") {
			initPlayer(allPlayers, playerID);
			const newPlayer = allPlayers.find((p: Player) => p.ID == playerID);
			if (!newPlayer)
				return reply.code(404).send({ error: "Player not found" });
			reply.code(200).send({ message: "Successfully added to matchmaking" });
			
			newPlayer.matchMaking = true;
			const playerTwo = allPlayers.find((p: Player) => p.matchMaking === true && p.ID !== newPlayer.ID);
			if (playerTwo) {
                cleanPlayers(allPlayers, newPlayer, playerTwo);
				startGame(app, [newPlayer, playerTwo], "multi");
            }
		} 
		else if (matchMakingReq.data.type === "local") {
			const playerOne = new Player(playerID);
			const playerID2 = generateUniqueID(allPlayers);
			const playerTwo = new Player(playerID2);
			if (playerOne && playerTwo)
				startGame(app, [playerOne, playerTwo], "local");
			reply.code(200).send({ message: "Local game started" });	
		} 
		else if (matchMakingReq.data.type === FRIEND_REQUEST_ACTIONS.INVITE) {
			const inviterId = playerID;
			const invitedId = matchMakingReq.data.invitedId;
			if (!invitedId || inviterId != matchMakingReq.data.inviterId)
				return reply.code(400).send({ errorMessage: "Invalid invite request" });
			initPlayers(allPlayers, inviterId, invitedId);
			reply.code(200).send({ message: "Invite sent, waiting for acceptance" });		
		} 
		else if (matchMakingReq.data.type === FRIEND_REQUEST_ACTIONS.INVITE_ACCEPT) {
			const invitedId = playerID;
			const inviterId = matchMakingReq.data.inviterId;
			if (!inviterId || invitedId != matchMakingReq.data.invitedId)
				return reply.code(400).send({ errorMessage: "Invalid invite request" });
			const invited = allPlayers.find((p: Player) => p.ID == invitedId);
			const inviter = allPlayers.find((p: Player) => p.ID == inviterId);
			if (!invited || !inviter)
				return reply.code(404).send({ errorMessage: "Players not found" });
            cleanPlayers(allPlayers, inviter, invited);
			startGame(app, [inviter, invited], "multi");
			reply.code(200).send({ message: "Game started!" });
		}
		else if (matchMakingReq.data.type === "clean_request") {
			await cleanInvite(app, playerID, matchMakingReq.data.inviterId, matchMakingReq.data.invitedId);
			await cleanGame(app, matchMakingReq.data.gameId);
			cleanPlayer(allPlayers, playerID);
			reply.code(200).send({ message: "Game cleaned up" });
		}
	});
}

function initPlayers(allPlayers: Player[], currentPlayerId: number, adversaryId: number) {
	initPlayer(allPlayers, currentPlayerId);
	initPlayer(allPlayers, adversaryId);
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

async function cleanGame(app: FastifyInstance, gameId?: number) {
	if (!gameId)
		return;
	const { allGames } = app.lobby;
	const game = allGames.find((game: Game) => game.gameID == gameId);
	if (game) {
		if (!game.isOver)
			await game.endGame();
		const idx = allGames.indexOf(game);
		if (idx !== -1)
			allGames.splice(idx, 1);
	}
}

async function cleanInvite(app: FastifyInstance, playerID: number, inviterId?: number, invitedId?: number) {
	if (!inviterId || !invitedId || playerID != inviterId)
		return;
	await deleteNotificationsFrom(invitedId);
	await updateInvitePlayer(invitedId, playerID, true);
	let notifData: NotificationInput = {
		type: FRIEND_REQUEST_ACTIONS.INVITE_CANCEL,
		from: playerID,
		to: invitedId,
		read: 1
	};
	const notif = await insertNotification(notifData);
	if (!notif || 'errorMessage' in notif)
		return;
	sendToSocket(app, [ notif ]);
}

async function decount(app: FastifyInstance, players: Player[], gameID: number)
{
	const { usersWS } = app;
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

const startGame = async (app: FastifyInstance, players: Player[], mode: string, gameCreated?: Game) => {
	const { usersWS } = app;
	const { allGames } = app.lobby;
	const isTournament = gameCreated ? true : false;
	const gameType = gameCreated ? "tournament" : mode;
	const gameID = await addGame(isTournament);
	await addGamePlayers(gameID, players[0].ID, players[1].ID);
	const newGame = gameCreated || new Game(gameID, 2, players);
	allGames.push(newGame);

	let WSToSend = { type: "start_game", gameID: gameID, mode: gameType} as StartGame;
	console.log("dans start game : players are", players);
	
	for (const player of players) {
		if (mode === "multi")
		{
			let otherUser;
			if (player === players[0])
				otherUser = await getUserStats(players[1].ID);
			else
				otherUser = await getUserStats(players[0].ID);
			WSToSend =  { type: "start_game", otherPlayer: otherUser, gameID: gameID, mode: gameType};
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

	// Vérifier si le jeu a été supprimé par une clean_request pendant le décompte
	const gameIndex = allGames.findIndex((g: Game) => g.gameID === gameID);
	if (gameIndex === -1)
		return;

	console.log(allGames);
	newGame.initGame();

}

// quand on appui dans le pret pour le tournoi -> fetch un playgame avec option tournament 
// -> on mate si le joueur est dans le lobby tournoi ->et game pour ca. quand le 2eme ok -> launch game