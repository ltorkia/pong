// game.service.ts
import { MatchMakingReq } from '../../shared/types/websocket.types';
import { SafeUserModel } from '../../shared/types/user.types';


import { TournamentAPI } from "./tournament.api"; //a deplacer dans tournament ?

const TournamentService = new TournamentAPI(); //a deplacer dans tournament ? 

export { TournamentService }; //a deplacer dans tournament ? 


export class GameService {
    private baseUrl: string = "/api/game";
    private webSocket?: WebSocket;

    constructor() {}

    /** Envoie une requête de matchmaking via API REST */
    public async sendMatchMakingRequest(
        type: string,
        playerID: number,
        tournamentID?: number
    ): Promise<void> {
        const req: MatchMakingReq = { type, playerID, tournamentID };
        try {
            const res = await fetch(`${this.baseUrl}/playgame`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(req),
                credentials: "include",
            });
            if (!res.ok) {
                const error = await res.json();
                console.error("Matchmaking error:", error.error);
            }
        } catch (err) {
            console.error("Network error during matchmaking:", err);
        }
    }

//     /** Récupère l'historique des parties d'un utilisateur */
//     public async getUserGames(userID: number): Promise<any[]> {
//         try {
//             const res = await fetch(`/api/user/${userID}/games`, {
//                 method: "GET",
//                 headers: { "Content-Type": "application/json" },
//                 credentials: "include",
//             });
//             if (!res.ok) {
//                 const error = await res.json();
//                 console.error("Fetch user games error:", error.errorMessage);
//                 return [];
//             }
//             return await res.json();
//         } catch (err) {
//             console.error("Network error fetching user games:", err);
//             return [];
//         }
//     }
}

// TODO: fetch api game ici