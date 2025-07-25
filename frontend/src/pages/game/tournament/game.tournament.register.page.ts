import { BasePage } from '../../base/base.page';
import { RouteConfig, RouteParams } from '../../../types/routes.types';

export class GameMenuTournamentRegister extends BasePage {
    private playersNb?: number | RouteParams;
    private players: {alias: string, username?: string}[];
    private pastilleHTML: HTMLElement;

    constructor(config: RouteConfig, nb?: number | RouteParams) {
        super(config);
        this.playersNb = nb;
        this.players = [];
        this.pastilleHTML = document.createElement("div");
    }

    protected async mount(): Promise<void> {
        sessionStorage.removeItem("fromRedirect");
        this.fetchPastille();
        console.log(this.pastilleHTML);
    }

    private async fetchPastille(): Promise<void> {
        try {
            const response = await fetch("../../../../public/templates/game/pastille.html");

            if (!response.ok) {
                throw new Error(`Failed to fetch pastille.html: ${response.status} ${response.statusText}`);
            }

            const html = await response.text();
            console.log("Fetched HTML:", html);

            const parser = new DOMParser();
            const doc = parser.parseFromString(html, "text/html");

            const pastilleDiv = doc.querySelector("#pastille");
            console.log("Parsed #pastille div:", pastilleDiv?.outerHTML);

            if (pastilleDiv && this.pastilleHTML) {
                this.pastilleHTML.innerHTML = pastilleDiv.outerHTML;
            } else {
                console.warn("Either #pastille was not found, or pastilleHTML is not initialized.");
            }
        } catch (error) {
            console.log("COUCOUUUU");
            console.error(error);
        }
    }

    private appendPlayerPastille(player: {alias: string, username?: string}): void {
        const pastille = document.createElement("div");
        pastille.innerHTML = this.pastilleHTML.innerHTML;
        pastille.querySelector("h2")!.textContent = `${player.alias}`;
        if (player.username)
            pastille.querySelector("h2")!.textContent += ` \(${player.username}\)`;
        const pastilleHolder = document.getElementById("pastilles-holder");
        pastilleHolder?.append(pastille);
        // const pastille = document.createElement("div");
        // const name = document.createElement("h2");
        // name.textContent = `${player.alias}`;
        // pastille.append(name);
    }

    private handleUserInput(alias: string, username?: string): void {
        if (username) {
            // request database
        }
        const player = {alias: alias, username: username};
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