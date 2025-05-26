import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = path.resolve('./data/database.db');

export async function getDb() {
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  // Exemple d'init : créer les tables si elles n’existent pas
  await db.exec(`
    CREATE TABLE IF NOT EXISTS Users (
        id INTEGER PRIMARY KEY,
        pseudo TEXT,
        email TEXT,
        inscription DATETIME,
        lastlog DATETIME,
        password TEXT,
        online BOOL,
        ingame BOOL,
        tournament BOOL
    );
  `);

  return db;
}
