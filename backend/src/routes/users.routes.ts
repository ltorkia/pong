import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getAllUsers, getAllUsersInfos, getUser, getUserFriends, getUserGames, getUserChat, getAvatar } from '../db/user';
import { requireAuth } from '../helpers/auth.helpers';
import { UserModel, SafeUserModel, PublicUser, Friends } from '../shared/types/user.types';
import { insertAvatar } from 'src/db/usermaj';
import { Buffer } from 'buffer';
import { GetAvatarFromBuffer, bufferizeStream } from '../helpers/image.helpers';

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


	app.put('/:id/moduser/avatar', async(request: FastifyRequest, reply: FastifyReply) => {
		try {
			const elements = await request.parts({
				limits: {
				fileSize: 5 * 1024 * 1024}
			}); //separe les differents elements recuperes

			let avatarFile; //stockera le file de l avatar
			let avatarBuffer: Buffer | null = null; //buffer de l'avatar pour la sauvegarde en deux parties


			//preparsing qui dispatch datatext d un cote et l avatar de l autre
			for await (const element of elements) {
				console.log(element);
				if (element.type === 'file' && element.fieldname === 'avatar' && element.filename != '') {
					avatarFile = element;
					avatarBuffer = await bufferizeStream(element.file);
				}
			}
			
			let user: UserModel | null = null;
			if (avatarFile && avatarBuffer)
			{
				const { id1 } = request.params as { id1: number };
				user = await getUser(id1, null);
				// if (await GetAvatarFromBuffer(user, avatarFile, avatarBuffer))
				await GetAvatarFromBuffer(reply, user, avatarFile, avatarBuffer);
			}
			return reply.status(200).send({
				statusCode: 200,
				message: user!.avatar
			});
		} catch (err) {
			request.log.error(err);
			return reply.status(500).send({
				errorMessage: 'Erreur serveur lors de l\'ajout d avatar',
			});
		}
	})

	app.put('/:id/moduser', async(request: FastifyRequest, reply: FastifyReply) => {
		const jwtUser = requireAuth(request, reply);
		if (!jwtUser) {
			return;
		}
		const { id } = request.params as { id: number };
		// 1. parsing des infos donnees
		
		// 2. en fonction des elements retrouves ->
		// 3. if password -> check si password donne ok + hasshing du nouveau + update
		// 4. if username -> check si nouveau exist deja sinon block
		// 5. if email -> check si nouveau exist deja sinon block
		// 6. avatar -> chope les fonctions de lee avant update

	})
};

