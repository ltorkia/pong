import { BasePage } from '../../base/base.page';
import { RouteConfig } from '../../../types/routes.types';
import { router } from '../../../router/router';
import { secureFetch } from '../../../utils/app.utils';
import { Tournament } from '../../../shared/types/game.types';
import { generateUniqueID } from '../../../shared/functions'
import { Player } from '../../../../../shared/types/game.types';
import { currentService } from '../../../services/index.service';
import { webSocketService } from '../../../services/user/user.service';

const MAX_PLAYERS = 16;
const MIN_PLAYERS = 4;

export class GameTournamentList extends BasePage {
    private allTournaments: Tournament[] = [];
    private playersNb: number = MIN_PLAYERS; // Minimum players required
    private alias: string = "";
    private tournamentItemHTML: Node;

    constructor(config: RouteConfig) {
        super(config);
        this.tournamentItemHTML = document.createElement("div");
        this.fetchTournamentItem();
        // console.log(currentService.getCurrentUser().id);
        // this.currentPlayer = new Player(
        //     currentService.getCurrentUser().id, 
        //     webSocketService.getWebSocket());
    }

    protected async mount(): Promise<void> {
        this.getTournaments();
        this.applyAppClasses();
        console.log(sessionStorage);
    }

    private applyAppClasses(): void {
        const app = document.getElementById("app");
        console.log(app);
        app!.classList.add("flex", "border-white");
    }

    private aliasSetAnimation(): void {
        const aliasBox = document.getElementById("alias-box");
        document.getElementById("alias-name-set")?.remove();
        aliasBox!.classList.add(
            "transition-transform", "duration-500", "-translate-y-6"
        );
        const alias = document.createElement("h3");
        alias.id = "alias-name-set";
        alias.classList.add(
            "flex", "justify-around", "p-1", "m-1", "w-48", "border-1", "border-black", "rounded-md",
            "animate__animated", "animate__fadeIn",
            "absolute", "bottom-5", "left-1/2", "-translate-x-1/2", "text-center",
            "shadow-black", "shadow-md", "bg-white", "bg-opacity-20"
        );
        alias.textContent = `Alias set to : ${this.alias}`;
        const xMark = document.createElement("i");
        xMark.classList.add(
            "fa-regular", "fa-circle-xmark", "text-red-500",
            "flex", "justify-center", "items-center"
        );
        xMark.addEventListener("click", () => {
            this.alias = "";
            alias.classList.add("animate__animated", "animate__fadeOut");
            setTimeout(() => {
                aliasBox!.classList.remove("-translate-y-6");
                aliasBox!.classList.add("translate-y-0");
                alias.addEventListener("animationend", () => {
                    alias.remove();
                    aliasBox!.classList.remove("translate-y-0");
                });
            }, 500);
        })
        alias.insertAdjacentElement('beforeend', xMark);
        document.querySelector("#input-box")!.append(alias);
    }

    private async fetchTournamentItem(): Promise<void> {
        const response = await fetch("../../../../public/templates/game/tournament_item.html");
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        const item = doc.querySelector("#tournament-item");
        if (item && this.tournamentItemHTML)
            this.tournamentItemHTML = item.cloneNode(true);
    }

