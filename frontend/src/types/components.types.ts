import { RouteConfig } from '../types/routes.types';
import { BaseComponent } from '../components/base/base.component';
import { COMPONENT_NAMES, HTML_COMPONENT_CONTAINERS, COMPONENT_PATHS } from '../config/components.config';
import { User } from '../shared/models/user.model';
import { PaginationInfos } from '../shared/types/user.types';

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
 * Interface de configuration d’un composant.
 *
 * Un composant est défini par :
 * - un nom unique, utilisé pour l’identifier et le référencer dans les routes,
 * - un constructeur, permettant d’instancier dynamiquement le composant,
 * - un chemin vers son template HTML, pour charger son rendu visuel,
 * - l’identifiant de l’élément HTML dans lequel il doit être inséré,
 * - `isPublic`: si true, le composant s’affiche uniquement sur les pages publiques (ex : login, register),
 * - `isPersistent`: si true, le composant est conservé entre les pages et ne dépend pas du cycle de vie d’une page,
 * - `destroy`: si true, un composant persistant doit être explicitement détruit (par exemple à la déconnexion),
 * - `instance`: si une instance d’un composant persistant est conservée, elle peut être récupérée par les pages suivantes
 *   pour permettre son nettoyage si `destroy` est activé.
 */
export interface ComponentConfig {
	name: ComponentName;
	componentConstructor: ComponentConstructor;
	templatePath: ComponentPath;
	containerId: ComponentContainer;
	isPublic?: boolean;
	isPersistent?: boolean;
	destroy?: boolean;
	instance?: BaseComponent;
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
 * - paginationParams: propriétés de pagination + fonction de changement de page (facultatif)
 */
export type ComponentConstructor = new (
	routeConfig: RouteConfig,
	componentConfig: ComponentConfig,
	container: HTMLElement,
	user?: User | null,
	PaginationParams?: PaginationParams
) => BaseComponent;

/**
 * Types pour les paramètres de pagination.
 */
export interface PaginationParams {
	infos: PaginationInfos;
	onPageChange: (page: number) => void;
}

/**
 * Types pour les noms de composants.
 * 
 * `ComponentNamesMap` représente le type des noms de composants définis dans `componentNames`.
 * `COMPONENT_NAMES` représente une des valeurs possibles des noms de composants.
 */
export type ComponentNamesMap = typeof COMPONENT_NAMES;

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
 * `HTML_COMPONENT_CONTAINERS` représente une des valeurs possibles des identifiants de conteneurs HTML.
 */
export type ComponentContainersMap = typeof HTML_COMPONENT_CONTAINERS;

/**
 * Type pour les identifiants de conteneurs HTML.
 * 
 * `ComponentContainer` représente une des valeurs possibles des identifiants de conteneurs HTML.
 * Par exemple, si `ComponentContainers` contient l'entrée `"root": "#root"`, alors `HTMLContainer` peut valoir `"#root"`.
 */
export type ComponentContainer = ComponentContainersMap[keyof ComponentContainersMap];

/**
 * Type pour les chemins de templates HTML.
 * 
 * `ComponentPathsMap` représente le type des chemins de templates définis dans `componentPaths`.
 * `COMPONENT_PATHS` représente une des valeurs possibles des chemins de templates.
 */
export type ComponentPathsMap = typeof COMPONENT_PATHS;

/**
 * Type pour les chemins de templates HTML.
 * 
 * `ComponentPath` représente une des valeurs possibles des chemins de templates.
 * Par exemple, si `componentPaths` contient l'entrée `"navbar": "/templates/components/navbar/navbar.component.html"`,
 * alors `ComponentPath` peut valoir `"/templates/components/navbar/navbar.component.html"`.
 */
export type ComponentPath = ComponentPathsMap[keyof ComponentPathsMap];
