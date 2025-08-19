import { FastifyInstance, FastifyRegister, FastifyReply, FastifyRequest } from "fastify";
import { getDb } from "./index.db";

// export async function gameDBRoutes(app: FastifyInstance) {
//     const db = await getDb();

//     app.post('/new_game', async (request: FastifyRequest, reply: FastifyReply) => {
//         const { n_participants, tournament, status, temporary_result } = request.body;

//         const result = await db.run(
//             `INSERT INTO Game (n_participants, tournament, status, temporary_result)
//             VALUES (?, ?, ?, ?)`,
//             [n_participants, tournament ?? 0, status ?? 'waiting', temporary_result ?? 0]
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
    // return snakeToCamel(relation) as FriendModel;
export async function addGame(userId1: number, userId2: number) {
    const db = await getDb();

    // Insérer le jeu et récupérer son id
    const result = await db.run(
        `INSERT INTO Game (status, n_participants) VALUES ('in_progress', 2)`
    );

    const gameId = result.lastID; // id du jeu inséré

    // Insérer les deux joueurs liés au jeu
    await db.run(
        `INSERT INTO User_Game (game_id, user_id) VALUES (?, ?)`,
        [gameId, userId1]
    );

    await db.run(
        `INSERT INTO User_Game (game_id, user_id) VALUES (?, ?)`,
        [gameId, userId2]
    );

    return gameId;
}

export async function resultGame(gameId: number, winnerId: number, looserId: number){
    const db = await getDb();

    // const [user1, user2] = userId1 < userId2
    //     ? [userId1, userId2]
    //     : [userId2, userId1];

    await db.run(`
        UPDATE Game SET status = 'finished', end = CURRENT_TIMESTAMP, winner_id = ? WHERE id = ?;

        UPDATE User_Game
        SET status_win = 1,
        SET duration = CAST((strftime('%s', (SELECT end FROM Game WHERE id = ?)) - strftime('%s', (SELECT begin FROM Game WHERE id = ?))) AS INTEGER)
        WHERE game_id = ? AND user_id = ?;

        UPDATE User_Game
        SET status_win = 0,
        UPDATE User_Game SET duration = CAST((strftime('%s', (SELECT end FROM Game WHERE id = ?)) 
                   - strftime('%s', (SELECT begin FROM Game WHERE id = ?))) AS INTEGER)
        WHERE game_id = ? AND user_id = ?;
    `,
		[winnerId, gameId, gameId, gameId, winnerId, gameId, gameId, gameId, looserId]
	);
    // return snakeToCamel(relation) as FriendModel;
}

// export async function getResultGame()
// export async function getResultGame()