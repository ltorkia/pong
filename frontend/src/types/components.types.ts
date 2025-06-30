import { RouteConfig } from '../types/routes.types';
import { BaseComponent } from '../components/base/base.component';
import { componentNames, componentContainers, componentPaths } from '../config/components.config';
import { User } from '../models/user.model';

// ===========================================
// COMPONENTS TYPES
// ===========================================
/**
 * Ce fichier contient les types de données liés aux composants.
 *
 * Les composants sont des éléments de l'interface utilisateur qui peuvent être
 * injectés dans des éléments HTML pour ajouter des fonctionnalités ou des
 * contenus dynamiques.
 *
 * Les types définis dans ce fichier servent à définir la structure des données
 * qui configurent les composants.
 */

/**
 * Interface de configuration d'un composant.
 *
 * Un composant est une instance de BaseComponent qui est injectée dans un élément HTML
 * et qui est configurée avec un nom unique, un chemin de template, un id d'élément cible,
 * un booléen pour définir si le composant est public ou non, et un booléen pour définir
 * si le composant est commun à plusieurs pages ou non.
 */
export interface ComponentConfig {
	name: ComponentName;							// Nom unique du composant (ex: 'navbar', 'user-row')
	componentConstructor: ComponentConstructor;		// Classe du composant à instancier
	templatePath: ComponentPath;					// Chemin du template HTML associé au composant
	containerId: ComponentContainer;				// id de l'élément HTML où insérer le composant
	isPublic: boolean;								// Si true, le composant doit s'afficher sur les pages publiques uniquement (login, register)
	isCommon: boolean;								// Si true, le composant est commun à plusieurs pages, si false il est relatif à une seule page
}

/**
 * Type représentant une classe de composant instanciable.
 *
 * Chaque composant doit hériter de BaseComponent et avoir un constructeur avec
 * ces paramètres:
 * - routeConfig: configuration complète de la route (de type RouteConfig)
 * - componentConfig: configuration du composant (de type ComponentConfig)
 * - container: élément HTML dans lequel injecter le contenu du composant
 * - user: utilisateur à afficher dans le composant (facultatif)
 */
export type ComponentConstructor = new (
	routeConfig: RouteConfig,			// Configuration complète de la route
	componentConfig: ComponentConfig,	// Configuration du composant
	container: HTMLElement,				// Élément HTML dans lequel injecter le contenu du composant
	user?: User | null,					// Utilisateur à afficher dans le composant
) => BaseComponent;						// Composant instanciable

/**
 * Types pour les noms de composants.
 * 
 * `ComponentNamesMap` représente le type des noms de composants définis dans `componentNames`.
 * `ComponentName` représente une des valeurs possibles des noms de composants.
 */
export type ComponentNamesMap = typeof componentNames;

/**
 * Type pour les noms de composants.
 * 
 * `ComponentName` représente une des valeurs possibles des noms de composants.
 * Par exemple, si `componentNames` contient l'entrée `"navbar": "navbar"`, alors `ComponentName` peut valoir `"navbar"`.
 */
export type ComponentName = ComponentNamesMap[keyof ComponentNamesMap];

/**
 * Types pour les conteneurs HTML.
 * 
 * `ComponentContainersMap` représente le type des identifiants de conteneurs HTML définis dans `ComponentContainers`.
 * `HTMLContainer` représente une des valeurs possibles des identifiants de conteneurs HTML.
 */
export type ComponentContainersMap = typeof componentContainers;

/**
 * Type pour les identifiants de conteneurs HTML.
 * 
 * `HTMLContainer` représente une des valeurs possibles des identifiants de conteneurs HTML.
 * Par exemple, si `ComponentContainers` contient l'entrée `"root": "#root"`, alors `HTMLContainer` peut valoir `"#root"`.
 */
export type ComponentContainer = ComponentContainersMap[keyof ComponentContainersMap];

/**
 * Type pour les chemins de templates HTML.
 * 
 * `ComponentPathsMap` représente le type des chemins de templates définis dans `componentPaths`.
 * `ComponentPath` représente une des valeurs possibles des chemins de templates.
 */
export type ComponentPathsMap = typeof componentPaths;

/**
 * Type pour les chemins de templates HTML.
 * 
 * `ComponentPath` représente une des valeurs possibles des chemins de templates.
 * Par exemple, si `componentPaths` contient l'entrée `"navbar": "/templates/components/navbar/navbar.component.html"`,
 * alors `ComponentPath` peut valoir `"/templates/components/navbar/navbar.component.html"`.
 */
export type ComponentPath = ComponentPathsMap[keyof ComponentPathsMap];
