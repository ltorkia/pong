import { FastifyInstance } from 'fastify';
import path from 'path';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';

const dbPath = path.resolve('./data/database.db');

// import { initDb } from './db';  // adapte le chemin selon ton projet

export async function testsRoutes(app: FastifyInstance) {
	app.get('/', async () => {
		const db = await open({ filename: dbPath, driver: sqlite3.Database });
			await db.run(`
				DELETE FROM User`
			);		
	});
};