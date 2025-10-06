import { BasePage } from '../../base/base.page';
import { RouteConfig } from '../../../types/routes.types';
import { router } from '../../../router/router';
import { secureFetch } from '../../../utils/app.utils';
import { generateUniqueID } from '../../../shared/functions'
import { currentService } from '../../../services/index.service';
import { animateCSS } from '../../../utils/animate.utils';
import { TournamentService } from '../../../api/game/game.api';
import { Tournament } from '../../../types/game.types';
import { loadTemplate } from '../../../utils/dom.utils';

const MAX_PLAYERS = 4;
const MIN_PLAYERS = 4;

export class GameTournamentList extends BasePage {
	private allTournaments: Tournament[] = [];
	private playersNb: number = MIN_PLAYERS; // Minimum players required
	private alias: string = "";
	private tournamentItemHTML: Node;
	private tournamentToCancel: number = 0;

	constructor(config: RouteConfig) {
		super(config);
		this.tournamentItemHTML = document.createElement("div");
		this.fetchTournamentItem();
	}

	protected async mount(): Promise<void> {
		this.getTournaments();
		this.applyAppClasses();
	}

	private applyAppClasses(): void {
		const app = document.getElementById("app");
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
		const html = await loadTemplate("../../../../public/templates/game/tournament_item.html");
		const parser = new DOMParser();
		const doc = parser.parseFromString(html, "text/html");
		const item = doc.querySelector("#tournament-item");
		if (item && this.tournamentItemHTML)
			this.tournamentItemHTML = item.cloneNode(true);
	}

	private printError(error: string): void {
		const errorDiv = document.createElement("div");
		
        // let container, tournamentBox;
        
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

	private handleCancelModal(tournamentID: number): void {
		const cancelDialogOverlay = document.getElementById("cancel-dialog-overlay")!;
		const dialog = document.getElementById("cancel-dialog")!;
		this.tournamentToCancel = tournamentID;

		animateCSS(cancelDialogOverlay, "fadeIn");
		cancelDialogOverlay.classList.remove("hidden", "opacity-0");

		const clickOutsideHandler = (event: MouseEvent) => {
			const target = event.target as HTMLElement;
			if (!dialog.contains(target)) {
				animateCSS(cancelDialogOverlay, "fadeOut").then(() => {
					cancelDialogOverlay.classList.add("hidden");
				});
				cancelDialogOverlay.removeEventListener("click", clickOutsideHandler);
				this.tournamentToCancel = 0;
			}
		};
		cancelDialogOverlay.addEventListener("click", clickOutsideHandler);
	}

	private displayTournamentsAndAttachListeners(allTournaments: Tournament[]): void {
		const tournamentList = document.getElementById("all-tournaments") as HTMLElement;
		while (tournamentList.lastChild)
			tournamentList.lastChild.remove();
		for (const tournament of allTournaments) {
			const tournamentItem = this.tournamentItemHTML.cloneNode(true) as HTMLElement;
			tournamentItem.querySelector("#tournament-name")!.textContent = tournament.name;
			tournamentItem.querySelector("#players")!.textContent = `${tournament.players!.length} / ${tournament.maxPlayers}`;
			if (tournament.players?.length == tournament.maxPlayers)
				tournamentItem.querySelector("#status")!.classList.add("text-red");
			if (tournament.masterPlayerID == this.currentUser!.id) {
				const cancelBtn = tournamentItem.querySelector("#cancel-tournament");
				cancelBtn?.classList.remove("hidden");
				cancelBtn?.addEventListener("click", (event) => {
					event.stopPropagation();
					this.handleCancelModal(tournament.ID);
				});
			}
			tournamentList!.append(tournamentItem);
			tournamentItem.addEventListener("click", async () => {
				// await TournamentService.joinTournament(this.currentUser!.id, tournament.ID);
				await router.navigate(`/game/tournaments/:${tournament.ID}/lobby`);
			});
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
		)))
		this.displayTournamentsAndAttachListeners(allTournaments);
	}

    private async sendTournament(tournamentName: string): Promise<void> {
        const newTournament: Tournament = {
            name: tournamentName,
            maxPlayers: this.playersNb,
            ID: generateUniqueID(this.allTournaments),
            masterPlayerID: currentService.getCurrentUser()!.id,
            isStarted: false,
        };
        try {
            TournamentService.postNewTournament(newTournament);
        } catch (error: any) {
            console.error(error.message);
        }
    }

    // TODO : listen socket pour maj liste tournois et maj joueurs dans tournoi;

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

		document.getElementById("yes-btn")!.addEventListener("click", async (event) => {
			const cancelDialogOverlay = document.getElementById("cancel-dialog-overlay")!;
			await TournamentService.sendDismantleRequest(this.currentUser!.id, this.tournamentToCancel);
			animateCSS(cancelDialogOverlay, "fadeOut").then(() => {
				cancelDialogOverlay.classList.add("hidden");
			});
			await this.getTournaments();
		});

		document.getElementById("no-btn")?.addEventListener("click", () => {
			const cancelDialogOverlay = document.getElementById("cancel-dialog-overlay")!;
			animateCSS(cancelDialogOverlay, "fadeOut").then(() => {
				cancelDialogOverlay.classList.add("hidden");
			});
			this.tournamentToCancel = 0;
		});

		refreshBtn.addEventListener("click", () => this.getTournaments());
	}
}