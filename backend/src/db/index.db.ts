import { open, Database } from 'sqlite';
import sqlite3 from 'sqlite3';
import path from 'path';
import { readFile } from 'fs/promises';

const dbPath = path.resolve('./data/database.db');
const sqlPath = path.resolve('./sql/init.sql');

let dbInstance: Database | null = null;

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

// recupere la db
export async function getDb() {
	 if (!dbInstance) 
		dbInstance = await open({ filename: dbPath, driver: sqlite3.Database });
	return dbInstance;
}