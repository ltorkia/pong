import Fastify from 'fastify';
import fastifyHelmet from '@fastify/helmet';

// Database
import {initDb} from './db';

// Routes importées
import { apiRoutes } from './routes/api.routes';
import { healthRoutes } from './routes/health.routes';
import { authRoutes } from './routes/auth.routes';
import { usersRoutes } from './routes/users.routes';
import { testsRoutes } from './routes/tests.routes';

const PORT = 3001;

async function start() {
  const fastify = Fastify({ logger: true });

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

  // Enregistrement des routes
  await fastify.register(apiRoutes);
  await fastify.register(healthRoutes);
  await fastify.register(authRoutes);
  await fastify.register(usersRoutes);
  await fastify.register(testsRoutes);

  // Lancement du serveur
  fastify.listen({ port: PORT, host: '0.0.0.0' }, (err, address) => {
    if (err) {
      fastify.log.error(err);
      process.exit(1);
    }
    fastify.log.info(`Serveur démarré sur ${address}`);
  });
}

start();
