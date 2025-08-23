import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { JwtPayload } from '../types/user.types';
import { getUserNotifications, getNotification, insertNotification, deleteNotification } from '../db/notification';
import { sendUpdateNotification, addNotifContent } from '../helpers/notifications.helpers';
import { NotificationInput, NotificationInputSchema } from '../types/zod/app.zod';
import type { NotificationModel } from '../shared/types/notification.types';
import { UserModel } from '../shared/types/user.types';
import { getUser } from '../db/user';
import { isParsingError, checkParsing } from '../helpers/types.helpers';

/* ======================== NOTIFICATIONS ROUTES ======================== */

export async function notificationsRoutes(app: FastifyInstance) {

	// --- Récupère toutes les notifications d'un utilisateur ---
	app.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
		const jwtUser = request.user as JwtPayload;
		try {
			const notifs = await getUserNotifications(jwtUser.id);
			if (!notifs || 'errorMessage' in notifs)
				return reply.code(404).send({ errorMessage: 'Notification not found'});
			for (const notif of notifs) {
				if (notif.to != jwtUser.id) {
					return reply.status(403).send({ errorMessage: 'Forbidden' });
				}
			}
			console.log(notifs);
			return reply.code(200).send({ notifs });
		} catch (err) {
			return reply.status(500).send({ errorMessage: 'Erreur serveur' });
		}
	});

	// --- Récupère une notification par son ID ---
	app.get('/id', async (request: FastifyRequest, reply: FastifyReply) => {
		const { notifId } = request.query as { notifId: number };
		const jwtUser = request.user as JwtPayload;

		try {
			const notif = await getNotification(notifId);
			if (!notif || 'errorMessage' in notif)
				return reply.code(404).send({ errorMessage: 'Notification not found'});
			if (notif.to != jwtUser.id) {
				return reply.status(403).send({ errorMessage: 'Forbidden' });
			}
			return reply.code(200).send({ notif });
		} catch (err) {
			return reply.status(500).send({ errorMessage: 'Error server' });
		}
	});

	// --- Envoie une notification ---
	app.post('/', async(request: FastifyRequest, reply: FastifyReply) => {
		const jwtUser = request.user as JwtPayload;
		const notifdataCheck = await checkParsing(NotificationInputSchema, request.body);
		if (isParsingError(notifdataCheck)) {
			return reply.status(400).send(notifdataCheck);
		}
		let data = notifdataCheck as NotificationInput;
		if (data.to != jwtUser.id) {
			return reply.status(403).send({ errorMessage: 'Forbidden' });
		}

		const user: UserModel = await getUser(Number(data.to));
		if (!user)
			return reply.code(404).send({ errorMessage: 'No user found'});

		const notifData: NotificationInput = await addNotifContent(data);
		const notif = await insertNotification(notifData);
		if (!notif || "errorMessage" in notif) {
			return reply.code(500).send({ errorMessage: notif.errorMessage || 'Error inserting notification'});
		}
		return reply.code(200).send( notif );
	})

	// --- Marque une notification comme lue ---
	app.put('/update', async (request: FastifyRequest, reply: FastifyReply) => {
		const jwtUser = request.user as JwtPayload;
		let { notifData } = request.body as { notifData: NotificationModel };

		// Validation notifId
		const notifId = Number(notifData.id);
		if (isNaN(notifId) || notifId <= 0) {
			return reply.status(400).send({ errorMessage: 'notifId missing or invalid' });
		}

		// Vérifie que la notif existe et appartient à l'utilisateur
		let notif = await getNotification(notifId);
		if (!notif || 'errorMessage' in notif)
			return reply.status(404).send({ errorMessage: 'Notification not found'});
		if (notif.from != jwtUser.id) {
			return reply.status(403).send({ errorMessage: 'Forbidden' });
		}
		
		// On met à jour la notification en base de données et on la renvoie à l'utilisateur concerné
		const updatedNotifs = await sendUpdateNotification(app, notif);
		if ('errorMessage' in updatedNotifs)
			return reply.code(500).send({ errorMessage: updatedNotifs.errorMessage });

		return reply.code(200).send( updatedNotifs );
	});

	// --- Supprime une notification ---
	app.delete('/', async (request: FastifyRequest, reply: FastifyReply) => {
		const jwtUser = request.user as JwtPayload;
		let { notifData } = request.body as { notifData: NotificationModel };

		// Validation notifId
		const notifId = Number(notifData.id);
		if (isNaN(notifId) || notifId <= 0) {
			return reply.status(400).send({ errorMessage: 'notifId missing or invalid' });
		}

		// Vérifie que la notif existe et appartient à l'utilisateur
		let notif = await getNotification(notifId);
		if (!notif || 'errorMessage' in notif)
			return reply.status(404).send({ errorMessage: 'Notification not found'});
		if (![notif.to, notif.from].includes(jwtUser.id)) {
			return reply.status(403).send({ errorMessage: 'Forbidden' });
		}

		// On supprime la notification de la base de données et on la renvoie à l'utilisateur concerné
		await deleteNotification(notifId);
		return reply.code(200).send( notif );
	});

}