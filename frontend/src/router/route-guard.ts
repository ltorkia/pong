import { userSessionService, userCurrentService } from '../services/index.service';
import { DEFAULT_ROUTE, AUTH_FALLBACK_ROUTE } from '../config/routes.config';
import { isPublicRoute } from '../utils/routes.utils';
import { router } from './router';

// ===========================================
// ROUTE GUARD
// ===========================================
/**
 * Classe RouteGuard
 * 
 * Gère la logique d'authentification pour redirections.
 * - Vérifie l'état d'authentification de l'utilisateur (cookies, store, localStorage)
 * - Redirige les utilisateurs non authentifiés vers /login pour les routes privées
 * - Redirige les utilisateurs authentifiés vers / s'ils essaient d'accéder aux pages publiques
 * - Gère la restauration des sessions utilisateur
 */
export class RouteGuard {
	/**
	 * Gère les redirections d'authentification avant d'exécuter une route.
	 * 
	 * - Restaure l'utilisateur depuis localStorage si absent du store.
	 * - Redirige vers /login si l'utilisateur tente d'accéder à une page privée sans être authentifié.
	 * - Redirige vers / si l'utilisateur authentifié tente d'accéder à une page publique (/login, /register).
	 * 
	 * Retourne true si une redirection a eu lieu, false sinon.
	 * 
	 * @private
	 * @param {string} route Chemin de la route à protéger
	 * @returns {Promise<boolean>} true si une redirection a eu lieu, false sinon
	 */
	private async handleAuthRedirect(route: string): Promise<boolean> {
		try {
			const isPublic = isPublicRoute(route);

			// Vérifie si un utilisateur est déjà chargé avec le cookie compagnon
			const authCookieIsActive = userSessionService.hasAuthCookie();
			
			// LOGIQUE DE REDIRECTION
			// Si route privée et user pas authentifié, redirection vers /login
			if (!isPublic && !authCookieIsActive) {
				userCurrentService.clearCurrentUser();
				console.log(`[${this.constructor.name}] Non connecté -> redirection vers /login`);
				await router.redirect(AUTH_FALLBACK_ROUTE);
				return true;
			}

			// Si route publique (login ou register) et user authentifié, redirection vers /
			if (isPublic && authCookieIsActive) {

				// Vérification dans le store d'abord
				if (userCurrentService.getCurrentUser()) {
					console.log(`[${this.constructor.name}] Utilisateur déjà en store -> redirection vers /`);
					await router.redirect(DEFAULT_ROUTE);
					return true;
				}
				
				// Si pas en store mais cookie présent, essayer de restaurer
				// via localStorage puis fallback API
				const user = await userSessionService.loadOrRestoreUser();
				if (user) {
					console.log(`[${this.constructor.name}] Utilisateur restauré -> redirection vers /`);
					await router.redirect(DEFAULT_ROUTE);
					return true;
				}
				// Si pas d'utilisateur mais cookie présent: désynchronisation cookie/serveur
			}

			// Pour les routes privées avec cookie présent, on restaure via localStorage puis fallback API
			if (!isPublic && authCookieIsActive) {
				const user = await userSessionService.loadOrRestoreUser();
				if (!user) {
					// Cookie présent mais pas d'utilisateur valide
					// (cas de désynchronisation ou session expirée côté serveur)
					console.log(`[${this.constructor.name}] Cookie présent mais utilisateur invalide -> redirection vers /login`);
					await router.redirect(AUTH_FALLBACK_ROUTE);
					return true;
				}
				// Désynchronisation cookie/serveur
			}
			return false;

		} catch (err) {
			if (route !== AUTH_FALLBACK_ROUTE) {
				userCurrentService.clearCurrentUser();
				await router.redirect(AUTH_FALLBACK_ROUTE);
				return true;
			} else {
				// On est déjà sur /login, on évite la suppression et la redirection
				console.warn(`[${this.constructor.name}] Erreur critique sur la page de login.`);
				return false;
			}
		}
	}
	
	/**
	 * Méthode publique pour gérer les redirections d'authentification en fonction
	 * de la route demandée et de l'état de l'utilisateur.
	 * 
	 * Appelée par router.ts pour gérer les redirections d'authentification.
	 * 
	 * @param {string} route Chemin de la route que l'on essaye de charger.
	 * @returns {Promise<boolean>} true si une redirection a eu lieu, false sinon.
	 */
	public async checkAuthRedirect(route: string): Promise<boolean> {
		return await this.handleAuthRedirect(route);
	}
}

/**
 * Instance de la classe RouteGuard.
 * Cette instance est utilisée par le routeur pour gérer les redirections d'authentification.
 */
export const routeGuard = new RouteGuard();
