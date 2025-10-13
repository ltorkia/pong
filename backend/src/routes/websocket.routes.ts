import { FastifyInstance } from 'fastify';
import { UserWS } from '../types/user.types';
import { Player } from '../shared/types/game.types';
import { Game } from '../types/game.types';

export async function webSocketRoutes(app: FastifyInstance) {

    // Ping interval côté serveur (en ms)
    const PING_INTERVAL = 25000;

    app.get('/ws', { websocket: true }, (connection: WebSocket, req: any) => {
        const userId = req.user.id;
        const tabID = req.query.tabID as string;

        if (!app.usersWS.has(userId))
            app.usersWS.set(userId, []);

        const userWS = new UserWS(userId, tabID, connection);
        userWS.isAlive = true;
        app.usersWS.get(userId)!.push(userWS);

        // Ping/pong automatique
        const pingInterval = setInterval(() => {
            if (!userWS.isAlive) {
                console.log(`No pong from user ${userId}, tab ${tabID} → closing WS`);
                connection.close();
                clearInterval(pingInterval);
                return;
            }
            userWS.isAlive = false;
            try {
                connection.send(JSON.stringify({ type: 'ping-check' }));
            } catch (err) {
                console.error('Failed to send ping:', err);
            }
        }, PING_INTERVAL);

        connection.onclose = () => {
            clearInterval(pingInterval);
            const sockets = app.usersWS.get(userId) || [];
            app.usersWS.set(userId, sockets.filter((u: UserWS) => u !== userWS));
            if (app.usersWS.get(userId)!.length === 0)
                app.usersWS.delete(userId);

            console.log(`WebSocket closed for user ${userId}, tab ${tabID}`);
        };

        attachWSHandler(userWS);
    });
}

// Dispatcher global des messages WS
export function attachWSHandler(userWS: UserWS, player?: Player, game?: Game, mode?: string) {
    const connection = userWS.WS;
    if (!connection) 
        return;

    connection.onmessage = (event: MessageEvent) => {
        try {
            const msg: any = JSON.parse(event.data);

            switch (msg.type) {
                case "pong-check":
                    userWS.isAlive = true;
                    break;

                case "movement":
                    if (!game || !player) 
                        break;

                    if (mode === "multi") 
                        game.registerInput(msg.playerID, msg.key, msg.status);
                    else if (mode === "local") 
                        game.registerInputLocal(msg.playerID, msg.key, msg.status);
                    else if (mode === "tournament")
                        game.registerInputLocalTournament(msg.key, msg.status);
                    break;

                case "touchMovement":
                    if (!game)
                        break ;

                    game.registerTouchInput(msg.coords, mode, msg.playerID);
                    break;

                case "go":
                    if (game && game.isPaused) {
                        game.isPaused = false;
                        game.initRound();
                    }
                    break;

                // case "chat":
                //     break;

                default:
                    console.warn(`Unknown WS message type from user ${userWS.id}:`, msg.type);
            }

        } catch {
            console.log(`WS raw message from user ${userWS.id}, tab ${userWS.tabID}:`, event.data?.toString());
        }
    };
}


  