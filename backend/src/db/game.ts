// import { FastifyInstance, FastifyRegister, FastifyReply, FastifyRequest } from "fastify";
// import { getDb } from "./index.db";

// export async function gameDBRoutes(app: FastifyInstance) {
//     const db = await getDb();

//     app.post('/new_game', async (request: FastifyRequest, reply: FastifyReply) => {
//         const { n_participants, tournament, status, temporary_result } = request.body;

//         const result = await db.run(
//             `INSERT INTO Game (n_participants, tournament, status, temporary_result)
//             VALUES (?, ?, ?, ?)`,
//             [n_participants, tournament ?? 0, status ?? 'waiting', temporary_result ?? 0]
//         );

//         return { id: result.lastID, message: 'Game created' };
//     });
// }