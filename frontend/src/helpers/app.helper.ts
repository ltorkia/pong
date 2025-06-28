import { userStore } from '../stores/UserStore';

// Vérifie qu'on ne tombe pas sur l'erreur 401 après chaque requête api.
// Si oui l'utilisateur est déconnecté, alors on clear le local storage et on le déco totalement.
export async function secureFetch(url: string, options?: RequestInit) {
	const res = await fetch(url, { credentials: 'include', ...options });
	if (res.status === 401 || res.status === 403) {

		// Token invalide/expiré → nettoyage local uniquement
		// + redirection '/login'
		userStore.clearCurrentUser();
		console.warn(`[secureFetch] Session invalide (status ${res.status})`);
		throw new Error('Session expirée ou non autorisée');
	}
	return res;
}

// Crée une pause asynchrone avant de passer à la suite du code
export function wait(ms: number): Promise<void> {
	// On retourne une nouvelle promesse qui se résout automatiquement après ms millisecondes
	return new Promise(resolve => setTimeout(resolve, ms));
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