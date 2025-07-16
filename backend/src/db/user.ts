import { getDb } from './index.db';
import { RegisterInput } from '../types/zod/auth.zod';
import { Game } from '../types/game.types';
import { ChatMessage } from '../types/chat.types';
import { searchNewName } from '../helpers/auth.helpers';
import { UserPassword, User2FA } from '../types/user.types';
import { DB_CONST } from '../shared/config/constants.config'; // en rouge car dossier local 'shared' != dossier conteneur
import { UserModel, SafeUserModel, UserBasic, UserWithAvatar, Friends } from '../shared/types/user.types'; // en rouge car dossier local 'shared' != dossier conteneur

// retourne les infos d un user particulier - userId = le id de l user a afficher
// a priori ? protegerait contre les insertions sql
export async function getUser(userId : number | null = null, search : string | null = null){
	const db = await getDb(); 
	const user = await db.get(`
		SELECT id, username, email, registration, 
		begin_log, end_log, tournament, avatar, game_played, game_win, 
		game_loose, time_played, n_friends, status, is_deleted, register_from 
		FROM User 
		WHERE id = ? OR username = ? OR email = ?
		`,
		[userId, search, search]
	);
	return user as UserModel;
}

// retourne les infos de tous les users
export async function getAllUsers() {
	const db = await getDb();
	const users = await db.all(`
		SELECT id, username, avatar 
		FROM User 
	`);
	return users as UserBasic[];
}

export async function getAllUsersInfos() {
	const db = await getDb();
	const users = await db.all(`
		SELECT id, username, registration, 
		begin_log, end_log, tournament, avatar, game_played, game_win, 
		game_loose, time_played, n_friends, status, is_deleted, register_from 
		FROM User 
	`);
	return users as SafeUserModel[];
}

// retourne les infos de tous les users pour l authentification 
export async function getUserP(email: string) {
	const db = await getDb();
	const user = await db.get(`
		SELECT id, username, email, password, register_from
		FROM User 
		WHERE email = ?
		`,
		[email]
	);
	return user as UserPassword;
}

export async function getUser2FA(email: string) {
	const db = await getDb();
	const user = await db.get(`
		SELECT id, username, email, code_2FA, code_2FA_expire_at, register_from
		FROM User 
		WHERE email = ?
		`,
		[email]
	);
	return user as User2FA;
}
	
// pour choper les friends, mais implique qu un element chat soit forcement cree des qu on devient ami
//  -> comment ajouter un ami ? nouvelle page ?
//  -> version ou on decide d avoir forcement de cree par defaut une donnee avec le client en tant que sender et receveur
export async function getUserFriends(userId: number) {
	const db = await getDb();
	const friends = await db.all(`
		SELECT u.id, u.username, u.avatar, u.begin_log, u.end_log
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
	try {
		const db = await getDb();
		
		if (!is_google)
		{
			if(await getUser(null, user.username))
				return {statusCode : 409, message : "Username already used.<br><b>" + await (searchNewName(user.username)) + "</b> is available."};
			
			if (await getUser(null, user.email))
				return {statusCode: 409, message : "Email already used"};
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
				user.username = await (searchNewName(user.username));
					
			await db.run(`
				INSERT INTO User (username, email, register_from)
				VALUES (?, ?, ?)
				`,
				[user.username, user.email, DB_CONST.USER.REGISTER_FROM.GOOGLE]
			);	
		}
		return {statusCode : 201, message : 'user add'};

	} catch (err) {
		console.error("Erreur lors de l'insertion d'un utilisateur standard :", err);
		return { statusCode: 500, message: "Erreur serveur : insertion utilisateur échouée." };
	}	
}

// export async function insertAvatar(avatar: string, username: string)
// {
//        const db = await getDb();
//        await db.run(`
//                UPDATE User
//                SET avatar = ?
//                WHERE (username = ?)
//                `,
//        [avatar, username]);
// }

export async function getAvatar(id: number)
{
       const db = await getDb();
       const avatar = await db.get(`
               SELECT u.avatar
               FROM User u
               WHERE u.id == ?
               `,
       [id]);
       return avatar;
}
		
// export async function majLastlog(username: string)
// {
// 	const db = await getDb();
// 	await db.run(`
// 		UPDATE User
// 		SET begin_log = datetime('now')
// 		WHERE (username = ?)
// 		`,
// 	[username]);
// }

// export async function insertCode2FA(email: string, code: string): Promise<{statusCode: number, message: string}>
// {
// 	const db = await getDb();
// 	const end_time = Date.now() + 5 * 60 * 1000;
// 	console.log(code, end_time);
// 	await db.run(`
// 		UPDATE User
// 		SET code_2FA = ?, code_2FA_expire_at = ?
// 		WHERE (email = ?)
// 		`,
// 	[code, end_time , email]);
// 	return {statusCode : 201, message : 'code 2FA inserted'};
// }

// export async function eraseCode2FA(email: string)
// {
// 	const db = await getDb();
// 	await db.run(`
// 		UPDATE User
// 		SET code_2FA = NULL, code_2FA_expire_at = NULL
// 		WHERE (email = ?)
// 		`,
// 	[email]);	
// }
