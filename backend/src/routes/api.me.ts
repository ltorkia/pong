import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getUser } from '../db/user';
import { JwtPayload } from '../types/jwt.types';

export async function apiMe(app: FastifyInstance) {

	app.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
		// try {
			const decoded = await request.jwtVerify<JwtPayload>();
			if (!decoded) {
				return reply.status(401).send({ error: 'Token missing' });
			}

			const user = await getUser(Number(decoded.id));

			return reply.send({
				id: user.id,
				username: user.pseudo,
				email: user.email
			});
		// } catch (err) {
		// 	return reply.status(401).send({ error: 'Unauthorized' });
		// }
	});

}