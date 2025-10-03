import { FastifyInstance } from 'fastify';
import { UserWS } from '../types/user.types';
import { Player } from '../shared/types/game.types';

export async function webSocketRoutes(app: FastifyInstance) {

    app.get('/ws', { websocket: true }, (connection: WebSocket, req: any) => {
        const userId = req.user.id;
        const tabID = req.query.tabID as string;

        console.log(`OPENING WEBSOCKET for user ${userId}, tabID: ${tabID}`);

        // Crée l'entrée pour l'utilisateur si elle n'existe pas
        if (!app.usersWS.has(userId))
            app.usersWS.set(userId, []);

        // Crée le UserWS pour cet onglet
        const userWS = new UserWS(userId, tabID, connection);
        app.usersWS.get(userId)!.push(userWS);

        // Gestion de la fermeture de la socket
        connection.onclose = () => {
            const sockets = app.usersWS.get(userId) || [];
            app.usersWS.set(userId, sockets.filter((u: UserWS) => u !== userWS));

            if (app.usersWS.get(userId)!.length === 0)
                app.usersWS.delete(userId);

            console.log(`WebSocket closed for user ${userId}, tab ${tabID}`);
        };

        // Log des sockets courantes
        console.log("Current sockets:", [...app.usersWS.entries()]
            .map(([id, sockets]) => `id: ${id} - ${sockets.length} connections`)
            .join(", ")
        );

        // Gestion des messages entrants
        connection.onmessage = (event: any) => {
            console.log(`WS message from user ${userId}, tab ${tabID}:`, event.data?.toString());
        };
    });
}

  