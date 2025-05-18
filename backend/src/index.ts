import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import jwt from '@fastify/jwt';
import staticFiles from '@fastify/static';
import path from 'path';
import dotenv from 'dotenv';
import { apiRoutes } from './routes/api.routes';

// Load environment variables
dotenv.config();

// Create Fastify instance
const server: FastifyInstance = Fastify({
	logger: true
});

// Register plugins
server.register(cors, {
	origin: process.env.FRONTEND_URL || 'http://localhost:3000',
	credentials: true
});

server.register(jwt, {
	secret: process.env.JWT_SECRET || 'default_secret_change_me'
});

server.register(websocket);

// Register API routes
server.register(apiRoutes, { prefix: '/api' });

// Serve static files if in production
if (process.env.NODE_ENV === 'production') {
	server.register(staticFiles, {
		root: path.join(__dirname, '../../frontend/dist'),
		prefix: '/'
	});

	// Catch-all route for SPA
	server.get('*', (req, reply) => {
		reply.sendFile('index.html');
	});
}

// Define port and host
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 8080;
const HOST = process.env.HOST || '0.0.0.0';

// Start the server
const start = async () => {
	try {
		await server.listen({ port: PORT, host: HOST });
		console.log(`Server is running on http://${HOST}:${PORT}`);
	} catch (err) {
		server.log.error(err);
		process.exit(1);
	}
};

start();