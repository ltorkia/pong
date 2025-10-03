import { currentService, webSocketService } from '../index.service';
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
	 * @param {"local" | "matchmaking_request" | "tournament" | "invite" | "invite-accept" | "clean_request" | "tournament_clean_request"} type Le type de partie (matchmaking, invite, tournament).
	 * @param {number} invitedId L'ID du joueur invite.
	 * @param {string} [inviterTabID] L'ID de l'onglet de l'inviteur (pour gérer les invitations multi-onglets).
	 * @param {number} [tournamentID] L'ID du tournoi si la partie est un tournoi.
	 * @returns {Promise<void>} La promesse qui se résout lorsque la partie est lancee.
	 */
	public async invitePlayer(type: "local" | "matchmaking_request" | "tournament" | "invite" | "invite-accept" | "clean_request" | "tournament_clean_request", invitedId: number, inviterTabID?: string, tournamentID?: number): Promise<void> {
		const currentUser = currentService.getCurrentUser();
		if (currentUser!.id === invitedId) {
			throw new Error("You cannot play with yourself.");
		}
		const matchMakingReq: MatchMakingReq = {
			type: type,
			playerID: currentUser!.id,
			tournamentID: tournamentID,
			invitedID: invitedId,
			inviterID: currentUser!.id,
			tabID: webSocketService.getTabID(),
			inviterTabID: inviterTabID,
		}
		await gameApi.matchMake(matchMakingReq);
	}
}