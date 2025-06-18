import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getUser } from '../db/user';
import { requireAuth } from '../utils/auth';

export async function apiMe(app: FastifyInstance) {

	app.get('/', async (request: FastifyRequest, reply: FastifyReply) => {

		const jwtUser = requireAuth(request, reply);
		if (!jwtUser) {
			return;
		}
		const userId = jwtUser.id;
		
		try {
			const dbUser = await getUser(Number(userId));
			if (!dbUser) {
				return reply.status(404).send({ error: 'User not found' });
			}

			return reply.send({
				id: dbUser.id,
				username: dbUser.pseudo,
				email: dbUser.email
			});
			
		} catch (err) {
			request.log.error(err);
			return reply.status(500).send({ error: 'Internal server error' });
		}
	});

}