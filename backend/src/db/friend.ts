import { getDb } from './index.db';
import { snakeToCamel, snakeArrayToCamel } from '../helpers/types.helpers';
import { FriendModel } from '../shared/types/friend.types';	// en rouge car dossier local 'shared' != dossier conteneur
import { NotificationModel } from '../shared/types/notification.types';

export async function getAllRelations() {
	const db = await getDb();
	const relations = await db.all(`
		SELECT u.id, u.username, u.avatar, u.begin_log, u.end_log, 
			f.requester_id, f.friend_status, f.blocked_by, f.meet_date
		FROM Friends f
		JOIN User u ON u.id = f.user1_id OR u.id = f.user2_id
	`);
	return snakeArrayToCamel(relations);
}
// pour choper les friends, mais implique qu un element chat soit forcement cree des qu on devient ami
//  -> comment ajouter un ami ? nouvelle page ?
//  -> version ou on decide d avoir forcement de cree par defaut une donnee avec le client en tant que sender et receveur
export async function getUserFriends(userId: number): Promise<FriendModel[]> {
	const db = await getDb();
	const friends = await db.all(`
		SELECT u.id, u.username, u.avatar, u.begin_log, u.end_log, 
		f.requester_id, f.friend_status, f.blocked_by, f.meet_date
		FROM Friends f
		JOIN User u ON (
			(f.user1_id = ? AND f.user2_id = u.id)
			OR
			(f.user2_id = ? AND f.user1_id = u.id)
		)
		`,
		[userId, userId]
	);
	return snakeArrayToCamel(friends) as FriendModel[];
}

/**
 * Cette fonction récupère les informations sur la relation entre deux utilisateurs dans la table Friends.
 * @param {number} userId1 - Identifiant du premier utilisateur.
 * @param {number} userId2 - Identifiant du second utilisateur.
 * @returns {Promise<FriendModel>} - Promesse qui se résout avec les informations sur la relation entre les deux utilisateurs.
 */
export async function getRelation(userId1: number, userId2: number): Promise<FriendModel> {
	const db = await getDb();
	const relation = await db.get(`
		SELECT u.id, u.username, u.avatar, u.begin_log, u.end_log, 
			f.requester_id, f.friend_status, f.blocked_by, f.meet_date
		FROM Friends f
		JOIN User u ON (
			(f.user1_id = u.id OR f.user2_id = u.id)
			AND u.id != ?
		)
		WHERE (f.user1_id = ? AND f.user2_id = ?)
		OR (f.user1_id = ? AND f.user2_id = ?)
	`, [userId1, userId1, userId2, userId2, userId1]);
	return snakeToCamel(relation) as FriendModel;
}

/**
 * LEFT JOIN User_Game ug = permet d’aller chercher toutes les parties du user.
 * COUNT(ug.game_id) = total de parties jouées.
 * SUM(CASE WHEN ug.status_win = 1 ...) = victoires/défaites.
 * SUM(ug.duration) = temps joué (si on stock la durée en secondes/minutes).
 * LEFT JOIN User_Tournament ut pour récupérer les stats des tournois.

 * COUNT(DISTINCT ut.tournament_id) = nombre de tournois joués.
 * SUM(ut.score), SUM(ut.wins), SUM(ut.losses) = score et victoires/défaites cumulées.
 * MAX(ut.round_reached) = dernier round atteint.
 * DISTINCT sur ug.game_id pour éviter les doublons si plusieurs entrées par jeu.
 */
export async function getUserFriendStats(userId1: number, userId2: number): Promise<FriendModel> {
	const db = await getDb();
	const stats = await db.get(`
		SELECT 
			u.id, u.username, u.avatar, u.registration, u.begin_log, u.end_log, 
			f.requester_id, f.friend_status, f.blocked_by, f.meet_date,

			COUNT(DISTINCT ug.game_id) AS game_played,
			SUM(CASE WHEN ug.status_win = 1 THEN 1 ELSE 0 END) AS game_win,
			SUM(CASE WHEN ug.status_win = 0 THEN 1 ELSE 0 END) AS game_loose,
			COALESCE(SUM(ug.duration), 0) AS time_played,

			COUNT(DISTINCT ut.tournament_id) AS tournaments_played,
			SUM(ut.score) AS tournament_score,
			SUM(ut.wins) AS tournament_wins,
			SUM(ut.losses) AS tournament_losses,
			MAX(ut.round_reached) AS last_round_reached

		FROM Friends f
		JOIN User u ON (
			(u.id = f.user1_id OR u.id = f.user2_id)
			AND u.id != ?
		)
		LEFT JOIN User_Game ug ON ug.user_id = u.id
		LEFT JOIN User_Tournament ut ON ut.user_id = u.id
		WHERE (f.user1_id = ? AND f.user2_id = ?)
			OR (f.user1_id = ? AND f.user2_id = ?)
		GROUP BY u.id
	`, [userId1, userId1, userId2, userId2, userId1]);

	return snakeToCamel(stats) as FriendModel;
}

/**
 * Renvoie les notifications ainsi que les informations sur la relation amicale
 * entre les utilisateurs d'identifiants `userId1` et `userId2`.
 *
 * Fait une requête SQL pour récupérer la relation d'amitié entre les deux
 * utilisateurs, ainsi que les notifications liées à cette relation.
 *
 * @param {number} userId1 Identifiant de l'utilisateur 1.
 * @param {number} userId2 Identifiant de l'utilisateur 2.
 * @returns {Promise<{ friend: Partial<FriendModel>, notifications: NotificationModel[] }>} Promesse qui se résout avec un objet
 * contenant les informations de la relation d'amitié (`Partial<FriendModel>`) et
 * les notifications associées (`NotificationModel[]`).
 */
