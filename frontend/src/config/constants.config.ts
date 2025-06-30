// ===========================================
// CONSTANTS CONFIG
// ===========================================

/**
 * Constantes pour les noms de pages.
 *
 * `pageNames` contient l'ensemble des noms de pages de l'application.
 * Chaque clé est une page de l'application.
 * La valeur associée à chaque clé est le nom de la page.
 * 
 * @export
 */
export const pageNames = {
	home: 'Home',
	register: 'Register',
	login: 'Login',
	game: 'Game',
	users: 'Users',
	profile: 'Profile',
} as const;

/**
 * Constantes pour les noms de composants.
 *
 * `componentNames` contient l'ensemble des noms de composants de l'application.
 * Chaque clé est un nom de composant.
 * La valeur associée à chaque clé est le nom du composant.
 * 
 * @export
 */
export const componentNames = {
	navbar: 'navbar',
	userRow: 'user-row',
} as const;

/**
 * Constantes pour les identifiants de conteneurs HTML.
 *
 * `HTMLContainers` contient l'ensemble des identifiants de conteneurs HTML
 * de l'application.
 * Chaque clé est un identifiant de conteneur HTML.
 * La valeur associée à chaque clé est l'identifiant HTML correspondant.
 * 
 * @export
 */
export const HTMLContainers = {
	appId: 'app',
	navbarId: 'navbar',
	userListId: 'user-list',
} as const;
