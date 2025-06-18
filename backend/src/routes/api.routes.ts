import { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import { healthRoutes } from './health.routes';
import { authRoutes } from './auth.routes';
import { usersRoutes } from './users.routes';
import { testsRoutes } from './tests.routes';
import { apiMe } from './api.me';
import { JwtPayload } from '../types/jwt.types';

export async function apiRoutes(app: FastifyInstance) {

	// Hook global pour vérifier JWT et injecter l'utilisateur sur les routes protégées
	app.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
		// Fastify enlève le préfixe dans request.url
		// donc /api/auth/login devient /auth/login
		// et /api/me devient /me
		
		// Routes publiques qu'on peut visiter pas logged
		const publicRoutes = [
			'/auth/login', 
			'/auth/register', 
			'/health',
			'/'
		];

		// Vérifier si c'est une route publique
		const path = request.url;
		const isPublicRoute = publicRoutes.some(route => path.startsWith(route));
		
		// Si oui pas de check JWT
		if (isPublicRoute) {
			return;
		}

		// Route protégée: on check JWT et on injecte l'utilisateur
		try {
			const decoded = await request.jwtVerify<JwtPayload>();
			if (!decoded || !decoded.id) {
				return reply.status(401).send({ 
					error: 'Unauthorized',
					message: 'Token JWT invalide - payload manquant'
				});
			}
			
			// On stocke l'utilisateur dans request
			// request.user = decoded;
			
		} catch (err) {
			return reply.status(401).send({ 
				error: 'Unauthorized',
				message: 'Token JWT manquant ou invalide'
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
	await app.register(testsRoutes, { prefix: '/tests' });
	await app.register(apiMe, { prefix: '/me' });
}