// import { FastifyInstance } from 'fastify';
// import websocket from '@fastify/websocket';

// export async function gameRoutes(app: FastifyInstance) {
//     await app.register(async function (fastify: FastifyInstance) {
//         await fastify.register(require('@fastify/websocket'));
    
//         fastify.get('/ws/multiplayer', { websocket: true }, (connection: any, request: any) => {
//         console.log("WebSocket connection established!");
//         console.log(connection);
//         connection.socket.on('message', (message: Buffer) => {
//             console.log(message);
//             const messageText = message.toString();
//             console.log('Received message:', messageText);
//             connection.socket.send(`Echo: ${messageText}`);
//         });
      
//         connection.socket.on('close', () => {
//             console.log('Connection closed');
//         });
      
//         connection.socket.send('Welcome to multiplayer!');
//         });
//     });
// }


import { FastifyInstance } from 'fastify';
import websocket from '@fastify/websocket';

export async function gameRoutes(app: FastifyInstance) {
  await app.register(require('@fastify/websocket'));
  
  app.get('/ws/multiplayer', { websocket: true }, (connection: any, req: any) => {
    console.log("WebSocket connection established!");
    
    console.log(Object.keys(connection));
    console.log(connection);
    // In newer versions, connection might be the WebSocket directly
    const ws = connection.socket || connection;
    
    ws.on('message', (message: any) => {
      const messageText = message.toString();
      console.log('Received message:', messageText);
      ws.send(`Echo: ${messageText}`);
    });
    
    ws.on('close', () => {
      console.log('Connection closed');
    });
    
    ws.send('Welcome to multiplayer!');
  });
}