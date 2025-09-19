import { BasePage } from '../../base/base.page';
import { RouteConfig } from '../../../types/routes.types';
import { DataService } from '../../../services/user/data.service';
import { Player } from '../../../shared/types/game.types';
import { Tournament } from '../../../types/game.types';
import { TournamentService } from '../../../api/game/game.api';
import { UserModel } from '../../../shared/types/user.types';
import { User } from '../../../shared/models/user.model';
import { webSocketService } from '../../../services/user/user.service'
import { router } from '../../../router/router';
import { animateCSS } from '../../../utils/animate.utils';
import { TournamentAPI } from '../../../api/game/tournament.api';

//   TODO : Start Tournament -> affiche que pour celui qui peut lancer le tournoi
export class GameTournamentLobby extends BasePage {
    private tournamentID: number;
    private tournament: Tournament | undefined;
    private joined: boolean = false;
    private pastilleHTML: Node;
    private dataApi: DataService = new DataService();
    private gridRowStyle: string = "";
    // private leavingPage: boolean = false;
    // private beaconSent: boolean = false;
    private ready: boolean = false;

    constructor(config: RouteConfig) {
        super(config);
        this.tournamentID = Number(window.location.href.split('/').reverse()[1].slice(1));
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
    }

    protected async beforeMount(): Promise<void> {
        await this.fetchPastille();
        await this.fetchTournament();
        if (!this.tournament?.players?.find((p: Player) => p.ID == this.currentUser!.id)) { //chelou -> passera pas dedans donc plutot erreur about tournament
            this.joined = false;
            document.getElementById("tournament-join-leave-btn")!.textContent = "JOIN";
            document.getElementById("tournament-ready-btn")!.textContent = "READY";
            
        }
        else
            { // TODO : tester le bouton
                this.joined = true;
                document.getElementById("tournament-join-leave-btn")!.textContent = "LEAVE";
                console.log("this readdy en before mount", this.ready);
                if (this.tournament?.players?.find(p => p.ID === this.currentUser!.id)!.ready == true)
                {
                    this.ready = true;
                    document.getElementById("tournament-ready-btn")!.textContent = "NOT READY";
                }
                else
                    document.getElementById("tournament-ready-btn")!.textContent = "READY";
        }
        // await TournamentService.joinTournament(this.currentUser!.id, this.tournamentID);
        // await this.fetchTournament();
        console.log("WASNT IN THE TOURNAMENT AND JOINED");
        // } else {
        //     console.log("WAS IN THE TOURNAMENT HENCE DIDNT JOINED");
        // }
    }

    protected async mount(): Promise<void> {
        const pastilleHolder = document.getElementById("pastilles-holder");
        pastilleHolder!.classList.add(this.gridRowStyle);
        this.displayTournament();
        if (this.currentUser!.id == this.tournament?.masterPlayerID) {
            const cancelBtn = document.getElementById("tournament-cancel-btn")!;
            const startBtn = document.getElementById("tournament-start-btn")!;
            startBtn.classList.remove("hidden");
            cancelBtn.classList.remove("hidden");
            startBtn.addEventListener("click", async () => {
                try {
                    console.log("iccciii starttournament on front");
                    await TournamentService.startTournament(this.currentUser!.id, this.tournamentID);
                    console.log("iccciii starttournament on front confirmed ///////////");
                } catch (error: any) {
                    this.printError(error.message);
                }
            })
            cancelBtn.addEventListener("click", () => this.handleCancelModal());
        }
    }

