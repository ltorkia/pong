import { userStore } from '../stores/user.store';

// ===========================================
// APP UTILS
// ===========================================
/**
 * Ce fichier contient des fonctions utilitaires qui
 * fournissent des fonctionnalités réutilisables pour
 * diverses parties de l'application frontend. Cela inclut
 * des méthodes pour gérer les requêtes
 * HTTP sécurisées, paramétrer des promesses, etc.
 */

/**
 * Wrapper sur la fonction native fetch() qui vérifie si l'utilisateur est connecté
 * avant de lancer la requête. Si la session est expirée ou non autorisée,
 * l'utilisateur est déconnecté et une erreur est levée.
 *
 * @param {string} url
 * @param {RequestInit} [options]
 * @returns {Promise<Response | never>} Une promesse qui se résout avec l'objet Response
 * ou qui lance une erreur si la session est expirée ou non autorisée
 * @throws {Error} Si la session est expirée ou non autorisée
 */
export async function secureFetch(url: string, options?: RequestInit): Promise<Response | never> {
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

/**
 * Crée une pause asynchrone pour une durée spécifiée.
 *
 * Renvoie une promesse qui se résout après le nombre spécifié
 * de millisecondes, retardant ainsi la poursuite de l'exécution
 * du code suivant.
 *
 * @param {number} ms - La durée de la pause en millisecondes.
 * @returns {Promise<void>} Une promesse qui se résout automatiquement
 * après ms millisecondes sans valeur.
 */
export function wait(ms: number): Promise<void> {
	// On retourne une nouvelle promesse qui se résout automatiquement après ms millisecondes
	return new Promise(resolve => setTimeout(resolve, ms));
}