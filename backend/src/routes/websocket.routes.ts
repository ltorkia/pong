import { FastifyInstance } from 'fastify';
import { UserWS } from '../types/user.types';
import { Player } from '../shared/types/game.types';

export async function webSocketRoutes(app: FastifyInstance) {

    // app.get('/ws', { websocket: true }, (connection: WebSocket, req: any) => {
    //     console.log("OPENING WEBSOCKET");
    //     const allUsers = app.usersWS;
    //     const allPlayers = app.lobby.allPlayers;
    //     allUsers.push(new UserWS(req.user.id, connection));
    //     console.log(allUsers);

    //     connection.onclose = () => {
    //         const userIdx = allUsers.findIndex((user: UserWS) => user.id == req.user.id);
    //         if (userIdx != -1) {
    //             allUsers.splice(userIdx, 1);
    //             console.log(`DELETED USER ID = ${req.user.id}`);
    //         }
    //         const playerIdx = allPlayers.findIndex((player: Player) => player.ID == req.user.id);
    //         if (playerIdx != -1) {
    //             allPlayers.splice(playerIdx, 1);
    //             console.log(`DELETED PLAYER ID = ${req.user.id}`);
    //         }
    //     }

    //     connection.onmessage = (event) => {
    //         console.log(event);
    //     }
    // })

    // app.get('/ws', { websocket: true }, (connection: WebSocket, req: any) => {
    //     console.log("OPENING WEBSOCKET for user", req.user.id);

    //     // ajoute la socket dans la Map (peut être plusieurs par user)
    //     if (!app.usersWS.has(req.user.id))
    //         app.usersWS.set(req.user.id, []);
    //     app.usersWS.get(req.user.id)!.push(connection);

    //     connection.on("close", () => {
    //         const sockets = app.usersWS.get(req.user.id) || [];
    //         app.usersWS.set(req.user.id, sockets.filter((s: WebSocket) => s !== connection));
    //         if (app.usersWS.get(req.user.id)!.length === 0)
    //             app.usersWS.delete(req.user.id);
    //     });

    //     console.log("Current sockets:", [...app.usersWS.entries()]
    //         .map(([id, sockets]) => `${id}: ${sockets.length} connections`)
    //         .join(", ")
    //     );

    //     connection.onmessage = (event: any) => {
    //         console.log("WS message from", req.user.id, ":", event.data?.toString());
    //     };
    // });

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

  