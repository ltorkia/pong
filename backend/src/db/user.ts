import { getDb } from './index.db';
import { RegisterInput, RegisterInputSchema } from '../types/zod/auth.zod';
import { UserBasic, UserForDashboard, UserWithAvatar, Friends } from '../types/user.types';
import { Game } from '../types/game.types';
import { ChatMessage } from '../types/chat.types';

// retourne les infos d un user particulier - userId = le id de l user a afficher
// a priori ? protegerait contre les insertions sql
export async function getUser(userId : number | null = null, search : string | null = null){
	const db = await getDb(); 
	const user = await db.get(`
		SELECT id, username, email, registration, 
		lastlog, tournament, avatar, game_played, game_win, 
		game_loose, time_played, n_friends, status, is_deleted, register_from 
		FROM User 
		WHERE id = ? OR username = ? OR email = ?
		`,
		[userId, search, search]
	);
	return user as UserForDashboard;
}

// retourne les infos de tous les users pour l authentification 
export async function getAllUsers() {
	const db = await getDb();
	const users = await db.all(`
		SELECT id, username, email, avatar 
		FROM User 
	`);
	return users as UserBasic[];
}

// retourne les infos de tous les users pour l authentification 
export async function getUserP(email: string) {
	const db = await getDb();
	const user = await db.get(`
		SELECT id, email, password, register_from
		FROM User 
		WHERE email = ?
		`,
		[email]
	);
	return user;
}
	
// pour choper les friends, mais implique qu un element chat soit forcement cree des qu on devient ami
//  -> comment ajouter un ami ? nouvelle page ?
//  -> version ou on decide d avoir forcement de cree par defaut une donnee avec le client en tant que sender et receveur
export async function getUserFriends(userId: number) {
	const db = await getDb();
	const friends = await db.all(`
		SELECT u.id, u.username, u.avatar, u.lastlog
		FROM Friends f
		JOIN User u ON (
			(f.User1_id = ? AND f.User2_id = u.id)
			OR
			(f.User2_id = ? AND f.User1_id = u.id)
		)
		WHERE f.status = 'accepted'
		`,
		[userId, userId]
	);
	return friends as Friends[];
}
// pour insert : const [u1, u2] = [userIdA, userIdB].sort((a, b) => a - b);
		
export async function getUserGames(userId: number) {
	const db = await getDb();
	const games = await db.all(`
		SELECT ug.Game_id, ug.status_win, ug.duration
		FROM User_Game ug
		WHERE ug.User_id = ?
		`,
		[userId]
	);

	for (const game of games) {
		const players = await db.all(`
			SELECT u.id, u.username, u.avatar
			FROM User_Game ug
			JOIN User u ON u.id = ug.User_id
			WHERE ug.Game_id = ?
			AND u.id != ?
			`,
			[game.Game_id, userId]
		);
		game.other_players = players as UserWithAvatar[];
	}
	return games as Game[];
}
		
export async function getUserChat(userId1: number, userId2: number) {
	const db = await getDb();
	const chat = await db.all(`
		SELECT c.message, c.time_send, c.id, c.Sender_id, c.Receiver_id
		FROM Chat c
		WHERE (Sender_id = ? AND Receiver_id = ?)
		OR (Sender_id = ? AND Receiver_id = ?)
		ORDER BY c.time_send ASC
		`,
		[userId1, userId2, userId2, userId1]
	);

	const other_user = await db.get(`
		SELECT u.id, u.username, u.avatar
		FROM User u
		WHERE u.id != ?
		`,
		[userId2]
	);
	return {
		messages : chat as ChatMessage[],
		other_user: other_user as UserWithAvatar 
	};
}
	
export async function insertUser(user: (RegisterInput | {username: string, email: string}), is_google: (boolean | null)) {
	const db = await getDb();
	// if(await getUser(null, user.username))
	// 	return {statusCode : 409, message : "username already used"};
		
	// if (await getUser(null, user.email))
	// 	return {statusCode: 409, message : "email already used"};

	if (!is_google)
	{
		if(await getUser(null, user.username))
			return {statusCode : 409, message : "username already used"};
		
		if (await getUser(null, user.email))
			return {statusCode: 409, message : "email already used"};
		 const u = user as RegisterInput;
		await db.run(`
			INSERT INTO User (username, email, password, secret_question_number, secret_question_answer)
			VALUES (?, ?, ?, ?, ?)
			`,
			[u.username, u.email, u.password, u.question, u.answer]
		);
	}
	else 
	{
		if(await getUser(null, user.username))
		{
			for (let i = 0; i < 20000000; i++)
			{
				user.username = user.username + "_" + i;
				if (!await getUser(null, user.username))
					break ;
			}
		}
	
		await db.run(`
			INSERT INTO User (username, email, register_from)
			VALUES (?, ?, ?)
			`,
			[user.username, user.email, 'google']
		);	
	}
	return {statusCode : 200, message : 'user add'};
}

export async function majLastlog(username: string)
{
	const db = await getDb();
	await db.run(`
		UPDATE User
		SET lastlog = datetime('now')
		WHERE (username = ?)
		`,
	[username]);
}