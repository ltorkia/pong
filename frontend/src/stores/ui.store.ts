// ===========================================
// UI STORE
// ===========================================
/**
 * Store d'etat de l'interface utilisateur.
 * 
 * Ce store contient des informations sur l'etat de l'interface utilisateur.
 * Il est utilise pour stocker des informations telles que l'activation
 * des animations de la barre de navigation à la connexion et la déconnexion.
 * 
 * Lorsque l'utilisateur navigue sur le site, le store est mis a jour
 * pour afficher ou cacher des éléments.
 */
export const uiStore = {
	animateNavbarIn: false,
	animateNavbarOut: false,
};