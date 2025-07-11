import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getAllUsers, getAllUsersInfos, getUser, getUserFriends, getUserGames, getUserChat, getAvatar } from '../db/user';
import { requireAuth } from '../helpers/auth.helpers';
import { UserModel, SafeUserModel, PublicUser, Friends } from '../shared/types/user.types';

export async function usersRoutes(app: FastifyInstance) {
	// pour afficher tous les users
	app.get('/', async (request: FastifyRequest, reply: FastifyReply): Promise<SafeUserModel[] | void> => {
		const jwtUser = requireAuth(request, reply);
		if (!jwtUser) {
			return;
		}
		// const users: UserBasic[] = await getAllUsers();
		const users: SafeUserModel[] = await getAllUsersInfos();
		return users;
	})

	// pour afficher des infos detaillees sur un user specifique sans le password
	app.get('/:id', async (request: FastifyRequest, reply: FastifyReply): Promise<SafeUserModel | void> => {
		const jwtUser = requireAuth(request, reply);
		if (!jwtUser) {
			return;
		}
		const { id } = request.params as { id: number };
		const user: SafeUserModel = await getUser(id);
		if (!user)
			return reply.code(404).send({ Error : 'User not found'});
		return user;
	})

	// pour afficher les potos de klk1 -> id = la personne concernee
	app.get('/:id/friends', async(request: FastifyRequest, reply: FastifyReply): Promise<Friends[] | void> => {
		const jwtUser = requireAuth(request, reply);
		if (!jwtUser) {
			return;
		}
		const { id } = request.params as { id: number };
		const friends: Friends[] = await getUserFriends(id);
		if (!friends)
			return reply.code(404).send({ Error : 'User not found'});
		return friends;
	})

	app.get('/:id/games', async(request: FastifyRequest, reply: FastifyReply) => {
		const jwtUser = requireAuth(request, reply);
		if (!jwtUser) {
			return;
		}
		const { id } = request.params as { id: number };
		const games = await getUserGames(id);
		// console.log("id = ", id);
		if (!games)
			return reply.code(404).send({ Error : 'User not found'});
		return games;
	})

	app.get('/:id1/:id2/chat', async(request: FastifyRequest, reply: FastifyReply) => {
		const jwtUser = requireAuth(request, reply);
		if (!jwtUser) {
			return;
		}
		const { id1 } = request.params as { id1: number };
		const { id2 } = request.params as { id2: number };
		// console.log("id1 = ", id1);
		// return id1;
		const chat = await getUserChat(id1, id2);
		if (!chat)
			return reply.code(404).send({ Error : 'User not found'});
		return chat;
	})
// -       //pour takeback l avatar en base 64 stocke dans le serveur 
// -       app.get('/:id/avatar', async(request: FastifyRequest, reply: FastifyReply) => {
// -               const jwtUser = requireAuth(request, reply);
// -               if (!jwtUser) {
// -                       return;
// -               }               
// -               const { id } = request.params as { id: number };
// -               const avatarPath = await getAvatar(id);
// -               console.log(avatarPath);
// -               if (!avatarPath)
// -                       return reply.code(210).send({ Error : 'avatar not found'});
// -
// -               try {
// -                       const data = await fs.readFile(avatarPath.avatar);
// -                       const data64 = data.toString('base64');
// -                   reply.status(200).send({
// -                       avatar: data64,
// -                               // Content-Type: image/png
// -               });
// -               } catch (error) {
// -       reply.status(500).send({ error: 'Impossible de lire l\'avatar' });
// -               }
// -       })
};

