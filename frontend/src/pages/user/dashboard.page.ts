import { BasePage } from '../base/base.page';
import { RouteConfig } from '../../types/routes.types';
import { getHTMLElementById } from '../../utils/dom.utils';
import { User } from '../../shared/models/user.model';
import { Friend } from '../../shared/models/friend.model';
import { Game } from '../../shared/models/game.model';
import { Tournament } from '../../shared/models/tournament.model';
import { dataApi, friendApi } from '../../api/index.api';
import { Chart, LineController, LineElement, PointElement, LinearScale, Title, CategoryScale, ArcElement, DoughnutController } from 'chart.js';
import { dataService, translateService } from '../../services/index.service';

// ===========================================
// DASHBOARD PAGE
// ===========================================
/**
 * Classe représentant la page des statistiques utilisateur.
 */
export class DashboardPage extends BasePage {
	private dahsboardContainer!: HTMLElement;

	private userStats: User | null = null;
	private userFriends: Friend[] = [];
	private userGames: Game[] = [];
	private userTournaments: Tournament[] = [];

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

		this.lineCtx = document.getElementById('lineChart') as HTMLCanvasElement;
		this.pieCtx = document.getElementById('pieChart') as HTMLCanvasElement;

		try {
			this.userStats = await dataApi.getUserStats(this.currentUser!.id);
			this.userFriends = await friendApi.getUserFriends(this.currentUser!.id);
			this.userGames = await dataApi.getUserGames(this.currentUser!.id);
			this.userTournaments = await dataApi.getUserTournaments(this.currentUser!.id);
		} catch (error) {
			console.error('Erreur lors du chargement du profil:', error);
			throw error;
		}
	}

	/**
	 * Montage de la page de dashboard.
	 * 
	 * @returns {Promise<void>} Une promesse qui se résout lorsque le composant est monté.
	 */
	protected async mount(): Promise<void> {
		this.renderStats();
		this.renderLineChart();
		this.renderPieChart();
		// this.defaultGraphics();
	}

	/**
	 * Rendu des statistiques utilisateur
	 */
	private renderStats(): void {
		const section = document.getElementById('stats-section') as HTMLDivElement;
		const template = document.getElementById('stat-card-template') as HTMLTemplateElement;

		if (!section || !template) 
			return;

		const totalGames = this.userStats!.gamePlayed;
		const winRate = this.userStats!.winRate;

		const stats = [
			{ icon: `<i class="fa-solid fa-trophy"></i>`, value: this.userStats!.gameWin || 0, label: 'Average score', translate: "dashboard.averageScore" },
			{ icon: `<i class="fa-solid fa-circle-xmark"></i>`, value: this.userStats!.gameLoose || 0, label: 'Streaks', translate: "dashboard.streak" },
			{ icon: `<i class="fa-solid fa-star-half-stroke"></i>`, value: `${winRate}%`, label: 'Win Rate', translate: "profile.winRateLabel" },
			{ icon: `<i class="fa-solid fa-table-tennis-paddle-ball"></i>`, value: totalGames, label: 'Game played', translate: "profile.gamePlayedLabel" }
		];

		stats.forEach(stat => {
			const clone = template.content.cloneNode(true) as DocumentFragment;
			const value = clone.querySelector('.stat-value') as HTMLElement;
			const label = clone.querySelector('.stat-label') as HTMLElement;
			const icon = clone.querySelector('.stat-icon') as HTMLElement;

			icon.innerHTML = stat.icon;

			value.textContent = stat.value.toString();
			label.textContent = stat.label;
			label.setAttribute('data-ts', stat.translate);

			section.appendChild(clone);
			translateService.updateLanguage(undefined, section);
		});
	}

	/**
	 * Rendu du graphique de ligne
	 */
	private renderLineChart(): void {
		const labels = this.userGames.map(game => game.begin);
		const data = this.userGames.map(game => game.avgScore);

		new Chart(this.lineCtx, {
			type: 'line',
			data: {
				labels: labels,
				datasets: [{
					label: 'Average score',
					data: data,
					backgroundColor: 'rgba(75, 192, 192, 0.2)',
					borderColor: 'rgba(75, 192, 192, 1)',
					borderWidth: 1
				}]
			},
			options: {
				scales: {
					y: {
						beginAtZero: true
					}
				}
			}
		});
	}

	/**
	 * Rendu du graphique circulaire
	 */
	private renderPieChart(): void {
		const labels = ['Win', 'Loose'];
		const data = [this.userStats!.gameWin, this.userStats!.gameLoose];

		new Chart(this.pieCtx, {
			type: 'doughnut',
			data: {
				labels: labels,
				datasets: [{
					data: data,
					backgroundColor: [
						'rgba(75, 192, 192, 0.2)',
						'rgba(255, 99, 132, 0.2)'
					],
					borderColor: [
						'rgba(75, 192, 192, 1)',
						'rgba(255, 99, 132, 1)'
					],
					borderWidth: 1
				}]
			}
		});
	}

	/**
	 * Modèle / exemple de rendu des graphiques utilisateur
	 */
	private defaultGraphics(): void {
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
}