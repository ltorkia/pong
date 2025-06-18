import Fastify from 'fastify';
import fastifyHelmet from '@fastify/helmet';
import fastifyJwt from '@fastify/jwt';
import fastifyCookie from '@fastify/cookie';
import websocket from '@fastify/websocket';
// import { SocketStream } from '@fastify/websocket';

// Database
import { initDb } from './db/index.db';

// Routes importées
import { apiRoutes } from './routes/api.routes';

const PORT = 3001;

async function start() {
	const fastify = Fastify({ 
		logger: true,
		ignoreTrailingSlash: true // ignore les / à la fin des urls
	});

	// Sécurise
	await fastify.register(fastifyHelmet);

	// await fastify.register(fastifyBcrypt, {
	//   saltWorkFactor: 12,  // par exemple ??????????????????
	// });

	fastify.register(fastifyCookie);

	const jwtSecret = process.env.JWT_SECRET;
	if (!jwtSecret) {
		throw new Error('JWT_SECRET must be defined in .env file');
	}
	
	fastify.register(fastifyJwt, {
		secret: jwtSecret,
		cookie: {
			cookieName: 'auth_token',
			signed: false
		}
	});

	// Initialisation de la db
	try {
		const db = await initDb();
		console.log('Database initialized');
		await db.close();
	} catch (err) {
		console.error('Database init error:', err);
		process.exit(1);
	}

	// // Register WebSocket plugin
	//   fastify.get('/ws', { websocket: true }, (connection: SocketStream, req: SocketStream ) => {
	//     console.log('✅ Client connecté via WebSocket');

	//     connection.socket.on('message', (message : string) => {
	//       console.log('📨 Message reçu :', message.toString());

	//       // Réponse au client
	//       connection.socket.send(`Echo : ${message}`);
	//     });
	// });

	// Enregistrement des routes
	try {
		await fastify.register(apiRoutes, { prefix: '/api' });
		console.log('Routes registered');
	} catch (err) {
		console.error('Register routes error:', err);
		process.exit(1);
	}


	// Lancement du serveur
	try {
		await fastify.listen({ port: PORT, host: '0.0.0.0' });
		fastify.log.info(`Server started on http://0.0.0.0:${PORT}`);
	} catch (err) {
		fastify.log.error(err);
		process.exit(1);
	}
}

start().catch((err) => {
	console.error('Start error:', err);
	process.exit(1);
});