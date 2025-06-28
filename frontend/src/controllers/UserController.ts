import { router } from '../router/Router';
import { defaultRoute, authFallbackRoute } from '../config/routes.config';
import { showError } from '../helpers/app.helper';
import { REGISTERED_MSG } from '../config/messages';
import { userApi } from '../api/user.api';
import { userStore } from '../stores/UserStore';
import { User } from '../models/user.model';

/**
 * Gère les erreurs, les redirections, les feedbacks visuels
 * et requêtes API liés à l'authentification du current user.
 */
export class UserController {

	/**
	 * Gestion Register
	 * Fait directement la requête API + stockage + redirection
	 */
	public async registerController(data: Record<string, string>): Promise<void> {
		try {
			const result = await userApi.registerUser(data);
			if (result.errorMessage) {
				console.error('Erreur d\'inscription :', result);
				showError(result.errorMessage);
				return;
			}
			
			console.log('Utilisateur inscrit :', result);
			const user = User.fromJSON(result.user!);
			userStore.setCurrentUser(user);
			
			// Redirection home
			alert(REGISTERED_MSG);
			await router.redirectPublic(defaultRoute);

		} catch (err) {
			console.error('Erreur réseau ou serveur', err);
			showError('Erreur réseau');
		}
	}

	/**
	 * Gestion Login
	 * Fait directement la requête API + stockage + redirection
	 */
	public async loginController(data: Record<string, string>): Promise<void> {
		try {
			const result = await userApi.loginUser(data);
			if (result.errorMessage) {
				console.error('Erreur d\'authentification :', result);
				showError(result.errorMessage);
				return;
			}
			
			console.log('Utilisateur connecté :', result);
			const user = User.fromJSON(result.user!);
			userStore.setCurrentUser(user);
			
			// Redirection home
			await router.redirectPublic(defaultRoute);

		} catch (err) {
			console.error('Erreur réseau ou serveur', err);
			showError('Erreur réseau');
		}
	}

	/**
	 * Gestion Logout
	 * Fait directement la requête API + clear store + redirection
	 */
	public async logoutController(): Promise<void> {
		try {
			const result = await userApi.logoutUser();
			if (result.errorMessage) {
				console.error('Erreur lors du logout :', result);
				showError(result.errorMessage);
				return;
			}
			
			console.log('Utilisateur déconnecté :', result);
			userStore.clearCurrentUser();
			
			// Redirection SPA vers login
			console.log('Déconnexion réussie. Redirection /login');
			await router.redirectPublic(authFallbackRoute);

		} catch (err) {
			console.error('Erreur réseau ou serveur', err);
			showError('Erreur réseau');
		}
	}
}