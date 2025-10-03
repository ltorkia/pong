import { FastifyInstance } from 'fastify';
// import { UserWS } from '../types/user.types';
// import type { WebSocket } from 'ws';
import { NotificationModel, UserOnlineStatus } from '../shared/types/notification.types';
import { FRIEND_REQUEST_ACTIONS, FRIEND_NOTIF_CONTENT } from '../shared/config/constants.config';
import { NotificationInput } from '../types/zod/app.zod';
import { getTwinNotifications, updateNotification, deleteNotification } from '../db/notification';
import { isValidNotificationType } from '../shared/utils/app.utils';
import { insertNotification } from '../db/notification';
import { majLastlog } from '../db/usermaj';

/**
 * Envoie un message à un utilisateur connecté via WebSockets.
 * La clé "to" du objet data est utilisée pour identifier l'utilisateur ciblé.
 * Si l'utilisateur est connecté, alors le message est envoyé via WebSockets.
 * @param {FastifyInstance} app - L'instance de l'application Fastify.
 * @param {NotificationModel[]} data - Le tableau contenant les notifications à envoyer.
 */
// export function sendToSocket(app: FastifyInstance, data: NotificationModel[]): void {
// 	const userWS: UserWS | undefined = app.usersWS.find((user: UserWS) => user.id == data[0].to);
// 	if (userWS) {
// 		console.log("→ Envoi WS vers", userWS.id, ":", JSON.stringify(data));
// 		userWS.WS.send(JSON.stringify(data));
// 	}
// }
export function sendToSocket(app: FastifyInstance, data: NotificationModel[]) {
    const sockets = app.usersWS.get(Number(data[0].to));
    if (!sockets) 
        return;

    for (const userWS of sockets) {
        if (userWS.WS.readyState === userWS.WS.OPEN) {
            userWS.WS.send(JSON.stringify(data));
        }
    }
}

/**
 * Envoie un message à tous les utilisateurs connectés via WebSockets, sauf l'utilisateur identifié par `jwtUserId`.
 * @param {FastifyInstance} app - L'instance de l'application Fastify.
 * @param {number} jwtUserId - L'ID de l'utilisateur identifié par le JWT.
 * @param {NotificationModel[]} data - Le tableau contenant les notifications à envoyer.
 */
// export function sendToAllSockets(app: FastifyInstance, jwtUserId: number, data: NotificationModel[]): void {
// 	for (const userWS of app.usersWS) {
// 		if (jwtUserId === userWS.id)
// 			continue;
// 		console.log("→ Envoi WS vers", userWS.id, ":", JSON.stringify(data));
// 		userWS.WS.send(JSON.stringify(data));
// 	}
// }
export function sendToAllSockets(app: FastifyInstance, jwtUserId: number, data: NotificationModel[]) {
    for (const [userId, sockets] of app.usersWS.entries()) {
        if (userId === jwtUserId) 
            continue;

        for (const userWS of sockets) {
            if (userWS.WS.readyState === userWS.WS.OPEN) {
                userWS.WS.send(JSON.stringify(data));
            }
        }
    }
}

/**
 * Met à jour l'état en ligne de l'utilisateur courant 
 * et envoie une notification à tous les utilisateurs connectés, 
 * à l'exception de l'utilisateur identifié par le JWT.
 * @param {FastifyInstance} app - L'instance de l'application Fastify.
 * @param {number} userId - L'ID de l'utilisateur.
 * @param {UserOnlineStatus} status - L'état en ligne (en ligne, absent, etc.) à définir pour l'utilisateur.
 */
export async function setOnlineStatus(app: FastifyInstance, userId: number, status: UserOnlineStatus) {
	await majLastlog(userId, status);
	let notifData: NotificationInput = {
		type: status,
		from: userId,
		to: 0,
		read: 0
	};
    for (const [otherUserId, userSockets] of app.usersWS.entries()) {
        if (otherUserId === userId)
            continue;

        for (const userWS of userSockets) {
            notifData.to = userWS.id;
            const notif = await insertNotification(notifData);
            if (!notif || 'errorMessage' in notif)
                continue;

            console.log("→ Envoi WS vers", userWS.id, ":", JSON.stringify([notif]));

            if (userWS.WS.readyState === userWS.WS.OPEN) {
                userWS.WS.send(JSON.stringify([notif]));
            }
        }
    }
	// for (const userWS of app.usersWS) {
	// 	if (userId === userWS.id)
	// 		continue;
	// 	notifData.to = userWS.id;
	// 	const notif = await insertNotification(notifData);
	// 	if (!notif || 'errorMessage' in notif)
	// 		return;
	// 	console.log("→ Envoi WS vers", userWS.id, ":", JSON.stringify([notif]));
	// 	userWS.WS.send(JSON.stringify([notif]));
	// }
}

