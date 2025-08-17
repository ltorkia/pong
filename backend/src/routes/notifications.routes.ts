import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { JwtPayload } from '../types/jwt.types';
import { getUserNotifications, getNotification, updateNotification } from '../db/notification';
import { sendUpdateNotification } from '../helpers/notifications.helpers';
import { NotifResponse } from '../shared/types/response.types';
import type { NotificationModel } from '../shared/types/notification.types';

/* ======================== USERS ROUTES ======================== */

export async function notificationsRoutes(app: FastifyInstance) {

	// --- Récupère toutes les notifications d'un utilisateur ---
	app.get('/', async (request: FastifyRequest, reply: FastifyReply): Promise<NotifResponse> => {
		const jwtUser = request.user as JwtPayload;
		try {
			const notifRes: NotifResponse = await getUserNotifications(jwtUser.id);
			if (!notifRes || notifRes.errorMessage || !notifRes.notifs)
				return reply.code(404).send({ errorMessage: 'Notification not found'});
			const notifications = notifRes.notifs;
			for (const notif of notifications) {
				if (notif.from != jwtUser.id) {
					return reply.status(403).send({ errorMessage: 'Forbidden' });
				}
			}
			return reply.code(200).send({ notifs: notifications });
		} catch (err) {
    		console.error('Erreur dans GET /api/notifs:', err);
			return reply.status(500).send({ errorMessage: 'Erreur serveur' });
		}
	});

	// --- Récupère une notification par son ID ---
	app.get('/id', async (request: FastifyRequest, reply: FastifyReply): Promise<NotifResponse> => {
		const { notifId } = request.query as { notifId: number };
		const jwtUser = request.user as JwtPayload;

		try {
			const notifRes: NotifResponse = await getNotification(notifId);
			if (!notifRes || notifRes.errorMessage || !notifRes.notif)
				return reply.code(404).send({ errorMessage: 'Notification not found'});
			const notification = notifRes.notif;
			if (notification.from != jwtUser.id) {
				return reply.status(403).send({ errorMessage: 'Forbidden' });
			}
			return reply.code(200).send({ notif: notification });
		} catch (err) {
			return reply.status(500).send({ errorMessage: 'Error server' });
		}
	});

	// --- Marque une notification comme lue ---
	app.put('/update', async (request: FastifyRequest, reply: FastifyReply): Promise<NotifResponse> => {
		const jwtUser = request.user as JwtPayload;
		const { notifData } = request.body as { notifData: NotificationModel };

		// Validation notifId
		const parseNotifId = Number(notifData.id);
		if (isNaN(parseNotifId)) {
			return reply.status(400).send({ errorMessage: 'notifId missing or invalid' });
		}

		// Vérifie que la notif existe et appartient à l'utilisateur
		let notifRes: NotifResponse = await getNotification(parseNotifId);
		if (!notifRes || notifRes.errorMessage || !notifRes.notif)
			return reply.code(404).send({ errorMessage: 'Notification not found'});
		let notification = notifRes.notif;
		if (!notification || !notification.id) {
			return reply.status(404).send({ errorMessage: 'Notification not found' });
		}
		if (notification.from != jwtUser.id) {
			return reply.status(403).send({ errorMessage: 'Forbidden' });
		}
		
		// On met à jour la notification en base de données et on la renvoie à l'utilisateur concerné
		const updatedRes: NotifResponse = await sendUpdateNotification(app, notification);
		if (updatedRes.errorMessage)
			return reply.code(500).send({ errorMessage: updatedRes.errorMessage });

		return reply.code(200).send({ notif: updatedRes.notif, notifs: updatedRes.notifs });
	});

}