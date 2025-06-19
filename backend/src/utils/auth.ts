import { FastifyRequest, FastifyReply } from 'fastify';
import { JwtPayload } from '../types/jwt.types';

export function requireAuth(request: FastifyRequest, reply: FastifyReply): JwtPayload | undefined {
    const user = request.user as JwtPayload | undefined;
    if (!user || !user.id) {
        reply.status(401).send({ error: 'Unauthorized' });
        return undefined;
    }
    return user;
}