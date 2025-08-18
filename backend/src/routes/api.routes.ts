import { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import { JwtPayload } from '../types/user.types';
import { clearAuthCookies } from '../helpers/auth.helpers';

// ROUTES
import { healthRoutes } from './health.routes';
import { authRoutes } from './auth.routes';
import { usersRoutes } from './users.routes';
import { notificationsRoutes } from './notifications.routes';
import { testsRoutes } from './tests.routes';
import { apiMe } from './api.me';
import { sessionRoutes } from './session.routes';
import { gameRoutes } from './game.routes';
import { tournamentRoutes } from './tournament.routes';
import { webSocketRoutes } from './websocket.routes';
import { friendsRoutes } from './friends.routes';
import { searchRoutes } from './search.routes';

// DB
import { getUser } from '../db/user';

export async function apiRoutes(app: FastifyInstance) {

	// Hook global pour vérifier JWT et injecter l'utilisateur sur les routes protégées
	app.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
		const publicRoutes = [
			'/api/auth/login',
			'/api/auth/register',
			'/api/auth/google',
			'/api/auth/google/callback',
			'/api/auth/2FAsend/email',
			'/api/auth/2FAsend/qrcode',
			'/api/auth/2FAreceive/email',
			'/api/auth/2FAreceive/qrcode',
			'/api/health',
		];

		// Vérifier si c'est une route publique
		// (on extrait les query potentielles apres l'url comme pour Google callback)
		const path = request.url.split('?')[0];
		const isPublicRoute = publicRoutes.some(route => route === path);
		
		// Si oui pas de check JWT
		if (isPublicRoute) {
			return;
		}

		// Route protégée: on check JWT et on injecte l'utilisateur
		try {
			const decoded = await request.jwtVerify<JwtPayload>();

			// On check que l'utilisateur existe bien en bdd
			// Si non on clear les cookies d'authentification
			const user = await getUser(decoded.id);
			if (!user || user.isDesactivated) {
				clearAuthCookies(reply);
				return reply.status(401).send({
					error: 'Unauthorized',
					message: 'Utilisateur inexistant ou supprimé',
				});
			}

			// Données user décodées du JWT (ici l'id du token)
			// injectées dans l'objet 'request' en param de chaque requete.
			// Ca permet aux routes d’accéder facilement à l’utilisateur authentifié
			// via request.user sans devoir redécoder le token à chaque fois.
			request.user = decoded;

		} catch (err) {
			clearAuthCookies(reply);
			return reply.status(401).send({
				error: 'Unauthorized',
				message: 'Token JWT manquant ou invalide',
			});
		}
	});

	// Route racine
	app.get('/', async () => {
		return {
			status: 'OK',
			message: 'ici on est sur le back',
			timestamp: new Date().toISOString()
		};
	});

	// Enregistrement des routes
	await app.register(healthRoutes, { prefix: '/health' });
	await app.register(authRoutes, { prefix: '/auth' });
    await app.register(usersRoutes, { prefix: '/users' });
	await app.register(notificationsRoutes, { prefix: '/notifs' });
    await app.register(testsRoutes, { prefix: '/tests' });
    await app.register(apiMe, { prefix: '/me' });
    await app.register(sessionRoutes, { prefix: '/validate-session' });
    await app.register(webSocketRoutes);
    await app.register(gameRoutes);
	await app.register(tournamentRoutes, { prefix: '/game'});
	await app.register(friendsRoutes, { prefix: '/friends' });
	await app.register(searchRoutes, { prefix: '/search' });
    console.log(app.printRoutes());
}
