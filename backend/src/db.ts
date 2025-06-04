import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import path from 'path';
import { readFile } from 'fs/promises';

const dbPath = path.resolve('./data/database.db');
const sqlPath = path.resolve('./src/init.sql');

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

//recupere la db
export async function getDb() {
  const db = await open({ filename: dbPath, driver: sqlite3.Database });
  return db;
}


// retourne les infos d un user particulier - userId = le id de l user a afficher
//  a priori ? protegerait contre les insertions sql
export async function getUser(userId : number) {
  const db = await getDb();
  const user = await db.get(
    `SELECT pseudo, avatar, email, inscription, 
      lastlog, tournament, game_played, game_win, 
      game_loose, time_played, n_friends 
    FROM Users 
    WHERE id = ?`,
    [userId]
  );
  return user;
}

//retourne les infos de tous les users pour l authentification 
export async function getAllUsers() {
  const db = await getDb();
  const users = await db.all(`
    SELECT id, pseudo, email 
    FROM Users 
    `);
  return users;
}

//pour choper les friends, mais implique qu un element chat soit forcement cree des qu on devient ami
//->comment ajouter un ami ? nouvelle page ?
// ->version ou on decide d avoir forcement de cree par defaut une donnee avec le client en tant que sender et receveur
export async function getUserFriends(userId: number) {
  const db = await getDb();
  const friends = await db.all(`
    SELECT u.id, u.pseudo, u.avatar, u.lastlog
    FROM Friends f
    JOIN Users u ON (
      (f.User1_id = ? AND f.User2_id = u.id)
      OR
      (f.User2_id = ? AND f.User1_id = u.id)
    )
    WHERE f.status = 'accepted'
    `, [userId, userId]);
    return friends;
}

// pour insert : const [u1, u2] = [userIdA, userIdB].sort((a, b) => a - b);
