import { secureFetch } from "../../utils/app.utils";
import { MatchMakingReq } from '../../shared/types/websocket.types';
import { TournamentAPI } from "./tournament.api";

export const TournamentService = new TournamentAPI();

class GameAPI {

	/**
	 * Lance une partie avec les informations fournies dans l'objet `data`.
	 * (matchmaking, invite, tournament...)
	 * 
	 * @param {MatchMakingReq} data Informations de la partie a lancer.
	 * @returns {Promise<void>} Promesse qui se résolution lorsque la partie est lancee.
	 */
	public async playGame(data: MatchMakingReq): Promise<void> {
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
	}

}

export const gameApi = new GameAPI();