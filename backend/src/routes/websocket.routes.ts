import { FastifyInstance } from 'fastify';
import { UserWS } from '../types/user.types'

export async function webSocketRoutes(app: FastifyInstance) {
    app.get('/ws', { websocket: true }, (connection: any, req: any) => {
        console.log(req);
        // if (app.userWS.find((user: UserWS) => user.WS == )) {
        // console.log("User WS already found");
    })
}
