import { userManager } from '../managers/UserManager';
import { userStore } from '../stores/user-store';
import { defaultRoute, authFallbackRoute } from '../config/routes.config';
import { isPublicRoute } from '../helpers/routes.helper';
import { Router } from './Router';

/**
 * Gère la logique d'authentification pour redirections.
 * - Vérifie l'état d'authentification du user (cookies, store, localStorage)
 * - Redirige les non authentifiés vers /login pour les routes privées
 * - Redirige les authentifiés vers / s'ils vont sur les pages publiques
 * - Gére la restauration des sessions utilisateur
 */
export class RouteGuard {
	private router: Router;

	constructor(router: Router) {
		this.router = router;
	}

	/**
	 * Gère les redirections d'authentification avant d'exécuter une route.
	 * 
	 * - Restaure l'utilisateur depuis localStorage si absent du store.
	 * - Redirige vers /login si l'utilisateur tente d'accéder à une page privée sans être authentifié.
	 * - Redirige vers / si l'utilisateur authentifié tente d'accéder à une page publique (/login, /register).
	 * 
	 * Retourne true si une redirection a eu lieu, false sinon.
	 */
	private async handleAuthRedirect(route: string): Promise<boolean> {
		try {
			const isPublic = isPublicRoute(route);

			// Vérifie si un utilisateur est déjà chargé avec le cookie compagnon
			const authCookieIsActive = userManager.hasAuthCookie();
			
			// LOGIQUE DE REDIRECTION
			// Si route privée et user pas authentifié, redirection vers /login
			if (!isPublic && !authCookieIsActive) {
				userStore.clearCurrentUser();
				console.log(`[${this.constructor.name}] Non connecté -> redirection vers /login`);
				await this.router.redirectPublic(authFallbackRoute);
				return true;
			}

			// Si route publique (login ou register) et user authentifié, redirection vers /
			if (isPublic && authCookieIsActive) {

				// Vérification dans le store d'abord
				if (userStore.getCurrentUser()) {
					console.log(`[${this.constructor.name}] Utilisateur déjà en store -> redirection vers /`);
					await this.router.redirectPublic(defaultRoute);
					return true;
				}
				
				// Si pas en store mais cookie présent, essayer de restaurer
				// via localStorage puis fallback API
				const user = await userManager.loadOrRestoreUser();
				if (user) {
					console.log(`[${this.constructor.name}] Utilisateur restauré -> redirection vers /`);
					await this.router.redirectPublic(defaultRoute);
					return true;
				}
				// Si pas d'utilisateur mais cookie présent: désynchronisation cookie/serveur
			}

			// Pour les routes privées avec cookie présent, on restaure via localStorage puis fallback API
			if (!isPublic && authCookieIsActive) {
				const user = await userManager.loadOrRestoreUser();
				if (!user) {
					// Cookie présent mais pas d'utilisateur valide
					// (cas de désynchronisation ou session expirée côté serveur)
					console.log(`[${this.constructor.name}] Cookie présent mais utilisateur invalide -> redirection vers /login`);
					await this.router.redirectPublic(authFallbackRoute);
					return true;
				}
				// Désynchronisation cookie/serveur
			}
			return false;

		} catch (err) {
			console.error(`[${this.constructor.name}] Erreur critique`, err);
			userStore.clearCurrentUser();
			await this.router.redirectPublic(authFallbackRoute);
			return true;
		}
	}

	/**
	 * Méthode publique pour appeler handleAuthRedirect depuis RouterCore
	 */
	public async checkAuthRedirect(route: string): Promise<boolean> {
		return await this.handleAuthRedirect(route);
	}
}