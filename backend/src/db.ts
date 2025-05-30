import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import path from 'path';
import { readFile } from 'fs/promises';

const dbPath = path.resolve('./data/database.db');
const sqlPath = path.resolve('./src/init.sql');

export async function getDb() {
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

    // Exemple d'init : créer les tables si elles n’existent pas
    


    const initSql = await readFile(sqlPath, 'utf-8');
    await db.exec(initSql);
    console.log('Base de données initialisée avec succès');

    
  return db;
}
