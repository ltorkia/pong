import { FastifyInstance } from 'fastify';
import { UserWS } from '../types/user.types';
import { Player } from '../shared/types/game.types';

export async function webSocketRoutes(app: FastifyInstance) {
    app.get('/ws', { websocket: true }, (connection: WebSocket, req: any) => {
        console.log("OPENING WEBSOCKET");
        const allUsers = app.usersWS;
        const allPlayers = app.lobby.allPlayers;
        // previent d eventuelles doubles connexions ->marchait pas dans le jeu avant
        const userIdx = allUsers.findIndex((user: UserWS) => user.id == req.user.id);
        if (userIdx != -1) {
            const oldUser = allUsers[userIdx];
                
            // Close the old WebSocket connection before removing
            if (oldUser.WS) {
                connection.close(1000, 'New connection established');
                console.log(`CLOSED OLD WEBSOCKET for user ID = ${req.user.id}`);
                return ;
            }
        //     allUsers.splice(userIdx, 1); //supprime des users
        //     console.log(`DELETED USER ID = ${req.user.id}`);
        // }
        // const playerIdx = allPlayers.findIndex((player: Player) => player.ID == req.user.id);
        // if (playerIdx != -1) {
        //     allPlayers.splice(playerIdx, 1);
        //     console.log(`DELETED PLAYER ID = ${req.user.id}`);
        }
        allUsers.push(new UserWS(req.user.id, connection));
        console.log(allUsers);

        connection.onclose = () => {
            const userIdx = allUsers.findIndex((user: UserWS) => user.id == req.user.id);
            if (userIdx != -1) {
                allUsers.splice(userIdx, 1);
                console.log(`DELETED USER ID = ${req.user.id}`);
            }
            const playerIdx = allPlayers.findIndex((player: Player) => player.ID == req.user.id);
            if (playerIdx != -1) {
                allPlayers.splice(playerIdx, 1);
                console.log(`DELETED PLAYER ID = ${req.user.id}`);
            }
        }

        connection.onmessage = (event) => {
            console.log(event);
        }
    })
}

  