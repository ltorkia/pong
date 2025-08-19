import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { JwtPayload } from '../types/jwt.types';
import { FRIEND_REQUEST_ACTIONS } from '../shared/config/constants.config';

import { getUser } from '../db/user';
import { UserModel } from '../shared/types/user.types';
import { FriendModel } from '../shared/types/friend.types';	// en rouge car dossier local 'shared' != dossier conteneur
import { getRelation, getUserFriends, getAllRelations } from '../db/friend'
import { addUserFriend, updateRelationshipConfirmed, updateRelationshipBlocked, updateRelationshipDelete } from '../db/friend'
import { FriendResponse } from '../shared/types/response.types';

import { IdInputSchema, IdInput } from '../types/zod/app.zod';
import { checkParsing, isParsingError } from '../helpers/types.helpers';

import { NotificationModel } from '../shared/types/notification.types';
import { insertNotification, getNotification, getTwinNotifications } from '../db/notification';
// import { getUserChat, addMessageToChat } from '../db/friend'; //pour le chat en comm
import { sendToSocket, sendUpdateNotification, sendDeleteNotification, addNotifContent } from '../helpers/notifications.helpers';
import { NotificationInput, NotificationInputSchema } from '../types/zod/app.zod';
import { NotifResponse } from '../shared/types/response.types';

/* ======================== FRIENDS ROUTES ======================== */

