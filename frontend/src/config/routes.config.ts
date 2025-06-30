// PAGES
import { HomePage } from '../pages/user/home.page';
import { RegisterPage } from '../pages/auth/register.page';
import { LoginPage } from '../pages/auth/login.page';
import { GamePage } from '../pages/game/game.page';
import { UsersPage } from '../pages/user/users.page';
import { ProfilePage } from '../pages/user/profile.page';

// TYPES
import { RouteConfig } from '../types/routes.types';

// UTILS
import { pageNames, componentNames } from './constants.config';
import { getComponentConfig } from '../utils/config.utils';

/**
 * Configuration des routes de l'app
 * 
 * - path: Chemin de la route ('/', '/users', '/user/:id'...)
 * - name: Nom de la route pour logs et debug
 * - pageClass: Classe de la page à instancier / render (HomePage, GamePage...)
 * - templatePath: Chemin du template HTML associé à la page
 * - components: Config des composants spécifiques à cette page
 * - isPublic: Si true, la route est accessible sans être authentifié uniquement (login, register)
 * - enableParticles: Si true, active les particules sur cette page
 * - getNavPath: Fonction pour récupérer le lien actif dans la navbar
 */
export const routesConfig: RouteConfig[] = [
	{
		path: '/',
		name: pageNames.home,
		pageClass: HomePage,
		templatePath: '/templates/user/home.html',
		components: {
			[componentNames.navbar]: getComponentConfig(componentNames.navbar)
		},
		isPublic: false,
		enableParticles: true
	},
	{
		path: '/register',
		name: pageNames.register,
		pageClass: RegisterPage,
		templatePath: '/templates/auth/register.html',
		components: {},
		isPublic: true,
		enableParticles: true
	},
	{
		path: '/login',
		name: pageNames.login,
		pageClass: LoginPage,
		templatePath: '/templates/auth/login.html',
		components: {},
		isPublic: true,
		enableParticles: true
	},
	{
		path: '/game',
		name: pageNames.game,
		pageClass: GamePage,
		templatePath: '/templates/game/game.html',
		components: {
			[componentNames.navbar]: getComponentConfig(componentNames.navbar)
		},
		isPublic: false,
		enableParticles: false
	},
	{
		path: '/users',
		name: pageNames.users,
		pageClass: UsersPage,
		templatePath: '/templates/user/users.html',
		components: {
			[componentNames.navbar]: getComponentConfig(componentNames.navbar),
			[componentNames.userRow]: getComponentConfig(componentNames.userRow)
		},
		isPublic: false,
		enableParticles: true
	},
	{
		path: '/user/:id',
		name: pageNames.profile,
		pageClass: ProfilePage,
		templatePath: '/templates/user/profile.html',
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

/**
 * Route par défaut pour les redirections
 */
export const defaultRoute = '/';

/**
 * Route de fallback en cas d'erreur d'authentification
 */
export const authFallbackRoute = '/login';