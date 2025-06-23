import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { JwtPayload } from '../types/jwt.types';

/**
 * Génère un token JWT pour un utilisateur donné
 * @returns Token JWT signé valide 7 jours
 */
export function generateJwt(app: FastifyInstance, user: { id: number; username: string }) {
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
		secure: false,
		maxAge: 60 * 60 * 24 * 7,
	});
}

/**
 * Définit le cookie compagnon pour indiquer la présence d'une session active
 * Ce cookie est lisible en JavaScript et permet d'éviter les appels API inutiles
 * Il ne contient aucune information sensible, juste un indicateur booléen.
 */
export function setStatusCookie(reply: FastifyReply) {
	reply.setCookie('auth_status', 'active', {
		path: '/',
		httpOnly: false,
		sameSite: 'lax',
		secure: false,
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
		secure: false,
	});
	
	// le cookie compagnon (statut)
	reply.clearCookie('auth_status', {
		path: '/',
		httpOnly: false,
		sameSite: 'lax',
		secure: false,
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