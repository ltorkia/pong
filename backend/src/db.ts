import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import path from 'path';
import { readFile } from 'fs/promises';
import { ChatMessage,
UserBasic, UserForDashboard, UserToRegister, UserWithAvatar,
Game, Friends,
GetUserForRegistration,
GetUserForLogin } from './types';
import { z } from 'zod';
// import { STATUS_CODES } from 'http';
const { STATUS_CODES } = require('https');
// import {bcrypt} from 'bcrypt';

const dbPath = path.resolve('./data/database.db');
const sqlPath = path.resolve('./src/init.sql');

// initialise la db
export async function initDb() {
	const db = await open({
		filename: dbPath,
		driver: sqlite3.Database
	});
	
	const initSql = await readFile(sqlPath, 'utf-8');
	await db.exec(initSql);
	return db;
}

//recupere la db
export async function getDb() {
	const db = await open({ filename: dbPath, driver: sqlite3.Database });
	return db;
}


// retourne les infos d un user particulier - userId = le id de l user a afficher
//  a priori ? protegerait contre les insertions sql
export async function getUser(userId : number | null = null, search : string | null = null){
	const db = await getDb(); 
	const user = await db.get(`
		SELECT pseudo, avatar, email, inscription, 
		lastlog, tournament, game_played, game_win, 
		game_loose, time_played, n_friends 
		FROM User 
		WHERE id = ? OR pseudo = ? OR email = ?
		`,
		[userId, search, search]
	);
	return user as UserForDashboard;
}

//retourne les infos de tous les users pour l authentification 
export async function getAllUsers() {
	const db = await getDb();
	const users = await db.all(`
		SELECT id, pseudo, email 
		FROM User 
	`);
	return users as UserBasic[];
}

//retourne les infos de tous les users pour l authentification 
export async function getUserP(email: string) {
	const db = await getDb();
	const user = await db.get(`
		SELECT id, email, password 
		FROM User 
		WHERE email = ?
		`,
		[email]
	);
	return user;
}
	
//pour choper les friends, mais implique qu un element chat soit forcement cree des qu on devient ami
//->comment ajouter un ami ? nouvelle page ?
// ->version ou on decide d avoir forcement de cree par defaut une donnee avec le client en tant que sender et receveur
export async function getUserFriends(userId: number) {
	const db = await getDb();
	const friends = await db.all(`
		SELECT u.id, u.pseudo, u.avatar, u.lastlog
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
			SELECT u.id, u.pseudo, u.avatar
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
		SELECT u.id, u.pseudo, u.avatar
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
	
export async function insertUser(user: GetUserForRegistration) {
	const db = await getDb();
	if(await getUser(null, user.pseudo))
		return {statusCode : 409, message : "pseudo already used"};
		
	if (await getUser(null, user.email))
		return {statusCode: 409, message : "email already used"};

	await db.run(`
		INSERT INTO User (pseudo, email, password, secret_question_number, secret_question_answer)
		VALUES (?, ?, ?, ?, ?)
		`,
		[user.pseudo, user.email, user.password, user.question, user.answer]
	);    
	return {statusCode : 200, message : 'user add'};
}