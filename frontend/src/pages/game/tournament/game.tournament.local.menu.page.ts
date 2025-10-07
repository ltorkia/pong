import { BasePage } from '../../base/base.page';
import { RouteConfig } from '../../../types/routes.types';
import { router } from '../../../router/router';
import { TournamentService } from '../../../api/game/game.api';
import { DataService } from '../../../services/user/data.service';
import { TournamentLocal } from '../../../types/game.types';
import { AuthResponse } from '../../../shared/types/response.types';
import { UserModel } from '../../../shared/types/user.types';
import { ROUTE_PATHS } from '../../../config/routes.config';
import { animateCSS } from '../../../utils/animate.utils';
import { translateService, webSocketService } from '../../../services/index.service';
import { Player } from '../../../shared/types/game.types';

const MAX_PLAYERS = 4;

export class GameMenuTournamentLocal extends BasePage {
    private playersNb: number = MAX_PLAYERS;
    private players: { ID: number, alias?: string, username?: string }[] = [];
    private dataApi = new DataService();
    private pastilleHTML: Node | undefined;

    constructor(config: RouteConfig) {
        super(config);
        this.pastilleHTML = document.createElement("div");
    }

    // Fetch HTML stocke localement a reutiliser pour display chaque joueur 
    private async fetchPastille(): Promise<void> {
        const response = await fetch("/templates/game/pastille.html");
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        const pastilleDiv = doc.querySelector("#pastille");
        if (pastilleDiv && this.pastilleHTML)
            this.pastilleHTML = pastilleDiv.cloneNode(true);
    }

    protected async mount(): Promise<void> {
        this.applyAppClasses();
        await this.fetchPastille();
    }

    // Juste du layout
    private applyAppClasses(): void {
        const app = document.getElementById("app");
        app!.classList.add("flex", "border-white");
    }

    // Recupere la pastille de HTML et l'ajoute visuellement a la partie
    private async appendPlayerPastille(player: { alias: string, user?: UserModel }): Promise<void> {
        const pastille = this.pastilleHTML!.cloneNode(true) as HTMLElement;
        const h2 = pastille.querySelector("h2");
        if (player.alias)
            h2!.textContent = `${player.alias}`;
        else
            h2!.textContent = `${player.user?.username}`;
        const pastilleHolder = document.getElementById("pastilles-holder") as HTMLElement;
        pastilleHolder.classList.add("flex", "justify-center", "items-center", "flex-wrap");
        pastille.classList.add("w-1/3", "h-1/3");
        pastilleHolder!.append(pastille);
        this.appendListenerPastille(pastille, player);
        requestAnimationFrame(() => {
            pastille.classList.add("opacity-100");
        });
        const img = pastille.querySelector("img") as HTMLImageElement;
        if (player.user)
            img.src = `${location.origin}/uploads/avatars/${player.user.avatar}`;
        else
            img.src = await this.dataApi.returnDefaultAvatarURL();
    }

    // Listener du bouton remove
    private appendListenerPastille(pastille: HTMLElement, player: { alias: string, username?: string }): void {
        pastille.querySelector("#tournament-cross")?.addEventListener("click", () => {
            const toRemoveIdx = this.players.findIndex(p => p.alias == player.alias);
            this.players.splice(toRemoveIdx, 1);
            animateCSS(pastille, "fadeOut").then(() => pastille.remove());
        })
    }

    // Animation pour print une erreur, error etant une value des JSON translate (tournament.errors.${param})
    private printError(error: string): void {
        const errorDiv = document.createElement("div");
        const tournamentBox = document.querySelectorAll("#input-box")[1];
        const startBtn = document.getElementById("tournament-start-btn");

        errorDiv.textContent = translateService.t(`tournament.errors.${error}`);

        errorDiv.classList.add(
            "absolute", "bottom-50", "left-0", "right-0", "-translate-y-1/2", "-translate-y-6",
            "border-2", "border-red-500", "rounded-md",
            "bg-black", "bg-opacity-90", "m-2", "p-2", "text-center", "text-white",
            "animate__animated", "animate__fadeIn"
        );
        const input = document.getElementById("input-box")!;
        input.insertAdjacentElement("afterend", errorDiv);
        tournamentBox!.classList.add("translate-y-12");
        tournamentBox!.classList.remove("hover:-translate-y-1");
        startBtn!.classList.add("translate-y-12");
        startBtn!.classList.remove("hover:-translate-y-1");

        setTimeout(() => {
            errorDiv.classList.add("animate__animated", "animate__fadeOut");
            setTimeout(() => {
                tournamentBox!.classList.remove("translate-y-12");
                tournamentBox!.classList.add("translate-y-0");
                startBtn!.classList.remove("translate-y-12");
                startBtn!.classList.add("translate-y-0");
                errorDiv.addEventListener("animationend", () => {
                    errorDiv.remove();
                });
                tournamentBox.classList.add("hover:-translate-y-1");
                startBtn!.classList.add("hover:-translate-y-1");
            }, 500);
        }, 1500);
        tournamentBox?.classList.remove("translate-y-0");
        startBtn?.classList.remove("translate-y-0");
    }

