import { currentService } from '../services/index.service';
import { router } from '../router/router';
import { DEFAULT_ROUTE } from '../config/routes.config';

// ===========================================
// APP UTILS
// ===========================================
/**
 * Ce fichier contient des fonctions utilitaires qui
 * fournissent des fonctionnalités réutilisables pour
 * diverses parties de l'application frontend. Cela inclut
 * gérer les requêtes HTTP sécurisées, paramétrer des promesses, etc.
 */

/**
 * Vérifie qu'un utilisateur est bien authentifié si la page est privée.
 *
 * Si la page est privée, cette méthode vérifie que l'utilisateur est
 * bien authentifié en vérifiant l'existence de l'utilisateur courant.
 * Si l'utilisateur n'est pas trouvé, une erreur est levée.
 * 
 * @param {boolean} isPublic La configuration du composant à charger.
 * @returns {boolean} Retourne true si l'utilisateur est authentifié, false sinon.
 */
export function checkUserLogged(isPublic: boolean): boolean {
	const currentUser = currentService.getCurrentUser();
	if (!isPublic && !currentUser) {
		console.error(`La récupération du user a échoué`);
		return false;
	}
	return true;
}

/**
 * Formatte une date au format ISO 8601 (par exemple, '2022-01-01T14:30:00.000Z')
 * en une chaîne de caractères lisible pour un utilisateur français.
 *
 * @param {string} dateString - La date à formatter, au format ISO 8601.
 * @returns {string} La date formatée, au format 'jj/mm/aaaa HH:MM'.
 */
export function formatDate(dateString: string): string {
	const date = new Date(dateString);
	return date.toLocaleDateString('fr-FR', { 
		day: 'numeric', 
		month: 'short', 
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	});
}

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
		currentService.clearCurrentUser();
		console.warn(`[secureFetch] Session invalide (status ${res.status})`);
		throw new Error('Session expirée ou non autorisée');
	} else if (res.status === 409) {
		console.warn(`[secureFetch] Conflit (status ${res.status})`);
		await router.redirect(DEFAULT_ROUTE);
		throw new Error('Relation bloquée ou invalide');
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