    private handleCancelModal(): void {
        const cancelDialogOverlay = document.getElementById("cancel-dialog-overlay")!;
        const dialog = document.getElementById("cancel-dialog")!;

        animateCSS(cancelDialogOverlay, "fadeIn");
        cancelDialogOverlay.classList.remove("hidden", "opacity-0");

        const clickOutsideHandler = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!dialog.contains(target)) {
                animateCSS(cancelDialogOverlay, "fadeOut").then(() => {
                    cancelDialogOverlay.classList.add("hidden");
                });
                cancelDialogOverlay.removeEventListener("click", clickOutsideHandler);
            }
        };

        cancelDialogOverlay.addEventListener("click", clickOutsideHandler);
        document.getElementById("no-btn")?.addEventListener("click", () => {
            animateCSS(cancelDialogOverlay, "fadeOut").then(() => {
                cancelDialogOverlay.classList.add("hidden");
            });
        });
    }

    private handleRedirectModal(): void {
        const redirectDialogOverlay = document.getElementById("redirect-dialog-overlay")!;

        animateCSS(redirectDialogOverlay, "fadeIn");
        redirectDialogOverlay.classList.remove("hidden", "opacity-0");
        document.getElementById("redirect-btn")?.addEventListener("click", async () => {
            await router.navigate("/game/tournaments");
        })
    }

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
        this.tournament?.players?.map((player: Player) => this.appendPlayerPastille(player));
    }

    private checkPlayersDifference(playersUpdate: Player[]): void {
        for (const player of this.tournament!.players!) {
            const playerUpdate = playersUpdate.find((p: Player) => p.ID == player.ID);
            if (!playerUpdate)
            {
                // document.querySelector(`[data-player-id="${player.ID}"]`)?.remove();
                return document.querySelector(`[data-player-id="${player.ID}"]`)?.remove();
            }
            // const DOMPlayerElem = document.querySelector(`[data-player-id="${player.ID}"]`);
            // if (player.ready === false) {
            //     DOMPlayerElem?.classList.remove("border-green-500");
            //     DOMPlayerElem?.classList.add("border-white");
            // } else {
            //     DOMPlayerElem?.classList.remove("border-white");
            //     DOMPlayerElem?.classList.add("border-green-500");
            // }
            if (playerUpdate?.ready != player.ready) {
                const DOMPlayerElem = document.querySelector(`[data-player-id="${player.ID}"]`);
                DOMPlayerElem?.classList.toggle("border-white");
                DOMPlayerElem?.classList.toggle("border-green-500");
            }
        }
        for (const player of playersUpdate) {
            const playerInLocalTournament = this.tournament?.players?.find((p: Player) => p.ID == player.ID);
            if (!playerInLocalTournament)
                this.appendPlayerPastille(player);
        }
    }

    private async fetchTournament(): Promise<void> {
        this.tournament = await TournamentService.fetchTournament(this.tournamentID);
        if (!this.tournament) {
            this.handleRedirectModal();
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
        // const res = await fetch(`/api/users/${player.ID}`)
        // if (!res.ok)
        //     return console.error("User fetch failed");
        // const user: UserModel = await res.json();
        const fetchedUser = await TournamentService.fetchUser(player.ID);
        if (!fetchedUser) throw new Error("User not found");
        const user: UserModel = fetchedUser;
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
        const img = pastille.querySelector("#user-avatar") as HTMLImageElement;
        if (this.tournament?.maxPlayers == 16)
            img.classList.add("w-8", "h-8");
        img.src = await this.dataApi.getUserAvatarURL(user as User);
        // requestAnimationFrame(() => 
        pastille.classList.remove("opacity-0");
        pastille.classList.add("opacity-100")
        // });
    }

    // private onClientNavigation(callback: (type: "pushState" | "replaceState" | "popstate" | "refresh", ...args: any[]) => void) {
    //     const originalPushState = history.pushState;
    //     history.pushState = function (...args) {
    //         const result = originalPushState.apply(this, args);
    //         callback("pushState", ...args);
    //         return result;
    //     };

    //     const originalReplaceState = history.replaceState;
    //     history.replaceState = function (...args) {
    //         const result = originalReplaceState.apply(this, args);
    //         callback("replaceState", ...args);
    //         return result;
    //     };

    //     window.addEventListener("popstate", () => {
    //         callback("popstate");
    //     });

    //     window.addEventListener("beforeunload", () => {
    //         if (!this.leavingPage && !this.beaconSent) {
    //             this.leavingPage = true;
    //             this.beaconSent = true;
    //             TournamentService.leaveTournamentBeacon(this.currentUser!.id, this.tournamentID);
    //         }
    //     })
    // }

    protected async attachListeners(): Promise<void> {
        document.getElementById("tournament-join-leave-btn")?.addEventListener("click", async (event) => {
            
            const btn = event.target as HTMLElement;
            btn.textContent = this.joined ? "JOIN" : "LEAVE";
            if (!this.joined) {
                this.joined = true;
                try {
                    await TournamentService.joinTournament(this.currentUser!.id, this.tournamentID);
            } catch (error: any) {
                this.printError(error);
            }
                // const btn = event.target as HTMLElement;
                // btn.textContent = "LEAVE";
            } else {
                this.joined = false;
                console.log('Leaving');
                TournamentService.leaveTournamentReq(this.currentUser!.id, this.tournamentID);
                // const btn = event.target as HTMLElement;
                // btn.textContent = "JOIN";
            }
        });

        document.getElementById("tournament-ready-btn")?.addEventListener("click", async (event) => {
            this.ready = !this.ready;
            const btn = event.target as HTMLElement;
            btn.textContent = this.ready ? "NOT READY" : "READY"; //TODO = foutre ailleurs pour le module trad
            try {
                await TournamentService.sendReadyRequest(this.currentUser!.id, this.tournamentID, this.ready);
            } catch (error: any) {
                this.printError(error);
                // this.printError("Please join tournament first!");
            }
        });

        document.getElementById("yes-btn")?.addEventListener("click", () => {
            TournamentService.sendDismantleRequest(this.currentUser!.id, this.tournamentID);
        })


        // this.onClientNavigation(async () => {
        //     if (!this.leavingPage)
        //         this.leavingPage = true;
        //     try {
        //         await TournamentService.leaveTournamentReq(this.currentUser!.id, this.tournamentID);
        //     } catch (error: any) {
        //         console.error(error.message);
        //     }
        // });
    }

	/**
	 * Gestionnaire d'événement pour les messages WebSocket reçus durant un tournoi.
	 * Méthode appelée dans le service centralisé dédié: `webSocketService`.
	 * 
	 * @param data Les informations du tournoi.
	 * @returns La promesse qui se résout lorsque le gestionnaire d'événement a fini de traiter les informations.
	 */
    public async handleTournamentMessage(data: any): Promise<void> {
        switch (data.type) {

            case "tournament_lobby_update":
                if (data.tournamentID != this.tournamentID)
                    return;
                this.checkPlayersDifference(data.players);
                this.tournament!.players = data.players;
                break;

            case "dismantle_signal":
                this.handleRedirectModal();
                break;

            case "start_tournament_signal":
                await router.navigate(`/game/tournaments/:${this.tournamentID}/overview`)
                // fetch appel a la db pour stocker le tournoi avec les joueurs ?
                // + choper ce qu il y a en lobby ?
                break;
            
            default:
                console.error("Message type inconnu: ", data.type);
        }
    }
}