import { BasePage } from '../base/base.page';
import { RouteConfig } from '../../types/routes.types';

// ===========================================
// STATS PAGE
// ===========================================
/**
 * Classe représentant la page des statistiques utilisateur.
 */
export class StatsPage extends BasePage {

	constructor(config: RouteConfig) {
		super(config);
	}
}