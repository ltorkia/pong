import { FastifyInstance } from 'fastify';
import { UserWS } from '../types/user.types';
import { NotificationModel, FriendRequestAction } from '../shared/types/notification.types';
import { FRIEND_REQUEST_ACTIONS } from '../shared/config/constants.config';
import { getUser } from '../db/user';
import { NotificationInput } from '../types/zod/app.zod';
import { getNotification, getTwinNotifications, updateNotification } from '../db/notification';
import { updateRelationshipBlocked, updateRelationshipConfirmed } from '../db/friendmaj';

/**
 * Met à jour les notifications liées à une demande d'amitié.
 *
 * - Met à jour la relation entre l'utilisateur courant et l'utilisateur ami.
 * - Récupère la notification liée à la demande d'amitié.
 * - Récupère les notifications jumelles (même expéditeur et destinataire, même type) à la notification liée.
 * - Met à jour chaque notification jumelle.
 * - Envoie les notifications mises à jour aux utilisateurs connectés via Websocket.
 *
 * @param {FastifyInstance} app - Instance de l'application Fastify.
 * @param {number} currentUserId - Identifiant de l'utilisateur courant.
 * @param {number} friendId - Identifiant de l'utilisateur ami.
 * @param {NotificationModel} data - Informations de la notification à mettre à jour.
 * @returns {Promise<void>} Une promesse qui se résout lorsque les notifications ont été mises à jour.
 */
export async function updateFriendProcess(app: FastifyInstance, currentUserId: number, friendId: number, data: NotificationModel, newType: FriendRequestAction): Promise<void> {
	switch (newType) {
		case FRIEND_REQUEST_ACTIONS.ACCEPT:
			await updateRelationshipConfirmed(currentUserId, friendId);
			break;
		case FRIEND_REQUEST_ACTIONS.BLOCK:
			await updateRelationshipBlocked(currentUserId, friendId);
			break;
	}
	const notifData: NotificationModel = await getNotification(data.id);
	const twinNotifs: NotificationModel[] = await getTwinNotifications(notifData);
	let updatedNotifs: NotificationModel[] = [];
	for (const twinNotif of twinNotifs) {
		twinNotif.type = newType;
		const notif: NotificationModel = await addNotifContent(twinNotif);
		const updatedNotif = await updateNotification(twinNotif.id, notif);
		if (!updatedNotif || updatedNotif.errorMessage || !updatedNotif.data) {
			console.error({ errorMessage: updatedNotif.errorMessage || 'Error inserting notification' });
			return;
		}
		updatedNotifs.push(updatedNotif.data);
	}
	sendToSocket(app, updatedNotifs);
}

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
 * Ajoute le contenu de la notification à un objet de type NotificationInput ou NotificationModel.
 * 
 * Cette fonction vérifie si le type de la notification est un type de demande d'ami.
 * En fonction du type de la demande, elle génère le contenu de la notification
 * et, le cas échéant, ajoute les boutons correspondants.
 * 
 * @param {T extends NotificationInput | NotificationModel} notifData - L'objet contenant les données de la notification.
 * @return {Promise<T>} L'objet de notification avec le contenu ajouté.
 */
export async function addNotifContent<T extends NotificationInput | NotificationModel>(notifData: T): Promise<T> {
	const user = await getUser(notifData.from);
	let notif = '';
	let buttons = null;
	if (Object.values(FRIEND_REQUEST_ACTIONS).includes(notifData.type)) {
		switch (notifData.type) {
			case FRIEND_REQUEST_ACTIONS.ADD:
				notif = `has sent you a friend request.`;
				buttons = addNotifButtonsHTML(notifData);
				break;
			case FRIEND_REQUEST_ACTIONS.ACCEPT:
				notif = `has accepted your friend request.`;
				break;
			case FRIEND_REQUEST_ACTIONS.DELETE:
				break;
			case FRIEND_REQUEST_ACTIONS.BLOCK:
				break;
		}
		notifData.content = `<span>${user.username} ${notif}</span>`;
		if (buttons) {
			notifData.content += buttons;
		}
	}
	return notifData;
}

/**
 * Crée le contenu de la notification avec le HTML pour les boutons d'actions dans une notification.
 * 
 * Si la notification est une demande d'amitié, les boutons "Accept" et "Decline"
 * seront ajoutés au contenu de la notification et seront affichés. Sinon, le HTML est vide.
 * 
 * @param {NotificationInput | NotificationModel} notifData - L'objet contenant les informations de la notification.
 * @returns {string} Le HTML des boutons d'actions.
 */
export function addNotifButtonsHTML(notifData: NotificationInput | NotificationModel): string {
	let html = `<div class="notif-actions flex justify-center space-x-4">`;
	switch (notifData.type) {
		case FRIEND_REQUEST_ACTIONS.ACCEPT:
			html += `
				<button class="btn smaller-btn" data-action="accept" data-to="${notifData.to}" data-from="${notifData.from}">
					Accept
				</button>
				<button class="btn smaller-btn" data-action="decline" data-to="${notifData.to}" data-from="${notifData.from}">
					Decline
				</button>
			`;
			break;
	}
	html += `</div>`;
	return html;
}