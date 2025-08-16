import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { promises as fs } from 'fs';
import { Buffer } from 'buffer';
import bcrypt from 'bcrypt';
import { JwtPayload } from '../types/jwt.types';
import { DB_CONST, FRIEND_REQUEST_ACTIONS } from '../shared/config/constants.config';

import { getUser, getUserFriends, getUserGames, getUserChat, getUserAllInfo } from '../db/user';
import { getAllUsersInfos, getUsersWithPagination } from '../db/user';
import { UserModel, SafeUserModel, PublicUser, PaginatedUsers, SortOrder, UserSortField } from '../shared/types/user.types';
import { FriendModel } from '../shared/types/friend.types';	// en rouge car dossier local 'shared' != dossier conteneur
import { getRelation, addUserFriend, updateRelationshipConfirmed, updateRelationshipBlocked, updateRelationshipDelete } from '../db/friendmaj'
import { FriendResponse } from '../shared/types/response.types';

import { checkParsing, isParsingError, adaptBodyForPassword } from '../helpers/types.helpers';
import { GetAvatarFromBuffer, bufferizeStream } from '../helpers/image.helpers';
import { ModUserInput, ModUserInputSchema, FriendsInputSchema, FriendInput } from '../types/zod/auth.zod';
import { searchNewName } from '../helpers/auth.helpers';
import { changeUserData } from '../db/usermaj';

import { insertNotification, getNotification } from '../db/notification';
import { sendToSocket, sendUpdateNotification, sendDeleteNotification, addNotifContent } from '../helpers/notifications.helpers';
import { NotificationInput, NotifInput, NotifInputSchema } from '../types/zod/app.zod';
import { FriendRequestAction } from '../shared/types/notification.types';
import { NotifResponse } from '../shared/types/response.types';

/* ======================== USERS ROUTES ======================== */

export async function usersRoutes(app: FastifyInstance) {


/* -------------------------------------------------------------------------- */
/*            🔎 - Affiche tous les users avec infos non sensible             */
/* -------------------------------------------------------------------------- */

	app.get('/', async (request: FastifyRequest, reply: FastifyReply): Promise<SafeUserModel[] | void> => {
		// const users: UserBasic[] = await getAllUsers();
		const users: SafeUserModel[] = await getAllUsersInfos();
		return users;
	})

/* -------------------------------------------------------------------------- */
/*      🔎 - Affiche tous les users avec pagination et paramètres de tri      */
/* -------------------------------------------------------------------------- */
	// Query params (optionnels) : sortBy, sortOrder
	// Exemple : /api/users/page/1/20?sortBy=registration&sortOrder=DESC

	app.get('/page/:page/:limit', async (request: FastifyRequest<{ 
		Params: { page: string; limit: string }; 
		Querystring: { sortBy?: UserSortField; sortOrder?: SortOrder }}>, 
		reply: FastifyReply): Promise<PaginatedUsers | void> => {
		try {
			const { page, limit } = request.params;
			const { sortBy = 'username', sortOrder = 'ASC' } = request.query;
			const pageNum = parseInt(page);
			const limitNum = parseInt(limit);
			if (isNaN(pageNum) || pageNum < 1) {
				return reply.status(400).send({ error: 'Le paramètre page doit être un nombre positif' });
			}
			if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
				return reply.status(400).send({ error: 'Le paramètre limit doit être entre 1 et 100' });
			}
			const result: PaginatedUsers = await getUsersWithPagination(pageNum, limitNum, sortBy, sortOrder);
				return result;
		} catch (error) {
			console.error('Erreur lors de la récupération des utilisateurs:', error);
			return reply.status(500).send({ error: 'Erreur interne du serveur' });
		}
	})


/* -------------------------------------------------------------------------- */
/*            🔎 - Affiche des infos detaillees sur un user specifique ami    */
/* -------------------------------------------------------------------------- */
	//:friend : username  
	app.get('/search/:friend', async(request: FastifyRequest, reply: FastifyReply): Promise<PublicUser | void> => {
		const { id } = request.params as { id: number };
		const { friend } = request.params as { friend: string };
		// peut etre pas necessaire en fonction de comment renvoie le front
		const userdataCheck = await checkParsing(FriendsInputSchema, {friend: friend});
		if (isParsingError(userdataCheck))
			return reply.status(400).send(userdataCheck);
		let data = userdataCheck as FriendInput;
		// TODO : rechercher pour check si user demande est un friend ou pas 
		const user: PublicUser = await getUser(null, friend);
		if (!user)
			return reply.code(404).send({ Error : 'User not found'});
		return reply.status(200).send(user);
	})

