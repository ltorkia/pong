import Fastify from 'fastify';
import fastifyHelmet from '@fastify/helmet';

// Database
import { initDb } from './db';

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

	// Initialisation de la db
	try {
		const db = await initDb();
		console.log('Database initialized');
		await db.close();
	} catch (err) {
		console.error('Database init error:', err);
		process.exit(1);
	}

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