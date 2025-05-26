import Fastify from 'fastify';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import path from 'path';
import {getDb} from './db';

const fastify = Fastify({ logger: true });

const dbPath = path.resolve('./data/database.db');

(async () => {
    const db = await getDb();
    console.log('Database initialized');
    await db.close();
})();

// fastify.get('/api/users', async () => {
//   const db = await getDb();
//   await db.run(`INSERT INTO users (name) VALUES ('Alice')`);
//   const users = await db.all(`SELECT * FROM users`);
//   return users;
// });

fastify.get('/api', async (request, reply) => {
  return "ici on est sur le back";
});

fastify.get('/api/users', async () => {
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
});

fastify.listen({ port: 8080, host: '0.0.0.0' });
