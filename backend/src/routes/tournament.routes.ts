import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

export async function tournamentRoutes(app: FastifyInstance) {
    app.get("/tournaments", async(request: FastifyRequest, reply: FastifyReply) => {
        return reply.send(app.lobby.allTournaments);
    })
}
