import { getDb } from "./index.db";
import { snakeToCamel } from '../helpers/types.helpers';
import { GameModel } from '../shared/types/game.types'; // en rouge car dossier local 'shared' != dossier conteneur

export async function addGame(tournament?: number, isOnlineGame?: boolean): Promise<number> {
    const db = await getDb();
    const tournamentId = tournament ?? 0;
    const gameType = isOnlineGame ? "online" : "local";

    // Insérer le jeu et récupérer son id
    const result = await db.run(
        `INSERT INTO Game (status, n_participants, tournament, type) VALUES ('in_progress', 2, ?, ?)`,
        [tournamentId, gameType]
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

export async function resultGame(gameId: number, winnerId: number, score: number[]){
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
    `, 
    [winnerId, minScore, gameId]);

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

export async function cancelledGame(gameId: number, winnerId: number, score: number[]){
    const db = await getDb();
    const minScore = Math.min(score[0], score[1]);

        // Mise à jour de la table Game
        await db.run(`
            UPDATE Game
            SET status = 'cancelled',
                end = CURRENT_TIMESTAMP,
                winner_id = ?,
                looser_result = ?
            WHERE id = ?;
        `, [winnerId, minScore, gameId]); // Ordre corrigé : winnerId, minScore, gameId

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
export async function waitingGame(gameId: number, winnerId: number, score: number[]){
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
        Where id = ?`, 
        [gameId]);
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

// Update tournament end
export async function endTournament(tournamentId: number): Promise<boolean> {
    const db = await getDb();

    try {
        const result = await db.run(
            `UPDATE Tournament 
            SET ended_at = CURRENT_TIMESTAMP,
                tournament_status = 'finished'
            WHERE id = ?`,
            [tournamentId]
        );
        
        return true;
    } catch (error) {
        console.error('Error ending tournament:', error);
        return false;
    }
}

// Update tournament status
export async function updateTournamentStatus(
        tournamentId: number,
        status: 'pending' | 'in_progress' | 'cancelled' | 'finished'
    ): Promise<boolean> {
    const db = await getDb();

    try {
        const updates: string[] = ['tournament_status = ?'];
        const params: any[] = [status];
        
        // Set ended_at when finishing or cancelling
        if (status === 'finished' || status === 'cancelled') {
            updates.push('ended_at = CURRENT_TIMESTAMP');
        }
        
        params.push(tournamentId);
        
        const result = await db.run(
            `UPDATE Tournament SET ${updates.join(', ')} WHERE id = ?`,
            params
        );
        
        return true;
    } catch (error) {
        console.error('Error updating tournament status:', error);
        return false;
    }
}


// Increment wins/losses (useful for game results)
export async function incrementUserTournamentStats(
        tournamentId: number,
        userId: number,
        win: boolean,
        scoreIncrement: number = 0
    ): Promise<boolean> {
    const db = await getDb();

    try {
        const result = await db.run(
        `UPDATE User_Tournament 
        SET wins = wins + ?,
            losses = losses + ?,
            score = score + ?
        WHERE tournament_id = ? AND user_id = ?`,
        [win ? 1 : 0, win ? 0 : 1, scoreIncrement, tournamentId, userId]
        );
        
        return true;
    } catch (error) {
        console.error('Error incrementing user tournament stats:', error);
        return false;
    }
}

// Enregistre un joueur dans un tournoi
export async function registerUserTournament(userId: number, tournamentId: number, alias?: string) {
    const db = await getDb();
    await db.run(`
        INSERT INTO User_Tournament (tournament_id, user_id, alias)
        VALUES (?, ?, ?)`,
        [tournamentId, userId, alias ?? null]
    );
}
