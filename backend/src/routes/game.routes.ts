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
import { FRIEND_REQUEST_ACTIONS } from '../shared/config/constants.config';
import { JwtPayload } from '../types/user.types';
import { updateInvitePlayer, getRelation } from '../db/friend';
import { insertNotification } from '../db/notification';
import { sendToSocket, addNotifContent } from '../helpers/notifications.helpers';
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
		// TODO : les gens peuvent relancer un game non stop -> creer condition pour l empecher une fois le 1er jeu termine ici ou dans le front
		// TODO : gerer les cas d abandon de tournoi (maj db + msg a l autre joueur)
		// TODO : gerer le 2eme round du tournoi
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
			reply.code(200).send("Successfully added to tournament matchmaking");
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
		//     // lancer le tournoi
		// // } adapter la suite pour rentrer dans la logique matchmaking multi mais avec dans db tournoi 
		}

		if (matchMakingReq.data.type === "matchmaking_request") {
			if (!allPlayers.find((p: Player) => p.ID == playerID))
			{
				allPlayers.push(new Player(playerID));
				console.log(`ADDED USER ID = ${playerID}`);
			}
			const newPlayer = allPlayers.find((p: Player) => p.ID == playerID);
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
		else if (matchMakingReq.data.type === "local") {
			const playerOne = new Player(playerID);
			const playerID2 = generateUniqueID(allPlayers);
			const playerTwo = new Player(playerID2);
			if (playerOne && playerTwo)
				startGame(app, [playerOne, playerTwo], "local");
		} 
		else if (matchMakingReq.data.type === FRIEND_REQUEST_ACTIONS.INVITE) {
			const inviterId = playerID;
			const invitedId = matchMakingReq.data.invitedId;
			if (!invitedId || inviterId != matchMakingReq.data.inviterId)
				return reply.code(400).send({ error: "Invalid invite request" });
			const relation = await getRelation(invitedId, inviterId);
			if (!relation)
				return reply.code(404).send({ errorMessage: 'No relation found'});
			if (relation.blockedBy)
				return reply.code(400).send({ errorMessage: 'Relation blocked'});
			invitePlayer(allPlayers, inviterId, invitedId);
			reply.code(200).send("Invite sent, waiting for acceptance");		
		} 
		else if (matchMakingReq.data.type === FRIEND_REQUEST_ACTIONS.INVITE_ACCEPT) {
			const invitedId = playerID;
			const inviterId = matchMakingReq.data.inviterId;
			if (!inviterId || invitedId != matchMakingReq.data.invitedId)
				return reply.code(400).send({ error: "Invalid invite request" });
			const invited = allPlayers.find((p: Player) => p.ID == invitedId);
			if (!invited)
				return reply.code(404).send({ error: "Player not found" });
			const relation = await getRelation(invitedId, inviterId);
			if (!relation)
				return reply.code(404).send({ errorMessage: 'No relation found'});
			const inviter = allPlayers.find((p: Player) => p.ID == inviterId);
			if (!inviter || !relation.waitingInvite || relation.challengedBy !== inviter.ID || relation.isChallenged !== invited.ID)
				return reply.code(400).send({ error: "Invalid invitation" });
			acceptInvite(allPlayers, inviter, invited);
			startGame(app, [inviter, invited], "multi");
			reply.code(200).send("Game started!");
		}
		else {

			// CLEANING A LA DESTRUCTION DE LA PAGE GAME 
			// (pour l'instant on tombe là quand matchMakingReq.data.type === 'clean_request')
			// à potentiellement déplacer dans une fonction à part dédiée et plus complète
			// et à rappeler dans tous les cas de figure où un game est 
			// terminé / cancel ou qu'on quitte la page abruptement ?
			await cleanInvite(app, playerID, matchMakingReq.data.inviterId, matchMakingReq.data.invitedId);
			const playerIdx = allPlayers.findIndex((p: Player) => p.ID === playerID);
			if (playerIdx !== -1) {
				allPlayers.splice(playerIdx, 1);
				console.log(`DELETED PLAYER ID = ${playerID}`);
			}
			reply.code(200).send("Game cleaned up");
		}
	});
}

function invitePlayer(allPlayers: Player[], inviterId: number, invitedId: number) {
	let inviter = allPlayers.find((p: Player) => p.ID == inviterId);
	if (!inviter) {
		inviter = new Player(inviterId);
		allPlayers.push(inviter);
		console.log(`ADDED PLAYER ID = ${inviterId}`);
	}
	let invited = allPlayers.find((p: Player) => p.ID == invitedId);
	if (!invited) {
		invited = new Player(invitedId);
		allPlayers.push(invited);
		console.log(`ADDED PLAYER ID = ${invitedId}`);
	}
	updateInvitePlayer(invitedId, inviterId);
}

function acceptInvite(allPlayers: Player[], inviter: Player, invited: Player) {
	updateInvitePlayer(invited.ID, inviter.ID, true);
	const playerIdx1 = allPlayers.findIndex((player: Player) => player.ID == inviter.ID);
	const playerIdx2 = allPlayers.findIndex((player: Player) => player.ID == invited.ID);
	allPlayers.splice(playerIdx1, 1);
	allPlayers.splice(playerIdx2, 1);
}

async function cleanInvite(app: FastifyInstance, playerID: number, inviterId?: number, invitedId?: number) {
	if (inviterId && invitedId && inviterId === playerID) {
		const friendId = inviterId === playerID ? invitedId : inviterId;
		const relation = await getRelation(invitedId, inviterId);
		if (!relation || !relation.waitingInvite)
			return;

		updateInvitePlayer(friendId, playerID, true);
		let notifData: NotificationInput = {
			type: FRIEND_REQUEST_ACTIONS.INVITE_CANCEL,
			from: playerID,
			to: friendId,
			read: 0
		};
		notifData = addNotifContent(notifData);
		const notif = await insertNotification(notifData);
		if (!notif || 'errorMessage' in notif)
			return;
		sendToSocket(app, [ notif ]);
	}
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

const startGame = async (app: FastifyInstance, players: Player[], mode: string, gameCreated?: Game) => {
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