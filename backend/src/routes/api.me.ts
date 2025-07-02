import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getUser } from '../db/user';
import { requireAuth } from '../helpers/auth.helpers';
import { UserModel } from '../shared/types/user.types'; // en rouge car dossier local 'shared' != dossier conteneur

export async function apiMe(app: FastifyInstance) {

	app.get('/', async (request: FastifyRequest, reply: FastifyReply) => {

		const jwtUser = requireAuth(request, reply);
		if (!jwtUser) {
			return;
		}
		
		try {
			const dbUser: UserModel = await getUser(jwtUser.id);
			if (!dbUser) {
				return reply.status(404).send({ error: 'User not found' });
			}
			return reply.send(dbUser);

		} catch (err) {
			request.log.error(err);
			return reply.status(500).send({ error: 'Internal server error' });
		}
	});

}