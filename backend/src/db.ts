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
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pseudo TEXT,
        email TEXT,
        inscription DATETIME,
        lastlog DATETIME,
        password TEXT,
        online BOOL,
        ingame BOOL,
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
    CREATE TABLE IF NOT EXISTS Users_Game (
        Game_id INTEGER NOT NULL,
        Users_id INTEGER NOT NULL,
        FOREIGN KEY (Game_id) REFERENCES Game(id),
        FOREIGN KEY (Users_id) REFERENCES Users(id),
        PRIMARY KEY (Game_id, Users_id)
        )

    `);

    
  return db;
}
