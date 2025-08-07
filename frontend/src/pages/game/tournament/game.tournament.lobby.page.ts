import { BasePage } from '../../base/base.page';
import { RouteConfig } from '../../../types/routes.types';
import { DataService } from '../../../services/user/data.service';
import { Player, Tournament } from '../../../../../shared/types/game.types';
import { TournamentLobbyUpdate, PlayerReadyUpdate, StartTournament } from '../../../shared/types/websocket.types';
import { UserModel } from '../../../../../shared/types/user.types';
import { webSocketService } from '../../../services/user/user.service'

const animateCSS = (element: HTMLElement, animation: string, prefix = 'animate__') =>
    // We create a Promise and return it
    new Promise((resolve, reject) => {
        const animationName = `${prefix}${animation}`;
        // const node = document.querySelector(element);

        element.classList.add(`${prefix}animated`, animationName);

        // When the animation ends, we clean the classes and resolve the Promise
        function handleAnimationEnd(event: any) {
            event.stopPropagation();
            element.classList.remove(`${prefix}animated`, animationName);
            resolve('Animation ended');
        }

        element.addEventListener('animationend', handleAnimationEnd, { once: true });
    });


export class GameTournamentLobby extends BasePage {
    private tournamentID: number;
    private tournament: Tournament | undefined;
    private pastilleHTML: Node;
    private dataApi: DataService = new DataService();
    private gridRowStyle: string = "";
    private leavingPage: boolean = false;
    private beaconSent: boolean = false;
    private ready: boolean = false;

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
        this.displayTournament();
        if (this.currentUser.id == this.tournament?.masterPlayerID) {
            const startBtn = document.getElementById("tournament-ready-btn")?.cloneNode() as HTMLElement;
            const dismantleBtn = startBtn?.cloneNode() as HTMLElement;;
            startBtn!.innerText = "Start tournament!";
            dismantleBtn.innerText = "Dismantle tournament";
            startBtn.addEventListener("click", () => {
                this.startTournament();
            })
            dismantleBtn.addEventListener("click", () => {
                this.dismantleTournament();
            })
            document.getElementById("buttons")?.append(dismantleBtn, startBtn);
            document.getElementById("tournament-dismantle-btn")?.addEventListener("click", () => {
                this.dismantleTournament();
            })
        }
    }

    private async leaveTournament(): Promise<void> {
        console.log("LEAVIGN TOURNAMENNTTT");
        this.leavingPage = true;
        const lobbyUpdate: TournamentLobbyUpdate = {
            type: "tournament_lobby_update",
            playerID: this.currentUser.id,
            tournamentID: this.tournamentID,
        }
        const res = await fetch("/api/game/leave_tournament", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(lobbyUpdate),
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
        if (this.beaconSent) return;
        this.beaconSent = true;
        this.leavingPage = true;
        const lobbyUpdate: TournamentLobbyUpdate = {
            type: "tournament_lobby_update",
            playerID: this.currentUser.id,
            tournamentID: this.tournamentID,
        }
        const data = JSON.stringify(lobbyUpdate);
        console.log("SENDING BEAACON");
        navigator.sendBeacon("/api/game/leave_tournament", data);
    }

    private async joinTournament(): Promise<void> {
        const lobbyUpdate: TournamentLobbyUpdate = {
            type: "tournament_lobby_update",
            playerID: this.currentUser.id,
            tournamentID: this.tournamentID,
        }
        const res = await fetch("/api/game/join_tournament", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(lobbyUpdate),
            credentials: 'include',
        });
        if (!res.ok) {
            const error = await res.json();
            console.error(error.error);
            return;
        }
    }

    private async sendReadyRequest(): Promise<void> {
        const readyUpdate: PlayerReadyUpdate = {
            type: "player_ready_update",
            playerID: this.currentUser.id,
            tournamentID: this.tournamentID,
            ready: this.ready
        };
        const res = await fetch("/api/game/player_ready", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(readyUpdate),
            credentials: 'include',
        });
        if (!res.ok) {
            const error = await res.json();
            console.error(error.error);
        }
    }

    private async startTournament(): Promise<void> {
        console.log("coucou")
        const startTournamentReq: StartTournament = {
            type: "start_tournament",
            playerID: this.currentUser.id,
            tournamentID: this.tournamentID,
        };
        const res = await fetch("/api/game/start_tournament", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(startTournamentReq),
            credentials: 'include',
        });
        if (!res.ok) {
            const error = await res.json();
            this.printError(error.error);
        }
    }

    private async dismantleTournament(): Promise<void> { }

    private printError(error: string): void {
        const errorDiv = document.createElement("div");
        errorDiv.textContent = error;
        errorDiv.classList.add(
            "absolute", "bot-0", "right-20",
            "border-2", "border-red-500", "rounded-md",
            "bg-white", "bg-opacity-100", "m-2", "p-2", "text-center", "text-black",
        );
        document.getElementById("buttons")?.append(errorDiv);
        animateCSS(errorDiv, "backInRight").then(() =>
            animateCSS(errorDiv, "wobble").then(() => 
                animateCSS(errorDiv, "backOutRight")).then(() => errorDiv.remove()));
    }

    private displayTournament(): void {
        const tournamentHolder = document.getElementById("pastilles-holder");
        while (tournamentHolder?.lastChild)
            tournamentHolder?.lastChild.remove();
        console.log(this.tournament);
        this.tournament?.players.map((player: Player) => this.appendPlayerPastille(player));
    }

    private checkPlayersDifference(playersUpdate: Player[]): void {
        for (const player of this.tournament!.players) {
            const playerUpdate = playersUpdate.find((p: Player) => p.ID == player.ID);
            if (!playerUpdate)
                return document.querySelector(`[data-player-id="${player.ID}"]`)?.remove();
            if (playerUpdate?.ready != player.ready) {
                const DOMPlayerElem = document.querySelector(`[data-player-id="${player.ID}"]`);
                DOMPlayerElem?.classList.toggle("border-white");
                DOMPlayerElem?.classList.toggle("border-green-500");
            }
        }
        for (const player of playersUpdate) {
            const playerInLocalTournament = this.tournament?.players.find((p: Player) => p.ID == player.ID);
            if (!playerInLocalTournament)
                this.appendPlayerPastille(player);
        }
    }

    private async fetchTournament(): Promise<void> {
        const res = await fetch(`/api/game/tournaments/:${this.tournamentID}`);
        if (res.ok) {
            this.tournament = await res.json();
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
            pastille.classList.add("w-1/4", "h-1/3");
        } else
            pastilleHolder.classList.add("grid", "grid-cols-4");
        if (player.ready) {
            pastille.classList.remove("border-white");
            pastille.classList.add("border-green-500");
        }
        pastille.dataset.playerId = player.ID.toString();
        pastilleHolder!.append(pastille);
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
            const lobbyUpdate: TournamentLobbyUpdate = JSON.parse(event.data);
            if (!lobbyUpdate)
                return;
            console.log("MSG RECEIVED");
            console.log(lobbyUpdate);
            if (lobbyUpdate && !this.leavingPage) {
                this.checkPlayersDifference(lobbyUpdate.players);
                this.tournament!.players = lobbyUpdate.players;
            }
        })

        document.getElementById("tournament-ready-btn")?.addEventListener("click", () => {
            this.ready = !this.ready;
            this.sendReadyRequest();
        })
    }
}