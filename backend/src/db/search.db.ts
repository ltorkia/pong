import { getDb } from './index.db';
import { UserSortFieldEnum, SortOrderEnum } from '../shared/config/constants.config'; // en rouge car dossier local 'shared' != dossier conteneur
import { SafeUserModel, PaginatedUsers, PaginationInfos, SearchParams } from '../shared/types/user.types'; // en rouge car dossier local 'shared' != dossier conteneur
import { snakeArrayToCamel } from '../helpers/types.helpers';

// Liste des utilisateurs qui permet d'avoir une pagination côté front (pour page Users)
// avec paramètres optionnels de tri
export async function getUsersWithPagination(
	currentUserId: number, page: number = 1, limit: number = 10, 
	sortBy: UserSortFieldEnum = UserSortFieldEnum.status, 
	sortOrder: SortOrderEnum = SortOrderEnum.DESC,
	filters: SearchParams = {}): Promise<PaginatedUsers> {
	const db = await getDb();
	const offset = (page - 1) * limit;

	const safeSortBy = sortBy || UserSortFieldEnum.status;
	const safeSortOrder = sortOrder || SortOrderEnum.DESC;

	// Base de la requête
	let whereClauses: string[] = ["u.id != ?"];
	let params: any[] = [currentUserId, currentUserId, currentUserId]; // pour LEFT JOIN Friends

	// Application des filtres
	if (filters.status) {
		whereClauses.push("u.status = ?");
		params.push(filters.status);
	}

	if (filters.searchTerm) {
		whereClauses.push("u.username LIKE ?");
		params.push(`%${filters.searchTerm}%`);
	}

	if (filters.level !== undefined) {
		whereClauses.push("u.level = ?");
		params.push(filters.level);
	}

	if (filters.friendsOnly) {
		whereClauses.push("f.friend_status = 'accepted'");
	}
	const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

	// Requête principale
	const users = await db.all(
		`
		SELECT 
			u.id, u.username, u.registration, u.begin_log, u.end_log, u.tournament, u.avatar,
			u.game_played, u.game_win, u.game_loose, u.time_played, u.n_friends, u.status, u.is_desactivated, u.register_from,
			f.friend_status,
			CASE 
				WHEN f.friend_status IS NOT NULL AND u.status = 'online' THEN 1
				WHEN f.friend_status IS NULL AND u.status = 'online' THEN 2
				ELSE 3
			END AS priority
		FROM User u
		LEFT JOIN Friends f 
			ON (
				(f.user1_id = ? AND f.user2_id = u.id) 
				OR 
				(f.user2_id = ? AND f.user1_id = u.id)
			)
		${whereSQL}
		ORDER BY priority ASC, ${safeSortBy} ${safeSortOrder}
		LIMIT ? OFFSET ?
		`,
		[...params, limit, offset]
	);

	// Total count (applique les mêmes filtres sans LIMIT)
	const totalResult = await db.get(
		`
		SELECT COUNT(*) as total 
		FROM User u
		LEFT JOIN Friends f 
			ON (
				(f.user1_id = ? AND f.user2_id = u.id) 
				OR 
				(f.user2_id = ? AND f.user1_id = u.id)
			)
		${whereSQL}
		`,
		params
	);
	const total = totalResult.total;
	const totalPages = Math.ceil(total / limit);

	return {
			users: snakeArrayToCamel(users) as SafeUserModel[],
			pagination: {
			currentPage: page,
			totalPages,
			totalUsers: total,
			hasNextPage: page < totalPages,
			hasPreviousPage: page > 1,
			limit
		} as PaginationInfos
	};
}