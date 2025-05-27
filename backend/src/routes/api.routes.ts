import { FastifyInstance } from 'fastify';

export async function apiRoutes(app: FastifyInstance) {
	app.get('/api', async () => {
		return {
			status: 'OK',
			message: 'ici on est sur le back',
			timestamp: new Date().toISOString()
		};
	});
}
