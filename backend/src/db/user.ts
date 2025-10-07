import { getDb } from './index.db';
import { RegisterInput } from '../types/zod/auth.zod';
import { searchNewName } from '../helpers/auth.helpers';
import { UserPassword, User2FA, UserForChangeData } from '../types/user.types';
import { DB_CONST } from '../shared/config/constants.config'; // en rouge car dossier local 'shared' != dossier conteneur
import { UserModel, SafeUserModel, SafeUserBasic } from '../shared/types/user.types'; // en rouge car dossier local 'shared' != dossier conteneur
import { TournamentModel, GameModel } from '../shared/types/game.types'; // en rouge car dossier local 'shared' != dossier conteneur
import { snakeToCamel, snakeArrayToCamel } from '../helpers/types.helpers';


export async function getAllUsersInfos() {
	const db = await getDb();
	const users = await db.all(`
		SELECT id, username, registration, 
		begin_log, end_log, tournament, avatar, game_played, game_win, 
		game_loose, time_played, n_friends, status, is_desactivated, register_from 
		FROM User 
	`);
	return snakeArrayToCamel(users) as SafeUserModel[];
}

// retourne les infos d'un user particulier
export async function getUser(userId : number | null = null, search : string | null = null) {
	const db = await getDb(); 
	const user = await db.get(`
		SELECT id, username, email, 
		registration, begin_log, end_log, tournament, avatar, n_friends, status, 
		is_desactivated, register_from, active_2FA
		FROM User 
		WHERE id = ? OR username = ? OR email = ?
		`,
		[userId, search, search]
	);
	return snakeToCamel(user) as UserModel;
}

/**
 * LEFT JOIN User_Game ug = permet d’aller chercher toutes les parties du user.
 * COUNT(ug.game_id) = total de parties jouées.
 * SUM(CASE WHEN ug.status_win = 1 ...) = victoires/défaites.
 * SUM(ug.duration) = temps joué (si on stock la durée en secondes/minutes).
 * LEFT JOIN User_Tournament ut pour récupérer les stats des tournois.

 * COUNT(DISTINCT ut.tournament_id) = nombre de tournois joués.
 * SUM(ut.score), SUM(ut.wins), SUM(ut.losses) = score et victoires/défaites cumulées.
 * MAX(ut.round_reached) = dernier round atteint.
 * DISTINCT sur ug.game_id pour éviter les doublons si plusieurs entrées par jeu.
 */
export async function getUserStats(userId: number): Promise<SafeUserModel> {
	const db = await getDb();
	const user = await db.get(`
		SELECT 
			u.id, u.username, u.avatar, u.registration, u.begin_log, 
			u.end_log, u.status, u.is_desactivated,

			COUNT(DISTINCT ug.game_id) AS game_played,
			SUM(CASE WHEN ug.status_win = 1 THEN 1 ELSE 0 END) AS game_win,
			SUM(CASE WHEN ug.status_win = 0 THEN 1 ELSE 0 END) AS game_loose,
			COALESCE(SUM(ug.duration), 0) AS time_played,

			COUNT(DISTINCT ut.tournament_id) AS tournaments_played,
			SUM(ut.score) AS tournament_score,
			SUM(ut.wins) AS tournament_wins,
			SUM(ut.losses) AS tournament_losses,
			MAX(ut.round_reached) AS last_round_reached

		FROM User u
		LEFT JOIN User_Game ug ON ug.user_id = u.id
		LEFT JOIN User_Tournament ut ON ut.user_id = u.id
		WHERE u.id = ?
		GROUP BY u.id
	`, [userId]);

	return snakeToCamel(user) as SafeUserModel;
}

/* -------------------------------------------------------------------------- */
/*      REQUÊTES USER POUR SETTINGS AUTHENTIFICATION CÔTE BACK UNIQUEMENT     */
/* -------------------------------------------------------------------------- */

export async function getUserAllInfo(id: number) {
	const db = await getDb();
	const user = await db.get(`
		SELECT *
		FROM User
		WHERE id = ?
		`,
		[id]
	);
	return snakeToCamel(user) as UserForChangeData;
}

// retourne les infos de tous les users pour l authentification 
export async function getUserP(email: string) {
	const db = await getDb();
	const user = await db.get(`
		SELECT id, username, email, password, register_from, avatar
		FROM User 
		WHERE email = ?
		`,
		[email]
	);
	return snakeToCamel(user) as UserPassword;
}

export async function getUser2FA(email: string) {
	const db = await getDb();
	const user = await db.get(`
		SELECT id, username, email, code_2FA_email, code_2FA_qrcode, code_2FA_expire_at, active_2FA, register_from
		FROM User 
		WHERE email = ?
		`,
		[email]
	);
	return snakeToCamel(user) as User2FA;
}

