import Fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';

// Routes importées
import { apiRoutes } from './routes/api.routes';
import { healthRoutes } from './routes/health.routes';
import { authRoutes } from './routes/auth.routes';
import { usersRoutes } from './routes/users.routes';

const PORT = 3001;

async function start() {
  const fastify = Fastify({ logger: true });

  await fastify.register(fastifyHelmet);
  await fastify.register(fastifyCors, { origin: '*', methods: ['GET', 'POST'] });

  await fastify.register(apiRoutes);
  await fastify.register(healthRoutes);
  await fastify.register(authRoutes);
  await fastify.register(usersRoutes);

  fastify.listen(PORT, '0.0.0.0', () => {
    fastify.log.info(`Serveur démarré sur le port ${PORT}`);
  });
}

start().catch(err => {
  console.error(err);
  process.exit(1);
});
