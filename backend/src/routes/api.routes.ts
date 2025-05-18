import { FastifyInstance } from 'fastify';
import { pongController, setupGameWebSocket } from '../controllers/pong.controller';

export async function apiRoutes(fastify: FastifyInstance) {
	// Root API endpoint
	fastify.get('/', async () => {
		return { message: 'API root is alive!' };
	});
		
	// Health check
	fastify.get('/health', async () => {
		return { status: 'ok' };
	});

	// Match routes
	fastify.get('/matches', pongController.getAllMatches);
	fastify.post('/matches', pongController.createMatch);

	// Tournament routes
	fastify.get('/tournaments', pongController.getActiveTournaments);
	fastify.post('/tournaments', pongController.createTournament);

	// Setup WebSocket for real-time game
	setupGameWebSocket(fastify);
}