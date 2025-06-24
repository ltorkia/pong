import { router } from '../router/router';
import { userManager } from '../managers/UserManager';
import { showError } from '../utils/errors.utils';
import { REGISTERED_MSG } from '../config/messages';

/**
 * Gère les erreurs, les redirections, les feedbacks visuels
 * liés à l'authentification du current user.
 */
export class UserController {

	/**
	 * Gestion Register
	 * UserManager s'occupe de faire la requête API
	 * + stockage du user dans store + localStorage
	 * Ici on redirige et on gère les erreurs
	 */
	public async registerController(data: Record<string, string>) {
		try {
			const result = await userManager.register(data);
			if (result.errorMessage) {
				console.error('Erreur d’inscription :', result);
				showError(result.errorMessage);
				return;
			}
			// Redirection home
			alert(REGISTERED_MSG);
			await router.redirectPublic('/');

		} catch (err) {
			console.error('Erreur réseau ou serveur', err);
			showError('Erreur réseau');
		}
	}

	/**
	 * Gestion Login
	 * UserManager s'occupe de faire la requête API
	 * + stockage du user dans store + localStorage
	 * Ici on redirige et on gère les erreurs
	 */
	public async loginController(data: Record<string, string>) {
		try {
			const result = await userManager.login(data);
			if (result.errorMessage) {
				console.error('Erreur d’authentification :', result);
				showError(result.errorMessage);
				return;
			}
			// Redirection home
			console.log('Utilisateur connecté :', result);
			await router.redirectPublic('/');

		} catch (err) {
			console.error('Erreur réseau ou serveur', err);
			showError('Erreur réseau');
		}
	}

	/**
	 * Gestion Logout
	 * UserManager s'occupe de faire la requête API
	 * + update / clear du user dans store + localStorage
	 * Ici on redirige et on gère les erreurs
	 */
	public async logoutController(): Promise<void> {
		try {
			const result = await userManager.logout();
			if (result.errorMessage) {
				console.error('Erreur lors du logout :', result);
				showError(result.errorMessage);
				return;
			}
			// Redirection SPA vers login
			console.log('Déconnexion réussie. Redirection /login');
			await router.redirectPublic('/login');

		} catch (err) {
			console.error('Erreur réseau ou serveur', err);
			showError('Erreur réseau');
		}
	}
}