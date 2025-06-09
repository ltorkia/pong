import { FastifyInstance } from 'fastify';
import { getAllUsers, getUser, getUserFriends } from '../db';

export async function usersRoutes(app: FastifyInstance) {
	// pour afficher tous les users : nom + email
	app.get('/', async () => {
		const users = await getAllUsers();
		return users;
	})

	// pour afficher des infos detaillees sur un user specifique sans le password
	app.get('/:id', async (request, reply) => {
		const { id } = request.params as { id: number };
		const user = await getUser(id);
		if (!user)
			return reply.code(404).send({ Error : 'User not found'});
		return user;
	})

	// pour afficher les potos de klk1 -> id = la personne concernee
	app.get('/:id/friends', async(request, reply) => {
		const { id } = request.params as { id: number };
		const friends = await getUserFriends(id);
		if (!friends)
			return reply.code(404).send({ Error : 'User not found'});
		return friends;
	})
};

