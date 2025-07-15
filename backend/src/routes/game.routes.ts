import { FastifyInstance } from 'fastify';
import websocket from '@fastify/websocket';
import { PositionObj, GameData } from '../shared/types/game.types'

export async function gameRoutes(app: FastifyInstance) {
  await app.register(require('@fastify/websocket'));

  app.get('/ws/multiplayer', { websocket: true }, (connection: any, req: any) => {
    connection.on('message', (message: any) => {
      const player: PositionObj = JSON.parse(message); 
    });

    connection.on('close', () => {
      console.log('Connection closed');
    });

    connection.send('Welcome to multiplayer!');
  });
}