    // Check et ajout du player a this.players pour creation d'un futur nouveau tournoi
    private addPlayer(alias: string, user?: UserModel) {
        if (alias.trim() == "")
            return (this.printError("invalidAlias"));
        if (this.players.length >= this.playersNb)
            return (this.printError("full"), null);
        if (user && (this.players.find(player => player.username == user.username ||
            this.players.find(player => player.alias == user.username))))
            return (this.printError("playerAlreadyThere"), null);
        if (this.players.find(player => player.alias == alias))
            return (this.printError("playerAlreadyThere"), null);
        if (user && alias)
            this.players.push({ ID: user.id, alias: alias, username: user.username });
        else if (user && !alias)
            this.players.push({ ID: user.id, alias: user.username, username: user.username });
        else
            this.players.push({ ID: -1, alias: alias }); // unique ID a generer une fois en backend
        console.log(this.players);
        return (true);
    }

    // Verification et fetch du compte si les champs user / pwd sont remplis
    private checkAccount = async (email: string, password: string) => {
        const userData: Record<string, string> = { email, password };
        try {
            const res: Response = await fetch('/api/auth/check_account', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData),
                credentials: 'include',
            });
            const data: AuthResponse = await res.json();
            return (data.user);
        } catch (error: any) {
            this.printError(error);
            return (undefined);
        }
    };

    // Handler du champ alias seul 
    private aliasInputHandler = (event: KeyboardEvent) => {
        const aliasInput = document.getElementById("alias-name-input") as HTMLInputElement;
        const usernameInput = document.getElementById("username-input")! as HTMLInputElement;
        const pwdInput = document.getElementById("password-input")! as HTMLInputElement;

        if (event.key == "Enter") {
            if (!aliasInput.value)
                return (this.printError("noAlias"));
            if (usernameInput.value || pwdInput.value)
                return this.accountInputHandler(event);
            if (!this.addPlayer(aliasInput.value))
                return;
            this.appendPlayerPastille({ alias: aliasInput.value });
            pwdInput.value = aliasInput.value = usernameInput.value = "";
        }
    }

    // Handler du champ email / password (+ alias)
    private accountInputHandler = async (event?: KeyboardEvent) => {
        const aliasInput = document.getElementById("alias-name-input") as HTMLInputElement;
        const usernameInput = document.getElementById("username-input")! as HTMLInputElement;
        const pwdInput = document.getElementById("password-input")! as HTMLInputElement;

        if (event && event.key != "Enter")
            return;
        if (!pwdInput.value || !usernameInput.value)
            return (this.printError("missingField"));
        const user: UserModel | undefined = await this.checkAccount(usernameInput.value, pwdInput.value);
        if (!user)
            return (this.printError("login"));
        if (!this.addPlayer(aliasInput.value, user))
            return;
        this.appendPlayerPastille({ alias: aliasInput.value, user: user });
        aliasInput.value = usernameInput.value = pwdInput.value = "";
    }

    // Juste pour utiliser le meme handler sur le bouton add player
    private btnHandler = () => {
        this.accountInputHandler();
    }

    private startTournamentHandler = async () => {
        if (this.players.length != MAX_PLAYERS)
            return (this.printError("missingPlayer"));

        const players: Player[] = [];

        for (const player of this.players)
            players.push(new Player(player.ID, player.alias || player.username));

        const newTournament = new TournamentLocal(MAX_PLAYERS, undefined, this.currentUser!.id, players, webSocketService.getTabID()!);
        try {
            const tournamentID = await TournamentService.postNewLocalTournament(newTournament);
            sessionStorage.setItem("tournamentID", `${tournamentID}`);
            router.navigate(`${ROUTE_PATHS.GAME_TOURNAMENT_LOCAL_MENU}/${tournamentID}`);
        } catch (error: any) {
            this.printError(error.error);
        }
    }

    protected attachListeners(): void {
        const aliasInput = document.getElementById("alias-name-input") as HTMLInputElement;
        const usernameInput = document.getElementById("username-input")! as HTMLInputElement;
        const pwdInput = document.getElementById("password-input")! as HTMLInputElement;
        const addPlayerBtn = document.getElementById("add-player-btn")!;
        const startTournamentBtn = document.getElementById("tournament-start-btn")!;
        const inputBoxes = document.querySelectorAll("#input-box");

        this.removeListenersFlag = true;

        aliasInput?.addEventListener("keydown", this.aliasInputHandler);
        usernameInput?.addEventListener("keydown", this.accountInputHandler);
        pwdInput?.addEventListener("keydown", this.accountInputHandler);
        addPlayerBtn?.addEventListener("click", this.btnHandler);
        startTournamentBtn?.addEventListener("click", this.startTournamentHandler);

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

    protected removeListeners(): void {
        const aliasInput = document.getElementById("alias-name-input") as HTMLInputElement;
        const usernameInput = document.getElementById("username-input")! as HTMLInputElement;
        const pwdInput = document.getElementById("password-input")! as HTMLInputElement;
        const addPlayerBtn = document.getElementById("add-player-btn")!;
        const startTournamentBtn = document.getElementById("tournament-start-btn")!;

        aliasInput?.removeEventListener("keydown", this.aliasInputHandler);
        usernameInput?.removeEventListener("keydown", this.accountInputHandler);
        pwdInput?.removeEventListener("keydown", this.accountInputHandler);
        addPlayerBtn?.removeEventListener("click", this.btnHandler);
        startTournamentBtn?.removeEventListener("click", this.startTournamentHandler);
    }
}