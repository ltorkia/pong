import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { JwtPayload } from '../types/user.types';
import { FRIEND_REQUEST_ACTIONS } from '../shared/config/constants.config';

import { getUser } from '../db/user';
import { UserModel } from '../shared/types/user.types';
import { FriendModel } from '../shared/types/friend.types';	// en rouge car dossier local 'shared' != dossier conteneur
import { getRelation, getUserFriends, getAllRelations } from '../db/friend'
import { addUserFriend, updateRelationshipConfirmed, updateRelationshipBlocked, updateRelationshipDelete } from '../db/friend'
import { FriendResponse } from '../shared/types/response.types';

import { IdInputSchema, IdInput, FriendActionInputSchema, FriendActionInput } from '../types/zod/app.zod';
import { checkParsing, isParsingError } from '../helpers/types.helpers';
import { isFriendRequestValid, isValidRequester } from '../helpers/friend.helpers';

// import { NotificationModel } from '../shared/types/notification.types';
// import { insertNotification, getNotification, getTwinNotifications } from '../db/notification';
// import { sendToSocket, sendUpdateNotification, sendDeleteNotification, addNotifContent } from '../helpers/notifications.helpers';
// import { NotificationInput, NotificationInputSchema } from '../types/zod/app.zod';
// import { NotifResponse } from '../shared/types/response.types';

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

		const relation: FriendModel = await getRelation(jwtUser.id, data.id);
		if (relation)
			return reply.code(404).send({ errorMessage: 'Already friends'});

		await addUserFriend(jwtUser.id, friend.id);
		return reply.code(200).send({ message: 'Friend request sent' });
	})

	app.put('/:friendId', async(request: FastifyRequest, reply: FastifyReply): Promise<FriendResponse> => {
		const jwtUser = request.user as JwtPayload;
		let { friendId } = request.params as { friendId: number };
		friendId = Number(friendId);
		if (!Number.isInteger(friendId) || friendId <= 0
			|| !Number.isInteger(friendId) || friendId <= 0) {
			return reply.status(403).send({ errorMessage: 'Forbidden' });
		}

		const friendDataCheck = await checkParsing(FriendActionInputSchema, request.body);
		if (isParsingError(friendDataCheck)) {
			return reply.status(400).send(friendDataCheck);
		}
		const data = friendDataCheck as FriendActionInput;
		let relation: FriendModel = await getRelation(jwtUser.id, friendId);
		if (!relation)
			return reply.code(404).send({ errorMessage: 'No relation found'});
		if (!isFriendRequestValid(data, relation.friendStatus)) {
			return reply.status(403).send({ errorMessage: 'Forbidden' });
		}
		if (!isValidRequester(data, relation, jwtUser.id)) {
			return reply.status(403).send({ errorMessage: 'Forbidden' });
		}

		switch (data) {

			// On met à jour le lien d'amitié en base de données
			case FRIEND_REQUEST_ACTIONS.ACCEPT:
			case FRIEND_REQUEST_ACTIONS.UNBLOCK:
				relation = await updateRelationshipConfirmed(friendId, jwtUser.id);
				break;
			case FRIEND_REQUEST_ACTIONS.BLOCK:
				relation = await updateRelationshipBlocked(friendId, jwtUser.id);
				break;
		}
		return reply.code(200).send({ message: 'Relation updated' });
	})

	app.delete('/:friendId', async(request: FastifyRequest, reply: FastifyReply): Promise<FriendResponse> => {
		const jwtUser = request.user as JwtPayload;
		let { friendId } = request.params as { friendId: number };
		friendId = Number(friendId);
		if (!Number.isInteger(friendId) || friendId <= 0) {
			return reply.status(403).send({ errorMessage: 'Forbidden' });
		}

		const queryAction = (request.query as { action?: string })?.action;
		const actionCheck = FriendActionInputSchema.safeParse(queryAction);
		if (!actionCheck.success) {
			return reply.status(400).send({ errorMessage: 'Invalid action' });
		}
		const action = actionCheck.data as FriendActionInput;

		let relation: FriendModel = await getRelation(jwtUser.id, friendId);
		if (!relation)
			return reply.code(404).send({ errorMessage: 'No relation found'});
		if (!isFriendRequestValid(action, relation.friendStatus)) {
			return reply.status(403).send({ errorMessage: 'Forbidden' });
		}
		if (!isValidRequester(action, relation, jwtUser.id)) {
			return reply.status(403).send({ errorMessage: 'Forbidden' });
		}

		await updateRelationshipDelete(jwtUser.id, friendId);
		return reply.code(200).send({  message: 'Relation deleted' });
	})
}