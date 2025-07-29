import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getUser, getUserFriends, getUserGames, getUserChat, getAvatar, getUserAllInfo } from '../db/user';
import { getAllUsers, getAllUsersInfos, getUsersWithPagination } from '../db/user';
import { UserModel, SafeUserModel, PublicUser, Friends, PaginatedUsers, SortOrder, UserSortField, UserSearchField } from '../shared/types/user.types';
import { insertAvatar } from '../db/usermaj';
import { addUserFriend, updateRelationshipBlocked, updateRelationshipConfirmed } from '../db/friendmaj';
import { Buffer } from 'buffer';
import bcrypt from 'bcrypt';
import { GetAvatarFromBuffer, bufferizeStream } from '../helpers/image.helpers';
import { RegisterInputSchema, RegisterInput, ModUserInput, ModUserInputSchema, FriendsInputSchema, FriendInput } from '../types/zod/auth.zod';
import { searchNewName } from '../helpers/auth.helpers';
import { changeUserData } from '../db/usermaj';
import { promises as fs } from 'fs';
import { DB_CONST } from '../shared/config/constants.config';
import { checkParsing, isParsingError, adaptBodyForPassword } from '../helpers/types.helpers';

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
/*      🔎 - Affiche tous les users avec pagination et paramètres de tri      */
/* -------------------------------------------------------------------------- */
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


/* -------------------------------------------------------------------------- */
/*            🔎 - Affiche des infos detaillees sur un user specifique ami    */
/* -------------------------------------------------------------------------- */
	//:friend : username  
	app.get('/search/:friend', async(request: FastifyRequest, reply: FastifyReply): Promise<PublicUser | void> => {
		const { id } = request.params as { id: number };
		const { friend } = request.params as { friend: string };
		console.log(friend);
		// peut etre pas necessaire en fonction de comment renvoie le front
		const userdataCheck = await checkParsing(FriendsInputSchema, {friend: friend});
		if (isParsingError(userdataCheck))
			return reply.status(400).send(userdataCheck);
		let data = userdataCheck as FriendInput;
		console.log(data);
		// TODO : rechercher pour check si user demande est un friend ou pas 
		const user: PublicUser = await getUser(null, friend);
		if (!user)
			return reply.code(404).send({ Error : 'User not found'});
		return reply.status(200).send(user);
	})

/* -------------------------------------------------------------------------- */
/*            🔎 - Affiche des infos detaillees sur un user specifique        */
/* -------------------------------------------------------------------------- */
	// (sans password)
	// :id = id de l utilisateur dans la db 

	app.get('/:id', async (request: FastifyRequest, reply: FastifyReply): Promise<SafeUserModel | void> => {
		const { id } = request.params as { id: number };
		const user: SafeUserModel = await getUser(id);
		if (!user)
			return reply.code(404).send({ Error : 'User not found'});
		return user;
	})

/* -------------------------------------------------------------------------- */
/*           🔎💛 - Affiche des infos sir les friends de l utilisateur        */
/* -------------------------------------------------------------------------- */
	// :id = id de l utilisateur dans la db dont on cherche les amis

	app.get('/:id/friends', async(request: FastifyRequest, reply: FastifyReply): Promise<PublicUser[] | void> => {
		const { id } = request.params as { id: number };
		const friends: PublicUser[] = await getUserFriends(id);
		if (!friends)
			return reply.code(404).send({ Error : 'User not found'});
		return friends;
	})

/* -------------------------------------------------------------------------- */
/*                     ⚙️💛 - Gere les actions entre amis                     */
/* -------------------------------------------------------------------------- */
	// :id = id de l utilisateur dans la db dont on cherche les amis
	// :action = pending (demande d ajout), blocked(pour bloauer klk1), accepted (pour valider une demande) 
	// attend dans la requete le nom de l ami recherche -> a adapter en fonction des besoins	 
	// TODO : a readapter en fonction du front

	app.get('/:id/friends/:action', async(request: FastifyRequest, reply: FastifyReply): Promise<PublicUser | void> => {
		const { id } = request.params as { id: number };
		const { action } = request.params as { action: string };

		// peut etre pas necessaire en fonction de comment renvoie le front
		const userdataCheck = await checkParsing(FriendsInputSchema, request.body);
		if (isParsingError(userdataCheck))
			return reply.status(400).send(userdataCheck);
		let data = userdataCheck as FriendInput;
		
		const friends = getUserFriends(id);
		const friend: PublicUser = await getUser(null, data.friend);
		if (!friend)
			return reply.code(404).send({ Error : 'User not found'});
		if (action === DB_CONST.FRIENDS.STATUS.PENDING) {	
			if (friend.id in friends)
				return reply.code(404).send({ Error : 'Already friend'});
			await addUserFriend(friend.id, id);
			return reply.code(200).send({ Message : 'Ask to be friend confirmed'});
		}
		if (action === DB_CONST.FRIENDS.STATUS.BLOCKED) {
			if (friend.id in friends)
				await updateRelationshipBlocked(friend.id, id);
			else
				return reply.code(404).send({ Error : 'not your friend'});
			return reply.code(200).send({ Message : 'friend blocked'});			
		}
		if (action === DB_CONST.FRIENDS.STATUS.ACCEPTED) {
			if (friend.id in friends)
				await updateRelationshipConfirmed(friend.id, id);
			else
				return reply.code(404).send({ Error : 'not asked to be friend'});
			return reply.code(200).send({ Message : 'friend successfully added'});			
		}
	})

/* -------------------------------------------------------------------------- */
/*                   🕹️ - Recupere les donnees de jeu d un user               */
/* -------------------------------------------------------------------------- */
	// :id = id de l utilisateur dans la db dont on cherche les amis

	app.get('/:id/games', async(request: FastifyRequest, reply: FastifyReply) => {
		const { id } = request.params as { id: number };
		const games = await getUserGames(id);
		// console.log("id = ", id);
		if (!games)
			return reply.code(404).send({ Error : 'User not found'});
		return games;
	})

/* -------------------------------------------------------------------------- */
/*             💬 - Recupere l'historique de tchat de 2 utilisateurs          */
/* -------------------------------------------------------------------------- */
	// :id1 et :id2 = id des utilisateurs dans la db dont on cherche les messages envoyes
	// renvoyes par la db ranges chronologiquement

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


/* -------------------------------------------------------------------------- */
/*                    ⚙️📸 - modifie l avatar de l utilisateur                */
/* -------------------------------------------------------------------------- */
	// :id = id de l utilisateur dans la db dont on cherche les amis

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
				if (user.avatar != DB_CONST.USER.DEFAULT_AVATAR)
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

/* -------------------------------------------------------------------------- */
/*          ⚙️ SETTING - modifie les infos persos de l utilisateur            */
/* -------------------------------------------------------------------------- */
	// :id = id de l utilisateur dans la db dont on cherche les amis

	app.put('/:id/moduser', async(request: FastifyRequest, reply: FastifyReply) => {
		try {
		
			const { id } = request.params as { id: number };
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
			// console.log("-----------------------", dataUserToUpdate);
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

