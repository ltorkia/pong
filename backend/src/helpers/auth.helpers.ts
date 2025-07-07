import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { JwtPayload } from '../types/jwt.types';
import { getUser } from '../db/user';
import { UserModel, PublicUser } from '../shared/types/user.types'; // en rouge car dossier local 'shared' != dossier conteneur
import { COOKIES_CONST } from '../shared/config/constants.config'; // en rouge car dossier local 'shared' != dossier conteneur
// import { majLastlog } from '../db/user';

/*propose un nouveau nom pour register*/
export async function searchNewName(username: string) {
	const now = Date.now();
	const digits = now.toString().split('');
	const len = digits.length;
	console.log( now + " " + digits + " " + len);
	
	for (let i = 0; i < len; i++)
	{
		if (i === 0)
			username += "_";
		username += digits[i];
		if (!await getUser(null, username))
			break ;
	}
	return username;
} 

/**
 * Génère un token JWT pour un utilisateur donné
 * @returns Token JWT signé valide 7 jours
 */
export function generateJwt(app: FastifyInstance, user: JwtPayload) {
	return app.jwt.sign(user, { expiresIn: '7d' });
}

/**
 * Définit le cookie principal d'authentification (sécurisé, HttpOnly)
 * Ce cookie contient le vrai token JWT et n'est pas accessible en JavaScript
 * Personne ne peut s'emparer de la session d'un utilisateur.
 */
export function setAuthCookie(reply: FastifyReply, token: string) {
	reply.setCookie(COOKIES_CONST.AUTH.TOKEN_KEY, token, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: true,
		maxAge: 60 * 60 * 24 * 7,
	});
}

/**
 * Définit le cookie compagnon pour indiquer la présence d'une session active
 * Ce cookie est lisible en JavaScript et permet d'éviter les appels API inutiles
 * Il ne contient aucune information sensible, juste un indicateur booléen.
 */
export function setStatusCookie(reply: FastifyReply) {
	reply.setCookie(COOKIES_CONST.AUTH.STATUS_KEY, COOKIES_CONST.AUTH.STATUS_VALUE, {
		path: '/',
		httpOnly: false,
		sameSite: 'lax',
		secure: true,
		maxAge: 60 * 60 * 24 * 7, // 7 jours même durée que le cookie principal
	});
}

/**
 * Supprime les cookies d'authentification lors de la déconnexion
 * Nettoie à la fois le cookie principal et le cookie compagnon
 */
export function clearAuthCookies(reply: FastifyReply) {
	// le cookie principal (token JWT)
	reply.clearCookie(COOKIES_CONST.AUTH.TOKEN_KEY, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: true,
	});
	
	// le cookie compagnon (statut)
	reply.clearCookie(COOKIES_CONST.AUTH.STATUS_KEY, {
		path: '/',
		httpOnly: false,
		sameSite: 'lax',
		secure: true,
	});
}

/**
 * Vérification d'authentification :
 * check si l'utilisateur est connecté et autorisé à accéder à la route
 */
export function requireAuth(request: FastifyRequest, reply: FastifyReply): JwtPayload | undefined {
	const user = request.user as JwtPayload | undefined;
	if (!user || !user.id) {
		reply.status(401).send({ error: 'Unauthorized' });
		return undefined;
	}
	return user;
}

/**
 * Définit les propriétés user safe à envoyer au front après login réussi
 */
export function setPublicUserInfos(user: UserModel): PublicUser {
	return {
		id: user.id,
		username: user.username,
		avatar: user.avatar,
		game_played: user.game_played,
		game_win: user.game_win,
		game_loose: user.game_loose,
		time_played: user.time_played,
		n_friends: user.n_friends
	};
}