import { getDb } from './index.db';
import { FriendModel } from '../shared/types/friend.types';
import { snakeToCamel } from '../helpers/types.helpers';

export async function getRelation(userId1: number, userId2: number): Promise<FriendModel> {
	const db = await getDb();

	const [user1, user2] = userId1 < userId2
		? [userId1, userId2]
		: [userId2, userId1];

	const relation = await db.get(`
		SELECT u.id, u.username, u.avatar, u.begin_log, u.end_log, 
		f.requester_id, f.friend_status, f.blocked_by, f.date
		FROM Friends f
		JOIN User u ON (
			(f.User1_id = ? AND f.User2_id = u.id AND f.User2_id = ?)
			OR
			(f.User2_id = ? AND f.User1_id = u.id AND f.User1_id = ?)
		)
		`,
		[user1, user2, user1, user2]
	);
	return snakeToCamel(relation) as FriendModel;
}

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