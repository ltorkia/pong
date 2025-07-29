import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fastifyWebsocket from '@fastify/websocket';

export async function usersRoutes(app: FastifyInstance) {

    // ⬇️ Déclare une route WebSocket
    app.get('/ws', { websocket: true }, (connection, req) => {
    const ws = connection.socket;
    let userId: string;

    // ⬇️ Écoute les messages entrants
    ws.on('message', (message) => {
        try {
        const data = JSON.parse(message.toString());

        // ⬇️ Première action attendue : identification
        if (data.type === 'IDENTIFY') {
            userId = data.userId;
            connectedUsers.set(userId, ws);

            // ⬇️ Préviens les autres
            broadcast({ type: 'USER_ONLINE', userId }, userId);
        }
        } catch (err) {
        console.error('Message JSON invalide', err);
        }
    });

    // ⬇️ Lorsqu’un utilisateur ferme sa connexion
    ws.on('close', () => {
        if (userId) {
        connectedUsers.delete(userId);
        broadcast({ type: 'USER_OFFLINE', userId }, userId);
        }
    });
    });
}