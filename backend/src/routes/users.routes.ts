import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getUser, getUserFriends, getUserGames, getUserChat, getAvatar, getUserAllInfo } from '../db/user';
import { getAllUsers, getAllUsersInfos, getUsersWithPagination } from '../db/user';
import { UserModel, SafeUserModel, PublicUser, Friends, PaginatedUsers, SortOrder, UserSortField, UserSearchField } from '../shared/types/user.types';
import { insertAvatar } from '../db/usermaj';
import { Buffer } from 'buffer';
import bcrypt from 'bcrypt';
import { GetAvatarFromBuffer, bufferizeStream } from '../helpers/image.helpers';
import { RegisterInputSchema, RegisterInput, ModUserInput, ModUserInputSchema } from '../types/zod/auth.zod';
import { searchNewName } from '../helpers/auth.helpers';
import { changeUserData } from '../db/usermaj';
import { promises as fs } from 'fs';
import { DB_CONST } from '../shared/config/constants.config';

export async function usersRoutes(app: FastifyInstance) {
	// pour afficher tous les users
	app.get('/', async (request: FastifyRequest, reply: FastifyReply): Promise<SafeUserModel[] | void> => {
		// const users: UserBasic[] = await getAllUsers();
		const users: SafeUserModel[] = await getAllUsersInfos();
		return users;
	})

	// Pour afficher tous les users avec pagination et paramètres de tri
	// Query params (optionnels) : sortBy, sortOrder
	// Exemple : /api/users/page/1/20?sortBy=registration&sortOrder=DESC
	app.get('/page/:page/:limit', async (request: FastifyRequest<{ 
		Params: { page: string; limit: string }; 
		Querystring: { sortBy?: UserSortField; sortOrder?: SortOrder }}>, 
		reply: FastifyReply): Promise<PaginatedUsers | void> => {
		try {
			const { page, limit } = request.params;
			const { sortBy = 'username', sortOrder = 'ASC' } = request.query;
			const pageNum = parseInt(page);
			const limitNum = parseInt(limit);
			if (isNaN(pageNum) || pageNum < 1) {
				return reply.status(400).send({ error: 'Le paramètre page doit être un nombre positif' });
			}
			if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
				return reply.status(400).send({ error: 'Le paramètre limit doit être entre 1 et 100' });
			}
			const result: PaginatedUsers = await getUsersWithPagination(pageNum, limitNum, sortBy, sortOrder);
				return result;
		} catch (error) {
			console.error('Erreur lors de la récupération des utilisateurs:', error);
			return reply.status(500).send({ error: 'Erreur interne du serveur' });
		}
	})

	// pour afficher des infos detaillees sur un user specifique sans le password
	app.get('/:id', async (request: FastifyRequest, reply: FastifyReply): Promise<SafeUserModel | void> => {
		const { id } = request.params as { id: number };
		const user: SafeUserModel = await getUser(id);
		if (!user)
			return reply.code(404).send({ Error : 'User not found'});
		return user;
	})

	// pour afficher les potos de klk1 -> id = la personne concernee
	app.get('/:id/friends', async(request: FastifyRequest, reply: FastifyReply): Promise<PublicUser[] | void> => {
		const { id } = request.params as { id: number };
		const friends: PublicUser[] = await getUserFriends(id);
		if (!friends)
			return reply.code(404).send({ Error : 'User not found'});
		return friends;
	})

	app.get('/:id/games', async(request: FastifyRequest, reply: FastifyReply) => {
		const { id } = request.params as { id: number };
		const games = await getUserGames(id);
		// console.log("id = ", id);
		if (!games)
			return reply.code(404).send({ Error : 'User not found'});
		return games;
	})

	app.get('/:id1/:id2/chat', async(request: FastifyRequest, reply: FastifyReply) => {
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
			// console.log("--------------------------request is : " + request);
			const elements = await request.parts({
				limits: {
				fileSize: 5 * 1024 * 1024}
			}); //separe les differents elements recuperes

			let avatarFile; //stockera le file de l avatar
			let avatarBuffer: Buffer | null = null; //buffer de l'avatar pour la sauvegarde en deux parties


			//preparsing qui dispatch datatext d un cote et l avatar de l autre
			for await (const element of elements) {
				// console.log(element);
				if (element.type === 'file' && element.fieldname === 'avatar' && element.filename != '') {
					avatarFile = element;
					avatarBuffer = await bufferizeStream(element.file);
				}
			}
			
			let user: UserModel | null = null;
			const { id } = request.params as { id: number };
			if (avatarFile && avatarBuffer)
			{
				user = await getUser(id);
				if (user.avatar != "default.png")
				{
					try {await fs.unlink(`./uploads/avatars/${user.avatar}`);}
					catch (err) { console.error(`Erreur lors de la suppression du fichier :`, err);} //ptet caca de faire comme ca jsp
				}
				await GetAvatarFromBuffer(reply, user, avatarFile.mimetype, avatarBuffer);
			}
			user = await getUser(id);
			console.log(user!.avatar);
			return reply.status(200).send({
				statusCode: 200,
				user: user
			});
		} catch (err) {
			request.log.error(err);
			return reply.status(500).send({
				errorMessage: 'Erreur serveur lors de l\'ajout d avatar',
			});
		}
	})

	app.put('/:id/moduser', async(request: FastifyRequest, reply: FastifyReply) => {
		try {
		
			const { id } = request.params as { id: number };
			const body = request.body as Record<string, any>; //c est bon any ?
			console.log(request.body);
			// Renommage explicite pour etre ok avec ts et js
			if ("curr-password" in body) {
				body["currPassword"] = body["curr-password"];
				delete body["curr-password"];
			}

			if ("new-password" in body) {
				body["newPassword"] = body["new-password"];
				delete body["new-password"];
			}

			// if ("twoFaMethod" in body) {

			// }
			
			// let twoFaMethod = 'ok';

			if(body["currPassword"] == '')
				body["currPassword"] = null;
			if(body["newPassword"] == '')
				body["newPassword"] = null;
			
			const result = ModUserInputSchema.safeParse(body);
			if (!result.success) {
				const error = result.error.errors[0];
				return reply.status(400).send({ statusCode: 400, errorMessage: error.message + " in " + error.path });
			}

			//on cree l user avec les donnees a inserer une fois le safeparse effectue
			const dataUserReceived = result.data as ModUserInput; //datatext - a mod pour current et new pass
			const dataUser = await getUserAllInfo(id);
			let dataUserToUpdate = dataUser; //prend par defaut toutes les infos de base de l user
			
			if (dataUserReceived.active2Fa)
				dataUserToUpdate.active2Fa = dataUserReceived.active2Fa;

			// check modification pour username
			if (dataUserReceived.username && dataUser.username != dataUserReceived.username)
				{
					const UserNameCheck = await getUser(null, dataUserReceived.username);
					if (UserNameCheck && UserNameCheck.id != dataUser.id)
						return {statusCode : 409, message : "Username already used.<br><b>" + await (searchNewName(dataUserToUpdate.username)) + "</b> is available."};
					dataUserToUpdate.username = dataUserReceived.username;
				}
				
				// check modification pour email
				if (dataUserReceived.email && dataUser.email != dataUserReceived.email)
					{
						const UserEmailCheck = await getUser(null, dataUserReceived.email);
						if (UserEmailCheck && UserEmailCheck.id != dataUser.id)
							return {statusCode: 409, message : "Email already used"};
						dataUserToUpdate.email = dataUserReceived.email;// console.log("user dans email diff", UserEmailCheck);
					}
					
					// check modification pour password 
					if (dataUserReceived.currPassword || dataUserReceived.newPassword)
					{
						if ((dataUserReceived.currPassword && !dataUserReceived.newPassword)
							|| (!dataUserReceived.currPassword && dataUserReceived.newPassword))
						return {statusCode: 400, message : "Please fill all the case of password to valid changement"};
						if (dataUserReceived.currPassword && dataUserReceived.newPassword)
						{
							const isPassValid = await bcrypt.compare(dataUserReceived.currPassword, dataUser.password);
							if (!isPassValid)
								return {statusCode: 401, message : 'Password does not match.'};
							dataUserToUpdate.password = await bcrypt.hash(dataUserReceived.newPassword, 10);
						}
					}
							
							// une fois infos verifiees, changement des datas puis recup du nouvel user
							console.log("-----------------------", dataUserToUpdate);
					await changeUserData(id, dataUserToUpdate);
			const user = await getUser(id);
			return reply.status(200).send({
				statusCode: 200,
				user: user
			});
		} catch (err) {
			request.log.error(err);
			return reply.status(500).send({
				errorMessage: 'Erreur serveur lors de la modif de settings',
			});
		}
	})

}

