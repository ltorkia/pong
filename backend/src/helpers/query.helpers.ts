import { FastifyInstance } from "fastify";
import { UserWS } from "src/types/user.types";

/**
 * Sanitize un terme de recherche.
 *
 * Si le terme n'est pas une chaîne de caractères, alors la fonction renvoie une chaîne vide.
 *
 * Si le terme est une chaîne de caractères, alors la fonction renvoie le terme nettoyé :
 * - les espaces en début et en fin de chaîne sont supprimés avec `trim()`,
 * - la longueur du terme est limitée à 100 caractères avec `slice(0, 100)`,
 * - cela permet de limiter les risques de SQL injection en limitant la longueur des query.
 *
 * @param term - Le terme de recherche à sanitizer.
 * @returns Le terme de recherche nettoyé.
 */
export function sanitizeSearchTerm(term: unknown): string {
	if (typeof term !== 'string') {
		return '';
	}
	return term.trim().slice(0, 100);
}

// export function findPlayerWebSocket(id: number, app: FastifyInstance): WebSocket | undefined{
// 	const user = app.usersWS.find((u: UserWS) => u.id == id);
// 	if (user)
// 		return user.WS;
// }

export function findPlayerWebSocket(id: number, app: FastifyInstance, tabID?: string): WebSocket | undefined {
    const userSockets = app.usersWS.get(id);
    if (!userSockets || userSockets.length === 0) 
		return undefined;

    // si tabID fourni, on retourne le WS correspondant, sinon le premier
    const userWS = tabID !== undefined
        ? userSockets.find((u: UserWS) => u.tabID === tabID)
        : userSockets[0];

    return userWS?.WS;
}

export function getUserWS(app: FastifyInstance, userId: number, tabID?: string): UserWS | undefined {
    const sockets = app.usersWS.get(userId);
    if (!sockets) 
		  return undefined;
    if (tabID)
		  return sockets.find((ws: UserWS) => ws.tabID === tabID);
    return sockets[0];
}