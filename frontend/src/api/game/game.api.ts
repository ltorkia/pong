import { secureFetch } from "../../utils/app.utils";
import { MatchMakingReq } from '../../shared/types/websocket.types';
import { currentService } from "../../services/index.service";
import { TournamentAPI } from "./tournament.api";

export const TournamentService = new TournamentAPI();

class GameAPI {

	/**
	 * Envoie une requête POST à la route API `/api/game/playgame` pour lancer une partie
	 * dans le contexte d'un matchmaking (aléatoire / invite / tournoi).
	 * 
	 * @param {MatchMakingReq} data Les informations de la partie à lancer.
	 * @returns {Promise<void>} La promesse qui se résout lorsque la partie est lancée.
	 * @throws {Error} Si la requête échoue, lance une erreur avec le message d'erreur.
	 */
	public async matchMake(data: MatchMakingReq): Promise<void> {
		const res = await secureFetch(`/api/game/playgame`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(data),
			credentials: 'include',
		});
		if (!res.ok) {
			const error = await res.json();
			throw new Error(error.error);
		}
		currentService.setGameInit(true);
	}

}

export const gameApi = new GameAPI();