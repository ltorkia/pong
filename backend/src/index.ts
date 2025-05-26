import Fastify from 'fastify';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import path from 'path';

const fastify = Fastify({ logger: true });

const dbPath = path.resolve('./data/database.db');

fastify.get('/api/users', async () => {
  const db = await open({ filename: dbPath, driver: sqlite3.Database });
  await db.exec(`CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT)`);
  await db.run(`INSERT INTO users (name) VALUES ('Alice')`);
  const users = await db.all(`SELECT * FROM users`);
  return users;
});

fastify.listen({ port: 8080, host: '0.0.0.0' });
