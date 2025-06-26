import { FastifyInstance } from 'fastify';

export async function healthRoutes(app: FastifyInstance) {
	app.get('/', async () => {
		return {
			status: 'OK',
			message: 'Transcendence Backend is healthy!',
			timestamp: new Date().toISOString()
		};
	});
}