/* -------------------------------------------------------------------------- */
/*            🔎 - Affiche des infos detaillees sur un user specifique        */
/* -------------------------------------------------------------------------- */
	// (sans password)
	// :id = id de l utilisateur dans la db 

	app.get('/:id', async (request: FastifyRequest, reply: FastifyReply): Promise<SafeUserModel | void> => {
		const { id } = request.params as { id: number };
		if (isNaN(id))
			return reply.status(403).send({ errorMessage: 'Forbidden' });
		const user: SafeUserModel = await getUser(id);
		if (!user)
			return reply.code(404).send({ Error : 'User not found'});
		return user;
	})

/* -------------------------------------------------------------------------- */
/*           🔎💛 - Affiche des infos sir les friends de l utilisateur        */
/* -------------------------------------------------------------------------- */
	// :id = id de l utilisateur dans la db dont on cherche les amis

	app.get('/:id/friends', async(request: FastifyRequest, reply: FastifyReply): Promise<FriendModel[] | void> => {
		const { id } = request.params as { id: number };
		if (isNaN(id))
			return reply.status(403).send({ errorMessage: 'Forbidden' });
		const friends: FriendModel[] = await getUserFriends(id);
		// if (!friends)
		// 	return reply.code(404).send({ Error : 'User not found'});
		return friends;
	})

/* -------------------------------------------------------------------------- */
/*                     ⚙️💛 - Gere les actions entre amis                     */
/* -------------------------------------------------------------------------- */

	app.post('/:id/friends/add', async(request: FastifyRequest, reply: FastifyReply): Promise<FriendResponse> => {
		const { id } = request.params as { id: number };
		const jwtUser = request.user as JwtPayload;
		if (id != jwtUser.id)
			return reply.status(403).send({ errorMessage: 'Forbidden' });

		const userdataCheck = await checkParsing(FriendsInputSchema, request.body);
		if (isParsingError(userdataCheck))
			return reply.status(400).send(userdataCheck);

		let data = userdataCheck as FriendInput;
		const friend: PublicUser = await getUser(data.friendId);
		if (!friend)
			return reply.code(404).send({ errorMessage: 'User not found'});
		const relation: FriendModel = await getRelation(jwtUser.id, data.friendId);
		if (!relation)
			return reply.code(404).send({ errorMessage: 'Relation not found'});

		await addUserFriend(id, friend.id);

		// Si l'utilisateur est connecté, envoyer une notification via WebSocket
		let friendRequestData: NotificationInput = {
			type: FRIEND_REQUEST_ACTIONS.ADD,
			from: Number(id),
			to: friend.id
		};
		const notifData: NotificationInput = await addNotifContent(friendRequestData);
		const notifRes: NotifResponse = await insertNotification(notifData);
		if (!notifRes || notifRes.errorMessage || !notifRes.notif)
			return reply.code(500).send({ errorMessage: notifRes.errorMessage || 'Error inserting notification'});
		
		const notif = notifRes.notif;
		if (notif.from != jwtUser.id) {
			return reply.status(403).send({ errorMessage: 'Forbidden' });
		}
		sendToSocket(app, [notif]);
		return reply.code(200).send({ relation: relation, notifs: [notif] });
	})

	app.put('/:id/friends/:action', async(request: FastifyRequest, reply: FastifyReply): Promise<FriendResponse> => {
		const { id } = request.params as { id: number };
		const jwtUser = request.user as JwtPayload;
		if (id != jwtUser.id)
			return reply.status(403).send({ errorMessage: 'Forbidden' });
		const { action } = request.params as { action: FriendRequestAction };

		const notifDataCheck = await checkParsing(NotifInputSchema, request.body);
		if (isParsingError(notifDataCheck))
			return reply.status(400).send(notifDataCheck);
		
		let data = notifDataCheck as NotifInput;
		const friend: PublicUser = await getUser(data.to);
		if (!friend)
			return reply.code(404).send({ errorMessage: 'User not found'});
		let relation: FriendModel = await getRelation(jwtUser.id, data.to);
		if (!relation)
			return reply.code(404).send({ errorMessage: 'Relation not found'});
		const notifRes: NotifResponse = await getNotification(data.id);
		if (!notifRes || notifRes.errorMessage || !notifRes.notif)
			return reply.code(404).send({ errorMessage: notifRes.errorMessage || 'Notification not found'});
		
		const notif = notifRes.notif;
		if (notif.from != jwtUser.id) {
			return reply.status(403).send({ errorMessage: 'Forbidden' });
		}
		notif.type = action;
		switch (notif.type) {

			// On met à jour le lien d'amitié en base de données
			case FRIEND_REQUEST_ACTIONS.ACCEPT:
				relation = await updateRelationshipConfirmed(notif.from, notif.to);
				break;
			case FRIEND_REQUEST_ACTIONS.BLOCK:
				relation = await updateRelationshipBlocked(notif.from, notif.to);
				break;
			case FRIEND_REQUEST_ACTIONS.DELETE:
				await updateRelationshipDelete(notif.from, notif.to);
				break;
		}

		// On met à jour la notification en base de données et on la renvoie à l'utilisateur concerné
		const updatedRes: NotifResponse = await sendUpdateNotification(app, notif);
		if (updatedRes.errorMessage)
			return reply.code(500).send({ errorMessage: updatedRes.errorMessage });

		return reply.code(200).send({ relation: relation, notifs: updatedRes.notifs });
	})

	app.delete('/:id/friends/delete', async(request: FastifyRequest, reply: FastifyReply): Promise<FriendResponse> => {
		const { id } = request.params as { id: number };
		const jwtUser = request.user as JwtPayload;
		if (id != jwtUser.id)
			return reply.status(403).send({ errorMessage: 'Forbidden' });

		const notifDataCheck = await checkParsing(NotifInputSchema, request.body);
		if (isParsingError(notifDataCheck))
			return reply.status(400).send(notifDataCheck);

		let data = notifDataCheck as NotifInput;
		const friend: PublicUser = await getUser(data.to);
		if (!friend)
			return reply.code(404).send({ errorMessage: 'User not found'});
		const relation: FriendModel = await getRelation(jwtUser.id, data.to);
		if (!relation)
			return reply.code(404).send({ errorMessage: 'Relation not found'});
		
		await updateRelationshipDelete(id, friend.id);

		const deletedNotifs: NotifResponse = await sendDeleteNotification(app, jwtUser.id, data.id, relation);
		if (deletedNotifs.errorMessage)
			return reply.code(500).send({ errorMessage: deletedNotifs.errorMessage });

		return reply.code(200).send({ notifs: deletedNotifs });	
	})
