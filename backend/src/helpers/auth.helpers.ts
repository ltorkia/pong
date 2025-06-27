import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { JwtPayload } from '../types/jwt.types';
import { UserForDashboard, PublicUser } from '../types/user.types';

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
	reply.setCookie('auth_token', token, {
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
	reply.setCookie('auth-status', 'active', {
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
	reply.clearCookie('auth_token', {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: true,
	});
	
	// le cookie compagnon (statut)
	reply.clearCookie('auth-status', {
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
export function setPublicUserInfos(user: UserForDashboard): PublicUser {
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