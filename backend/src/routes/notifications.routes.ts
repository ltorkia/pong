import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { NotificationInputSchema, NotificationInput } from '../types/zod/app.zod';
import { JwtPayload } from '../types/jwt.types';
import { checkParsing, isParsingError } from '../helpers/types.helpers';
import { insertNotification, getUserNotifications, getNotification, updateNotificationStatus, updateNotificationContent } from '../db/notification';
import { NotifResponse } from '../shared/types/notification.types';

/* ======================== USERS ROUTES ======================== */

export async function notificationsRoutes(app: FastifyInstance) {

	// --- Récupère toutes les notifications d'un utilisateur ---
	app.get('/', async (request: FastifyRequest, reply: FastifyReply): Promise<NotifResponse> => {
		const jwtUser = request.user as JwtPayload;
		try {
			const notifications = await getUserNotifications(jwtUser.id);
			console.log(notifications);
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
			const notification = await getNotification(notifId);
			if (!notification)
				return reply.status(404).send({ errorMessage: 'Notif not found' });
			if (notification.to != jwtUser.id)
				return reply.status(403).send({ errorMessage: 'Forbidden' });
			return reply.code(200).send({ notif: notification });
		} catch (err) {
			return reply.status(500).send({ errorMessage: 'Error server' });
		}
	});

	// --- Ajoute une notification en db ---
	app.post('/add', async(request: FastifyRequest, reply: FastifyReply): Promise<void> => {
		const jwtUser = request.user as JwtPayload;
		const userdataCheck = await checkParsing(NotificationInputSchema, request.body);
		if (isParsingError(userdataCheck)) {
			return reply.status(400).send(userdataCheck);
		}
		let data = userdataCheck as NotificationInput;
		if (jwtUser.id != data.to)
			return reply.status(403).send({ errorMessage: 'Forbidden' });
		await insertNotification(data);
		return reply.code(200).send({ message : 'Notif sent' });
	})

	// --- Marque une notification comme lue ou modifie son contenu ---
	app.put('/update', async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
		const jwtUser = request.user as JwtPayload;
		const { notifId, notifContent } = request.body as { notifId: number; notifContent?: string };

		// Validation notifId
		const parseNotifId = Number(notifId);
		if (isNaN(parseNotifId)) {
			return reply.status(400).send({ errorMessage: 'notifId missing or invalid' });
		}

		// Vérifie que la notif existe et appartient à l'utilisateur
		const notif = await getNotification(parseNotifId);
		if (!notif || !notif.id) {
			return reply.status(404).send({ errorMessage: 'Notif not found' });
		}
		if (notif.to != jwtUser.id) {
			return reply.status(403).send({ errorMessage: 'Forbidden' });
		}

		// Si notifContent est fourni on met à jour le contenu
		if (typeof notifContent === 'string' && notifContent.trim() !== '') {
			await updateNotificationContent(notif.id, notifContent.trim());
			return reply.code(200).send({ message: 'Notif content updated' });
		}

		// Sinon on marque comme lu
		await updateNotificationStatus(notif.id);
		return reply.code(200).send({ message: 'Notif marked read' });
	});

}