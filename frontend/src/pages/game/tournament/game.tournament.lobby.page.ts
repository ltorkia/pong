import { BasePage } from '../../base/base.page';
import { RouteConfig } from '../../../types/routes.types';
import { DataService } from '../../../services/user/data.service';
import { Player, Tournament } from '../../../../../shared/types/game.types';
import { TournamentLobbyUpdate } from '../../../shared/types/websocket.types';
import { UserModel } from '../../../../../shared/types/user.types';
import { webSocketService } from '../../../services/user/user.service'

export class GameTournamentLobby extends BasePage {
    private tournamentID: number;
    private tournament: Tournament | undefined;
    private pastilleHTML: Node;
    private dataApi: DataService = new DataService();
    private gridRowStyle: string = "";
    private leavingPage: boolean = false;
    private beaconSent: boolean = false;

    constructor(config: RouteConfig) {
        super(config);
        this.tournamentID = Number(window.location.href.split('/').reverse()[0].slice(1));
        this.pastilleHTML = document.createElement("div");
        const gridRowClass = {
            1: 'grid-rows-1',
            2: 'grid-rows-2',
            3: 'grid-rows-3',
            4: 'grid-rows-4',
            5: 'grid-rows-5',
            6: 'grid-rows-6'
        };
        const rowCount = this.tournament?.maxPlayers;
        this.gridRowStyle = gridRowClass[rowCount as keyof typeof gridRowClass];
        this.onClientNavigation(async () => {
            if (!this.leavingPage)
                await this.leaveTournament();
        });
    }

    protected async beforeMount(): Promise<void> {
        await this.fetchPastille();
        await this.fetchTournament();
        console.log(this.tournament);
        if (!this.tournament?.players.find((p: Player) => p.ID == this.currentUser.id)) {
            await this.joinTournament();
            await this.fetchTournament();
            console.log("WASNT IN THE TOURNAMENT AND JOINED");
        } else {
            console.log("WAS IN THE TOURNAMENT HENCE DIDNT JOINED");
        }
    }

    protected async mount(): Promise<void> {
        const pastilleHolder = document.getElementById("pastilles-holder");
        pastilleHolder!.classList.add(this.gridRowStyle);
        // console.log("I SHOULD HAVE JOINED");
        // console.log(this.tournament);
        this.displayTournament();
        // for (const player of this.tournament!.players)
        // console.log(player);
    }

    private async leaveTournament(): Promise<void> {
        console.log("LEAVIGN TOURNAMENNTTT");
        this.leavingPage = true;
        const res = await fetch("/api/game/leave_tournament", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                playerID: this.currentUser.id,
                tournamentID: this.tournamentID,
            }),
            credentials: 'include',
        });
        console.log(res);
        if (!res.ok) {
            const error = await res.json();
            console.error(error.error);
            return;
        }
    }

    private leaveTournamentBeacon(): void {
        if (this.beaconSent) return ;
        this.beaconSent = true;
        this.leavingPage = true;
         const data = JSON.stringify({
            playerID: this.currentUser.id,
            tournamentID: this.tournamentID,    
        });
        console.log("SENDING BEAACON");
        navigator.sendBeacon("/api/game/leave_tournament", data);
    }

    private async joinTournament(): Promise<void> {
        const res = await fetch("/api/game/join_tournament", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                playerID: this.currentUser.id,
                tournamentID: this.tournamentID,
            }),
            credentials: 'include',
        });
        if (!res.ok) {
            const error = await res.json();
            console.error(error.error);
            return;
        }
    }

    private displayTournament(): void {
        const tournamentHolder = document.getElementById("pastilles-holder");
        while (tournamentHolder?.lastChild)
            tournamentHolder?.lastChild.remove();
        console.log(this.tournament);
        this.tournament?.players.map((player: Player) => this.appendPlayerPastille(player));
    }

    private async fetchTournament(): Promise<void> {
        const res = await fetch(`/api/game/tournaments/:${this.tournamentID}`);
        if (res.ok) {
            this.tournament = await res.json();
            // console.log(this.tournament);
        } else {
            console.error("Tournament not found");
        }
    }

    private async fetchPastille(): Promise<void> {
        const response = await fetch("../../../../public/templates/game/pastille.html");
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        const pastilleDiv = doc.querySelector("#pastille");
        if (pastilleDiv && this.pastilleHTML)
            this.pastilleHTML = pastilleDiv.cloneNode(true);
    }

    private async appendPlayerPastille(player: Player): Promise<void> {
        const res = await fetch(`/api/users/${player.ID}`)
        if (!res.ok)
            return console.error("User fetch failed");
        const user: UserModel = await res.json();
        const pastille = this.pastilleHTML.cloneNode(true) as HTMLElement;
        const h2 = pastille.querySelector("h2");
        if (player.alias)
            h2!.textContent = `${player.alias}`;
        else
            h2!.textContent = `${user.username}`;
        const pastilleHolder = document.getElementById("pastilles-holder") as HTMLElement;
        if (this.tournament?.maxPlayers == 4) {
            pastilleHolder.classList.add("flex", "justify-center", "items-center", "flex-wrap");
            pastille.classList.add("w-1/3", "h-1/3");
        } else
            pastilleHolder.classList.add("grid", "grid-cols-4");
        pastilleHolder!.append(pastille);
        // this.appendListenerPastille(pastille, player);
        requestAnimationFrame(() => pastille.classList.add("opacity-100"));
        const img = pastille.querySelector("#user-avatar") as HTMLImageElement;
        if (this.tournament?.maxPlayers == 16)
            img.classList.add("w-8", "h-8");
        img.src = await this.dataApi.getUserAvatarURL(user);

    }

    private onClientNavigation(callback: (type: "pushState" | "replaceState" | "popstate" | "refresh", ...args: any[]) => void) {
        const originalPushState = history.pushState;
        history.pushState = function (...args) {
            const result = originalPushState.apply(this, args);
            callback("pushState", ...args);
            return result;
        };

        const originalReplaceState = history.replaceState;
        history.replaceState = function (...args) {
            const result = originalReplaceState.apply(this, args);
            callback("replaceState", ...args);
            return result;
        };

        window.addEventListener("popstate", () => {
            callback("popstate");
            console.log("POSTATE DETECTED");
        });

        window.addEventListener("beforeunload", () => {
            this.leaveTournamentBeacon();
        })
    }

    protected async attachListeners(): Promise<void> {
        webSocketService.getWebSocket()?.addEventListener("message", (event) => {
            const tournamentPlayers: TournamentLobbyUpdate = JSON.parse(event.data);
            console.log("MSG RECEIVED");
            console.log(tournamentPlayers);
            if (tournamentPlayers && !this.leavingPage) {
                this.tournament!.players = tournamentPlayers.players;
                this.displayTournament();
            }
        })
    }
}