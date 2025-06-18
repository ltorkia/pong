import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import path from 'path';
import { readFile } from 'fs/promises';

// import { STATUS_CODES } from 'http';
const { STATUS_CODES } = require('https');
// import {bcrypt} from 'bcrypt';

const dbPath = path.resolve('./data/database.db');
const sqlPath = path.resolve('./sql/init.sql');
// const sqlPath = path.resolve(__dirname, '../../sql/init.sql');

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
	const db = await open({ filename: dbPath, driver: sqlite3.Database });
	return db;
}