// COMPONENTS
import { NavbarComponent } from '../components/navbar/navbar.component';
import { UserRowComponent } from '../components/user-row/user-row.component';

// TYPES
import { ComponentConfig } from '../types/components.types';

// UTILS
import { componentNames, HTMLContainers } from './constants.config';

/**
 * Tableau contenant la configuration de tous les composants réutilisables
 * de l’application.
 * 
 * Chaque élément décrit un composant avec:
 * - un nom unique permettant de l’identifier et de le référencer dans les routes,
 * - la classe du composant (pour instancier le composant dynamiquement),
 * - le chemin vers son template HTML (pour charger le rendu visuel associé).
 * - l'id de l'élément HTML où insérer le composant
 * - Si isPublic = true, le component doit s'afficher sur les pages publiques uniquement (login, register)
 * - Si isCommon = true, le composant est commun à plusieurs pages, si false il est relatif à une seule page
 */
export const componentsConfig: ComponentConfig[] = [
	{
		name: componentNames.navbar,
		componentClass: NavbarComponent,
		templatePath: '/components/common/navbar/navbar-component.html',
		containerId: HTMLContainers.navbarId,
		isPublic: false,
		isCommon: true
	},
	{
		name: componentNames.userRow,
		componentClass: UserRowComponent,
		templatePath: '/components/user/users/user-row-component.html',
		containerId: HTMLContainers.userListId,
		isPublic: false,
		isCommon: false
	}
];