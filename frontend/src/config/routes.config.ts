import { HomePage } from '../pages/home.page';
import { RegisterPage } from '../pages/register.page';
import { LoginPage } from '../pages/login.page';
import { GamePage } from '../pages/game.page';
import { UsersPage } from '../pages/users.page';
import { ProfilePage } from '../pages/profile.page';

import { RouteConfig } from '../types/routes.types';
import { getComponentConfig } from '../utils/config.utils';
import { COMPONENT_NAMES } from './components.config';

// ===========================================
// ROUTES CONFIG
// ===========================================
/**
 * Ce fichier contient la configuration de routes de l'application.
 *
 * Les routes sont définies dans un tableau de type RouteConfig[].
 * Chaque élément de ce tableau décrit une route de l'application.
 * Les routes sont enregistrées par le routeur et sont utilisées pour
 * rediriger les utilisateurs vers les bonnes pages.
 */

/**
 * ID de la div HTML dans laquelle on injecte les templates de pages HTML.
 * 
 * Cette div est l'élément racine de l'application et est définie dans le fichier
 * index.html. Les routes injectent les templates HTML dans cette div.
 */
export const APP_ID: string = 'app';

/**
 * Lien HTML vers le profil de l'utilisateur actuel.
 *
 * Ce lien est utilisé dans la navbar pour lier vers le profil de l'utilisateur actuel.
 * Le lien est généré par le composant de la navbar qui remplace le placeholder {userId}
 * par l'id de l'utilisateur actuel dans 'user/{userId}'.
 */
export const PROFILE_HTML_ANCHOR: string = '/profile';

/**
 * Constantes pour les noms de pages.
 *
 * `PAGE_NAMES` contient l'ensemble des noms de pages de l'application.
 * Chaque clé est une page de l'application.
 * La valeur associée à chaque clé est le nom de la page.
 */
export const PAGE_NAMES = {
	HOME: 'Home',
	REGISTER: 'Register',
	LOGIN: 'Login',
	GAME: 'Game',
	USERS: 'Users',
	PROFILE: 'Profile',
} as const;

/**
 * Constantes pour les chemins de routes.
 *
 * `ROUTE_PATHS` contient l'ensemble des chemins de routes de l'application.
 * Chaque clé est une page de l'application.
 * La valeur associée à chaque clé est le chemin de route correspondant.
 */
export const ROUTE_PATHS = {
	HOME: '/',
	REGISTER: '/register',
	LOGIN: '/login',
	GAME: '/game',
	USERS: '/users',
	PROFILE: '/user/:id',
	LOGOUT: '/logout',
} as const;

/**
 * Constantes pour les chemins de modèles HTML.
 *
 * `TEMPLATE_PATHS` contient l'ensemble des chemins de modèles HTML de l'application.
 * Chaque clé est une page de l'application.
 * La valeur associée à chaque clé est le chemin de template correspondant.
 */
export const TEMPLATE_PATHS = {
	HOME: '/templates/home.html',
	REGISTER: '/templates/register.html',
	LOGIN: '/templates/login.html',
	GAME: '/templates/game.html',
	USERS: '/templates/users.html',
	PROFILE: '/templates/profile.html',
} as const;

/**
 * Route par défaut pour les redirections
 */
export const DEFAULT_ROUTE = ROUTE_PATHS.HOME;

/**
 * Route de fallback en cas d'erreur d'authentification
 */
export const AUTH_FALLBACK_ROUTE = ROUTE_PATHS.LOGIN;

/**
 * Route API pour les avatars
 */
export const AVATARS_ROUTE_API = '/uploads/avatars/';

/**
 * Configuration statique des routes de l'application.
 * 
 * Chaque route est définie par un objet contenant:
 * - path: Chemin de la route (ex: '/', '/users', '/user/:id')
 * - name: Nom de la route pour les logs et le debug
 * - pageConstructor: Constructeur de la page à instancier/rendre (ex: HomePage, GamePage)
 * - templatePath: Chemin du template HTML associé à la page
 * - components : Configuration des composants spécifiques à cette page,
 *                chaque composant est une copie indépendante de la configuration originale
 *                afin d'éviter toute modification directe de la configuration globale des composants,
 *                car certains champs (ex: instance, destroy) peuvent être modifiés dynamiquement
 *                lors de l'exécution de l'application.
 * - isPublic: Si true, la route est accessible sans authentification
 * - enableParticles: Si true, active les particules sur cette pages
 * 
 * Cette configuration est destinée à être statique et manuelle:
 * elle ne doit pas être modifiée dynamiquement au cours de l'exécution,
 * pour garantir une source de vérité stable.
 */
export const routesConfig: RouteConfig[] = [
	{
		path: ROUTE_PATHS.HOME,
		name: PAGE_NAMES.HOME,
		pageConstructor: HomePage,
		templatePath: TEMPLATE_PATHS.HOME,
		components: {
			[COMPONENT_NAMES.NAVBAR]: getComponentConfig(COMPONENT_NAMES.NAVBAR)
		},
		isPublic: false,
		enableParticles: true
	},
	{
		path: ROUTE_PATHS.REGISTER,
		name: PAGE_NAMES.REGISTER,
		pageConstructor: RegisterPage,
		templatePath: TEMPLATE_PATHS.REGISTER,
		components: {},
		isPublic: true,
		enableParticles: true
	},
	{
		path: ROUTE_PATHS.LOGIN,
		name: PAGE_NAMES.LOGIN,
		pageConstructor: LoginPage,
		templatePath: TEMPLATE_PATHS.LOGIN,
		components: {
			[COMPONENT_NAMES.TWOFA_MODAL]: getComponentConfig(COMPONENT_NAMES.TWOFA_MODAL)
		},
		isPublic: true,
		enableParticles: true
	},
	{
		path: ROUTE_PATHS.GAME,
		name: PAGE_NAMES.GAME,
		pageConstructor: GamePage,
		templatePath: TEMPLATE_PATHS.GAME,
		components: {
			[COMPONENT_NAMES.NAVBAR]: getComponentConfig(COMPONENT_NAMES.NAVBAR)
		},
		isPublic: false,
		enableParticles: false
	},
	{
		path: ROUTE_PATHS.USERS,
		name: PAGE_NAMES.USERS,
		pageConstructor: UsersPage,
		templatePath: TEMPLATE_PATHS.USERS,
		components: {
			[COMPONENT_NAMES.NAVBAR]: getComponentConfig(COMPONENT_NAMES.NAVBAR),
			[COMPONENT_NAMES.USER_ROW]: getComponentConfig(COMPONENT_NAMES.USER_ROW)
		},
		isPublic: false,
		enableParticles: true
	},
	{
		path: ROUTE_PATHS.PROFILE,
		name: PAGE_NAMES.PROFILE,
		pageConstructor: ProfilePage,
		templatePath: TEMPLATE_PATHS.PROFILE,
		components: {
			[COMPONENT_NAMES.NAVBAR]: getComponentConfig(COMPONENT_NAMES.NAVBAR)
		},
		isPublic: false,
		enableParticles: true
	}
];

/**
 * Routes publiques (accessibles sans authentification / inaccessibles si authentifié)
 */
export const publicRoutes = routesConfig
	.filter(route => route.isPublic)
	.map(route => route.path);

/**
 * Routes protégées (accessibles authentifié / inaccessibles sans authentification)
 */
export const protectedRoutes = routesConfig
	.filter(route => !route.isPublic)
	.map(route => route.path);