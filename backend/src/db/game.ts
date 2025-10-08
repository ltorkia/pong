import { getDb } from "./index.db";

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

export async function addGamePlayers(gameId: number, userIds: number[], aliases?: string[]) {
    const db = await getDb();
    const playerAliases = aliases ?? ["", ""];
    await db.run(
        `INSERT INTO User_Game (game_id, user_id, alias) VALUES (?, ?, ?)`,
        [gameId, userIds[0], playerAliases[0]]
    );
    await db.run(
        `INSERT INTO User_Game (game_id, user_id) VALUES (?, ?)`,
        [gameId, userIds[1], playerAliases[1]]
    );
}

export async function resultGame(gameId: number, winnerId: number, score: number[], isCancelled: boolean = false) {
    const db = await getDb();

    const minScore = Math.min(score[0], score[1]);
    console.log("resultGame,  score = ", score, " minScore = ", minScore);
    const status = isCancelled ? "cancelled" : "finished";

    await db.run(`
        UPDATE Game
        SET status = ?,
            end = CURRENT_TIMESTAMP,
            winner_id = ?,
            looser_result = ?
        WHERE id = ?;
    `, 
    [status, winnerId, minScore, gameId]);

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