/* -------------------------------------------------------------------------- */
/*                   🕹️ - Recupere les donnees de jeu d un user               */
/* -------------------------------------------------------------------------- */
	// :id = id de l utilisateur dans la db dont on cherche les amis

	app.get('/:id/games', async(request: FastifyRequest, reply: FastifyReply) => {
		const { id } = request.params as { id: number };
		if (isNaN(id))
			return reply.status(403).send({ errorMessage: 'Forbidden' });
		const games = await getUserGames(id);
		if (!games)
			return reply.code(404).send({ Error : 'User not found'});
		return games;
	})

/* -------------------------------------------------------------------------- */
/*             💬 - Recupere l'historique de tchat de 2 utilisateurs          */
/* -------------------------------------------------------------------------- */
	// :id1 et :id2 = id des utilisateurs dans la db dont on cherche les messages envoyes
	// renvoyes par la db ranges chronologiquement

	app.get('/:id1/:id2/chat', async(request: FastifyRequest, reply: FastifyReply) => {
		const { id1 } = request.params as { id1: number };
		const jwtUser = request.user as JwtPayload;
		if (id1 !== jwtUser.id)
			return reply.status(403).send({ errorMessage: 'Forbidden' });
		const { id2 } = request.params as { id2: number };
		const chat = await getUserChat(id1, id2);
		if (!chat)
			return reply.code(404).send({ Error : 'User not found'});
		return chat;
	})


