import { FastifyInstance } from 'fastify';
import fastifyJwt from '@fastify/jwt';
import fastifyCookie from '@fastify/cookie';
import {getUser} from '../../src/db'

export async function apiMe(app: FastifyInstance) {

    app.register(fastifyCookie);
    app.register(fastifyJwt, { secret: JWT_SECRET });
    
    app.get('/', async (request, reply) => {
      try {
        const token = request.cookies.auth_token;
        const decoded = app.jwt.verify(token);
        const user = await getUser(decoded.id);
        return reply.send({
          id: user.id,
          username: user.pseudo,
          email: user.email
        });
      } catch (err) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
    });
}
