import { FastifyInstance, FastifyRegister, FastifyReply, FastifyRequest } from "fastify";
import { getDb } from "./index.db";
import { Game } from "../types/game.types";
import { snakeToCamel, snakeArrayToCamel } from '../helpers/types.helpers';
import { GameModel } from '../shared/types/game.types'; // en rouge car dossier local 'shared' != dossier conteneur
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

export async function addGame(tournament: boolean = false): Promise<number> {
    const db = await getDb();

    // Insérer le jeu et récupérer son id
    const result = await db.run(
        `INSERT INTO Game (status, n_participants, tournament) VALUES ('in_progress', 2, ?)`,
        [tournament ? 1 : 0]
    );

    const gameId = result.lastID!;
    return gameId;
}

export async function addGamePlayers(gameId: number, userId1: number, userId2: number) {
    const db = await getDb();
    await db.run(
        `INSERT INTO User_Game (game_id, user_id) VALUES (?, ?)`,
        [gameId, userId1]
    );
    await db.run(
        `INSERT INTO User_Game (game_id, user_id) VALUES (?, ?)`,
        [gameId, userId2]
    );
}

export async function updateGameStatus(gameId: number, status: string) {
    const db = await getDb();
    await db.run(
        `UPDATE Game SET status = ? WHERE id = ?`,
        [status, gameId]
    );
}

export async function updateStartGame(gameId: number) {
    const db = await getDb();
    await db.run(
        `UPDATE Game SET begin = CURRENT_TIMESTAMP WHERE id = ?`,
        [gameId]
    );
}

export async function resultGame(gameId: number, winnerId: number, looserId: number, score: number[]){
    const db = await getDb();

    const minScore = Math.min(score[0], score[1]);
    console.log("resultGame,  score = ", score, " minScore = ", minScore);

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
            winner_id = ?,
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

export async function getResultGame(gameId: number)
{
    const db = await getDb();
    const game = await db.get(`
    	SELECT id, n_participant, begin, end, tournament, status, looser_result, winner_id 
		FROM Game
        Where id = ${gameId};
	`
   );
   return snakeToCamel(game) as GameModel;
}
// resultgame dans fichier user -> a deplacer ici ? 

// const db = new Database("pong.db"); // ou le chemin vers ta DB

// interface User {
    //     id: number;
    //     alias: string;
    // }

// Crée un tournoi et retourne son id
export async function createTournament(nParticipants: number, nRound: number): Promise<number | undefined> {
        const db = await getDb();
    const tournament = await db.run(
        `INSERT INTO Tournament (n_participants, n_round) VALUES (?, ?)`,
        [nParticipants, nRound]
    );
    return tournament.lastID;
}

// // Crée un jeu et retourne son id
// export async function createGame(nParticipants: number, tournamentId?: number) { //ptet pas necessaire si on reprend la logique remote
//     const db = await getDb();   
//     const stmt = db.run(`
//         INSERT INTO Game (n_participants, tournament)
//         VALUES (?, ?)
//     `);
//     // const info = stmt.run(nParticipants, tournamentId || 0);
//     // return info.lastInsertRowid as number;
// }

// // Enregistre un joueur dans un jeu
// export async function registerUserGame(userId: number, gameId: number, statusWin?: number, duration?: number) { //ptet pas necessaire si on reprend la logique remote
//     const db = await getDb();
//     const stmt = db.run(`
//         INSERT INTO User_Game (game_id, user_id, status_win, duration)
//         VALUES (${gameId}, ${userId}, ?, ?)
//     `);
//     // stmt.run(gameId, userId, statusWin ?? null, duration ?? 0);
// }

// // Enregistre un joueur dans un tournoi
export async function registerUserTournament(userId: number, tournamentId: number, alias?: string) { //a voir ptet a readapter pour quand creation du jeu
    const db = await getDb();
    await db.run(`
        INSERT INTO User_Tournament (tournament_id, user_id, alias)
        VALUES (${tournamentId},${userId}, ${alias ?? null})
    `);
}

// // // Exemple d'utilisation
// // function setupTournamentWithTwoGames(usersId: number[]) {
// //     // 1. Créer le tournoi
// //     const tournamentId = createTournament(usersId.length, 2);

// //     // 2. Créer deux jeux
// // }
