import { getDb } from './index.db';
import { NotificationModel } from '../shared/types/notification.types';	// en rouge car dossier local 'shared' != dossier conteneur
import { NotificationInput } from '../types/zod/app.zod';
import { snakeToCamel, snakeArrayToCamel } from '../helpers/types.helpers';
import { NotifResponse } from '../shared/types/response.types';

/**
 * Renvoie la liste des notifications de l'utilisateur d'identifiant `id`.
 *
 * Fait une requête SQL pour récupérer les notifications de l'utilisateur
 * d'identifiant `id`, en ordre décroissant de date de création.
 *
 * @param {number} id Identifiant de l'utilisateur.
 * @returns {Promise<NotificationModel[] | { errorMessage: string }>} Promesse qui se résout avec un tableau
 * d'objets `NotificationModel` ou un message d'erreur.
 */
export async function getUserNotifications(id: number): Promise<NotificationModel[] | { errorMessage: string }> {
	const db = await getDb();
	try {
		const notifs = await db.all(`
			SELECT n.id, n."from", n."to", n.type, n.content, n.created_at, n.read
			FROM Notif n
			WHERE n."to" = ?
			ORDER BY n.created_at ASC
			`,
		[id]);
		return snakeArrayToCamel(notifs) as NotificationModel[];
	} catch (error) {
		return { errorMessage: (error as Error).message };
	}
}

/**
 * Renvoie la notification d'identifiant `notifId`.
 *
 * Renvoie une promesse qui se résout avec un objet `NotificationModel`
 * contenant les informations de la notification.
 *
 * @param {number} notifId L'identifiant de la notification à récupérer.
 * @returns {Promise<NotificationModel | { errorMessage: string }>} Promesse qui se résout avec l'objet
 * `NotificationModel` ou un message d'erreur.
 */
export async function getNotification(notifId: number): Promise<NotificationModel | { errorMessage: string }> {
	const db = await getDb();
	try {
		const notif = await db.get(`
			SELECT n.id, n."from", n."to", n.type, n.content, n.created_at, n.read
			FROM Notif n
			WHERE n.id = ?
			`,
		[notifId]);
		return snakeToCamel(notif) as NotificationModel;
	} catch (error) {
		return { errorMessage: (error as Error).message };
	}
}

/**
 * Renvoie les notifications jumelles à la notification en paramètre.
 *
 * Une notification jumelle est une notification qui a les mêmes expéditeurs et
 * destinataires, ainsi que le même type, que la notification en paramètre.
 *
 * @param {NotificationModel | NotificationInput} notifData - La notification qui sert de base pour
 * la recherche des notifications jumelles.
 * @returns {Promise<NotificationModel[] | { errorMessage: string }>} Promesse qui se résout avec un tableau
 * d'objets `NotificationModel` ou un message d'erreur.
 */
export async function getTwinNotifications(notifData: NotificationModel | NotificationInput): Promise<NotificationModel[] | { errorMessage: string }> {
	const db = await getDb();
	try {
		const notifs = await db.all(`
			SELECT n.id, n."from", n."to", n.type, n.content, n.created_at, n.read
			FROM Notif n
			WHERE n."from" = ? AND n."to" = ? AND n.type = ?
			`,
			[notifData.from, notifData.to, notifData.type]
		);
		return snakeArrayToCamel(notifs) as NotificationModel[];
	} catch (error) {
		return { errorMessage: (error as Error).message };
	}
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
 * @returns {Promise<NotificationModel | { errorMessage: string }>} Promesse qui se résout avec l'objet
 * `NotificationModel` ou un message d'erreur.
 */
export async function insertNotification(notifData: NotificationInput): Promise<NotificationModel | { errorMessage: string }> {
	const db = await getDb();
	try {
		if (notifData.from === notifData.to) {
			throw new Error('Les ids des utilisateurs doivent différer');
		}
		const result = await db.run(
			`
			INSERT INTO Notif ("from", "to", type, content, read)
			VALUES (?, ?, ?, ?, ?)
			`,
			[notifData.from, notifData.to, notifData.type, notifData.content, notifData.read]
		);
		const insertedNotif = await getNotification(result.lastID!);
		if (!insertedNotif || "errorMessage" in insertedNotif) {
			return { errorMessage: "Impossible de récupérer la notif insérée" };
		}
		return snakeToCamel(insertedNotif) as NotificationModel;
	} catch (error) {
		return { errorMessage: (error as Error).message };
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
 * @param {NotificationModel} notifData - Informations de la notification à mettre à jour.
 * @returns {Promise<NotificationModel | { errorMessage: string }>} Promesse qui se résout avec l'objet
 */
export async function updateNotification(notifData: NotificationModel): Promise<NotificationModel | { errorMessage: string }> {
	const db = await getDb();
	try {
		await db.run(`
			UPDATE Notif
			SET type = ?, content = ?, read = ?
			WHERE (id = ?)
			`,
			[notifData.type, notifData.content, notifData.read, notifData.id]
		);

		const updatedNotif = await getNotification(notifData.id!);
		return snakeToCamel(updatedNotif) as NotificationModel;
	} catch (error) {
		return { errorMessage: (error as Error).message };
	}
}

/**
 * Supprime la notification d'identifiant `notifId`.
 * 
 * Exécute une requête SQL pour supprimer la notification spécifiée par `notifId`.
 * 
 * @param {number} notifId - Identifiant de la notification à supprimer.
 * @returns {Promise<NotifResponse | void>} Une promesse qui se résout lorsque la suppression est terminée
 * ou renvoie un message d'erreur.
 */
export async function deleteNotification(notifId: number): Promise<NotifResponse | void> {
	const db = await getDb();
	try {
		await db.run(`
			DELETE FROM Notif
			WHERE (id = ?)
			`,
		[notifId]);
	} catch (error) {
		return { errorMessage: (error as Error).message };
	}
}
