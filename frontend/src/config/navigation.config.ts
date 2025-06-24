// VIEWS
import { HomeView } from '../views/HomeView';
import { RegisterView } from '../views/RegisterView';
import { LoginView } from '../views/LoginView';
import { GameView } from '../views/GameView';
import { UsersView } from '../views/UsersView';
import { ProfileView } from '../views/ProfileView';

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
		component: HomeView,
		name: 'Accueil',
		isPublic: false,
		enableParticles: true
	},
	{
		path: '/register',
		component: RegisterView,
		name: 'Inscription',
		isPublic: true,
		enableParticles: true
	},
	{
		path: '/login',
		component: LoginView,
		name: 'Connexion',
		isPublic: true,
		enableParticles: true
	},
	{
		path: '/game',
		component: GameView,
		name: 'Jeu',
		isPublic: true,
		enableParticles: false
	},
	{
		path: '/users',
		component: UsersView,
		name: 'Utilisateurs',
		isPublic: true,
		enableParticles: true
	},
	{
		path: '/user/:id',
		component: ProfileView,
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