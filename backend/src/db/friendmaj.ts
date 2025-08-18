import { getDb } from './index.db';
import { UserForChangeData } from '../types/user.types';
import { DB_CONST } from '../shared/config/constants.config';


export async function updateRelationshipBlocked(userid1: number, userid2: number) {
	const db = await getDb();

	const [user1, user2] = userid1 < userid2
		? [userid1, userid2]
		: [userid2, userid1];

	await db.run(`
		UPDATE Friends
		SET friend_status = 'blocked', blocked_by = ?
		WHERE user1_id = ? AND user2_id = ?
	`, [userid2, user1, user2]);
}


export async function updateRelationshipConfirmed(userid1: number, userid2: number) {
	const db = await getDb();

	const [user1, user2] = userid1 < userid2
		? [userid1, userid2]
		: [userid2, userid1];

	await db.run(`
		UPDATE Friends
		SET friend_status = 'accepted'
		WHERE user1_id = ? AND user2_id = ?
	`, [user1, user2]);
}

export async function updateRelationshipDelete(userid1: number, userid2: number){
	const db = await getDb();

	const [user1, user2] = userid1 < userid2
		? [userid1, userid2]
		: [userid2, userid1];

	await db.run(`
		DELETE FROM Friends
		WHERE user1_id = ? AND user2_id = ?
		`, 
		[user1, user2]
	);	
}

export async function addUserFriend(userid1: number, userid2: number) {
	const db = await getDb();

    	const [user1, user2] = userid1 < userid2
		? [userid1, userid2]
		: [userid2, userid1];

	await db.run(`
        INSERT INTO Friends (user1_id, user2_id, requester_id)
		VALUES (?, ?, ?)
        `,
		[user1, user2, userid1]
	);
}