// PageS
import { HomePage } from '../pages/user/HomePage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { LoginPage } from '../pages/auth/LoginPage';
import { GamePage } from '../pages/game/GamePage';
import { UsersPage } from '../pages/user/UsersPage';
import { ProfilePage } from '../pages/user/ProfilePage';

// TYPES
import { RouteConfig } from '../types/navigation.types';

// UTILS
import { getProfilePath } from '../helpers/navbar';

/**
 * Configuration des routes de l'app
 * 
 * - path: Chemin de la route ('/', '/users', '/user/:id'...)
 * - component: Composant de la page à render (HomePage, GamePage...)
 * - name: Nom de la route pour logs et debug
 * - isPublic: Si true, la route est accessible sans être authentifié (login, register)
 * - enableParticles: Si true, active les particules sur cette page
 * - getNavPath: Fonction pour récupérer le lien actif dans la navbar
 */
export const routesConfig: RouteConfig[] = [
	{
		path: '/',
		component: HomePage,
		name: 'Home',
		isPublic: false,
		enableParticles: true
	},
	{
		path: '/register',
		component: RegisterPage,
		name: 'Register',
		isPublic: true,
		enableParticles: true
	},
	{
		path: '/login',
		component: LoginPage,
		name: 'Login',
		isPublic: true,
		enableParticles: true
	},
	{
		path: '/game',
		component: GamePage,
		name: 'Game',
		isPublic: false,
		enableParticles: false
	},
	{
		path: '/users',
		component: UsersPage,
		name: 'Users',
		isPublic: false,
		enableParticles: true
	},
	{
		path: '/user/:id',
		component: ProfilePage,
		name: 'Profile',
		isPublic: false,
		enableParticles: true,
		getNavPath: getProfilePath
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