export async function getNotifsInRelation(userId1: number, userId2: number): Promise<{ friend: Partial<FriendModel>, notifications: NotificationModel[] }> {
	const db = await getDb();

	const result: any[] = await db.all(`
		SELECT 
			-- NOTIFS
			n.id as notif_id, n."from", n."to", n.type,
			n.created_at, n.content, n.read,
			f.requester_id, f.friend_status, f.blocked_by, f.meet_date,
			u.id, u.username, u.status

		FROM Friends f
		JOIN User u 
			ON ( (f.user1_id = u.id OR f.user2_id = u.id) AND u.id != ? )
		LEFT JOIN Notif n
			ON (
				(n."from" = ? AND n."to" = ?)
					OR 
				(n."from" = ? AND n."to" = ?)
			)
		WHERE (f.user1_id = ? AND f.user2_id = ?)
		   OR (f.user1_id = ? AND f.user2_id = ?)
		ORDER BY n.created_at DESC
	`, [
		userId1, userId1, userId2, userId2, userId1,
		userId1, userId2, userId2, userId1
	]);

	if (!result || result.length === 0)
		throw new Error("Relation not found");

	// Relation = infos de l'autre user + friend_status
	const relationRow = result[0];
	const friendObj = snakeToCamel({
		id: relationRow.id,
		username: relationRow.username,
		requesterId: relationRow.requester_id,
		friendStatus: relationRow.friend_status,
		blockedBy: relationRow.blocked_by,
		meetDate: relationRow.meet_date,
		status: relationRow.status
	});

	if (!friendObj)
		throw new Error("Erreur lors de la conversion friend");
	const friend: Partial<FriendModel> = friendObj;

	// Notifications = tableau
	const notifications = snakeArrayToCamel(
	result
		.filter(r => r.notif_id != null)
		.map(r => ({
			id: r.notif_id,
			from: r.from,
			to: r.to,
			type: r.type,
			createdAt: r.created_at,
			content: r.content,
			read: r.read
		}))
	) as NotificationModel[];

	return { notifications, friend };
}

/**
 * Cette fonction met à jour une relation entre deux utilisateurs en bloquant cette relation.
 * @param {number} userId1 - Identifiant du premier utilisateur.
 * @param {number} userId2 - Identifiant du second utilisateur.
 * @returns {Promise<FriendModel>} - Promesse qui se résout avec les informations sur la relation bloquée entre les deux utilisateurs.
 */
export async function updateRelationshipBlocked(userId1: number, userId2: number): Promise<FriendModel> {
	const db = await getDb();

	const [user1, user2] = userId1 < userId2
		? [userId1, userId2]
		: [userId2, userId1];

	await db.run(`
		UPDATE Friends
		SET friend_status = 'blocked', blocked_by = ?
		WHERE user1_id = ? AND user2_id = ?
	`, [userId2, user1, user2]);

	const relation = await getRelation(userId1, userId2);
	return snakeToCamel(relation) as FriendModel;
}

/**
 * Cette fonction met à jour une relation entre deux utilisateurs en acceptant cette relation.
 * @param {number} userId1 - Identifiant du premier utilisateur.
 * @param {number} userId2 - Identifiant du second utilisateur.
 * @returns {Promise<FriendModel>} - Promesse qui se résout avec les informations sur la relation acceptée entre les deux utilisateurs.
 */
export async function updateRelationshipConfirmed(userId1: number, userId2: number): Promise<FriendModel> {
	const db = await getDb();

	const [user1, user2] = userId1 < userId2
		? [userId1, userId2]
		: [userId2, userId1];

	await db.run(`
		UPDATE Friends
		SET friend_status = 'accepted'
		WHERE user1_id = ? AND user2_id = ?
	`, [user1, user2]);

	const relation = await getRelation(userId1, userId2);
	return snakeToCamel(relation) as FriendModel;
}

/**
 * Cette fonction supprime une relation entre deux utilisateurs de la table Friends.
 * @param {number} userId1 - Identifiant du premier utilisateur.
 * @param {number} userId2 - Identifiant du second utilisateur.
 * @returns {Promise<void>} - Promesse qui se résout après avoir supprimé la relation entre les deux utilisateurs de la table Friends.
 */
export async function updateRelationshipDelete(userId1: number, userId2: number): Promise<void> {
	const db = await getDb();

	const [user1, user2] = userId1 < userId2
		? [userId1, userId2]
		: [userId2, userId1];

	await db.run(`
		DELETE FROM Friends
		WHERE user1_id = ? AND user2_id = ?
	`, [user1, user2]);
}

/**
 * This function adds a friend to the Friends table by inserting a new row.
 * @param {number} userId1 - The ID of the first user.
 * @param {number} userId2 - The ID of the second user.
 * @return {Promise<FriendModel>} - A Promise that resolves to a FriendModel object representing the newly added friend relationship.
 */
export async function addUserFriend(userId1: number, userId2: number): Promise<FriendModel> {
	const db = await getDb();

	const [user1, user2] = userId1 < userId2
		? [userId1, userId2]
		: [userId2, userId1];

	await db.run(`
        INSERT INTO Friends (user1_id, user2_id, requester_id)
		VALUES (?, ?, ?)
        `,
		[user1, user2, userId1]
	);

	const relation = await getRelation(userId1, userId2);
	return snakeToCamel(relation) as FriendModel;
}