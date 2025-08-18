import { getDb } from './index.db';
import { ALLOWED_SORT_FIELDS, ALLOWED_SORT_ORDERS } from '../shared/config/constants.config'; // en rouge car dossier local 'shared' != dossier conteneur
import { SafeUserModel, UserSortField, SortOrder, PaginatedUsers, PaginationInfos } from '../shared/types/user.types'; // en rouge car dossier local 'shared' != dossier conteneur
import { snakeArrayToCamel } from '../helpers/types.helpers';

// Liste des utilisateurs qui permet d'avoir une pagination côté front (pour page Users)
// avec paramètres optionnels de tri
export async function getUsersWithPagination(
	page: number = 1, limit: number = 10, sortBy: UserSortField = 'username', sortOrder: SortOrder = 'ASC'): Promise<PaginatedUsers> {
	const db = await getDb();
	const offset = (page - 1) * limit;

	const safeSortBy = ALLOWED_SORT_FIELDS[sortBy] || 'username';
	const safeSortOrder = ALLOWED_SORT_ORDERS[sortOrder] || 'ASC';

	const users = await db.all(
		`
		SELECT id, username, registration, 
				begin_log, end_log, tournament, avatar,
				game_played, game_win, game_loose, time_played,
				n_friends, status, is_desactivated, register_from 
		FROM User 
		ORDER BY ${safeSortBy} ${safeSortOrder}
		LIMIT ? OFFSET ?
		`, 
		[limit, offset]);
	const totalResult = await db.get(
		`
		SELECT COUNT(*) as total 
		FROM User
		`
	);
	const total = totalResult.total
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