import { currentService } from './user.service';
import { gameApi } from '../../api/index.api';
import { MatchMakingReq } from '../../shared/types/websocket.types';

// ============================================================================
// GAME SERVICE
// ============================================================================
export class GameService {

	/**
	 * Invite un joueur à jouer une partie.
	 * Si le joueur actuel essaye d'inviter lui-meme, une erreur est levée.
	 * 
	 * @param {string} type Le type de partie (matchmaking, invite, tournament).
	 * @param {number} invitedId L'ID du joueur invite.
	 * @param {number} [tournamentID] L'ID du tournoi si la partie est un tournoi.
	 * @returns {Promise<void>} La promesse qui se résout lorsque la partie est lancee.
	 */
	public async invitePlayer(type: string, invitedId: number, tournamentID?: number): Promise<void> {
		const currentUser = currentService.getCurrentUser();
		if (currentUser!.id === invitedId) {
			throw new Error("You cannot play with yourself.");
		}
		const matchMakingReq: MatchMakingReq = {
			type: type,
			playerID: currentUser!.id,
			tournamentID: tournamentID,
			invitedId: invitedId,
			inviterId: currentUser!.id
		}
		await gameApi.matchMake(matchMakingReq);
	}
}