import { FastifyInstance } from 'fastify';
import path from 'path';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';

const dbPath = path.resolve('./data/database.db');

// import { initDb } from './db';  // adapte le chemin selon ton projet


export async function testsRoutes(app: FastifyInstance) {
    app.get('/api/tests', async () => {
        const db = await open({ filename: dbPath, driver: sqlite3.Database });
       
//   try {
    // Insérer Users
    let user_mail = await db.get('SELECT id FROM Users WHERE email = ?', 'alice@example.com');
    let user_name = await db.get('SELECT id FROM Users WHERE pseudo = ?', 'Alice');
if (!user_mail && !user_name) {
    await db.run(`
      INSERT INTO Users (pseudo, email, inscription, lastlog, password, ingame, tournament, avatar, game_played, game_win, game_loose, time_played, n_friends)
      VALUES (?, ?, datetime('now'), datetime('now'), ?, 0, 0, NULL, ?, ?, ?, ?, ?)`,
      ['Alice', 'alice@example.com', 'hashed_pass', 10, 5, 5, 3600, 2]
    );
}
    user_mail = await db.get('SELECT id FROM Users WHERE email = ?', 'bob@example.com');
    user_name = await db.get('SELECT id FROM Users WHERE pseudo = ?', 'Bob');
if (!user_mail && !user_name) {

    await db.run(`
      INSERT INTO Users (pseudo, email, inscription, lastlog, password, ingame, tournament, avatar, game_played, game_win, game_loose, time_played, n_friends)
      VALUES (?, ?, datetime('now'), datetime('now'), ?, 0, 0, NULL, ?, ?, ?, ?, ?)`,
      ['Bob', 'bob@example.com', 'hashed_pass2', 8, 4, 4, 3000, 1]
    );
}
    // Insérer Game
    await db.run(`
      INSERT INTO Game (n_participants, date, begin, tournament, status, temporary_result)
      VALUES (?, datetime('now'), datetime('now'), ?, ?, ?)`,
      [2, 0, 1, 0]
    );

    // Insérer Users_Game
    await db.run(`
      INSERT INTO Users_Game (Game_id, Users_id, status_win, duration)
      VALUES (?, ?, ?, ?)`,
      [1, 1, 1, 900]
    );

    await db.run(`
      INSERT INTO Users_Game (Game_id, Users_id, status_win, duration)
      VALUES (?, ?, ?, ?)`,
      [1, 2, 0, 900]
    );

    // Insérer Chat (fusionné)
    await db.run(`
      INSERT INTO Chat (sender_id, receiver_id, time_send, message, friend, lock)
      VALUES (?, ?, datetime('now'), ?, ?, ?)`,
      [1, 2, 'Salut Bob !', 1, 0]
    );

        await db.run(`
      INSERT INTO Chat (sender_id, receiver_id, time_send, message, friend, lock)
      VALUES (?, ?, datetime('now'), ?, ?, ?)`,
      [2, 1, 'Salut Alice !', 1, 0]
    );


    // Insérer Tournament
    await db.run(`
      INSERT INTO Tournament (n_participants, n_round)
      VALUES (?, ?)`,
      [2, 2]
    );

    // Insérer Users_Tournament
    await db.run(`
      INSERT INTO Users_Tournament (Tournament_id, Users_id, Game_id)
      VALUES (?, ?, ?)`,
      [1, 1, 1]
    );

    await db.run(`
      INSERT INTO Users_Tournament (Tournament_id, Users_id, Game_id)
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