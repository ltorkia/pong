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
                                                    -- Users : comprend les infos persos du user + stats pour le dashboard + situation en cours
    CREATE TABLE IF NOT EXISTS Users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pseudo TEXT,
        email TEXT,
        inscription DATETIME,                                                   -- 1ere inscription
        lastlog DATETIME,                                                       -- derniere connection
        password TEXT,                                                          -- a hascher + tard
        ingame BOOL,                                                            -- si actuellement en jeu
        tournament BOOL,                                                        -- a voir si utile ici, aussi s'il peut participer a plsieurs tournois
        avatar BLOB,                                                            -- BLOB = type pour inserer une img
        game_played INTEGER,                                                    -- total des parties jouees -> permet d eviter de recalculer a chaque fois dans la db
        game_win INTEGER,                                                       -- total parties gagnees -> pareil
        game_loose INTEGER,                                                     -- total parties perdues ->pareil
        time_played DATETIME,                                                   -- total temps joue -> a remettre a jour a chaque fin de jeu
        n_friends INTEGER                                                       -- nbre d amis total
      );

                                                         -- Game -> donnees propre au jeu
    CREATE TABLE IF NOT EXISTS Game (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        n_participants INT,
        date DATETIME,
        begin DATETIME,
        tournament BOOL,
        status TEXT                                                             -- jeu en cours, termine, ou pas encore commence si tournoi ? 
        temporary_result INT,                                                   -- au cas ou serveur plante, possibilite de recuperer le score en cours
      );

                                                                                -- Users_Game : resultat entre user et game 
    CREATE TABLE IF NOT EXISTS Users_Game (
        Game_id INTEGER NOT NULL,                                               -- necessaire pour ensuite faire les foreign key et relier les tables entre elles
        Users_id INTEGER NOT NULL,
        status_win BOOL,
        duration DATETIME,                                                      -- Duree du jeu
        FOREIGN KEY (Game_id) REFERENCES Game(id),
        FOREIGN KEY (Users_id) REFERENCES Users(id),
        PRIMARY KEY (Game_id, Users_id)                                          --un element pour chaque user qui a participe au meme jeu
      );

                                                        -- Chat -> pour gerer les messages echanges A RETRAVAILLER
    CREATE TABLE IF NOT EXISTS Chat (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        Users_id INTEGER,
        sender TEXT,
        time_send DATETIME,
        FOREIGN KEY (Users_id) REFERENCES Users(id)
      );

    CREATE TABLE IF NOT EXISTS Users_Chat (
      Chat_id INTEGER NOT NULL,
      Users_id INTEGER NOT NULL,
      friend BOOL,
      lock BOOL,
      FOREIGN KEY (Chat_id) REFERENCES Chat(id),
      FOREIGN KEY (Users_id) REFERENCES Users(id),
      PRIMARY KEY (Chat_id, Users_id)
      );

    CREATE TABLE IF NOT EXISTS Tournament ( 
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      n_participants INTEGER NOT NULL,
      n_round INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS Users_Tournament (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      Tournament_id INTEGER NOT NULL,
      Users_id INTEGER NOT NULL,
      Game_id INTEGER,
      FOREIGN KEY (Tournament_id) REFERENCES Tournament(id),
      FOREIGN KEY (Users_id) REFERENCES Users(id),
      FOREIGN KEY (Game_id) REFERENCES Game(id)
    );

    `);
    
  return db;
}
