import { BasePage } from '../base/base.page';
import { PONG_CAT_PATH } from '../../shared/config/constants.config';
import { RouteConfig } from '../../types/routes.types';
import { getHTMLElementByClass } from '../../utils/dom.utils';

// ===========================================
// RULES PAGE
// ===========================================
/**
 * Les règles du jeu.
 */
export class RulesPage extends BasePage {
	private imgContainer!: HTMLElement;

	/**
	 * Constructeur de la page d'accueil.
	 *
	 * Initialise la configuration de la route et appelle le constructeur
	 * de la classe de base pour établir la configuration initiale de la page.
	 *
	 * @param {RouteConfig} config La configuration de la route actuelle.
	 */
	constructor(config: RouteConfig) {
		super(config);
	}

	// ===========================================
	// METHODES OVERRIDES DE BASEPAGE
	// ===========================================

	protected async beforeMount(): Promise<void> {
		this.imgContainer = getHTMLElementByClass('avatar') as HTMLElement;
	}

	protected async mount(): Promise<void> {
		const img = document.createElement("img");
		img.src = `${PONG_CAT_PATH}`;
		img.alt = "Happy cat";

		this.imgContainer.appendChild(img);
	}
}