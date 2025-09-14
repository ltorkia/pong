import { BasePage } from '../../base/base.page';
import { RouteConfig } from '../../../types/routes.types';
import { router } from '../../../router/router';
import { secureFetch } from '../../../utils/app.utils';
import { generateUniqueID } from '../../../shared/functions'
import { currentService } from '../../../services/index.service';
import { animateCSS } from '../../../utils/animate.utils';
// import { joinTournament, postNewTournament, sendDismantleRequest } from '../../../api/game/tournament.api';
import { TournamentService } from '../../../api/game/game.api';
import { Player } from '../shared/types/game.types';
import { DataService } from '../../../services/user/data.service';
import { Tournament } from '../../../types/game.types';

const MAX_PLAYERS = 4;
const MIN_PLAYERS = 4;

export class GameMenuTournamentLocal extends BasePage {
    private allTournaments: Tournament[] = [];
    private playersNb: number = MIN_PLAYERS; // Minimum players required
    private players: Player[] = [];
    private alias: string = "";
    private dataApi = new DataService();
    private pastilleHTML: Node | undefined;
    private tournamentToCancel: number = 0;

    constructor(config: RouteConfig) {
        super(config);
        this.pastilleHTML = document.createElement("div");
        // this.fetchTournamentItem();
    }

    // Fetch HTML stocke localement a reutiliser pour chaque joueur 
    private async fetchPastille(): Promise<void> {
        const response = await fetch("../../../../public/templates/game/pastille.html");
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        const pastilleDiv = doc.querySelector("#pastille");
        if (pastilleDiv && this.pastilleHTML)
            this.pastilleHTML = pastilleDiv.cloneNode(true);
    }

    protected async mount(): Promise<void> {
        // this.getTournaments();
        this.applyAppClasses();
        await this.fetchPastille();
        console.log(this.pastilleHTML);
    }

    // Juste du layout
    private applyAppClasses(): void {
        const app = document.getElementById("app");
        app!.classList.add("flex", "border-white");
    }

    // Recupere la pastille de HTML, recherche le joueur dans la DB et l'ajoute 
    // TODO : gerer mot de passe 
    private async appendPlayerPastille(player: { alias: string, username?: string }): Promise<void> {
        console.log(player);
        const pastille = this.pastilleHTML!.cloneNode(true) as HTMLElement;
        const h2 = pastille.querySelector("h2");
        h2!.textContent = `${player.alias}`;
        if (player.username)
            h2!.textContent += ` \(${player.username}\)`;
        const pastilleHolder = document.getElementById("pastilles-holder") as HTMLElement;
        if (this.playersNb <= 4) {
            pastilleHolder.classList.add("flex", "justify-center", "items-center", "flex-wrap");
            pastille.classList.add("w-1/3", "h-1/3");
        } else
            pastilleHolder.classList.add("grid", "grid-cols-4");
        pastilleHolder!.append(pastille);
        this.appendListenerPastille(pastille, player);
        requestAnimationFrame(() => {
            pastille.classList.add("opacity-100");
        });
        const img = pastille.querySelector("img") as HTMLImageElement;
        if (player.username) {
            console.log("username : ", player.username);
            const res = await secureFetch(`/api/users/search/${player.username}`);
            const data = await res.json();
            console.log(data);
            // console.log(playerFetched);
            img.src = `https://localhost:8443/uploads/avatar/${data.avatar}`;
        } else {
            img.src = await this.dataApi.returnDefaultAvatarURL();
        }
    }

    // Handler du champ user input
    private async handleUserInput(alias: string, username?: string): Promise<void> {
        if (!alias) {
            const aliasInput = document.getElementById("alias-input");
            aliasInput?.classList.add("animate__animated", "animate__shakeX", "animate__fast");
            return;
        }
        if (this.players.length >= this.playersNb)
            return (this.printError("Invalid number of players!"));
        if (this.players.find(player => player.alias == alias))
            return (this.printError("Player already exists in tournament!"));
        const player = { alias: alias, username: username };
        this.players.push(player);
        this.appendPlayerPastille(player);
    }

    // Listener du bouton remove (a rajouter)
    private appendListenerPastille(pastille: HTMLElement, player: { alias: string, username?: string }): void {
        pastille.querySelector("#tournament-cross")?.addEventListener("click", () => {
            const toRemoveIdx = this.players.findIndex(p => p.alias == player.alias);
            this.players.splice(toRemoveIdx, 1);
            pastille.remove();
        })
    }

    // Animation pour print une erreur
    private printError(error: string): void {
        const errorDiv = document.createElement("div");
        const container = document.getElementById("alias-container");
        const tournamentBox = document.querySelectorAll("#input-box")[1];
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

    protected attachListeners(): void {
        const aliasInput = document.getElementById("alias-name-input") as HTMLInputElement;
        const usernameInput = document.getElementById("username-input")! as HTMLInputElement;
        const inputBoxes = document.querySelectorAll("#input-box");

        aliasInput.addEventListener("keydown", (event) => {
            if (event.key == "Enter") {
                this.handleUserInput(aliasInput.value);
                aliasInput.value = "";
                usernameInput.value = "";
            }
        });
        aliasInput.addEventListener("animationend", () => {
            aliasInput.classList.remove("animate__animated", "animate__shakeX", "animate__fast", "border-2", "border-red-500");
        })
        usernameInput.addEventListener("keydown", (event) => {
            if (event.key == "Enter") {
                this.handleUserInput(aliasInput.value, usernameInput.value);
                aliasInput.value = "";
                usernameInput.value = "";
            }
        });

        // Animations
        for (const box of inputBoxes) {
            box.addEventListener("mouseover", () => {
                const inputs = box.querySelectorAll("input");
                for (const input of inputs) {
                    input!.classList.remove("bg-white", "text-white");
                    input!.classList.add("bg-black", "opacity-100", "text-black");
                }
            })
            box.addEventListener("mouseleave", () => {
                const inputs = box.querySelectorAll("input");
                for (const input of inputs) {
                    input!.classList.remove("bg-black", "opacity-100", "text-black");
                    input!.classList.add("bg-white", "text-white");
                }
            });
        }
    }
}