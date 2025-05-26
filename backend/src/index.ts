import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import path from 'path';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';

const fastify = Fastify({ logger: true });

// Servir les fichiers statiques depuis /app/public (monté depuis frontend/dist)
fastify.register(fastifyStatic, {
  root: path.join(__dirname, 'public'),
  prefix: '/',
});

// Pour les routes SPA (React), renvoyer index.html par défaut
fastify.setNotFoundHandler((req, reply) => {
  reply.sendFile('index.html');
});

const dbPath = path.resolve('./data/database.db');

fastify.get('/api/users', async () => {
  const db = await open({ filename: dbPath, driver: sqlite3.Database });
  await db.exec(`CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT)`);
  await db.run(`INSERT INTO users (name) VALUES ('Alice')`);
  const users = await db.all(`SELECT * FROM users`);
  return users;
});

fastify.listen({ port: 8080, host: '0.0.0.0' });
