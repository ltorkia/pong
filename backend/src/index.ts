import Fastify from 'fastify';
import fastifyHelmet from '@fastify/helmet';

// Database
import {initDb} from './db';

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

	// Initialisation de la base de données
	try {
		const db = await initDb();
		console.log('Database initialized');
		await db.close();
	} catch (err) {
		console.error('Erreur lors de l\'initialisation de la base de données:', err);
		process.exit(1);
	}

	// Enregistrement des routes avec gestion d'erreur
	try {
		await fastify.register(apiRoutes, { prefix: '/api' });
		console.log('Routes enregistrées avec succès');
	} catch (err) {
		console.error('Erreur lors de l\'enregistrement des routes:', err);
		process.exit(1);
	}

	// Lancement du serveur
	try {
		await fastify.listen({ port: PORT, host: '0.0.0.0' });
		fastify.log.info(`Serveur démarré sur http://0.0.0.0:${PORT}`);
	} catch (err) {
		fastify.log.error(err);
		process.exit(1);
	}
}

start().catch((err) => {
	console.error('Erreur lors du démarrage:', err);
	process.exit(1);
});