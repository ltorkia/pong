import { FastifyInstance } from 'fastify';
import path from 'path';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';

const dbPath = path.resolve('./data/database.db');

export async function usersRoutes(app: FastifyInstance) {
	app.get('/api/users', async () => {
		const db = await open({ filename: dbPath, driver: sqlite3.Database });
		const users = await db.all(`SELECT * FROM users`);
		return users;
	})
};