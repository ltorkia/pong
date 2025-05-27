import { FastifyInstance } from 'fastify';

export async function apiRoutes(app: FastifyInstance) {
	app.get('/api', async () => {
		return {
			status: 'OK',
			message: 'Transcendance Backend is running!',
			timestamp: new Date().toISOString()
		};
	});
}
