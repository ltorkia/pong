import { userStore } from '../store/UserStore';
import { PUBLIC_ROUTES } from '../config/public.routes';

// Vérifie qu'on ne tombe pas sur l'erreur 401 après chaque requête api.
// Si oui l'utilisateur est déconnecté, alors on clear le local storage et on le déco totalement.
export async function secureFetch(url: string, options?: RequestInit) {
	const res = await fetch(url, { credentials: 'include', ...options });
	if (res.status === 401) {

		// Token invalide/expiré → nettoyage local uniquement
		userStore.clearCurrentUser();

		console.warn('[secureFetch] Session expirée → aucun utilisateur connecté localement');
		throw new Error('Session expirée');
	}
	return res;
}

// Crée une pause asynchrone avant de passer à la suite du code
export function wait(ms: number): Promise<void> {
	// On retourne une nouvelle promesse qui se résout automatiquement après ms millisecondes
	return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Vérifie si une route est publique.
 * 
 * Accepte soit un objet contenant une propriété route, soit une chaîne de caractères représentant le chemin.
 * Compare ensuite à la liste PUBLIC_ROUTES (/login, /register...)
 */
export function isPublicRoute(routeOrPath: { route: string } | string | null): boolean {
	const publicRoutes = PUBLIC_ROUTES.map((route) => `${route}`);

	if (!routeOrPath) return false;

	// Si on reçoit un objet avec une propriété route
	if (typeof routeOrPath === 'object' && 'route' in routeOrPath) {
		return publicRoutes.includes(routeOrPath.route);
	}

	// Si on reçoit directement un chemin (string)
	if (typeof routeOrPath === 'string') {
		return publicRoutes.includes(routeOrPath);
	}

	return false;
}

/**
 * Vérifie si le chemin d’un template HTML correspond à une page publique.
 * Utilisé pour savoir s’il faut afficher la navbar ou d’autres éléments seulement sur les pages privées.
 */
export function isPublicTemplate(templatePath: string): boolean {
	const publicTemplates = PUBLIC_ROUTES.map(route => `/templates${route}.html`);
	return publicTemplates.includes(templatePath);
}

/**
 * Wrapper pour styliser les messages d'erreur sur les pages
 */
export function showError(message: string) {
	const alertDiv = document.getElementById('alert');
	if (alertDiv) {
		const cautionIcon = '<i class="fa-solid fa-circle-exclamation"></i> ';
		alertDiv.innerHTML = cautionIcon + message;
		alertDiv.classList.remove('hidden');
	}
}