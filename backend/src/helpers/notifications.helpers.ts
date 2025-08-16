import { FastifyInstance } from 'fastify';
import { UserWS } from '../types/user.types';
import { NotificationModel } from '../shared/types/notification.types';
import { FRIEND_REQUEST_ACTIONS } from '../shared/config/constants.config';
import { getUser } from '../db/user';
import { NotificationInput } from '../types/zod/app.zod';
import { getNotification, getTwinNotifications, updateNotification, deleteNotification } from '../db/notification';
import { NotifResponse } from '../shared/types/response.types';
import { FriendModel } from '../shared/types/friend.types';
import { DB_CONST } from '../shared/config/constants.config';

/**
 * Envoie un message à un utilisateur connecté via WebSockets.
 * La clé "to" du objet data est utilisée pour identifier l'utilisateur ciblé.
 * Si l'utilisateur est connecté, alors le message est envoyé via WebSockets.
 * @param {FastifyInstance} app - L'instance de l'application Fastify.
 * @param {NotificationModel[]} data - Le tableau contenant les notifications à envoyer.
 */
export function sendToSocket(app: FastifyInstance, data: NotificationModel[]): void {
	const userWS: UserWS | undefined = app.usersWS.find((user: UserWS) => user.id == data[0].to);
	if (userWS) {
		console.log("→ Envoi WS vers", userWS.id, ":", JSON.stringify(data));
		userWS.WS.send(JSON.stringify(data));
	}
}

/**
 * Met à jour et envoie une notification amicale.
 * Cette fonction récupère la notification et ses potentiels doublons,
 * les met à jour en utilisant le type donné dans le paramètre `data`,
 * puis les envoie mises à jour via WebSockets.
 * 
 * @param {FastifyInstance} app - L'instance de l'application Fastify.
 * @param {NotificationModel} data - Les données de la notification, y compris le type.
 * @returns {Promise<NotifResponse>} Une promesse qui se résout lorsque les notifications sont mises à jour 
 * et envoyées via WebSockets, ou par un message d'erreur.
 */
export async function sendUpdateNotification(app: FastifyInstance, data: NotificationModel): Promise<NotifResponse> {

	// On récupère la notification liée et ses potentiels doublons
	const notifRes: NotifResponse = await getNotification(data.id);
	if (!notifRes || notifRes.errorMessage || !notifRes.notif)
		return { errorMessage: notifRes.errorMessage || 'Notification not found' };
	const twinNotifRes: NotifResponse = await getTwinNotifications(notifRes.notif);
	if (!twinNotifRes || twinNotifRes.errorMessage || !twinNotifRes.notifs)
		return { errorMessage: twinNotifRes.errorMessage };

	// On met à jour les notifications
	const twinNotifs = twinNotifRes.notifs;
	let updatedNotifs: NotificationModel[] = [];
	let returnedNotif: NotificationModel = data;
	for (const twinNotif of twinNotifs) {
		twinNotif.type = data.type;
		const notif: NotificationModel = await addNotifContent(twinNotif);
		const updatedRes = await updateNotification(notif);
		if (!updatedRes || updatedRes.errorMessage || !updatedRes.notif) {
			return { errorMessage: updatedRes.errorMessage || 'Error inserting notification' };
		}
		updatedNotifs.push(updatedRes.notif);
		if (updatedRes.notif.id == data.id) {
			returnedNotif = updatedRes.notif;
		}
	}

	// On envoie les notifications mises à jour
	sendToSocket(app, updatedNotifs);
	return { notifs: updatedNotifs };
}

/**
 * Supprime une notification et ses potentiels doublons et les envoie via WebSockets.
 * Cette fonction récupère la notification et ses potentiels doublons, les supprime si la relation
 * est en attente, puis les envoie supprimées via WebSockets pour référence.
 * 
 * @param {FastifyInstance} app - L'instance de l'application Fastify.
 * @param {number} jwtUserId - L'ID de l'utilisateur connecté via JWT.
 * @param {number} notifId - L'ID de la notification à supprimer.
 * @param {FriendModel} relation - Les données de la relation amicale.
 * @returns {Promise<NotifResponse>} Une promesse qui se résout lorsque les notifications sont supprimées
 * et envoyées via WebSockets, ou par un message d'erreur.
 */
export async function sendDeleteNotification(app: FastifyInstance, jwtUserId: number, notifId: number, relation: FriendModel): Promise<NotifResponse> {
	const notifRes: NotifResponse = await getNotification(notifId);
	if (!notifRes || notifRes.errorMessage || !notifRes.notif)
		return { errorMessage: 'Notification not found'};
	if (notifRes.notif.from != jwtUserId) {
		return { errorMessage: 'Forbidden' };
	}
	const twinNotifRes: NotifResponse = await getTwinNotifications(notifRes.notif);
	if (!twinNotifRes || twinNotifRes.errorMessage || !twinNotifRes.notifs)
		return { errorMessage: twinNotifRes.errorMessage || 'Notification(s) not found'};
	
	const twinNotifs = twinNotifRes.notifs;
	const deletedNotifs: NotificationModel[] = [];
	for (const notif of twinNotifs) {
		if (relation.friendStatus === DB_CONST.FRIENDS.STATUS.PENDING) {
			notif.type = FRIEND_REQUEST_ACTIONS.DELETE;
			deletedNotifs.push(notif);
			await deleteNotification(notif.id);
		}
	}
	sendToSocket(app, deletedNotifs);
	return { notifs: deletedNotifs };
}

/**
 * Ajoute le contenu de la notification à un objet de type NotificationInput ou NotificationModel.
 * 
 * Cette fonction vérifie si le type de la notification est un type de demande d'ami.
 * En fonction du type de la demande, elle génère le contenu de la notification.
 * 
 * @param {T extends NotificationInput | NotificationModel} notifData - L'objet contenant les données de la notification.
 * @return {Promise<T>} L'objet de notification avec le contenu ajouté.
 */
export async function addNotifContent<T extends NotificationInput | NotificationModel>(notifData: T): Promise<T> {
	const user = await getUser(notifData.from);
	let notif = '';
	if (Object.values(FRIEND_REQUEST_ACTIONS).includes(notifData.type)) {
		switch (notifData.type) {
			case FRIEND_REQUEST_ACTIONS.ADD:
				notif = `has sent you a friend request.`;
				break;
			case FRIEND_REQUEST_ACTIONS.ACCEPT:
				notif = `has accepted your friend request.`;
				break;
			case FRIEND_REQUEST_ACTIONS.DELETE:
				break;
			case FRIEND_REQUEST_ACTIONS.BLOCK:
				break;
		}
		notifData.content = `${user.username} ${notif}`;
	}
	return notifData;
}