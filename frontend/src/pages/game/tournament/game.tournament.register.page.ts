import { BasePage } from '../../base/base.page';
import { RouteConfig, RouteParams } from '../../../types/routes.types';
import { DataService } from '../../../services/user/data.service';

export class GameMenuTournamentRegister extends BasePage {
    private playersNb: number;
    private players: { alias: string, username?: string }[];
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
        const rowCount = this.playersNb / 4; // make sure this is an integer!
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

    private appendListenerPastille(pastille: HTMLElement, player: {alias: string, username?: string}): void {
        pastille.querySelector("#tournament-cross")?.addEventListener("click", () => {
            const toRemoveIdx = this.players.findIndex(p => p.alias == player.alias);
            this.players.splice(toRemoveIdx, 1);
            pastille.remove();
        })
    }

    private async appendPlayerPastille(player: { alias: string, username?: string }): Promise<void> {
        const pastille = this.pastilleHTML.cloneNode(true) as HTMLElement;
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
        if (!player.username) {
            const img = pastille.querySelector("img") as HTMLImageElement;
            // img.src = this.dataApi.getUserAvatarURL("default");
            img.src = await this.dataApi.returnDefaultAvatarURL();
        } 
    }

    private handleUserInput(alias: string, username?: string): void {
        if (username) {
            // request database
        }
        const player = { alias: alias, username: username };
        this.players.push(player);
        this.appendPlayerPastille(player);
    }

    protected attachListeners(): void {
        const aliasInput = document.getElementById("alias-input")! as HTMLInputElement;
        const usernameInput = document.getElementById("username-input")! as HTMLInputElement;

        aliasInput.addEventListener("keydown", (event) => {
            if (event.key == "Enter") {
                this.handleUserInput(aliasInput.value);
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

    }
}