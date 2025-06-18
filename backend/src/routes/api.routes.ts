import { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import { healthRoutes } from './health.routes';
import { authRoutes } from './auth.routes';
import { usersRoutes } from './users.routes';
import { testsRoutes } from './tests.routes';
import { apiMe } from './api.me';

export async function apiRoutes(app: FastifyInstance) {

	// Hook global pour vérifier JWT sauf sur les routes publiques
	// (va s'ajouter automatiquement a chaque requete get / post)
	app.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
		const publicRoutes = ['/api/auth/login', '/api/auth/register'];

		// On récupère le chemin de la route appelée, exemple "/api/auth/login"
		const path = request.routerPath || request.raw.url || '';

		// Si la route est publique, on skip la vérification
		if (publicRoutes.includes(path)) {
			return;
		}

		// Sinon on vérifie le token
		try {
			await request.jwtVerify();
		} catch {
			return reply.status(401).send({ error: 'Unauthorized' });
		}
	});

	app.get('/', async () => {
		return {
			status: 'OK',
			message: 'ici on est sur le back',
			timestamp: new Date().toISOString()
		};
	});

	await app.register(healthRoutes, { prefix: '/health' });
	await app.register(authRoutes, { prefix: '/auth' });
	await app.register(usersRoutes, { prefix: '/users' });
	await app.register(testsRoutes, { prefix: '/tests' });
	await app.register(apiMe, { prefix: '/me' });
}