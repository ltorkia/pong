import { NavbarComponent } from '../components/navbar/navbar.component';
import { UserRowComponent } from '../components/user-row/user-row.component';
import { ComponentConfig } from '../types/components.types';

// ===========================================
// COMPONENTS CONFIG
// ===========================================
/**
 * Ce fichier contient la configuration de tous les composants réutilisables de l'application.
 *
 * Un composant est une instance de BaseComponent qui est injectée dans un élément HTML
 * et qui est configurée avec un nom unique, un chemin de template, un id d'élément cible,
 * un booléen pour définir si le composant est public ou non, et un booléen pour définir
 * si le composant est commun à plusieurs pages ou non.
 *
 * La configuration des composants est exportée sous forme d'un tableau de ComponentConfig.
 * Chaque élément de ce tableau décrit un composant réutilisable de l'application.
 * Les composants sont injectés dans des éléments HTML par le routeur, lors de la navigation.
 */

/**
 * Constantes pour les identifiants de conteneurs HTML de composants.
 *
 * `HTML_COMPONENT_CONTAINERS` contient l'ensemble des identifiants de conteneurs HTML
 * des composants de l'application.
 * Chaque clé est un identifiant de conteneur HTML.
 * La valeur associée à chaque clé est l'identifiant HTML correspondant.
 */
export const HTML_COMPONENT_CONTAINERS = {
	navbarId: 'navbar',
	userListId: 'user-list',
} as const;

/**
 * Constantes pour les noms de composants.
 *
 * `COMPONENT_NAMES` contient l'ensemble des noms de composants de l'application.
 * Chaque clé est un nom de composant.
 * La valeur associée à chaque clé est le nom du composant.
 */
export const COMPONENT_NAMES = {
	navbar: 'navbar',
	userRow: 'user-row',
} as const;

/**
 * Constantes pour les chemins de modèles HTML de composants.
 *
 * `COMPONENT_PATHS` contient l'ensemble des chemins de modèles HTML de composants de l'application.
 * Chaque clé est une page de l'application.
 * La valeur associée à chaque clé est le chemin de de modèle HTML du composant correspondant.
 */
export const COMPONENT_PATHS = {
	[COMPONENT_NAMES.navbar]: '/components/common/navbar/navbar-component.html',
	[COMPONENT_NAMES.userRow]: '/components/user/users/user-row-component.html',
} as const;

/**
 * Configuration statique des composants réutilisables de l’application.
 * 
 * Chaque élément de ce tableau décrit un composant par ses propriétés statiques:
 * - `name`: Nom unique permettant d’identifier et référencer le composant,
 * - `componentConstructor`: Constructeur permettant d’instancier dynamiquement le composant,
 * - `templatePath`: Chemin vers le template HTML servant au rendu visuel du composant,
 * - `containerId`: ID de l’élément HTML dans lequel le composant sera inséré,
 * - `isPublic`: Indique si le composant s’affiche uniquement sur les pages publiques (ex: login, register),
 * - `isPersistent`: Booléen indiquant si le composant est persistant, c’est-à-dire créé une fois et conservé entre les pages,
 * - `destroy`: Indique si un nettoyage manuel est requis lors de la destruction d’un composant persistant.
 * 
 * Cette configuration est statique et partagée durant toute l’exécution de l’application.
 * 
 * Les propriétés dynamiques (comme `instance` ou `destroy`) sont modifiées directement
 * sur cette configuration partagée, ce qui implique que l’état des composants est centralisé.
 * 
 * Exemples d’utilisation:
 * - Composants non persistants générés et détruits à chaque chargement de page (ex: lignes de tableau `/users`),
 * - Composants persistants créés une seule fois et conservés (ex: navbar générée à la connexion et détruite à la déconnexion).
 */

export const componentsConfig: ComponentConfig[] = [
	{
		name: COMPONENT_NAMES.navbar,
		componentConstructor: NavbarComponent,
		templatePath: COMPONENT_PATHS[COMPONENT_NAMES.navbar],
		containerId: HTML_COMPONENT_CONTAINERS.navbarId,
		isPublic: false,
		isPersistent: true,
		destroy: true
		// instance: créee et stockée ici lors de la connexion, undefined avant ça
	},
	{
		name: COMPONENT_NAMES.userRow,
		componentConstructor: UserRowComponent,
		templatePath: COMPONENT_PATHS[COMPONENT_NAMES.userRow],
		containerId: HTML_COMPONENT_CONTAINERS.userListId,
		isPublic: false,
		isPersistent: false
	}
];