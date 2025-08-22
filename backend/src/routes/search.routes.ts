import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { JwtPayload } from '../types/user.types';
import { getUsersWithPagination } from '../db/search.db';
import { PaginatedUsers, SortOrder, UserSortField } from '../shared/types/user.types';

/* ======================== SEARCH ROUTES ======================== */

export async function searchRoutes(app: FastifyInstance) {

	/* -------------------------------------------------------------------------- */
	/*      🔎 - Affiche tous les users avec pagination et paramètres de tri      */
	/* -------------------------------------------------------------------------- */
	// Query params (optionnels) : sortBy, sortOrder
	// Exemple : /api/users/page/1/20?sortBy=registration&sortOrder=DESC

	app.get('/users/page/:page/:limit', async (request: FastifyRequest<{ 
		Params: { page: string; limit: string }; 
		Querystring: { sortBy?: UserSortField; sortOrder?: SortOrder }}>, 
		reply: FastifyReply): Promise<PaginatedUsers | void> => {
		try {
			const jwtUser = request.user as JwtPayload;
			const { page, limit } = request.params;
			const { sortBy = 'status', sortOrder = 'DESC' } = request.query;
			const pageNum = parseInt(page);
			const limitNum = parseInt(limit);
			if (isNaN(pageNum) || pageNum < 1) {
				return reply.status(400).send({ error: 'Le paramètre page doit être un nombre positif' });
			}
			if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
				return reply.status(400).send({ error: 'Le paramètre limit doit être entre 1 et 100' });
			}
			const result: PaginatedUsers = await getUsersWithPagination(jwtUser.id, pageNum, limitNum, sortBy, sortOrder);
				return result;
		} catch (error) {
			console.error('Erreur lors de la récupération des utilisateurs:', error);
			return reply.status(500).send({ error: 'Erreur interne du serveur' });
		}
	})
}