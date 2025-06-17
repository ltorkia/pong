import { FastifyInstance } from 'fastify';
import path from 'path';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';

const dbPath = path.resolve('./data/database.db');

// import { initDb } from './db';  // adapte le chemin selon ton projet


export async function testsRoutes(app: FastifyInstance) {
	app.get('/', async () => {
		const db = await open({ filename: dbPath, driver: sqlite3.Database });
	
		//   try {
		// Insérer Users
		let user_mail = await db.get('SELECT id FROM User WHERE email = ?', 'alice@example.com');
		let user_name = await db.get('SELECT id FROM User WHERE pseudo = ?', 'Alice');
		if (!user_mail && !user_name) {
			await db.run(`
				INSERT INTO User (pseudo, email, inscription, lastlog, password, tournament, avatar, game_played, game_win, game_loose, time_played, secret_question_number, secret_question_answer, n_friends)
				VALUES (?, ?, datetime('now'), datetime('now'), ?, 0, NULL, ?, ?, ?, ?, ?, ?, ?)`,
				['Alice', 'alice@example.com', 'hashed_pass', 10, 5, 5, 3600, 1, 'bla', 2]
			);
		}

		user_mail = await db.get('SELECT id FROM User WHERE email = ?', 'bob@example.com');
		user_name = await db.get('SELECT id FROM User WHERE pseudo = ?', 'Bob');
		if (!user_mail && !user_name) {
			await db.run(`
				INSERT INTO User (pseudo, email, inscription, lastlog, password, tournament, avatar, game_played, game_win, game_loose, time_played, secret_question_number, secret_question_answer, n_friends)
				VALUES (?, ?, datetime('now'), datetime('now'), ?, 0, NULL, ?, ?, ?, ?, ?, ?, ?)`,
				['Bob', 'bob@example.com', 'hashed_pass2', 8, 4, 4, 3000, 1, 'bla', 1]
			);
		}
		const usersToAdd = [
			{ pseudo: 'Charlie', email: 'charlie@example.com', password: 'hashed_pass3', game_played: 15, game_win: 9, game_loose: 6, time_played: 4200, secret_question_number: 1, secret_question_answer: 'bla', n_friends: 2 },
			{ pseudo: 'Dana', email: 'dana@example.com', password: 'hashed_pass4', game_played: 12, game_win: 6, game_loose: 6, time_played: 3900, secret_question_number: 1, secret_question_answer: 'bla', n_friends: 2 },
			{ pseudo: 'Eve', email: 'eve@example.com', password: 'hashed_pass5', game_played: 20, game_win: 12, game_loose: 8, time_played: 5000, secret_question_number: 1, secret_question_answer: 'bla', n_friends: 1 },
			{ pseudo: 'Frank', email: 'frank@example.com', password: 'hashed_pass6', game_played: 5, game_win: 1, game_loose: 4, time_played: 2000, secret_question_number: 1, secret_question_answer: 'bla', n_friends: 1 }
		];

		for (const user of usersToAdd) {
			const userExists = await db.get(
				`SELECT id FROM User WHERE email = ? OR pseudo = ?`,
				[user.email, user.pseudo]
			);

			if (!userExists) {
				await db.run(`
					INSERT INTO User (pseudo, email, inscription, lastlog, password, tournament, avatar, game_played, game_win, game_loose, time_played, secret_question_number, secret_question_answer, n_friends)
					VALUES (?, ?, datetime('now'), datetime('now'), ?, 0, NULL, ?, ?, ?, ?, ?, ?, ?)`,
					[user.pseudo, user.email, user.password, user.game_played, user.game_win, user.game_loose, user.time_played, user.secret_question_number, user.secret_question_answer, user.n_friends]
				);
			}
	
		}

		// Exemple : Friends table with User1_id, User2_id, status
		const friendships = [
			['Alice', 'Bob'],
			['Alice', 'Charlie'],
			['Bob', 'Dana'],
			['Charlie', 'Dana'],
			['Charlie', 'Eve'],
			['Frank', 'Eve'],
		];

		for (const [name1, name2] of friendships) {
			const user1 = await db.get(`SELECT id FROM User WHERE pseudo = ?`, [name1]);
			const user2 = await db.get(`SELECT id FROM User WHERE pseudo = ?`, [name2]);

			// enforce User1_id < User2_id convention
			const [User1_id, User2_id] = user1.id < user2.id
				? [user1.id, user2.id]
				: [user2.id, user1.id];

			const exists = await db.get(
				`SELECT 1 FROM Friends WHERE User1_id = ? AND User2_id = ?`,
				[User1_id, User2_id]
			);

			if (!exists) {
				await db.run(`
					INSERT INTO Friends (User1_id, User2_id, status)
					VALUES (?, ?, ?)`,
					[User1_id, User2_id, 'accepted']
				);
			}
		}

		// Insérer Game
		await db.run(`
			INSERT INTO Game (n_participants, begin, end, tournament, status, temporary_result)
			VALUES (?, datetime('now'), ?, ?, ?, ?)`,
			[2, 0, 1, 'in_progress', 0]
		);

		// Insérer Users_Game
		await db.run(`
			INSERT INTO User_Game (Game_id, User_id, status_win, duration)
			VALUES (?, ?, ?, ?)`,
			[1, 1, 1, 900]
		);

		await db.run(`
			INSERT INTO User_Game (Game_id, User_id, status_win, duration)
			VALUES (?, ?, ?, ?)`,
			[1, 2, 0, 900]
		);

		// Insérer Chat (fusionné)
		await db.run(`
			INSERT INTO Chat (sender_id, receiver_id, time_send, message)
			VALUES (?, ?, datetime('now'), ?)`,
			[1, 2, 'Salut Bob !']
		);

		await db.run(`
			INSERT INTO Chat (sender_id, receiver_id, time_send, message)
			VALUES (?, ?, datetime('now'), ?)`,
			[2, 1, 'Salut Alice !']
		);


		// Insérer Tournament
		await db.run(`
			INSERT INTO Tournament (n_participants, n_round)
			VALUES (?, ?)`,
			[2, 2]
		);

		// Insérer Users_Tournament
		await db.run(`
			INSERT INTO User_Tournament (Tournament_id, User_id, Game_id)
			VALUES (?, ?, ?)`,
			[1, 1, 1]
		);

		await db.run(`
			INSERT INTO User_Tournament (Tournament_id, User_id, Game_id)
			VALUES (?, ?, ?)`,
			[1, 2, 1]
		);

		console.log('✅ Base de données remplie avec des données de test !');
	//   } catch (err) {
		// console.error('❌ Erreur lors de l’insertion des données de test :', err);
	//   }

			// const users = await db.all(`SELECT * FROM users`);
			// return users;
	})
};