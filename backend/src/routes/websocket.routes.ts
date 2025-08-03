import { FastifyInstance } from 'fastify';
import { UserWS } from '../types/user.types'

export async function webSocketRoutes(app: FastifyInstance) {
    app.get('/ws', { websocket: true }, (connection: WebSocket, req: any) => {
        const allUsers = app.usersWS;
        allUsers.push(new UserWS(req.user.id, connection));
        console.log(`ADDED USER ID = ${req.user.id}`);
        console.log(allUsers);

        connection.onclose = () => {
            const userIdx = app.usersWS.findIndex((user: UserWS) => user.id == req.user.id);
            if (userIdx != -1) {
                allUsers.splice(userIdx, 1);
                console.log(`DELETED USER ID = ${req.user.id}`);
            }
        }

        connection.onmessage = (event) => {
            console.log(event);
        }
    })
}
