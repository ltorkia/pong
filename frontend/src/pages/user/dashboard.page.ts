import { BasePage } from '../base/base.page';
import { RouteConfig } from '../../types/routes.types';
import { getHTMLElementById } from '../../utils/dom.utils';
import { Chart, LineController, LineElement, PointElement, LinearScale, Title, CategoryScale, ArcElement, DoughnutController } from 'chart.js';

// ===========================================
// DASHBOARD PAGE
// ===========================================
/**
 * Classe représentant la page des statistiques utilisateur.
 */
export class DashboardPage extends BasePage {
	private dahsboardContainer!: HTMLElement;

	private totalGames: number = 0;
	private winRate: number = 0;
	private avgScore: number = 0;
	private streak: number = 0;

	private totalGamesElm!: HTMLElement;
	private winRateElm!: HTMLElement;
	private avgScoreElm!: HTMLElement;
	private streakElm!: HTMLElement;

	private lineCtx!: HTMLCanvasElement;
	private pieCtx!: HTMLCanvasElement;

	constructor(config: RouteConfig) {
		super(config);
	}

	// ===========================================
	// METHODES OVERRIDES DE BASEPAGE
	// ===========================================
	/**
	 * Récupère les éléments HTML de la page d'accueil avant de la monter.
	 * 
	 * Stocke les éléments HTML suivants dans les propriétés de l'objet:
	 * - welcomeContainer: le conteneur de la zone de bienvenue.
	 * - avatarContainer: le conteneur de l'avatar qui sera mis à jour avec l'image sélectionnée.
	 * 
	 * @returns {Promise<void>} Une promesse qui se résout lorsque les éléments HTML ont été stockés.
	 */
	protected async beforeMount(): Promise<void> {
		// Composants à enregistrer
		Chart.register(LineController, LineElement, PointElement, LinearScale, Title, CategoryScale, ArcElement, DoughnutController);

		this.dahsboardContainer = getHTMLElementById('dashboard');
		this.totalGamesElm = getHTMLElementById('total-games');
		this.winRateElm = getHTMLElementById('win-rate');
		this.avgScoreElm = getHTMLElementById('avg-score');
		this.streakElm = getHTMLElementById('streak');

		this.lineCtx = document.getElementById('lineChart') as HTMLCanvasElement;
		this.pieCtx = document.getElementById('pieChart') as HTMLCanvasElement;
	}

	/**
	 * Montage de la page de dashboard.
	 * 
	 * Mets à jour les éléments HTML de la page avec des valeurs de démonstration.
	 * Les éléments HTML suivants sont mis à jour:
	 * - `#total-games`: le nombre total de parties jouées.
	 * - `#win-rate`: le taux de victoire.
	 * - `#avg-score`: le score moyen.
	 * - `#streak`: le nombre de parties gagnées consécutives.
	 * 
	 * Deux graphiques sont également générés:
	 * - Un graphique de ligne (`#lineChart`) montrant l'évolution
	 *   du score moyen dans le temps.
	 * - Un graphique circulaire (`#pieChart`) montrant le nombre de
	 *   victoires et de défaites.
	 * 
	 * @returns {Promise<void>} Une promesse qui se résout lorsque le composant est monté.
	 */
	protected async mount(): Promise<void> {
		// Exemple de stats
		this.totalGames = 152;
		this.winRate = 60;
		this.avgScore = 8.4;
		this.streak = 5;

		this.totalGamesElm.textContent = this.totalGames.toString();
		this.winRateElm.textContent = `${this.winRate}%`;
		this.avgScoreElm.textContent = this.avgScore.toString();
		this.streakElm.textContent = this.streak.toString();

		// Scores dans le temps
		new Chart(this.lineCtx, {
			type: 'line',
			data: {
				labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
				datasets: [
					{
						label: 'Average score',
						data: [8, 10, 7, 9, 11],
						borderColor: 'rgb(75, 192, 192)',
						tension: 0.2
					}
				]
			}
		});

		// Victoires vs défaites
		new Chart(this.pieCtx, {
			type: 'doughnut',
			data: {
				labels: ['Victories', 'Losses'],
				datasets: [
					{
						label: 'Résults',
						data: [90, 62],
						backgroundColor: ['#3b4e7f', '#b9525b']
					}
				]
			}
		});
	}

	// ===========================================
	// METHODES PRIVATES
	// ===========================================
}