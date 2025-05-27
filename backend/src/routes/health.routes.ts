import { FastifyInstance } from 'fastify';

export async function healthRoutes(app: FastifyInstance) {
	app.get('/api/health', async () => {
		return {
			status: 'OK',
			message: 'Transcendance Backend is healthy!',
			timestamp: new Date().toISOString()
		};
	});
}
