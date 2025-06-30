import { RouteConfig } from '../types/routes.types';
import { BaseComponent } from '../components/base/base.component';
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
	name: string;						// Nom unique du composant (ex: 'navbar', 'user-row')
	componentClass: ComponentClass;		// Classe du composant à instancier
	templatePath: string;				// Chemin du template HTML associé au composant
	containerId: string;				// id de l'élément HTML où insérer le composant
	isPublic: boolean;					// Si true, le composant doit s'afficher sur les pages publiques uniquement (login, register)
	isCommon: boolean;					// Si true, le composant est commun à plusieurs pages, si false il est relatif à une seule page
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
export type ComponentClass = new (
	routeConfig: RouteConfig,			// Configuration complète de la route
	componentConfig: ComponentConfig,	// Configuration du composant
	container: HTMLElement,				// Élément HTML dans lequel injecter le contenu du composant
	user?: User | null,					// Utilisateur à afficher dans le composant
) => BaseComponent;						// Composant instanciable
