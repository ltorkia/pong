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