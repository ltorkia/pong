import { FastifyInstance } from 'fastify';
import path from 'path';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';

const dbPath = path.resolve('./data/database.db');

// export async function usersRoutes(app: FastifyInstance) {
// 	app.get('/api/users', async () => {
// 		const db = await open({ filename: dbPath, driver: sqlite3.Database });
// 		await db.exec(`CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT)`);
// 		await db.run(`INSERT INTO users (name) VALUES ('Alice')`);
// 		return db.all(`SELECT * FROM users`);
// 	});
// }

export async function usersRoutes(app: FastifyInstance) {
	app.get('/api/users', async () => {
		const db = await open({ filename: dbPath, driver: sqlite3.Database });
		// await db.exec(`CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT)`);
		// await db.run(`INSERT INTO users (name) VALUES ('Alice')`);
		await db.run(
			`INSERT INTO Users (pseudo, email, inscription, lastlog, password, online, ingame, tournament)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
			[
				'JohnDoe',
				'john@example.com',
				new Date().toISOString(),
				new Date().toISOString(),
				'hashed_password_here',
				false,
				false,
				false
			]
		);
		const users = await db.all(`SELECT * FROM users`);
		return users;
	})
};