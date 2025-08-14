import { getDb } from './index.db';
import { NotificationModel } from '../shared/types/notification.types';	// en rouge car dossier local 'shared' != dossier conteneur
import { NotificationInput } from '../types/zod/app.zod';
import { snakeToCamel, snakeArrayToCamel } from '../helpers/types.helpers';

/**
 * Renvoie la liste des notifications de l'utilisateur d'identifiant `id`.
 *
 * Fait une requête SQL pour récupérer les notifications de l'utilisateur
 * d'identifiant `id`, en ordre décroissant de date de création.
 *
 * @param {number} id Identifiant de l'utilisateur.
 * @returns {Promise<NotificationModel[]>} Promesse qui se résout avec un tableau
 * d'objets `NotificationModel`.
 */
export async function getUserNotifications(id: number): Promise<NotificationModel[]> {
	const db = await getDb();
	const notifs = await db.all(`
		SELECT n.id, n."from", n."to", n.type, n.content, n.created_at, n.status
		FROM Notif n
		WHERE n."to" = ?
		ORDER BY n.created_at DESC
		`,
	[id]);
	return snakeArrayToCamel(notifs) as NotificationModel[];
}

/**
 * Renvoie la notification d'identifiant `notifId`.
 *
 * Renvoie une promesse qui se résout avec un objet `NotificationModel`
 * contenant les informations de la notification.
 *
 * @param {number} notifId L'identifiant de la notification à récupérer.
 * @returns {Promise<NotificationModel>} La promesse qui se résout avec les informations de la notification.
 */
export async function getNotification(notifId: number): Promise<NotificationModel> {
	const db = await getDb();
	const notif = await db.get(`
		SELECT n.id, n."from", n."to", n.type, n.content, n.created_at, n.status
		FROM Notif n
		WHERE n.id = ?
		`,
	[notifId]);
	return snakeToCamel(notif) as NotificationModel;
}

/**
 * Renvoie les notifications jumelles à la notification en paramètre.
 *
 * Une notification jumelle est une notification qui a les mêmes expéditeurs et
 * destinataires, ainsi que le même type, que la notification en paramètre.
 *
 * @param {NotificationInput} notifData - La notification qui sert de base pour
 * la recherche des notifications jumelles.
 * @returns {Promise<NotificationModel[]>} Promesse qui se résout avec un tableau
 * contenant les notifications jumelles.
 */
export async function getTwinNotifications(notifData: NotificationInput): Promise<NotificationModel[]> {
	const db = await getDb();
	const notifs = await db.all(`
		SELECT n.id, n."from", n."to", n.type, n.content, n.created_at, n.status
		FROM Notif n
		WHERE n."from" = ? AND n."to" = ? AND n.type = ?
		`,
		[notifData.from, notifData.to, notifData.type]
	);
	return snakeArrayToCamel(notifs) as NotificationModel[];
}

/**
 * Ajoute une notification en base de données.
 *
 * Ajoute une notification en base de données avec les informations données.
 * Si la notification est ajoutée, renvoie un objet avec un code d'état 201 et
 * l'objet `NotificationModel` correspondant.
 * Sinon, renvoie un objet avec un code d'état 400 et un message d'erreur.
 *
 * @param {NotificationInput} notifData Les informations de la notification à ajouter.
 */
export async function insertNotification(notifData: NotificationInput) {
	const db = await getDb();

	try {
		if (notifData.from === notifData.to) {
			throw new Error('Les ids des utilisateurs doivent différer');
		}
		const result = await db.run(
			`
			INSERT INTO Notif ("from", "to", type, content)
			VALUES (?, ?, ?, ?)
			`,
			[notifData.from, notifData.to, notifData.type, notifData.content]
		);

		const insertedNotif = await getNotification(result.lastID);
		return {
			statusCode: 201,
			data: snakeToCamel(insertedNotif) as NotificationModel
		};
	} catch (error) {
		return {
			statusCode: 400,
			errorMessage: (error as Error).message
		};
	}
}

/**
 * Met à jour une notification.
 * 
 * Met à jour la notification d'identifiant `notifId` avec les informations
 * contenues dans `notifData`.
 * 
 * Si la requête réussit, renvoie l'objet `NotificationModel` mis à jour.
 * Sinon, renvoie un objet contenant un message d'erreur.
 * 
 * @param {number} notifId - Identifiant de la notification à mettre à jour.
 * @param {NotificationModel} notifData - Informations de la notification à mettre à jour.
 */
export async function updateNotification(notifId: number, notifData: NotificationModel) {
	const db = await getDb();

	try {
		const result = await db.run(`
			UPDATE Notif
			SET "type = ?, content = ?
			WHERE (id = ?)
			`,
			[notifData.type, notifData.content, notifId]
		);

		const updatedNotif = await getNotification(result.lastID);
		return {
			statusCode: 201,
			data: snakeToCamel(updatedNotif) as NotificationModel
		};
	} catch (error) {
		return {
			statusCode: 400,
			errorMessage: (error as Error).message
		};
	}
}

/**
 * Met à jour le statut de la notification d'identifiant `notifId` pour passer au statut "lu".
 * 
 * Met à jour la notification d'identifiant `notifId` avec le statut "lu".
 * 
 * @param {number} notifId - Identifiant de la notification à mettre à jour.
 * @returns {Promise<void>} Une promesse qui se résout lorsque la mise à jour est terminée.
 */
export async function updateNotificationStatus(notifId: number): Promise<void> {
	const db = await getDb();
	await db.run(`
		UPDATE Notif
		SET status = 1
		WHERE (id = ?)
		`,
	[notifId]);
}

/**
 * Met à jour le contenu de la notification d'identifiant `notifId`.
 *
 * Exécute une requête SQL pour mettre à jour le champ `content` de la
 * notification spécifiée par `notifId` avec le nouveau contenu `notifContent`.
 *
 * @param {number} notifId - Identifiant de la notification à mettre à jour.
 * @param {string} notifContent - Nouveau contenu de la notification.
 * @returns {Promise<void>} Une promesse qui se résout lorsque la mise à jour est terminée.
 */

export async function updateNotificationContent(notifId: number, notifContent: string): Promise<void> {
	const db = await getDb();
	await db.run(`
		UPDATE Notif
		SET content = ?
		WHERE (id = ?)
		`,
	[notifContent, notifId]);
}

/**
 * Supprime la notification d'identifiant `notifId`.
 * 
 * Exécute une requête SQL pour supprimer la notification spécifiée par `notifId`.
 * 
 * @param {number} notifId - Identifiant de la notification à supprimer.
 * @returns {Promise<void>} Une promesse qui se résout lorsque la suppression est terminée.
 */
export async function deleteNotification(notifId: number): Promise<void> {
	const db = await getDb();
	await db.run(`
		DELETE FROM Notif
		WHERE (id = ?)
		`,
	[notifId]);
}