export async function friendsRoutes(app: FastifyInstance) {

	/* -------------------------------------------------------------------------- */
	/*                        Affiche toutes les relations                        */
	/* -------------------------------------------------------------------------- */

	app.get('/', async(request: FastifyRequest, reply: FastifyReply) => {
		const allFriends = await getAllRelations();
		if (!allFriends)
			return reply.code(404).send({ errorMessage : 'No relation found'});
		return reply.status(200).send(allFriends);
	})

	/* -------------------------------------------------------------------------- */
	/*               Affiche des infos sur les friends d'un utilisateur           */
	/* -------------------------------------------------------------------------- */

	app.get('/:userId', async(request: FastifyRequest, reply: FastifyReply): Promise<FriendModel[] | void> => {
		let { userId } = request.params as { userId: number };
		userId = Number(userId);
		if (!Number.isInteger(userId) || userId <= 0) {
			return reply.status(403).send({ errorMessage: 'Forbidden' });
		}
		const friends: FriendModel[] = await getUserFriends(userId);
		if (!friends)
			return reply.code(404).send({ errorMessage : 'No user found'});
		return reply.status(200).send(friends);
	})
	
	/* -------------------------------------------------------------------------- */
	/*               Affiche des infos detaillees sur un user specifique ami      */
	/* -------------------------------------------------------------------------- */

	app.get('/:userId/:friendId', async(request: FastifyRequest, reply: FastifyReply): Promise<FriendResponse> => {
		let { userId, friendId } = request.params as { userId: number; friendId: number };
		userId = Number(userId), friendId = Number(friendId);
		if (!Number.isInteger(userId) || userId <= 0
			|| !Number.isInteger(friendId) || friendId <= 0) {
			return reply.status(403).send({ errorMessage: 'Forbidden' });
		}
		const jwtUser = request.user as JwtPayload;
		if (userId != jwtUser.id)
			return reply.status(403).send({ errorMessage: 'Forbidden' });

		const friend: FriendModel = await getRelation(userId, friendId);
		if (!friend)
			return reply.code(404).send({ errorMessage : 'No user found'});
		return reply.status(200).send({ user: friend });
	})
	
	/* -------------------------------------------------------------------------- */
	/*                                   CRUD                                     */
	/* -------------------------------------------------------------------------- */

	app.post('/', async(request: FastifyRequest, reply: FastifyReply): Promise<FriendResponse> => {
		
		const jwtUser = request.user as JwtPayload;
		const userdataCheck = await checkParsing(IdInputSchema, request.body);
		if (isParsingError(userdataCheck)) {
			return reply.status(400).send(userdataCheck);
		}
		let data = userdataCheck as IdInput;

		const friend: UserModel = await getUser(Number(data.id));
		if (!friend)
			return reply.code(404).send({ errorMessage: 'No user found'});

		await addUserFriend(jwtUser.id, friend.id);
		const relation: FriendModel = await getRelation(jwtUser.id, data.id);
		if (!relation)
			return reply.code(404).send({ errorMessage: 'No relation found'});

		// Si l'utilisateur est connecté, envoyer une notification via WebSocket
		let friendRequestData: NotificationInput = {
			type: FRIEND_REQUEST_ACTIONS.ADD,
			from: jwtUser.id,
			to: friend.id
		};
		const notifData: NotificationInput = await addNotifContent(friendRequestData);
		const notif = await insertNotification(notifData);
		if (!notif || "errorMessage" in notif) {
			return reply.code(500).send({ errorMessage: notif.errorMessage || 'Error inserting notification'});
		}
		
		sendToSocket(app, [notif]);
		return reply.code(200).send( notif );
	})

	app.put('/:friendId', async(request: FastifyRequest, reply: FastifyReply): Promise<FriendResponse> => {
		const jwtUser = request.user as JwtPayload;
		let { friendId } = request.params as { friendId: number };
		friendId = Number(friendId);
		if (!Number.isInteger(friendId) || friendId <= 0
			|| !Number.isInteger(friendId) || friendId <= 0) {
			return reply.status(403).send({ errorMessage: 'Forbidden' });
		}

		const notifDataCheck = await checkParsing(NotificationInputSchema, request.body);
		if (isParsingError(notifDataCheck))
			return reply.status(400).send(notifDataCheck);
		const data = notifDataCheck as NotificationInput;
		if (data.from != jwtUser.id)
			return reply.status(403).send({ errorMessage: 'Forbidden' });

		const friend: UserModel = await getUser(data.to);
		if (!friend)
			return reply.code(404).send({ errorMessage: 'No user found'});
		let relation: FriendModel = await getRelation(jwtUser.id, data.to);
		if (!relation)
			return reply.code(404).send({ errorMessage: 'No relation found'});
		const notif = await getNotification(data.id!);
		if (!notif || 'errorMessage' in notif)
			return reply.code(404).send({ errorMessage: notif.errorMessage || 'Notification not found'});
		
		if (notif.from != jwtUser.id) {
			return reply.status(403).send({ errorMessage: 'Forbidden' });
		}
		notif.type = data.toType!;
		switch (notif.type) {

			// On met à jour le lien d'amitié en base de données
			case FRIEND_REQUEST_ACTIONS.ACCEPT:
				relation = await updateRelationshipConfirmed(notif.from, notif.to);
				break;
			case FRIEND_REQUEST_ACTIONS.BLOCK:
				relation = await updateRelationshipBlocked(notif.from, notif.to);
				break;
		}

		// On met à jour la notification en base de données et on la renvoie à l'utilisateur concerné
		const updatedNotifs = await sendUpdateNotification(app, notif);
		if ('errorMessage' in updatedNotifs)
			return reply.code(500).send({ errorMessage: updatedNotifs.errorMessage });

		return reply.code(200).send(updatedNotifs);
	})

	app.delete('/:friendId', async(request: FastifyRequest, reply: FastifyReply): Promise<FriendResponse> => {
		const jwtUser = request.user as JwtPayload;
		let { friendId } = request.params as { friendId: number };
		friendId = Number(friendId);
		if (!Number.isInteger(friendId) || friendId <= 0) {
			return reply.status(403).send({ errorMessage: 'Forbidden' });
		}
		
		let notifId = 0;
		const parsedQuery = IdInputSchema.safeParse({ id: Number((request.query as any).id) });
		if (parsedQuery.success) {
			notifId = parsedQuery.data.id;
		}

		const friend: UserModel = await getUser(friendId);
		if (!friend)
			return reply.code(404).send({ errorMessage: 'No user found'});
		let relation: FriendModel = await getRelation(jwtUser.id, friendId);
		if (!relation)
			return reply.code(404).send({ errorMessage: 'No relation found'});

		await updateRelationshipDelete(jwtUser.id, friend.id);

		let twinNotifs;
		if (notifId) {
			const notif = await getNotification(notifId);
			if (!notif || 'errorMessage' in notif) 
				return reply.code(404).send({ errorMessage: notif.errorMessage || 'Notification not found' });
			twinNotifs = await getTwinNotifications(notif);
		} else {
			let data: NotificationInput = {
				from: jwtUser.id,
				to: friendId,
			}
			// pas d'id = on crée un objet NotificationInput “fictif” pour récupérer les twin notifications
			twinNotifs = await getTwinNotifications({ ...data, type: FRIEND_REQUEST_ACTIONS.ADD });
		}

		if ('errorMessage' in twinNotifs) 
			return reply.code(404).send({ errorMessage: twinNotifs.errorMessage || 'Notification(s) not found' });

		const deletedNotifs = await sendDeleteNotification(app, twinNotifs);
		if ('errorMessage' in deletedNotifs) 
			return reply.code(500).send({ errorMessage: deletedNotifs.errorMessage });

		return reply.code(200).send(deletedNotifs);
	})



	// ----------------------- brouillon chat ---------------------------------------------
	/* -------------------------------------------------------------------------- */
	/*             💬 - Recupere l'historique de tchat de 2 utilisateurs          */
	/* -------------------------------------------------------------------------- */
	// :id1 et :id2 = id des utilisateurs dans la db dont on cherche les messages envoyes
	// renvoyes par la db ranges chronologiquement
// 	app.get('/chat/:id1/:id2', async(request: FastifyRequest, reply: FastifyReply) => {
// 		const { id1 } = request.params as { id1: number };
// 		const jwtUser = request.user as JwtPayload;
// 		if (id1 !== jwtUser.id)
// 			return reply.status(403).send({ errorMessage: 'Forbidden' });
// 		const { id2 } = request.params as { id2: number };
// 		const chat = await getUserChat(id1, id2);
// 		if (!chat)
// 			return reply.code(404).send({ errorMessage: 'User not found'});
// 		return chat;
// 	})
// 	app.post('/chatadd/:id1/:id2', async(request: FastifyRequest, reply: FastifyReply) => {
// 		const { id1 } = request.params as { id1: number };
// 		const jwtUser = request.user as JwtPayload;
// 		if (id1 !== jwtUser.id)
// 			return reply.status(403).send({ errorMessage: 'Forbidden' });
// 		const { id2 } = request.params as { id2: number };		//check si id2 = ami ? -> non car doit recevoir a posteriori si blocke aussi ? 
// 		const friend = await getRelation(id1, id2) as FriendModel;
		
// 		if (friend.friendStatus === 'accepted')
// 			await addMessageToChat(id1, id2, request.body);
// 		else 
// 			// error message blocked ou no friend
// 		return(reply.status(200).send({friend: id2, message: request.body})); //notif a envoyer 
// 	})

}
	



// export async function addMessageToChat(sender_id: number, receiver_id: number, message: string) {
// 	const db = await getDb();

// 	await db.run(`
// 		INSERT INTO Friends (sender_id, receiver_id, message)
// 		VALUES (?, ?, ?)
// 		`,
// 		[sender_id, receiver_id, message]
// 	);
// }

// export async function extractMessagesToChat(sender_id: number, receiver_id: number) {