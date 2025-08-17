import { getDb } from './index.db';
import { getRelation } from './friend';
import { FriendModel } from '../shared/types/friend.types';
import { snakeToCamel } from '../helpers/types.helpers';

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