import { router } from '../router/router';
import { registerUser, loginUser, logoutUser } from '../api/users';
import { REGISTERED_MSG } from '../config/messages';
import { showError } from '../utils/errors.utils';
import { userStore, User } from '../store/UserStore';
import { getUserLog } from '../api/users';

/**
 * Vérifie si le cookie d'authentification est présent
 * sans faire d'appel API ni accéder au store
 */
export function hasAuthCookie(): boolean {
	return document.cookie.includes('auth_status=active');
}

/**
 * Vérifie si un utilisateur est déjà chargé,
 * sinon tente de le restaurer depuis localStorage ou l'API.
 */
export async function loadOrRestoreUser(): Promise<User | null> {
	// Si un utilisateur est déjà dans le store, pas besoin de vérifier
	if (userStore.getCurrentUser()) {
		return userStore.getCurrentUser();
	}

	// Vérification du cookie compagnon en premier
	if (!hasAuthCookie()) {
		console.log('[UserController] Pas de cookie auth_status, utilisateur non connecté');
		userStore.clearCurrentUser();
		return null;
	}

	console.log('[UserController] Cookie auth_status présent, tentative de restauration utilisateur');

	// Essayer de restaurer depuis localStorage d'abord
	userStore.restoreFromStorage();
	
	if (userStore.getCurrentUser()) {
		console.log('[UserController] Utilisateur restauré depuis localStorage');
		return userStore.getCurrentUser();
	}

	// Si pas d'utilisateur en localStorage mais cookie présent,
	// faire l'appel API pour récupérer les données utilisateur
	try {
		const user = await getUserLog(); // GET /api/me
		if (user) {
			userStore.setCurrentUser(user);
			console.log('[UserController] Utilisateur restauré via /api/me');
			return user;
		} else {
			// Cookie présent mais API retourne null/undefined
			console.warn('[UserController] Cookie présent mais API ne retourne pas d\'utilisateur');
			userStore.clearCurrentUser();
			return null;
		}
	} catch (error) {
		console.warn('[UserController] Erreur lors de la restauration via /api/me:', error);
		userStore.clearCurrentUser();
		return null;
	}
}

/**
 * Gestion formulaire Register
 */
export async function registerController(data: Record<string, string>): Promise<void> {
	try {
		const result = await registerUser(data);
		if (result.errorMessage) {
			console.error('Erreur d’inscription :', result);
			showError(result.errorMessage);
			return;
		}
		
		// Init current user dans le store et localStorage
		const { user } = result;
		userStore.setCurrentUser(user);

		console.log('Utilisateur inscrit :', result);
		alert(REGISTERED_MSG);

		// Redirection home
		await router.redirectPublic('/');

	} catch (err) {
		console.error('Erreur réseau ou serveur', err);
		showError('Erreur réseau.');
	}
}

/**
 * Gestion formulaire Login
 */
export async function loginController(data: Record<string, string>): Promise<void> {
	try {
		const result = await loginUser(data);
		if (result.errorMessage) {
			console.error('Erreur d’authentification :', result);
			showError(result.errorMessage);
			return;
		}
		
		// Init current user dans le store et localStorage
		const { user } = result;
		userStore.setCurrentUser(user);

		console.log('Utilisateur connecté :', result);

		// Redirection home
		await router.redirectPublic('/');

	} catch (err) {
		console.error('Erreur réseau ou serveur', err);
		showError('Erreur réseau.');
	}
}

/**
 * Gestion Logout
 */
export async function logoutController(): Promise<void> {
	try {
		const result = await logoutUser();
		if (result.errorMessage) {
			console.error('Erreur lors du logout :', result);
			showError(result.errorMessage);
			return;
		}
		
		// Nettoyer le store et localStorage
		userStore.clearCurrentUser();
		
		// Redirection SPA vers login
		console.log('Déconnexion réussie. Redirection /login');
		router.redirectPublic('/login');

	} catch (err) {
		console.error('Erreur réseau ou serveur', err);
		showError('Erreur réseau');
	}
}