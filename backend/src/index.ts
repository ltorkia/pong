import Fastify from 'fastify';
import fastifyHelmet from '@fastify/helmet';
import fastifyCookie from '@fastify/cookie';
import fastifyJwt from '@fastify/jwt';
import websocket from '@fastify/websocket';
import fastifyMultipart from '@fastify/multipart';
import { IMAGE_CONST } from './shared/config/constants.config';
// import { SocketStream } from '@fastify/websocket';

// Database
import { initDb } from './db/index.db';

// Routes importées
import { apiRoutes } from './routes/api.routes';

const PORT = 3001;

async function start() {

	// Instanciation de Fastify
	const app = Fastify({ 
		logger: true,
		ignoreTrailingSlash: true,		// ignore les / à la fin des urls
		bodyLimit: 10 * 1024 * 1024,	// 10 Mo pour toutes les requêtes
		connectionTimeout: 120000,		// 2 minutes
		keepAliveTimeout: 120000		// 2 minutes
	});

	// Sécurise
	// await app.register(fastifyHelmet);

	// Enregistre le plugin fastify-cookie pour gérer les cookies HTTP
	// dans les requêtes et réponses
	app.register(fastifyCookie);

	// pour uploader des avatars
	app.register(fastifyMultipart, {
		limits: {
			fileSize: IMAGE_CONST.MAX_SIZE,	// 5 Mo par fichier
			files: 1,						// 1 fichier max
			fieldNameSize: 100,				// Taille max du nom de champ
			fieldSize: 100,					// Taille max de la valeur de champ
			fields: 10,						// Nombre max de champs
			headerPairs: 2000				// Nombre max de paires headers
		}
	});

	// Enregistrement du plugin JWT
	const jwtSecret = process.env.JWT_SECRET;
	if (!jwtSecret) {
		throw new Error('JWT_SECRET must be defined in .env file');
	}
	app.register(fastifyJwt, {
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
		await app.register(apiRoutes, { prefix: '/api' });
		console.log('Routes registered');
	} catch (err) {
		console.error('Register routes error:', err);
		process.exit(1);
	}


	// Lancement du serveur
	try {
		await app.listen({ port: PORT, host: '0.0.0.0' });
		app.log.info(`Server started on http://0.0.0.0:${PORT}`);
	} catch (err) {
		app.log.error(err);
		process.exit(1);
	}
}

start().catch((err) => {
	console.error('Start error:', err);
	process.exit(1);
});