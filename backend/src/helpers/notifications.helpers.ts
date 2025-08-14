import { FastifyInstance } from 'fastify';
import { UserWS } from '../types/user.types';
import { NotificationModel, FriendRequestAction } from '../shared/types/notification.types';
import { FRIEND_REQUEST_ACTIONS } from '../../shared/config/constants.config';
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
 * @param {NotificationInput} data - Informations de la notification à mettre à jour.
 * @returns {Promise<void>} Une promesse qui se résout lorsque les notifications ont été mises à jour.
 */
export async function updateFriendProcess(app: FastifyInstance, currentUserId: number, friendId: number, data: NotificationInput, newType: FriendRequestAction): Promise<void> {
	switch (newType) {
		case FRIEND_REQUEST_ACTIONS.ACCEPT:
			await updateRelationshipConfirmed(currentUserId, friendId);
			break;
		case FRIEND_REQUEST_ACTIONS.BLOCK:
			await updateRelationshipBlocked(currentUserId, friendId);
			break;
	}
	const notifData: NotificationModel = await getNotification(data.notifId);
	const twinNotifs: NotificationModel[] = await getTwinNotifications(notifData);
	let updatedNotifs: NotificationModel[] = [];
	for (const twinNotif of twinNotifs) {
		twinNotif.type = newType;
		const notif: NotificationModel = addNotifContent(twinNotif);
		const updatedNotif = await updateNotification(twinNotif.id, notif);
		if (data.errorMessage) {
			console.error({ errorMessage: data.errorMessage || 'Error inserting notification' });
			return;
		}
		updatedNotifs.push(updatedNotif);
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
 * Ajoute le contenu de la notification en fonction de l'action de la demande d'amitié.
 *
 * Si l'action de la demande d'amitié est connue, alors le contenu de la notification
 * est généré en conséquence. Si l'action est inconnue, alors une erreur est enregistrée.
 *
 * @param {NotificationInput | NotificationModel} notifData - L'objet contenant les informations de la notification.
 * @returns {NotificationInput | NotificationModel} L'objet mis à jour avec le contenu de la notification.
 */
export async function addNotifContent(notifData: NotificationInput | NotificationModel): NotificationInput | NotificationModel {
	const user = await getUser(notifData.type.from);
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
			default:
				console.error("Unknown friend request action:", notifData.type);
				break;
		}
		notifData.content = `<span>${user.username} ${notif}</span>`;
		if (buttons) {
			notifData.content += buttons;
		}
		return notifData;
	}
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
	if (Object.values(FRIEND_REQUEST_ACTIONS).includes(notifData.type
		&& notifData.type === FRIEND_REQUEST_ACTIONS.ADD)) {
		
		html += `
			<button class="btn smaller-btn" data-action="accept" data-to="${notifData.to}" data-from="${notifData.from}">
				Accept
			</button>
			<button class="btn smaller-btn" data-action="decline" data-to="${notifData.to}" data-from="${notifData.from}">
				Decline
			</button>
		`;
	}
	html += `</div>`;
	return html;
}