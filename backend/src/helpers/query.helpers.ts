import { FastifyInstance } from 'fastify';
import { UserWS } from '../types/user.types';
import { FriendRequest } from '../shared/types/websocket.types';

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

/**
 * Envoie un message à un utilisateur connecté via WebSockets.
 * La clé "to" du objet data est utilisée pour identifier l'utilisateur ciblé.
 * Si l'utilisateur est connecté, alors le message est envoyé via WebSockets.
 * @param app - L'instance de l'application Fastify.
 * @param data - L'objet contenant les données à envoyer.
 */
export function sendToSocket(app: FastifyInstance, data: any): void {
	console.log("!!!!!!! Sending data to user via WebSocket:", data);
	const userWS: UserWS | undefined = app.usersWS.find((user: UserWS) => user.id == data.to);
	if (userWS) {
		console.log("→ Envoi WS vers", userWS.id, ":", JSON.stringify(data));
		userWS.WS.send(JSON.stringify(data));
	}
}