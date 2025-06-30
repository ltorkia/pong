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
 * `HTMLComponentContainers` contient l'ensemble des identifiants de conteneurs HTML
 * des composants de l'application.
 * Chaque clé est un identifiant de conteneur HTML.
 * La valeur associée à chaque clé est l'identifiant HTML correspondant.
 */
export const componentContainers = {
	navbarId: 'navbar',
	userListId: 'user-list',
} as const;

/**
 * Constantes pour les noms de composants.
 *
 * `componentNames` contient l'ensemble des noms de composants de l'application.
 * Chaque clé est un nom de composant.
 * La valeur associée à chaque clé est le nom du composant.
 */
export const componentNames = {
	navbar: 'navbar',
	userRow: 'user-row',
} as const;

/**
 * Constantes pour les chemins de modèles HTML de composants.
 *
 * `componentPaths` contient l'ensemble des chemins de modèles HTML de composants de l'application.
 * Chaque clé est une page de l'application.
 * La valeur associée à chaque clé est le chemin de de modèle HTML du composant correspondant.
 */
export const componentPaths = {
	[componentNames.navbar]: '/components/common/navbar/navbar-component.html',
	[componentNames.userRow]: '/components/user/users/user-row-component.html',
} as const;

/**
 * Exporte un tableau de configurations de composants.
 * 
 * Chaque élément de ce tableau décrit un composant réutilisable de l'application.
 * 
 * Un composant est décrit par:
 * - son nom unique (permet de l'identifier et de le référencer dans les routes),
 * - la classe du composant (pour instancier le composant dynamiquement),
 * - le chemin vers son template HTML (pour charger le rendu visuel associé),
 * - l'id de l'élément HTML où insérer le composant,
 * - Si isPublic = true, le component doit s'afficher sur les pages publiques uniquement (login, register)
 * - Si isCommon = true, le composant est commun à plusieurs pages, si false il est relatif à une seule page
 */
export const componentsConfig: ComponentConfig[] = [
	{
		name: componentNames.navbar,
		componentConstructor: NavbarComponent,
		templatePath: componentPaths[componentNames.navbar],
		containerId: componentContainers.navbarId,
		isPublic: false,
		isCommon: true
	},
	{
		name: componentNames.userRow,
		componentConstructor: UserRowComponent,
		templatePath: componentPaths[componentNames.userRow],
		containerId: componentContainers.userListId,
		isPublic: false,
		isCommon: false
	}
];