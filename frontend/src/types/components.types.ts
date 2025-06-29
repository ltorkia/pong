import { RouteConfig } from '../types/routes.types';
import { BaseComponent } from '../components/base-component';
import { User } from '../models/user.model';
import { UserController } from '../controllers/UserController';

/**
 * Interface pour la configuration d'un composant.
 * 
 * Contient toutes les informations nécessaires pour instancier
 * et rendre un composant.
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
 * Chaque composant doit hériter de BaseComponent et avoir un constructeur avec ces paramètres:
 * - routeConfig: configuration complète de la route (de type RouteConfig)
 * - componentConfig: configuration du composant (de type ComponentConfig)
 * - container: élément HTML dans lequel injecter le contenu du composant
 * - user: utilisateur à afficher dans le composant
 * - currentUser: utilisateur courant (peut être null si non connecté)
 * - userController: instance permettant de gérer les actions liées à l’utilisateur
 */
export type ComponentClass = new (
	routeConfig: RouteConfig,
	componentConfig: ComponentConfig,
	container: HTMLElement,
	user: User | null,
	currentUser: User | null,
	userController: UserController
) => BaseComponent;