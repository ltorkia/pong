import { HomePage } from '../pages/home.page';
import { RegisterPage } from '../pages/register.page';
import { LoginPage } from '../pages/login.page';
import { GamePage } from '../pages/game.page';
import { UsersPage } from '../pages/users.page';
import { ProfilePage } from '../pages/profile.page';
import { TwofaPage } from '../pages/twofa.page';

import { RouteConfig } from '../types/routes.types';
import { componentNames } from './components.config';
import { getComponentConfig } from '../utils/config.utils';

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
export const appId: string = 'app';

/**
 * Lien HTML vers le profil de l'utilisateur actuel.
 *
 * Ce lien est utilisé dans la navbar pour lier vers le profil de l'utilisateur actuel.
 * Le lien est généré par le composant de la navbar qui remplace le placeholder {userId}
 * par l'id de l'utilisateur actuel dans 'user/{userId}'.
 */
export const profileHTMLAnchor: string = '/profile';

/**
 * Constantes pour les noms de pages.
 *
 * `pageNames` contient l'ensemble des noms de pages de l'application.
 * Chaque clé est une page de l'application.
 * La valeur associée à chaque clé est le nom de la page.
 */
export const pageNames = {
	home: 'Home',
	register: 'Register',
	login: 'Login',
	game: 'Game',
	users: 'Users',
	profile: 'Profile',
	twofa: 'Twofa',
} as const;

/**
 * Constantes pour les chemins de routes.
 *
 * `routePaths` contient l'ensemble des chemins de routes de l'application.
 * Chaque clé est une page de l'application.
 * La valeur associée à chaque clé est le chemin de route correspondant.
 */
export const routePaths = {
	home: '/',
	register: '/register',
	login: '/login',
	game: '/game',
	users: '/users',
	profile: '/user/:id',
	logout: '/logout',
	twofa: '/twofa',
} as const;

/**
 * Constantes pour les chemins de modèles HTML.
 *
 * `templatePaths` contient l'ensemble des chemins de modèles HTML de l'application.
 * Chaque clé est une page de l'application.
 * La valeur associée à chaque clé est le chemin de template correspondant.
 */
export const templatePaths = {
	home: '/templates/home.html',
	register: '/templates/register.html',
	login: '/templates/login.html',
	game: '/templates/game.html',
	users: '/templates/users.html',
	profile: '/templates/profile.html',
	twofa: '/templates/twofa.html',
} as const;

/**
 * Route par défaut pour les redirections
 */
export const defaultRoute = routePaths.home;

/**
 * Route de fallback en cas d'erreur d'authentification
 */
export const authFallbackRoute = routePaths.login;

/**
 * Route pour la page de double authentification (2FA)
 */
export const authTwofaRoute = routePaths.twofa;

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
		path: routePaths.home,
		name: pageNames.home,
		pageConstructor: HomePage,
		templatePath: templatePaths.home,
		components: {
			[componentNames.navbar]: getComponentConfig(componentNames.navbar)
		},
		isPublic: false,
		enableParticles: true
	},
	{
		path: routePaths.register,
		name: pageNames.register,
		pageConstructor: RegisterPage,
		templatePath: templatePaths.register,
		components: {},
		isPublic: true,
		enableParticles: true
	},
	{
		path: routePaths.login,
		name: pageNames.login,
		pageConstructor: LoginPage,
		templatePath: templatePaths.login,
		components: {},
		isPublic: true,
		enableParticles: true
	},
	{
		path: routePaths.twofa,
		name: pageNames.twofa,
		pageConstructor: TwofaPage,
		templatePath: templatePaths.twofa,
		components: {},
		isPublic: true,
		enableParticles: true
	},
	{
		path: routePaths.game,
		name: pageNames.game,
		pageConstructor: GamePage,
		templatePath: templatePaths.game,
		components: {
			[componentNames.navbar]: getComponentConfig(componentNames.navbar)
		},
		isPublic: false,
		enableParticles: false
	},
	{
		path: routePaths.users,
		name: pageNames.users,
		pageConstructor: UsersPage,
		templatePath: templatePaths.users,
		components: {
			[componentNames.navbar]: getComponentConfig(componentNames.navbar),
			[componentNames.userRow]: getComponentConfig(componentNames.userRow)
		},
		isPublic: false,
		enableParticles: true
	},
	{
		path: routePaths.profile,
		name: pageNames.profile,
		pageConstructor: ProfilePage,
		templatePath: templatePaths.profile,
		components: {
			[componentNames.navbar]: getComponentConfig(componentNames.navbar)
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