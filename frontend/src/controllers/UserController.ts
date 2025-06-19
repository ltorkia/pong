import { router } from '../router/router';
import { registerUser, loginUser, logoutUser } from '../api/users';
import { REGISTERED_MSG } from '../config/messages';
import { showError } from '../utils/errors.utils';

export async function registerController(data: Record<string, string>): Promise<void> {
	try {
		const result = await registerUser(data);
		if (result.errorMessage) {
			console.error('Erreur d’inscription :', result);
			showError(result.errorMessage);
			return;
		}

		console.log('Utilisateur inscrit :', result);
		alert(REGISTERED_MSG);
		router.navigate('/login');

	} catch (err) {
		console.error('Erreur réseau ou serveur', err);
		alert('Erreur réseau.');
	}
}

export async function loginController(data: Record<string, string>): Promise<void> {
	try {
		const result = await loginUser(data);
		if (result.errorMessage) {
			console.error('Erreur d’authentification :', result);
			showError(result.errorMessage);
			return;
		}

		console.log('Utilisateur connecté :', result);
		router.redirectPublic('/');

	} catch (err) {
		console.error('Erreur réseau ou serveur', err);
		showError('Erreur réseau.');
	}
}

export async function logoutController(): Promise<void> {
	try {
		const result = await logoutUser();
		if (result.errorMessage) {
			console.error('Erreur lors du logout :', result);
			showError(result.errorMessage);
			return;
		}
		// Nettoyer le localStorage, notifier l'utilisateur ...? A compléter
		
		// Redirection SPA vers login
		console.log('Déconnexion réussie. Redirection /login');
		router.redirectPublic('/login');

	} catch (err) {
		console.error('Erreur réseau ou serveur', err);
		showError('Erreur réseau');
	}
}