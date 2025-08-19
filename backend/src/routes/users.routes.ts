import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { promises as fs } from 'fs';
import { Buffer } from 'buffer';
import bcrypt from 'bcrypt';
import { JwtPayload } from '../types/jwt.types';
import { DB_CONST } from '../shared/config/constants.config';

import { getUser, getUserGames, getUserAllInfo } from '../db/user';
import { getAllUsersInfos } from '../db/user';
import { UserModel, SafeUserModel } from '../shared/types/user.types';

import { checkParsing, isParsingError, adaptBodyForPassword } from '../helpers/types.helpers';
import { GetAvatarFromBuffer, bufferizeStream } from '../helpers/image.helpers';
import { ModUserInput, ModUserInputSchema } from '../types/zod/auth.zod';
import { searchNewName } from '../helpers/auth.helpers';
import { changeUserData } from '../db/usermaj';

/* ======================== USERS ROUTES ======================== */

export async function usersRoutes(app: FastifyInstance) {

	/* -------------------------------------------------------------------------- */
	/*            🔎 - Affiche tous les users avec infos non sensible             */
	/* -------------------------------------------------------------------------- */

	app.get('/', async (request: FastifyRequest, reply: FastifyReply): Promise<SafeUserModel[] | void> => {
		// const users: UserBasic[] = await getAllUsers();
		const users: SafeUserModel[] = await getAllUsersInfos();
		return users;
	})

	/* -------------------------------------------------------------------------- */
	/*            🔎 - Affiche des infos detaillees sur un user specifique        */
	/* -------------------------------------------------------------------------- */
	// (sans password)
	// :id = id de l utilisateur dans la db 

	app.get('/:id', async (request: FastifyRequest, reply: FastifyReply): Promise<SafeUserModel | void> => {
		const { id } = request.params as { id: number };
		if (isNaN(id))
			return reply.status(403).send({ errorMessage: 'Forbidden' });
		const user: SafeUserModel = await getUser(id);
		if (!user)
			return reply.code(404).send({ errorMessage: 'User not found'});
		return user;
	})

	/* -------------------------------------------------------------------------- */
	/*                   🕹️ - Recupere les donnees de jeu d un user               */
	/* -------------------------------------------------------------------------- */
	// :id = id de l utilisateur dans la db dont on cherche les amis

	app.get('/:id/games', async(request: FastifyRequest, reply: FastifyReply) => {
		const { id } = request.params as { id: number };
		if (isNaN(id))
			return reply.status(403).send({ errorMessage: 'Forbidden' });
		const games = await getUserGames(id);
		if (!games)
			return reply.code(404).send({ errorMessage: 'User not found'});
		return games;
	})

	// /* -------------------------------------------------------------------------- */
	// /*             💬 - Recupere l'historique de tchat de 2 utilisateurs          */
	// /* -------------------------------------------------------------------------- */
	// // :id1 et :id2 = id des utilisateurs dans la db dont on cherche les messages envoyes
	// // renvoyes par la db ranges chronologiquement

	// app.get('/:id1/:id2/chat', async(request: FastifyRequest, reply: FastifyReply) => {
	// 	const { id1 } = request.params as { id1: number };
	// 	const jwtUser = request.user as JwtPayload;
	// 	if (id1 !== jwtUser.id)
	// 		return reply.status(403).send({ errorMessage: 'Forbidden' });
	// 	const { id2 } = request.params as { id2: number };
	// 	const chat = await getUserChat(id1, id2);
	// 	if (!chat)
	// 		return reply.code(404).send({ errorMessage: 'User not found'});
	// 	return chat;
	// })


	/* -------------------------------------------------------------------------- */
	/*                    ⚙️📸 - modifie l avatar de l utilisateur                */
	/* -------------------------------------------------------------------------- */
	// :id = id de l utilisateur dans la db dont on cherche les amis

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
				if (element.type === 'file' && element.fieldname === 'avatar' && element.filename != '') {
					avatarFile = element;
					avatarBuffer = await bufferizeStream(element.file);
				}
			}
			
			let user: UserModel | null = null;
			const { id } = request.params as { id: number };
			const jwtUser = request.user as JwtPayload;
			if (id != jwtUser.id)
				return reply.status(403).send({ errorMessage: 'Forbidden' });
			if (avatarFile && avatarBuffer)
			{
				user = await getUser(id);
				if (user.avatar != DB_CONST.USER.DEFAULT_AVATAR)
				{
					try {await fs.unlink(`./uploads/avatars/${user.avatar}`);}
					catch (err) { console.error(`Erreur lors de la suppression du fichier :`, err);} //ptet caca de faire comme ca jsp
				}
				await GetAvatarFromBuffer(reply, user, avatarFile.mimetype, avatarBuffer);
			}
			user = await getUser(id);
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

	/* -------------------------------------------------------------------------- */
	/*          ⚙️ SETTING - modifie les infos persos de l utilisateur            */
	/* -------------------------------------------------------------------------- */
	// :id = id de l utilisateur dans la db dont on cherche les amis

	app.put('/:id/moduser', async(request: FastifyRequest, reply: FastifyReply) => {
		try {
		
			const { id } = request.params as { id: number };
			const jwtUser = request.user as JwtPayload;
			if (id != jwtUser.id)
				return reply.status(403).send({ errorMessage: 'Forbidden' });
			const body = adaptBodyForPassword(request); //renomme les elements lies au password en CamelCase

			const userdataCheck = await checkParsing(ModUserInputSchema, request.body);
			if (isParsingError(userdataCheck))
				return reply.status(400).send(userdataCheck);
			let dataUserReceived = userdataCheck as ModUserInput;
			
			const dataUser = await getUserAllInfo(id);
			let dataUserToUpdate = dataUser; //prend par defaut toutes les infos de base de l user
			
			if (dataUserReceived.twoFaMethod)
				dataUserToUpdate.active2Fa = dataUserReceived.twoFaMethod;

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
				dataUserToUpdate.email = dataUserReceived.email;
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