    private async joinTournament(tournamentID: number): Promise<void> {
        const res = await fetch("/api/game/join_tournament", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                playerID: this.currentUser.id,
                tournamentID: tournamentID,
            }),
            credentials: 'include',
        });
        if (!res.ok) {
            const error = await res.json();
            this.printError(error.error);
            return ;
        }
        router.navigate(`/game/tournaments/:${tournamentID}`);
    }

    private printError(error: string): void {
        const errorDiv = document.createElement("div");
        const container = document.getElementById("alias-container");
        const tournamentBox = document.querySelectorAll("#input-box")[1];
        console.log(tournamentBox);
        errorDiv.textContent = error;
        errorDiv.classList.add(
            "absolute", "top-50", "left-0", "right-0", "translate-y-1/2",
            "border-2", "border-red-500", "rounded-md",
            "bg-white", "bg-opacity-100", "m-2", "p-2", "text-center", "text-black",
            "animate__animated", "animate__fadeIn"
        );
        container?.append(errorDiv);
        tournamentBox!.classList.add("translate-y-10");
        tournamentBox!.classList.remove("hover:-translate-y-1");
        setTimeout(() => {
            errorDiv.classList.add("animate__animated", "animate__fadeOut");
            setTimeout(() => {
                tournamentBox!.classList.remove("translate-y-10");
                tournamentBox!.classList.add("translate-y-0");
                errorDiv.addEventListener("animationend", () => {
                    errorDiv.remove();
                });
                tournamentBox.classList.add("hover:-translate-y-1");
            }, 500);
        }, 1500);
        tournamentBox?.classList.remove("translate-y-0");
    }

    private displayTournamentsAndAttachListeners(allTournaments: Tournament[]): void {
        const tournamentList = document.getElementById("all-tournaments") as HTMLElement;
        while (tournamentList.lastChild)
            tournamentList.lastChild.remove();
        for (const tournament of allTournaments) {
            const tournamentItem = this.tournamentItemHTML.cloneNode(true) as HTMLElement;
            tournamentItem.querySelector("#tournament-name")!.textContent = tournament.name;
            tournamentItem.querySelector("#players")!.textContent = `${tournament.players.length} / ${tournament.maxPlayers}`;
            if (tournament.players == tournament.maxPlayers)
                tournamentItem.querySelector("#status")!.classList.add("text-red");
            tournamentList!.append(tournamentItem);
            tournamentItem.addEventListener("click", () => this.joinTournament(tournament.ID));
        }
    }

    protected async getTournaments(): Promise<void> {
        const res = await secureFetch("/api/game/tournaments");
        if (!res.ok)
            return this.printError("Network issue. Please try again later..");
        const allTournaments = await res.json();
        allTournaments.map((t: Tournament) => this.allTournaments.push(new Tournament(
            t.name,
            t.maxPlayers,
            t.ID,
            t.masterPlayerID,
            t.isStarted,
        )))
        this.displayTournamentsAndAttachListeners(allTournaments);
        console.log(allTournaments);
    }

    private async sendTournament(tournamentName: string): Promise<void> {
        const newTournament = new Tournament(
            tournamentName,
            this.playersNb,
            generateUniqueID(this.allTournaments),
            currentService.getCurrentUser().id,
            false,
        )
        console.log(newTournament);
        const res: Response = await fetch('/api/game/new_tournament', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newTournament),
            credentials: 'include',
        });
        if (!res.ok) {
            const error = await res.json();
            return this.printError(error.error);
        }
    }

    protected attachListeners(): void {
        const tournamentBtns = document.querySelectorAll("#btn-counter");
        const tournamentInput = document.getElementById("tournament-name-input") as HTMLInputElement;
        const tournamentList = document.getElementById("all-tournaments") as HTMLElement;
        const aliasInput = document.getElementById("alias-name-input") as HTMLInputElement;
        const inputBoxes = document.querySelectorAll("#input-box");
        const refreshBtn = document.getElementById("refresh-btn") as HTMLElement;

        for (const box of inputBoxes) {
            box.addEventListener("mouseover", () => {
                const input = box.querySelector("input");
                input!.classList.remove("bg-white", "text-white");
                input!.classList.add("bg-black", "opacity-100", "text-black");
            })
            box.addEventListener("mouseleave", () => {
                const input = box.querySelector("input");
                input!.classList.remove("bg-black", "opacity-100", "text-black");
                input!.classList.add("bg-white", "text-white");
            });
        }

        tournamentBtns[0].addEventListener("click", () => {
            if (this.playersNb > MIN_PLAYERS)
                this.playersNb /= 2;
            document.getElementById("btn-counter-nb")!.textContent = this.playersNb.toString();
        });

        tournamentBtns[1].addEventListener("click", () => {
            if (this.playersNb < MAX_PLAYERS) {
                this.playersNb *= 2;
                document.getElementById("btn-counter-nb")!.textContent = this.playersNb.toString();
            }
        });

        aliasInput?.addEventListener("keydown", (event) => {
            if (event.key == "Enter") {
                this.alias = aliasInput.value;
                aliasInput.value = "";
                this.aliasSetAnimation();
            }
        })

        tournamentInput!.addEventListener("keydown", (event) => {
            if (event.key == "Enter") {
                this.sendTournament(tournamentInput.value);
                this.getTournaments();
                tournamentInput.value = "";
            }
        });

        tournamentList.addEventListener("wheel", (e) => {
            e.preventDefault(); // empêche le scroll page
            tournamentList.scrollTop += e.deltaY; // pour scroll horizontal avec molette
        });

        refreshBtn.addEventListener("click", () => this.getTournaments());
    }
}