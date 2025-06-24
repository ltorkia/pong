// PAGES
import { HomePage } from '../views/HomeView';
import { RegisterPage } from '../views/RegisterView';
import { LoginPage } from '../views/LoginView';
import { GamePage } from '../views/GameView';
import { UsersPage } from '../views/UsersView';
import { ProfilePage } from '../views/ProfileView';

// TYPES
import { RouteConfig } from '../types/navigation.types';

// UTILS
import { getProfilePath } from '../utils/navbar.utils';

/**
 * Configuration des routes de l'app
 * 
 * - path: Le chemin de l'URL
 * - component: Le composant à rendre
 * - name: Nom de la route pour les logs
 * - isPublic: Si la route est accessible sans être authentifié (login, register)
 * - enableParticles: Si les particules doivent être activées
 * - getNavPath: Fonction pour récupérer le chemin de navigation (facultatif)
 */
export const routesConfig: RouteConfig[] = [
	{
		path: '/',
		component: HomePage,
		name: 'Accueil',
		isPublic: false,
		enableParticles: true
	},
	{
		path: '/register',
		component: RegisterPage,
		name: 'Inscription',
		isPublic: true,
		enableParticles: true
	},
	{
		path: '/login',
		component: LoginPage,
		name: 'Connexion',
		isPublic: true,
		enableParticles: true
	},
	{
		path: '/game',
		component: GamePage,
		name: 'Jeu',
		isPublic: true,
		enableParticles: false
	},
	{
		path: '/users',
		component: UsersPage,
		name: 'Utilisateurs',
		isPublic: true,
		enableParticles: true
	},
	{
		path: '/user/:id',
		component: ProfilePage,
		name: 'Profil',
		isPublic: true,
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