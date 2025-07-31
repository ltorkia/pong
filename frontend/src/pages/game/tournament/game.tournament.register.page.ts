import { BasePage } from '../../base/base.page';
import { RouteConfig, RouteParams } from '../../../types/routes.types';
import { DataService } from '../../../services/user/data.service';
import { secureFetch } from '../../../utils/app.utils';
// import "animate.css";

export class GameMenuTournamentRegister extends BasePage {
    private playersNb: number;
    private players: { alias: string, username?: string, playerDB?: any }[];
    private pastilleHTML: Node;
    private dataApi: DataService = new DataService();

    constructor(config: RouteConfig, nb: RouteParams) {
        super(config);
        this.playersNb = Number(nb.nb.slice(1));
        this.players = [];
        this.pastilleHTML = document.createElement("div");
    }

    protected async mount(): Promise<void> {
        const gridRowClass = {
            1: 'grid-rows-1',
            2: 'grid-rows-2',
            3: 'grid-rows-3',
            4: 'grid-rows-4',
            5: 'grid-rows-5',
            6: 'grid-rows-6'
        };
        sessionStorage.removeItem("fromRedirect");
        this.fetchPastille();
        const rowCount = this.playersNb / 4;
        const gridClassName = gridRowClass[rowCount as keyof typeof gridRowClass];
        const pastilleHolder = document.getElementById("pastilles-holder");
        pastilleHolder!.classList.add(gridClassName);
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

    private appendListenerPastille(pastille: HTMLElement, player: { alias: string, username?: string }): void {
        pastille.querySelector("#tournament-cross")?.addEventListener("click", () => {
            const toRemoveIdx = this.players.findIndex(p => p.alias == player.alias);
            this.players.splice(toRemoveIdx, 1);
            pastille.remove();
        })
    }

    private async appendPlayerPastille(player: { alias: string, username?: string }, playerDB: any): Promise<void> {
        console.log(player);
        const pastille = this.pastilleHTML.cloneNode(true) as HTMLElement;
        const h2 = pastille.querySelector("h2");
        h2!.textContent = `${player.alias}`;
        if (player.username)
            h2!.textContent += ` \(${player.username}\)`;
        const pastilleHolder = document.getElementById("pastilles-holder") as HTMLElement;
        if (this.playersNb == 4) {
            pastilleHolder.classList.add("flex", "justify-center", "items-center", "flex-wrap");
            pastille.classList.add("w-1/3", "h-1/3");
        } else
            pastilleHolder.classList.add("grid", "grid-cols-4");
            
            pastilleHolder!.append(pastille);
            this.appendListenerPastille(pastille, player);
            requestAnimationFrame(() => {pastille.classList.add("opacity-100");});
            const img = pastille.querySelector("#user-avatar") as HTMLImageElement;
        if (this.playersNb == 16)
            img.classList.add("w-8", "h-8");
        if (player.username) 
            img.src = await this.dataApi.getUserAvatarURL(playerDB);
        else 
            img.src = await this.dataApi.returnDefaultAvatarURL();
    }

    private printError(error: string): void {
        const errorDiv = document.createElement("div");
        const container = document.getElementById("alias-container");
        const inputsContainer = document.getElementById("inputs-container");
        errorDiv.textContent = error;
        errorDiv.classList.add(
            "absolute", "bottom-10", "left-0", "right-0",
            "border-2", "border-red-500", "rounded-md",
            "bg-black", "bg-opacity-30", "m-2", "p-2", "text-center", 
            "animate__animated", "animate__fadeIn"
        );
        container?.append(errorDiv);
        inputsContainer!.classList.add("transition-transform", "duration-500", "-translate-y-10");
        setTimeout(() => {
            errorDiv.classList.add("animate__animated", "animate__fadeOut");
            setTimeout(() => {
                inputsContainer!.classList.remove("-translate-y-10");
                inputsContainer!.classList.add("translate-y-0");
                errorDiv.addEventListener("animationend", () => {
                    errorDiv.remove();
                });
            }, 500);
        }, 1500);
        inputsContainer?.classList.remove("translate-y-0");
    }

    private async handleUserInput(alias: string, username?: string): Promise<void> {
        let playerDB: any = undefined;

        if (!alias) {
            const aliasInput = document.getElementById("alias-input");
            aliasInput?.classList.add("animate__animated", "animate__shakeX", "animate__fast");
            return;
        }
        if (this.players.length >= this.playersNb)
            return (this.printError("Invalid number of players!"));
        if (this.players.find(player => player.alias === alias || player.username && player.username === username))
            return (this.printError("Player already exists in tournament!"));
        if (username) {
            const res = (await secureFetch(`/api/users/search/${username}`));
            if (res.ok)
                playerDB = await res.json();
            else
                return (this.printError("Player not found in database!"));
        }
        const player = { alias: alias, username: username, playerDB: playerDB };
        this.players.push(player);
        this.appendPlayerPastille(player, playerDB);
    }

    protected async attachListeners(): Promise<void> {
        const aliasInput = document.getElementById("alias-input")! as HTMLInputElement;
        const usernameInput = document.getElementById("username-input")! as HTMLInputElement;

        aliasInput.addEventListener("keydown", (event) => {
            if (event.key == "Enter") {
                this.handleUserInput(aliasInput.value, usernameInput.value);
                aliasInput.value = "";
                usernameInput.value = "";
            }
        });
        usernameInput.addEventListener("keydown", (event) => {
            if (event.key == "Enter") {
                this.handleUserInput(aliasInput.value, usernameInput.value);
                aliasInput.value = "";
                usernameInput.value = "";
            }
        });
        aliasInput.addEventListener("animationend", () => {
            aliasInput.classList.remove("animate__animated", "animate__shakeX", "animate__fast", "border-2", "border-red-500");
        })
    }
}