/* -------------------------------------------------------------------------- */
/*                    CRUD / SETTINGS UTILISATEUR COURANT                     */
/* -------------------------------------------------------------------------- */

export async function insertUser(user: (RegisterInput | {username: string, email: string}), is_google: (boolean | null)) {
	try {
		const db = await getDb();
		
		if (!is_google)
		{
			if(await getUser(null, user.username))
				return {statusCode : 409, message : "Username already used.<br><b>" + await (searchNewName(user.username)) + "</b> is available."};
			
			if (await getUser(null, user.email))
				return {statusCode: 409, message : "Email already used"};
			const u = user as RegisterInput;
			await db.run(`
				INSERT INTO User (username, email, password)
				VALUES (?, ?, ?)
				`,
				[u.username, u.email, u.password]
			);
		}
		else 
		{
			if(await getUser(null, user.username))
				user.username = await (searchNewName(user.username));
					
			await db.run(`
				INSERT INTO User (username, email, register_from)
				VALUES (?, ?, ?)
				`,
				[user.username, user.email, DB_CONST.USER.REGISTER_FROM.GOOGLE]
			);	
		}
		return {statusCode : 201, message : 'user add'};

	} catch (err) {
		console.error("Erreur lors de l'insertion d'un utilisateur standard :", err);
		return { statusCode: 500, message: "Erreur serveur : insertion utilisateur échouée." };
	}	
}

/* -------------------------------------------------------------------------- */
/*               QUERIES USER EN LIEN AVEC D'AUTRES TABLES                    */
/* -------------------------------------------------------------------------- */

export async function getUserGames(userId: number): Promise<GameModel[] | undefined>{
	const db = await getDb();

	// On récupère les infos de Game ET User_Game
	const games = await db.all(
		`
		SELECT 
			g.id,
			g.n_participants,
			g.begin,
			g.end,
			g.tournament,
			g.status,
			g.looser_result,
			g.winner_id,
			g.type,
			ug.status_win,
			ug.duration
		FROM User_Game ug
		JOIN Game g ON g.id = ug.game_id
		WHERE ug.user_id = ?
		ORDER BY g.begin DESC
		`,
		[userId]
	);

	// Pour chaque game, récupérer les autres joueurs
	for (const game of games) {
		const players = await db.all(
			`
			SELECT u.id, u.username, u.avatar
			FROM User_Game ug
			JOIN User u ON u.id = ug.user_id
			WHERE ug.game_id = ?
			AND u.id != ?
			`,
			[game.id, userId]
		);
		game.other_players = players as SafeUserBasic[];
	}
	return snakeArrayToCamel(games) as GameModel[];
}

export async function getUsersGame(gameId: number, userId: number): Promise<SafeUserBasic | undefined> {
    try {
        const db = await getDb();
        const player = await db.get(
            `
            SELECT u.id, u.username, u.avatar
            FROM User_Game ug
            JOIN User u ON u.id = ug.user_id
            WHERE ug.game_id = ?
            AND u.id != ?
            LIMIT 1
            `,
            [gameId, userId]
        );
        return snakeToCamel(player) as SafeUserBasic;
    } catch (error) {
        console.error(`Error fetching user for game ${gameId}:`, error);
        return undefined;
    }
}

export async function getUserTournaments(userId: number): Promise<TournamentModel[]> {
	const db = await getDb();

	// Récupérer les tournois où est inscrit l’utilisateur
	const tournaments = await db.all(`
		SELECT 
			ut.tournament_id,
			ut.alias,
			ut.score,
			ut.wins,
			ut.losses,
			ut.round_reached,
			ut.status,
			ut.registered_at,
			t.n_participants,
			t.n_round,
			t.started_at,
			t.ended_at,
			t.tournament_status
		FROM User_Tournament ut
		JOIN Tournament t ON t.id = ut.tournament_id
		WHERE ut.user_id = ?
		ORDER BY t.started_at DESC
	`, [userId]);

	// Pour chaque tournoi, récupérer les parties et les autres joueurs
	for (const tournament of tournaments) {
		const games = await db.all(`
			SELECT g.id AS game_id, g.begin, g.end, g.status, g.winner_id
			FROM Game g
			WHERE g.tournament = ?
		`, [tournament.tournament_id]);

		for (const game of games) {
			const players = await db.all(`
				SELECT u.id, u.username, u.avatar
				FROM User_Game ug
				JOIN User u ON u.id = ug.user_id
				WHERE ug.game_id = ?
				AND u.id != ?
			`, [game.game_id, userId]);

			game.other_players = players as SafeUserBasic[];
		}

		tournament.games = snakeArrayToCamel(games) as GameModel[];
	}
	return snakeArrayToCamel(tournaments) as TournamentModel[];
}
