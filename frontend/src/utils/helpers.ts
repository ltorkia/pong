import { userStore } from '../store/UserStore';

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