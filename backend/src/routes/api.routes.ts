import { FastifyInstance } from 'fastify';
import { healthRoutes } from './health.routes';
import { authRoutes } from './auth.routes';
import { usersRoutes } from './users.routes';
import { testsRoutes } from './tests.routes';

export async function apiRoutes(app: FastifyInstance) {
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
}