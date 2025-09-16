import { getDb } from './index.db';
import { snakeToCamel, snakeArrayToCamel } from '../helpers/types.helpers';
import { FriendModel, ChatModel } from '../shared/types/friend.types';	// en rouge car dossier local 'shared' != dossier conteneur
import { SafeUserBasic } from '../shared/types/user.types';

export async function getAllRelations() {
	const db = await getDb();
	const relations = await db.all(`
		SELECT u.id, u.username, u.avatar, u.begin_log, u.end_log, 
			f.requester_id, f.friend_status, f.blocked_by, f.challenged_by, f.meet_date
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
		SELECT u.id, u.username, u.avatar, u.begin_log, u.end_log, u.status,
		f.requester_id, f.friend_status, f.blocked_by, f.challenged_by, f.meet_date
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
		SELECT u.id, u.username, u.avatar, u.begin_log, u.end_log, u.status,
			f.requester_id, f.friend_status, f.blocked_by, f.challenged_by, f.meet_date
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
 * Met à jour le statut de défi entre deux utilisateurs en marquant que le premier utilisateur a été défié par le second.
 * @param {number} userId1 - Identifiant du premier utilisateur.
 * @param {number} userId2 - Identifiant du second utilisateur.
 * @returns {Promise<void>} - Promesse qui se résout après avoir mis à jour le statut de défi entre les deux utilisateurs.
 */
export async function updateFriendChallenged(userId1: number, userId2: number): Promise<FriendModel> {
	const db = await getDb();

	const [user1, user2] = userId1 < userId2
		? [userId1, userId2]
		: [userId2, userId1];

	await db.run(`
		UPDATE Friends
		SET challenged_by = ?
		WHERE user1_id = ? AND user2_id = ?
	`, [userId2, user1, user2]);

	const relation = await getRelation(userId1, userId2);
	return snakeToCamel(relation) as FriendModel;
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


//  -------------------------- brouillon chat - pas teste --------------------------------------------
// export async function addMessageToChat(sender_id: number, receiver_id: number, message: string) {
// 	const db = await getDb();

// 	await db.run(`
//         INSERT INTO Friends (sender_id, receiver_id, message)
// 		VALUES (?, ?, ?)
//         `,
// 		[sender_id, receiver_id, message]
// 	);
// }

// export async function getUserChat(userId1: number, userId2: number) {
// 	const db = await getDb();
// 	const chat = await db.all(`
// 		SELECT c.message, c.time_send, c.id, c.sender_id, c.receiver_id
// 		FROM Chat c
// 		WHERE (sender_id = ? AND receiver_id = ?)
// 		OR (sender_id = ? AND receiver_id = ?)
// 		ORDER BY c.time_send ASC
// 		`,
// 		[userId1, userId2, userId2, userId1]
// 	);

// 	const other_user = await db.get(`
// 		SELECT u.id, u.username, u.avatar
// 		FROM User u
// 		WHERE u.id != ?
// 		`,
// 		[userId2]
// 	);
// 	return {
// 		messages : snakeArrayToCamel(chat) as ChatModel[],
// 		otherUser: snakeToCamel(other_user) as SafeUserBasic 
// 	};
// }

// export async function extractMessagesToChat(sender_id: number, receiver_id: number) {
// 	const db = await getDb();

// 	const messages = await db.get(`
//         SELECT *
// 		FROM Chat c
// 		JOIN User u ON
// 		(
// 			(c.sender_id = ? AND c.receiver_id = ?)
// 			OR
// 			(c.sender_id = ? AND c.receiver_id = ?)
// 		)
// 		VALUES (?, ?, ?, ?)
//         `,
// 		[sender_id, receiver_id, receiver_id, sender_id]
// 	);
// 	return snakeToCamel(messages) as ChatModel[];
// }
// requete pour add un message + route avec a la fin envoi d un socket au receiver
// requete pour recuperer tous les messages
