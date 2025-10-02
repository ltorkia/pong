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
	 * @returns {Promise<any>} La promesse qui se résout lorsque la partie est lancée ou avec une erreur.
	 * @throws {Error} Si la requête échoue, lance une erreur avec le message d'erreur.
	 */
	public async matchMake(data: MatchMakingReq): Promise<any> {
		if (data.type !== "clean_request")
			currentService.setGameInit(true);
		const res = await secureFetch(`/api/game/playgame`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(data),
			credentials: 'include',
		});
		const result = await res.json();
		if (!res.ok || 'errorMessage' in result || 'error' in result) {
			return { errorMessage: result.errorMessage || result.error || 'Erreur lors du matchmaking.' };
		}
		return result;
	}

}

export const gameApi = new GameAPI();