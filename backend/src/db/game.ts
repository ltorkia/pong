import { FastifyInstance, FastifyRegister, FastifyReply, FastifyRequest } from "fastify";
import { getDb } from "./index.db";
import { Game } from "../types/game.types";
import { snakeToCamel, snakeArrayToCamel } from '../helpers/types.helpers';
// import { GameModel } from '../../shared/types/game.types';


// export async function gameDBRoutes(app: FastifyInstance) {
//     const db = await getDb();

//     app.post('/new_game', async (request: FastifyRequest, reply: FastifyReply) => {
//         const { n_participants, tournament, status, looser_result } = request.body;

//         const result = await db.run(
//             `INSERT INTO Game (n_participants, tournament, status, looser_result)
//             VALUES (?, ?, ?, ?)`,
//             [n_participants, tournament ?? 0, status ?? 'waiting', looser_result ?? 0]
//         );

//         return { id: result.lastID, message: 'Game created' };
//     });
//     app.

// export async function addGame(userId1: number, userId2: number): Promise<GameModel> {
// export async function addGame(userId1: number, userId2: number){
//     const db = await getDb();

//     await db.exec(`
//         BEGIN TRANSACTION;

//         INSERT INTO Game (status, n_participants) 
//         VALUES ('in_progress', 2);

//         INSERT INTO User_Game (game_id, user_id)
//         VALUES (last_insert_rowid(), ${userId1});

//         INSERT INTO User_Game (game_id, user_id)
//         VALUES (last_insert_rowid(), ${userId2});

//     COMMIT;`,
// 	);
// }

// export async function getResultGame 

export async function addGame(userId1: number, userId2: number, tournament: boolean): Promise<number> {
    const db = await getDb();

    // Insérer le jeu et récupérer son id
    const result = await db.run(
        `INSERT INTO Game (status, n_participants, tournament) VALUES ('in_progress', 2, ${tournament})`
    );

    const gameId = result.lastID!; // id du jeu inséré

    // Insérer les deux joueurs liés au jeu
    await db.run(`INSERT INTO User_Game (game_id, user_id) VALUES (${gameId}, ${userId1})`);

    await db.run(
        `INSERT INTO User_Game (game_id, user_id) VALUES (${gameId}, ${userId2})`);

    return gameId;
}

export async function resultGame(gameId: number, winnerId: number, looserId: number, score: number[]){
    const db = await getDb();

    // await db.run(`
    //     UPDATE Game SET status = 'finished', end = CURRENT_TIMESTAMP, winner_id = ? WHERE id = ?;

    //     UPDATE User_Game
    //     SET status_win = 1,
    //     SET duration = CAST((strftime('%s', (SELECT end FROM Game WHERE id = ?)) - strftime('%s', (SELECT begin FROM Game WHERE id = ?))) AS INTEGER)
    //     WHERE game_id = ? AND user_id = ?;

    //     UPDATE User_Game
    //     SET status_win = 0,
    //     UPDATE User_Game SET duration = CAST((strftime('%s', (SELECT end FROM Game WHERE id = ?)) 
    //                - strftime('%s', (SELECT begin FROM Game WHERE id = ?))) AS INTEGER)
    //     WHERE game_id = ? AND user_id = ?;
    // `,
	// 	[winnerId, gameId, gameId, gameId, winnerId, gameId, gameId, gameId, looserId]
	// );
    const minScore = Math.min(score[0], score[1]);


    await db.run(`
        UPDATE Game
        SET status = 'finished',
            end = CURRENT_TIMESTAMP,
            winner_id = ?,
            looser_result = ?
        WHERE id = ?;
`, [winnerId, minScore, gameId]);

    await db.run(`
        UPDATE User_Game
        SET status_win = CASE WHEN user_id = ? THEN 1 ELSE 0 END,
            duration = CAST(
                (strftime('%s', (SELECT end FROM Game WHERE id = ?)) - 
                strftime('%s', (SELECT begin FROM Game WHERE id = ?))
                ) AS INTEGER
            )
        WHERE game_id = ?;
        `, 
 [winnerId, gameId, gameId, gameId]);

}


export async function cancelledGame(gameId: number, winnerId: number, looserId: number, score: number[]){
    const db = await getDb();
    const minScore = Math.min(score[0], score[1]);


    await db.run(`
        UPDATE Game
        SET status = 'cancelled',
            end = CURRENT_TIMESTAMP,
            winner_id = ?
            looser_result = ?
        WHERE id = ?;
`, [winnerId, gameId, minScore]);

    await db.run(`
        UPDATE User_Game
        SET status_win = CASE WHEN user_id = ? THEN 1 ELSE 0 END,
            duration = CAST(
                (strftime('%s', (SELECT end FROM Game WHERE id = ?)) - 
                strftime('%s', (SELECT begin FROM Game WHERE id = ?))
                ) AS INTEGER
            )
        WHERE game_id = ?;
        `, 
 [winnerId, gameId, gameId, gameId]);
}

// ptet pas utile
export async function waitingGame(gameId: number, winnerId: number, looserId: number, score: number[]){
    const db = await getDb();
    const minScore = Math.min(score[0], score[1]);


    await db.run(`
        UPDATE Game
        SET status = 'waiting',
            end = CURRENT_TIMESTAMP,
            winner_id = ?
            looser_result = ?
        WHERE id = ?;
`, [winnerId, gameId, minScore]);

    await db.run(`
        UPDATE User_Game
        SET status_win = CASE WHEN user_id = ? THEN 1 ELSE 0 END,
            duration = CAST(
                (strftime('%s', (SELECT end FROM Game WHERE id = ?)) - 
                strftime('%s', (SELECT begin FROM Game WHERE id = ?))
                ) AS INTEGER
            )
        WHERE game_id = ?;
        `, 
 [winnerId, gameId, gameId, gameId]);
}

// resultgame dans fichier user -> a deplacer ici ? 