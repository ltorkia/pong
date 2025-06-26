import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getUser } from '../db/user';
import { requireAuth, setPublicUserInfos } from '../helpers/auth.helpers';
import { PublicUser } from '../types/user.types';

export async function apiMe(app: FastifyInstance) {

	app.get('/', async (request: FastifyRequest, reply: FastifyReply) => {

		const jwtUser = requireAuth(request, reply);
		if (!jwtUser) {
			return;
		}
		
		try {
			const dbUser = await getUser(jwtUser.id);
			if (!dbUser) {
				return reply.status(404).send({ error: 'User not found' });
			}

			const responseUser: PublicUser = setPublicUserInfos(dbUser);
			return reply.send(responseUser);

		} catch (err) {
			request.log.error(err);
			return reply.status(500).send({ error: 'Internal server error' });
		}
	});

}