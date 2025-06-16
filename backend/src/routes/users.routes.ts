import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getAllUsers, getUser, getUserFriends, getUserGames, getUserChat } from '../db';

export async function usersRoutes(app: FastifyInstance) {
	// pour afficher tous les users : nom + email
	app.get('/', async () => {
		const users = await getAllUsers();
		return users;
	})

	// pour afficher des infos detaillees sur un user specifique sans le password
	app.get('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
		const { id } = request.params as { id: number };
		const user = await getUser(id);
		if (!user)
			return reply.code(404).send({ Error : 'User not found'});
		return user;
	})

	// pour afficher les potos de klk1 -> id = la personne concernee
	app.get('/:id/friends', async(request: FastifyRequest, reply: FastifyReply) => {
		const { id } = request.params as { id: number };
		const friends = await getUserFriends(id);
		if (!friends)
			return reply.code(404).send({ Error : 'User not found'});
		return friends;
	})

	app.get('/:id/games', async(request: FastifyRequest, reply: FastifyReply) => {
		const { id } = request.params as { id: number };
		const games = await getUserGames(id);
		console.log("id = ", id);
		if (!games)
			return reply.code(404).send({ Error : 'User not found'});
		return games;
	})

	app.get('/:id1/:id2/chat', async(request: FastifyRequest, reply: FastifyReply) => {
		const { id1 } = request.params as { id1: number };
		const { id2 } = request.params as { id2: number };
		console.log("id1 = ", id1);
		// return id1;
		const chat = await getUserChat(id1, id2);
		if (!chat)
			return reply.code(404).send({ Error : 'User not found'});
		return chat;
	})

};

