import { FastifyInstance } from 'fastify';

export async function authRoutes(app: FastifyInstance) {
	app.post('/api/login', async (request, reply) => {
		return { message: 'Login à implémenter' };
	});

	app.post('/api/register', async (request, reply) => {
		return { message: 'Register à implémenter' };
	});
}
