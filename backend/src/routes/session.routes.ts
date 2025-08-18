import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { JwtPayload } from '../types/user.types';

export async function sessionRoutes(app: FastifyInstance) {

	/**
	 * Route de validation de session utilisateur:
	 * Permet de vérifier que la session JWT en cours
	 * correspond bien à l'utilisateur dont l'id est passé en paramètre d'URL.
	 * 
	 * Utile pour valider côté client que la session est toujours active et que
	 * l'utilisateur est bien celui attendu, sans exposer de données sensibles comme avec api/me.
	 */
	app.get('/:id', async (request: FastifyRequest<{ Params: { id : number } }>, reply: FastifyReply) => {
		const jwtUser = request.user as JwtPayload;
		const requestedId = Number(request.params.id);
		if (isNaN(requestedId) || jwtUser.id !== requestedId) {
			return reply.status(403).send({ valid: false });
		}

		return reply.send({ valid: true });
	});

}
