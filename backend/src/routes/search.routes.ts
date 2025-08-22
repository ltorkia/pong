import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { JwtPayload } from '../types/user.types';
import { getUsersWithPagination } from '../db/search.db';
import { PaginatedUsers, UsersPageParams } from '../shared/types/user.types';
import { SearchParamsSchema, UsersPageQuery } from '../types/zod/search';
import { UserSortFieldEnum, SortOrderEnum } from '../shared/config/constants.config';

/* ======================== SEARCH ROUTES ======================== */

export async function searchRoutes(app: FastifyInstance) {

	/* -------------------------------------------------------------------------- */
	/*      🔎 - Affiche tous les users avec pagination et paramètres de tri      */
	/* -------------------------------------------------------------------------- */
	// Query params (optionnels) : sortBy, sortOrder
	// Exemple : /api/users/page/1/20?sortBy=registration&sortOrder=DESC

	// app.get('/users/page/:page/:limit', async (request: FastifyRequest<{ 
	// 	Params: { page: string; limit: string }; 
	// 	Querystring: { sortBy?: UserSortField; sortOrder?: SortOrder; 
	// 					searchTerm?: string; status?: string; level?: string; friendsOnly?: string; }}>, 
	// 	reply: FastifyReply): Promise<PaginatedUsers | void> => {
	// 	try {
	// 		const jwtUser = request.user as JwtPayload;
	// 		const { page, limit } = request.params;
	// 		const { sortBy = 'status', sortOrder = 'DESC', searchTerm, status, level, friendsOnly } = request.query;
	// 		const pageNum = parseInt(page);
	// 		const limitNum = parseInt(limit);
	// 		if (isNaN(pageNum) || pageNum < 1) {
	// 			return reply.status(400).send({ error: 'Le paramètre page doit être un nombre positif' });
	// 		}
	// 		if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
	// 			return reply.status(400).send({ error: 'Le paramètre limit doit être entre 1 et 100' });
	// 		}
	// 		const friendsOnlyBool = friendsOnly === 'true';
	// 		const result: PaginatedUsers = await getUsersWithPagination(jwtUser.id, pageNum, limitNum, sortBy, sortOrder,
	// 															{ searchTerm, status, level, friendsOnly: friendsOnlyBool }
	// 		);
	// 			return result;
	// 	} catch (error) {
	// 		console.error('Erreur lors de la récupération des utilisateurs:', error);
	// 		return reply.status(500).send({ error: 'Erreur interne du serveur' });
	// 	}
	// })

	app.get('/users/page/:page/:limit', async (
		request: FastifyRequest<{ Params: UsersPageParams; Querystring: UsersPageQuery }>,
		reply: FastifyReply) => {
		try {
			const jwtUser = request.user as JwtPayload;
			const { page, limit } = request.params;

			const pageNum = parseInt(page);
			const limitNum = parseInt(limit);

			if (isNaN(pageNum) || pageNum < 1)
				return reply.status(400).send({ error: 'Page invalide' });
			if (isNaN(limitNum) || limitNum < 1 || limitNum > 100)
				return reply.status(400).send({ error: 'Limit invalide' });

			const parseResult = SearchParamsSchema.safeParse(request.query);
			if (!parseResult.success) {
				return reply.status(400).send({
					error: 'Query params invalides',
					details: parseResult.error.errors,
				});
			}
			const filters = parseResult.data;
			const sortBy: UserSortFieldEnum = (filters.sortBy ?? UserSortFieldEnum.status) as UserSortFieldEnum;
			const sortOrder: SortOrderEnum = (filters.sortOrder ?? SortOrderEnum.DESC) as SortOrderEnum;
			const result: PaginatedUsers = await getUsersWithPagination(
				jwtUser.id,
				pageNum,
				limitNum,
				sortBy,
				sortOrder,
				filters
			);
			return result;
		} catch (error) {
			console.error('Erreur lors de la récupération des utilisateurs:', error);
			return reply.status(500).send({ error: 'Erreur interne du serveur' });
		}
	});

}