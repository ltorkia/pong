import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { JwtPayload } from '../types/user.types';
import { getUserNotifications, getNotification, insertNotification, deleteNotification } from '../db/notification';
import { sendUpdateNotification, addNotifContent, sendToSocket } from '../helpers/notifications.helpers';
import { NotificationInput, NotificationInputSchema } from '../types/zod/app.zod';
import { UserModel } from '../shared/types/user.types';
import { getUser } from '../db/user';
import { isParsingError, checkParsing } from '../helpers/types.helpers';

/* ======================== NOTIFICATIONS ROUTES ======================== */

export async function notificationsRoutes(app: FastifyInstance) {

	// --- Récupère toutes les notifications de l'utilisateur courant ---
	app.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
		const jwtUser = request.user as JwtPayload;
		try {
			const notifs = await getUserNotifications(jwtUser.id);
			if (!notifs || 'errorMessage' in notifs)
				return reply.code(404).send({ errorMessage: 'Notification not found'});
			for (const notif of notifs) {
				if (notif.to != jwtUser.id) {
					return reply.code(403).send({ errorMessage: 'Forbidden' });
				}
			}
			return reply.code(200).send({ notifs });
		} catch (err) {
			return reply.code(500).send({ errorMessage: 'Erreur serveur' });
		}
	});

	// --- Récupère une notification par son ID
	app.get('/id', async (request: FastifyRequest, reply: FastifyReply) => {
		const { notifId } = request.query as { notifId: number };
		const jwtUser = request.user as JwtPayload;

		try {
			const notif = await getNotification(notifId);
			if (!notif || 'errorMessage' in notif)
				return reply.code(404).send({ errorMessage: 'Notification not found'});
			if (notif.to != jwtUser.id) {
				return reply.code(403).send({ errorMessage: 'Forbidden' });
			}
			return reply.code(200).send({ notif });
		} catch (err) {
			return reply.code(500).send({ errorMessage: err });
		}
	});

	// --- Envoie une notification ---
	app.post('/', async(request: FastifyRequest, reply: FastifyReply) => {
		const jwtUser = request.user as JwtPayload;
		const notifdataCheck = await checkParsing(NotificationInputSchema, request.body);
		if (isParsingError(notifdataCheck)) {
			return reply.code(400).send(notifdataCheck);
		}
		let data = notifdataCheck as NotificationInput;
		if (data.from != jwtUser.id) {
			return reply.code(403).send({ errorMessage: 'Forbidden' });
		}

		const user: UserModel = await getUser(Number(data.to));
		if (!user)
			return reply.code(404).send({ errorMessage: 'No user found'});

		let notifData: NotificationInput = addNotifContent(data);
		notifData.read = data.read ?? 0;
		const notif = await insertNotification(notifData);
		if (!notif || "errorMessage" in notif) {
			return reply.code(500).send({ errorMessage: notif.errorMessage || 'Error inserting notification'});
		}
		(notif as any).inviterTabID = notifData.inviterTabID;
		sendToSocket(app, [ notif ]);
		return reply.code(200).send(notif);
	})

	// --- Marque une notification comme lue ---
	app.put('/', async (request: FastifyRequest, reply: FastifyReply) => {
		const jwtUser = request.user as JwtPayload;

		let notifId = Number(request.body);
		if (isNaN(notifId) || notifId <= 0) {
			return reply.code(400).send({ errorMessage: 'notifId missing or invalid' });
		}

		// Vérifie que la notif existe et appartient à l'utilisateur
		let notif = await getNotification(notifId);
		if (!notif || 'errorMessage' in notif)
			return reply.code(404).send({ errorMessage: 'Notification not found'});
		if (![notif.from, notif.to].includes(jwtUser.id)) {
			return reply.code(403).send({ errorMessage: 'Forbidden' });
		}
		
		// On met à jour la notification en base de données et on la renvoie à l'utilisateur concerné
		const updatedNotifs = await sendUpdateNotification(app, notif);
		if (!updatedNotifs || 'errorMessage' in updatedNotifs)
			return reply.code(500).send({ errorMessage: updatedNotifs?.errorMessage || "Unknown error updating notification" });
		
		notif.read = 1;
		return reply.code(200).send( notif );
	});

	// --- Supprime une notification ---
	app.delete('/:notifId', async (request: FastifyRequest, reply: FastifyReply) => {
		const jwtUser = request.user as JwtPayload;
		let { notifId } = request.params as { notifId: number };
		notifId = Number(notifId);
		if (isNaN(notifId) || notifId <= 0) {
			return reply.code(400).send({ errorMessage: 'notifId missing or invalid' });
		}

		// Vérifie que la notif existe et appartient à l'utilisateur
		let notif = await getNotification(notifId);
		if (!notif || 'errorMessage' in notif)
			return reply.code(404).send({ errorMessage: 'Notification not found'});
		if (![notif.to, notif.from].includes(jwtUser.id)) {
			return reply.code(403).send({ errorMessage: 'Forbidden' });
		}

		// On supprime la notification de la base de données et on la renvoie à l'utilisateur concerné
		await deleteNotification(notifId);
		return reply.code(200).send( notif );
	});

}