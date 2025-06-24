import { userManager } from '../managers/UserManager';
import { userStore } from '../store/UserStore';
import { isPublicRoute } from '../utils/navigation.utils';

/**
 * Gère la logique d'authentification pour redirections.
 * - Vérifie l'état d'authentification du user (cookies, store, localStorage)
 * - Redirige les non authentifiés vers /login pour les routes privées
 * - Redirige les authentifiés vers / s'ils vont sur les pages publiques
 * - Gére la restauration des sessions utilisateur
 */
export class RouteGuard {
	constructor(private router: any) {}

	/**
	 * Gère les redirections d'authentification avant d'exécuter une route.
	 * 
	 * - Restaure l'utilisateur depuis localStorage si absent du store.
	 * - Redirige vers /login si l'utilisateur tente d'accéder à une page privée sans être authentifié.
	 * - Redirige vers / si l'utilisateur authentifié tente d'accéder à une page publique (/login, /register).
	 * 
	 * Retourne true si une redirection a eu lieu, false sinon.
	 */
	private async handleAuthRedirect(matchedRoute: { route: string }): Promise<boolean> {
		try {
			const isPublic = isPublicRoute(matchedRoute.route);

			// Vérifie si un utilisateur est déjà chargé avec le cookie compagnon
			const authCookieIsActive = userManager.hasAuthCookie();
			
			// LOGIQUE DE REDIRECTION
			// Si route privée et user pas authentifié, redirection vers /login
			if (!isPublic && !authCookieIsActive) {
				userStore.clearCurrentUser();
				console.log('[handleAuthRedirect] Non connecté -> redirection vers /login');
				await this.router.redirect('/login');
				return true;
			}

			// Si route publique (login ou register) et user authentifié, redirection vers /
			if (isPublic && authCookieIsActive) {

				// Vérification dans le store d'abord
				if (userStore.getCurrentUser()) {
					console.log('[handleAuthRedirect] Utilisateur déjà en store -> redirection vers /');
					await this.router.redirect('/');
					return true;
				}
				
				// Si pas en store mais cookie présent, essayer de restaurer
				// via localStorage puis fallback API
				const user = await userManager.loadOrRestoreUser();
				if (user) {
					console.log('[handleAuthRedirect] Utilisateur restauré -> redirection vers /');
					await this.router.redirect('/');
					return true;
				}
				// Si pas d'utilisateur mais cookie présent: désynchronisation cookie/serveur
			}

			// Seulement pour les routes privées avec cookie présent, on charge le user avec requête API
			if (!isPublic && authCookieIsActive) {
				const user = await userManager.loadOrRestoreUser();
				if (!user) {
					// Cookie présent mais pas d'utilisateur valide
					// (cas de désynchronisation ou session expirée côté serveur)
					console.log('[handleAuthRedirect] Cookie présent mais utilisateur invalide -> redirection vers /login');
					await this.router.redirect('/login');
					return true;
				}
			}

			return false;

		} catch (err) {
			console.error('[handleAuthRedirect] Erreur critique', err);
			userStore.clearCurrentUser();
			await this.router.redirect('/login');
			return true;
		}
	}

	/**
	 * Méthode publique pour appeler handleAuthRedirect depuis RouterCore
	 */
	public async checkAuthRedirect(matchedRoute: { route: string }): Promise<boolean> {
		return await this.handleAuthRedirect(matchedRoute);
	}
}