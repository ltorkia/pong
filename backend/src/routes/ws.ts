import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
// import fastifyWebsocket from '@fastify/websocket';
import jwt from 'jsonwebtoken';

// const connectedUsers[]

// export function broadcast(message: string | null = null, userId: string, connectedUsers : Map<string, WebSocket>)
// {
//   const payload = JSON.stringify(message);
//   for (const ws of connectedUsers.values()) {
//     ws.send(payload);
//   }    
// }

// export async function websocketRoutes(app: FastifyInstance, connectedUsers: Map<string, WebSocket>) {

//     // ⬇️ Déclare une route WebSocket
//     app.get('/ws', { websocket: true }, (connection : any, request : any) => {
//         const ws = connection.socket;
//         let userId: string;
//     const token = request.query.token as string;
//         // ⬇️ Écoute les messages entrants
//         ws.on('message', (message : string) => {
//             try {
//                 const data = JSON.parse(message.toString());
//                 const payload = jwt.verify(token, process.env.JWT_SECRET!) as { sub: string };
//                 userId = payload.sub;
//                 // ⬇️ Première action attendue : identification
//                 if (data.type === 'online') {
//                     userId = data.userId;
//                     connectedUsers.set(userId, ws);

//                     // ⬇️ Préviens les autres
//                     broadcast( 'online', userId, connectedUsers);
//                 }
//                 } catch (err) {
//                     console.error('Message JSON invalide', err);
//                 }
//         });

//         // ⬇️ Lorsqu’un utilisateur ferme sa connexion
//         ws.on('close', () => {
//             if (userId) {
//                 connectedUsers.delete(userId);
//                 broadcast('offline', userId, connectedUsers);
//             }
//         });
//     });
// }