/**
 * Met à jour et envoie une notification amicale.
 * Cette fonction récupère la notification et ses potentiels doublons,
 * les met à jour en utilisant le type donné dans le paramètre `data`,
 * puis les envoie mises à jour via WebSockets.
 * 
 * @param {FastifyInstance} app - L'instance de l'application Fastify.
 * @param {NotificationModel} data - Les données de la notification, y compris le type.
 * @returns {Promise<NotificationModel[] | { errorMessage: string }>} Une promesse qui se résout lorsque les notifications sont mises à jour 
 * et envoyées via WebSockets, ou par un message d'erreur.
 */
export async function sendUpdateNotification(app: FastifyInstance, data: NotificationModel): Promise<NotificationModel[] | { errorMessage: string }> {

	const twinNotifs = await getTwinNotifications(data);
	if (!twinNotifs || 'errorMessage' in twinNotifs)
		return { errorMessage: twinNotifs?.errorMessage || "No twin notifications found" };

	// On met à jour les notifications
	let updatedNotifs: NotificationModel[] = [];
	for (const twinNotif of twinNotifs) {
		twinNotif.read = 1;
		const updatedRes = await updateNotification(twinNotif);
		if (!updatedRes || 'errorMessage' in updatedRes) {
			return { errorMessage: updatedRes?.errorMessage || 'Error updating notification' };
		}
		updatedNotifs.push(updatedRes);
	}
	return updatedNotifs;
}

/**
 * Supprime une notification et ses potentiels doublons et les envoie via WebSockets.
 * Cette fonction récupère la notification et ses potentiels doublons, les supprime si la relation
 * est en attente, puis les envoie supprimées via WebSockets pour référence.
 * 
 * @param {FastifyInstance} app - L'instance de l'application Fastify.
 * @param {NotificationModel[]} data - Les données des notifications.
 * @returns {Promise<NotificationModel[] | { errorMessage: string }>} Une promesse qui se résout lorsque les notifications sont supprimées
 * et envoyées via WebSockets, ou par un message d'erreur.
 */
export async function sendDeleteNotification(app: FastifyInstance, data: NotificationModel[]): Promise<NotificationModel[] | { errorMessage: string }> {
	const deletedNotifs: NotificationModel[] = [];
	for (const notif of data) {
		notif.type = FRIEND_REQUEST_ACTIONS.DELETE;
		deletedNotifs.push(notif);
		await deleteNotification(notif.id);
	}
	return deletedNotifs;
}

/**
 * Ajoute le contenu de la notification à un objet de type NotificationInput ou NotificationModel.
 * 
 * Cette fonction vérifie si le type de la notification est un type de demande d'ami, un statut online etc.
 * En fonction du type de la demande, elle génère le contenu de la notification.
 * 
 * @param {T extends NotificationInput | NotificationModel} notifData - L'objet contenant les données de la notification.
 * @return {T} L'objet de notification avec le contenu ajouté.
 */
export function addNotifContent<T extends NotificationInput | NotificationModel>(notifData: T): T {
	if (!isValidNotificationType(notifData.type!)) {
		throw new Error('Invalid notification type');
	}
	
	let notif = '';
	if (!notifData.type) {
		return notifData;
	}
	switch (notifData.type) {
		case FRIEND_REQUEST_ACTIONS.ADD:
			notif = FRIEND_NOTIF_CONTENT.ADD;
			break;
		case FRIEND_REQUEST_ACTIONS.ACCEPT:
			notif = FRIEND_NOTIF_CONTENT.ACCEPT;
			break;
		case FRIEND_REQUEST_ACTIONS.INVITE:
			notif = FRIEND_NOTIF_CONTENT.INVITE;
			break;
		case FRIEND_REQUEST_ACTIONS.INVITE_ACCEPT:
			notif = FRIEND_NOTIF_CONTENT.INVITE_ACCEPT;
			break;
		case FRIEND_REQUEST_ACTIONS.INVITE_CANCEL:
			notif = FRIEND_NOTIF_CONTENT.INVITE_CANCEL;
			break;
		default:
			notifData.content = '';
			return notifData;
	}
	notifData.content = `${notif}`;
	return notifData;
}