/* -------------------------------------------------------------------------- */
/*                    ⚙️📸 - modifie l avatar de l utilisateur                */
/* -------------------------------------------------------------------------- */
	// :id = id de l utilisateur dans la db dont on cherche les amis

	app.put('/:id/moduser/avatar', async(request: FastifyRequest, reply: FastifyReply) => {
		try {
			const elements = await request.parts({
				limits: {
				fileSize: 5 * 1024 * 1024}
			}); //separe les differents elements recuperes

			let avatarFile; //stockera le file de l avatar
			let avatarBuffer: Buffer | null = null; //buffer de l'avatar pour la sauvegarde en deux parties


			//preparsing qui dispatch datatext d un cote et l avatar de l autre
			for await (const element of elements) {
				if (element.type === 'file' && element.fieldname === 'avatar' && element.filename != '') {
					avatarFile = element;
					avatarBuffer = await bufferizeStream(element.file);
				}
			}
			
			let user: UserModel | null = null;
			const { id } = request.params as { id: number };
			const jwtUser = request.user as JwtPayload;
			if (id != jwtUser.id)
				return reply.status(403).send({ errorMessage: 'Forbidden' });
			if (avatarFile && avatarBuffer)
			{
				user = await getUser(id);
				if (user.avatar != DB_CONST.USER.DEFAULT_AVATAR)
				{
					try {await fs.unlink(`./uploads/avatars/${user.avatar}`);}
					catch (err) { console.error(`Erreur lors de la suppression du fichier :`, err);} //ptet caca de faire comme ca jsp
				}
				await GetAvatarFromBuffer(reply, user, avatarFile.mimetype, avatarBuffer);
			}
			user = await getUser(id);
			return reply.status(200).send({
				statusCode: 200,
				user: user
			});
		} catch (err) {
			request.log.error(err);
			return reply.status(500).send({
				errorMessage: 'Erreur serveur lors de l\'ajout d avatar',
			});
		}
	})

	/* -------------------------------------------------------------------------- */
	/*          ⚙️ SETTING - modifie les infos persos de l utilisateur            */
	/* -------------------------------------------------------------------------- */
	// :id = id de l utilisateur dans la db dont on cherche les amis

	app.put('/:id/moduser', async(request: FastifyRequest, reply: FastifyReply) => {
		try {
		
			const { id } = request.params as { id: number };
			const jwtUser = request.user as JwtPayload;
			if (id != jwtUser.id)
				return reply.status(403).send({ errorMessage: 'Forbidden' });
			const body = adaptBodyForPassword(request); //renomme les elements lies au password en CamelCase

			const userdataCheck = await checkParsing(ModUserInputSchema, request.body);
			if (isParsingError(userdataCheck))
				return reply.status(400).send(userdataCheck);
			let dataUserReceived = userdataCheck as ModUserInput;
			
			const dataUser = await getUserAllInfo(id);
			let dataUserToUpdate = dataUser; //prend par defaut toutes les infos de base de l user
			
			if (dataUserReceived.twoFaMethod)
				dataUserToUpdate.active2Fa = dataUserReceived.twoFaMethod;

			// check modification pour username
			if (dataUserReceived.username && dataUser.username != dataUserReceived.username)
			{
				const UserNameCheck = await getUser(null, dataUserReceived.username);
				if (UserNameCheck && UserNameCheck.id != dataUser.id)
					return {statusCode : 409, message : "Username already used.<br><b>" + await (searchNewName(dataUserToUpdate.username)) + "</b> is available."};
				dataUserToUpdate.username = dataUserReceived.username;
			}
				
			// check modification pour email
			if (dataUserReceived.email && dataUser.email != dataUserReceived.email)
			{
				const UserEmailCheck = await getUser(null, dataUserReceived.email);
				if (UserEmailCheck && UserEmailCheck.id != dataUser.id)
					return {statusCode: 409, message : "Email already used"};
				dataUserToUpdate.email = dataUserReceived.email;
			}
				
			// check modification pour password 
			if (dataUserReceived.currPassword || dataUserReceived.newPassword)
			{
				if ((dataUserReceived.currPassword && !dataUserReceived.newPassword)
					|| (!dataUserReceived.currPassword && dataUserReceived.newPassword))
					return {statusCode: 400, message : "Please fill all the case of password to valid changement"};
				if (dataUserReceived.currPassword && dataUserReceived.newPassword)
				{
					const isPassValid = await bcrypt.compare(dataUserReceived.currPassword, dataUser.password);
					if (!isPassValid)
						return {statusCode: 401, message : 'Password does not match.'};
					dataUserToUpdate.password = await bcrypt.hash(dataUserReceived.newPassword, 10);
				}
			}
							
			// une fois infos verifiees, changement des datas puis recup du nouvel user
			await changeUserData(id, dataUserToUpdate);
			const user = await getUser(id);
			return reply.status(200).send({
				statusCode: 200,
				user: user
			});
		} catch (err) {
			request.log.error(err);
			return reply.status(500).send({
				errorMessage: 'Erreur serveur lors de la modif de settings',
			});
		}
	})

}

