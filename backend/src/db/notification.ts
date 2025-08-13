import { getDb } from './index.db';
import { NotificationModel } from '../shared/types/notification.types';	// en rouge car dossier local 'shared' != dossier conteneur
import { NotificationInput } from '../types/zod/auth.zod';
import { snakeToCamel, snakeArrayToCamel } from '../helpers/types.helpers';

export async function insertNotification(notifData: NotificationInput) {
	const db = await getDb();
	if (notifData.userId != notifData.receiverId)
	{
		await db.run(`
			INSERT INTO Notif (sender_id, receiver_id, content)
			VALUES (?, ?, ?)
			`,
			[notifData.userId, notifData.receiverId, notifData.content]
		);
	}
	return {statusCode : 201, message : 'notif add'};
}

export async function getUserNotifications(id: number): Promise<NotificationModel[]> {
	const db = await getDb();
	const notifs = await db.all(`
		SELECT n.id, n.sender_id, n.receiver_id, n.content, n.created_at, n.status
		FROM Notif n
		WHERE n.receiver_id = ?
		ORDER BY n.created_at DESC
		`,
	[id]);
	return snakeArrayToCamel(notifs) as NotificationModel[];
}

export async function getNotification(notifId: number): Promise<NotificationModel> {
	const db = await getDb();
	const notif = await db.get(`
		SELECT n.id, n.sender_id, n.receiver_id, n.content, n.created_at, n.status
		FROM Notif n
		WHERE n.id = ?
		`,
	[notifId]);
	return snakeToCamel(notif) as NotificationModel;
}

export async function updateNotification(notifId: number) {
	const db = await getDb();
	await db.run(`
		UPDATE Notif
		SET status = 1
		WHERE (id = ?)
		`,
	[notifId]);
}