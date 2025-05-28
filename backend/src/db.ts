import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = path.resolve('./data/database.db');

export async function getDb() {
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

<<<<<<< HEAD

    // Exemple d'init : créer les tables si elles n’existent pas
    await db.exec(`
    CREATE TABLE IF NOT EXISTS Users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
=======
  // Exemple d'init : créer les tables si elles n’existent pas
  await db.exec(`
    CREATE TABLE IF NOT EXISTS Users (
        id INTEGER PRIMARY KEY,
>>>>>>> ea02d3285ab3c4f4406851940a619b38e3e33aa8
        pseudo TEXT,
        email TEXT,
        inscription DATETIME,
        lastlog DATETIME,
        password TEXT,
        online BOOL,
        ingame BOOL,
<<<<<<< HEAD
        tournament BOOL,
        avatar BLOB
    );
    CREATE TABLE IF NOT EXISTS Game (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        winner TEXT,
        n_participants INT,
        date DATETIME,
        duration DATETIME,
        tournoi TEXT 
    );

    `);

    
=======
        tournament BOOL
    );
  `);

>>>>>>> ea02d3285ab3c4f4406851940a619b38e3e33aa8
  return db;
}
