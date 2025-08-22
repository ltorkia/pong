import { getDb } from './index.db';
import { ALLOWED_SORT_FIELDS, ALLOWED_SORT_ORDERS } from '../shared/config/constants.config'; // en rouge car dossier local 'shared' != dossier conteneur
import { SafeUserModel, UserSortField, SortOrder, PaginatedUsers, PaginationInfos } from '../shared/types/user.types'; // en rouge car dossier local 'shared' != dossier conteneur
import { snakeArrayToCamel } from '../helpers/types.helpers';

// Liste des utilisateurs qui permet d'avoir une pagination côté front (pour page Users)
// avec paramètres optionnels de tri
// export async function getUsersWithPagination(
// 	page: number = 1, limit: number = 10, sortBy: UserSortField = 'status', sortOrder: SortOrder = 'DESC'): Promise<PaginatedUsers> {
// 	const db = await getDb();
// 	const offset = (page - 1) * limit;

// 	const safeSortBy = ALLOWED_SORT_FIELDS[sortBy] || 'status';
// 	const safeSortOrder = ALLOWED_SORT_ORDERS[sortOrder] || 'DESC';

// 	const users = await db.all(
// 		`
// 		SELECT id, username, registration, 
// 				begin_log, end_log, tournament, avatar,
// 				game_played, game_win, game_loose, time_played,
// 				n_friends, status, is_desactivated, register_from 
// 		FROM User 
// 		ORDER BY ${safeSortBy} ${safeSortOrder}
// 		LIMIT ? OFFSET ?
// 		`, 
// 		[limit, offset]);
// 	const totalResult = await db.get(
// 		`
// 		SELECT COUNT(*) as total 
// 		FROM User
// 		`
// 	);
// 	const total = totalResult.total
// 	const totalPages = Math.ceil(total / limit);
// 	return {
// 			users: snakeArrayToCamel(users) as SafeUserModel[],
// 			pagination: {
// 			currentPage: page,
// 			totalPages,
// 			totalUsers: total,
// 			hasNextPage: page < totalPages,
// 			hasPreviousPage: page > 1,
// 			limit
// 		} as PaginationInfos
// 	};
// }

export async function getUsersWithPagination(
	currentUserId: number, page: number = 1, limit: number = 10, sortBy: UserSortField = 'status', sortOrder: SortOrder = 'DESC')
	: Promise<PaginatedUsers> {
	const db = await getDb();
	const offset = (page - 1) * limit;

	const safeSortBy = ALLOWED_SORT_FIELDS[sortBy] || 'status';
	const safeSortOrder = ALLOWED_SORT_ORDERS[sortOrder] || 'DESC';

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
		WHERE u.id != ?
		ORDER BY priority ASC, ${safeSortBy} ${safeSortOrder}
		LIMIT ? OFFSET ?
		`,
		[currentUserId, currentUserId, currentUserId, limit, offset]
	);

	const totalResult = await db.get(`SELECT COUNT(*) as total FROM User WHERE id != ?`, [currentUserId]);
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