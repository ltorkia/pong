import { FastifyInstance } from 'fastify';
import path from 'path';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';

const dbPath = path.resolve('./data/database.db');

export async function testsRoutes(app: FastifyInstance) {
    app.get('/api/tests', async () => {
        const db = await open({ filename: dbPath, driver: sqlite3.Database });
        await db.run(
            `INSERT INTO Users (pseudo, email, inscription, lastlog, password, online, ingame, tournament, avatar)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                'JohnDoe',
                'john@example.com',
                new Date().toISOString(),
                new Date().toISOString(),
                'hashed_password_here',
                false,
                false,
                false,
                null
            ]);
        await db.run(
            `INSERT INTO Game (winner, n_participants, date, duration, tournoi)
            VALUES (?, ?, ?, ?, ?)`,
            [
                'JohnDoe',
                8,
                new Date().toISOString(),
                new Date().toISOString(),
                'no'
            ]
        );
        const result = await db.run(`
        INSERT INTO Game (winner, n_participants, date, duration, tournoi)
        VALUES (?, ?, datetime('now'), ?, ?)
        `, ['user1', 2, '00:15:00', 'Tournoi A']);

        const gameId = result.lastID;
        await db.run(`INSERT INTO Users_Game (Game_id, Users_id) VALUES (?, ?)`, [gameId, 1]);
        await db.run(`INSERT INTO Users_Game (Game_id, Users_id) VALUES (?, ?)`, [gameId, 2]);


        // const users = await db.all(`SELECT * FROM users`);
        // return users;
    })
};