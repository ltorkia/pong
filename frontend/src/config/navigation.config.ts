// VIEWS
import { HomeView } from '../views/user/HomeView';
import { RegisterView } from '../views/auth/RegisterView';
import { LoginView } from '../views/auth/LoginView';
import { GameView } from '../views/game/GameView';
import { UsersView } from '../views/user/UsersView';
import { ProfileView } from '../views/user/ProfileView';

// TYPES
import { RouteConfig } from '../types/navigation.types';

// UTILS
import { getProfilePath } from '../utils/navbar.utils';

/**
 * Configuration des routes de l'app
 * 
 * - path: Chemin de la route ('/', '/users', '/user/:id'...)
 * - component: Composant de la page à render (HomeView, GameView...)
 * - name: Nom de la route pour logs et debug
 * - isPublic: Si true, la route est accessible sans être authentifié (login, register)
 * - idUserRequired: Si true, l'id du user actuellement connecté est attendu en param de la view a instancier
 * - enableParticles: Si true, active les particules sur cette page
 * - getNavPath: Fonction pour récupérer le lien actif dans la navbar
 */
export const routesConfig: RouteConfig[] = [
	{
		path: '/',
		component: HomeView,
		name: 'Home',
		isPublic: false,
		idUserRequired: true,
		enableParticles: true
	},
	{
		path: '/register',
		component: RegisterView,
		name: 'Register',
		isPublic: true,
		idUserRequired: false,
		enableParticles: true
	},
	{
		path: '/login',
		component: LoginView,
		name: 'Login',
		isPublic: true,
		idUserRequired: false,
		enableParticles: true
	},
	{
		path: '/game',
		component: GameView,
		name: 'Game',
		isPublic: false,
		idUserRequired: false,
		enableParticles: false
	},
	{
		path: '/users',
		component: UsersView,
		name: 'Users',
		isPublic: false,
		idUserRequired: false,
		enableParticles: true
	},
	{
		path: '/user/:id',
		component: ProfileView,
		name: 'Profile',
		isPublic: false,
		idUserRequired: true,
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