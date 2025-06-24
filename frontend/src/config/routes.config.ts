// PAGES
import { HomePage } from '../views/HomeView';
import { RegisterPage } from '../views/RegisterView';
import { LoginPage } from '../views/LoginView';
import { GamePage } from '../views/GameView';
import { UsersPage } from '../views/UsersView';
import { ProfilePage } from '../views/ProfileView';

// TYPES
import { RouteConfig } from '../types/route.types';

// UTILS
import { getProfilePath } from '../utils/navbar.utils';

/**
 * Configuration des routes de l'application
 * 
 * Chaque route définit :
 * - path: Le chemin de l'URL
 * - component: Le composant à rendre
 * - name: Nom de la route pour les logs
 * - isPublic: Si la route est accessible même sans être authentifié
 * - enableParticles: Si les particules doivent être activées
 * - getNavPath: Fonction pour récupérer le chemin de navigation (facultatif)
 */
export const routesConfig: RouteConfig[] = [
	{
		path: '/',
		component: HomePage,
		name: 'Accueil',
		isPublic: false, // Route protégée - nécessite une authentification
		enableParticles: true
	},
	{
		path: '/register',
		component: RegisterPage,
		name: 'Inscription',
		isPublic: true, // Route publique
		enableParticles: true
	},
	{
		path: '/login',
		component: LoginPage,
		name: 'Connexion',
		isPublic: true, // Route publique
		enableParticles: true
	},
	{
		path: '/game',
		component: GamePage,
		name: 'Jeu',
		isPublic: true, // Route publique
		enableParticles: false // Désactivé pour les performances du jeu
	},
	{
		path: '/users',
		component: UsersPage,
		name: 'Utilisateurs',
		isPublic: true, // Route publique
		enableParticles: true
	},
	{
		path: '/user/:id',
		component: ProfilePage,
		name: 'Profil',
		isPublic: true, // Route publique
		enableParticles: true,
		getNavPath: getProfilePath
	}
];

/**
 * Routes publiques (accessibles sans authentification)
 */
export const publicRoutes = routesConfig
	.filter(route => route.isPublic)
	.map(route => route.path);

/**
 * Routes protégées (nécessitent une authentification)
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

/**
 * Fonction utilitaire pour vérifier si une route est publique
 * Remplace l'ancienne fonction isPublicRoute()
 */
export const isPublicRoute = (routeOrPath: { route: string } | string | null): boolean => {
	if (!routeOrPath) return false;

	// Extraction du chemin
	const path = typeof routeOrPath === 'object' && 'route' in routeOrPath 
		? routeOrPath.route 
		: routeOrPath;

	if (typeof path !== 'string') return false;

	// Recherche dans la configuration
	const routeConfig = routesConfig.find(config => config.path === path);
	return routeConfig?.isPublic ?? false;
};

/**
 * Fonction utilitaire pour vérifier si une route est protégée
 * Remplace l'ancienne logique
 */
export const isProtectedRoute = (routeOrPath: { route: string } | string | null): boolean => {
	return !isPublicRoute(routeOrPath);
};

/**
 * Fonction utilitaire pour vérifier si un template correspond à une page publique
 * Remplace l'ancienne fonction isPublicTemplate()
 */
export const isPublicTemplate = (templatePath: string): boolean => {
	// Extraction du chemin depuis le template path (ex: /templates/login.html -> /login)
	const routePath = templatePath
		.replace('/templates', '')
		.replace('.html', '');
	
	return isPublicRoute(routePath);
};

/**
 * Fonction utilitaire pour déterminer si la navbar doit être affichée
 * Remplace shouldShowNavbar()
 */
export const shouldShowNavbar = (templatePath: string): boolean => {
	return !isPublicTemplate(templatePath);
};

/**
 * Fonction utilitaire pour récupérer une configuration de route par son path
 */
export const getRouteConfig = (path: string): RouteConfig | undefined => {
	return routesConfig.find(route => route.path === path);
};