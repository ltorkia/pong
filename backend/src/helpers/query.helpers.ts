import { FastifyInstance } from "fastify";
import { UserWS } from "src/types/user.types";

export function getUserWS(app: FastifyInstance, userId: number, tabID?: string): UserWS | undefined {
    const sockets = app.usersWS.get(userId);
    if (!sockets) 
		  return undefined;
    if (tabID)
		  return sockets.find((ws: UserWS) => ws.tabID === tabID);
    return sockets[0];
}