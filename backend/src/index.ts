import Fastify from 'fastify';
import fastifyHelmet from '@fastify/helmet';
import websocket from '@fastify/websocket';
import { FastifyRequest } from 'fastify';
import fastifyJwt from '@fastify/jwt';
import fastifyCookie from '@fastify/cookie';
// import { SocketStream } from '@fastify/websocket';
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
  const fastify = Fastify({ 
    logger: true,
    ignoreTrailingSlash: true // ignore les / à la fin des urls
  });


//insertion jwt 
  
  const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';

  fastify.register(fastifyCookie);
  fastify.register(fastifyJwt, {
    secret: JWT_SECRET,
    cookie: {
      cookieName: 'auth_token',
      signed: false,
    }
  });


// Sécurise
  await fastify.register(fastifyHelmet);
// await fastify.register(fastifyBcrypt, {
//   saltWorkFactor: 12,  // par exemple ??????????????????
// });

  // Initialisation de la base de données
  try {
    const db = await initDb();
    console.log('Database initialized');
    await db.close();
  } catch (err) {
    console.error('Erreur lors de l\'initialisation de la base de données:', err);
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
fastify.listen({ port: PORT, host: '0.0.0.0' }, (err, address) => {
	if (err) {
	fastify.log.error(err);
	process.exit(1);
	}
	fastify.log.info(`Serveur démarré sur ${address}`);
});
}

start();