import { HomePage } from '../pages/user/home.page';
import { RegisterPage } from '../pages/auth/register.page';
import { LoginPage } from '../pages/auth/login.page';
import { BoidsPage } from '../pages/game/boids.page';
import { RulesPage } from '../pages/user/rules.page';
import { UsersPage } from '../pages/user/users.page';
import { ProfilePage } from '../pages/user/profile.page';
import { DashboardPage } from '../pages/user/dashboard.page';
import { SettingsPage } from '../pages/user/settings.page';

import { RouteConfig } from '../types/routes.types';
import { getComponentConfig } from '../utils/config.utils';
import { COMPONENT_NAMES } from './components.config';
import { GameMenuLocal } from '../pages/game/game.local.page';
import { GameMenuMulti } from '../pages/game/game.multi.page';
import { GameMenuTournament } from '../pages/game/tournament/game.tournament.menu.page';
import { GameMenuTournamentLocal } from '../pages/game/tournament/game.tournament.local.menu.page';
import { GameTournamentLobby } from '../pages/game/tournament/game.tournament.lobby.page';
import { GameTournamentList } from '../pages/game/tournament/game.tournament.list.page';
import { GameTournamentOverview } from '../pages/game/tournament/game.tournament.overview.page';
import { GameTournamentLocalOverview } from '../pages/game/tournament/game.tournament.local.overview.page';
import { GameMenuLocalID } from '../pages/game/game.localID.page';

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
    GAME_LOCAL: 'Local Game',
    GAME_LOCAL_ID: 'Tournament Game',
    GAME_MULTI: 'Multiplayer game',
    GAME_TOURNAMENT_LOCAL_MENU: 'Tournament Local',
    GAME_TOURNAMENT_OVERVIEW: 'Tournament Overview',
    GAME_TOURNAMENT: 'Tournament',
    GAME_TOURNAMENT_LIST: "Tournament List",
    GAME_TOURNAMENT_REGISTER: 'Tournament Register',
    GAME_TOURNAMENT_LOBBY: 'Tournament Lobby',
    BOIDS: 'Boids',
    RULES: 'Rules',
    USERS: 'Users',
    PROFILE: 'Profile',
    DASHBOARD: 'Dashboard',
    SETTINGS: 'Settings',
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
	GAME_LOCAL: '/game/local',
	GAME_LOCAL_ID: '/game/local/:tournamentId/:gameId',
	GAME_MULTI: '/game/multi/:userId',
	GAME_TOURNAMENT_LOCAL_MENU: '/game/tournament_local',
	GAME_TOURNAMENT_LOCAL_OVERVIEW: '/game/tournament_local/:tournamentId',
	GAME_TOURNAMENT: '/game/tournament',
	GAME_TOURNAMENT_LIST: "/game/tournaments",
	GAME_TOURNAMENT_LOBBY: '/game/tournaments/:id/lobby',
	GAME_TOURNAMENT_OVERVIEW: '/game/tournaments/:id',
	BOIDS: '/game/boids',
	RULES: '/rules',
	USERS: '/users',
	PROFILE: '/user/:userId',
	DASHBOARD: '/dashboard',
	LOGOUT: '/logout',
	SETTINGS: '/settings'
} as const;

/**
 * Constantes pour les chemins de modèles HTML.
 *
 * `TEMPLATE_PATHS` contient l'ensemble des chemins de modèles HTML de l'application.
 * Chaque clé est une page de l'application.
 * La valeur associée à chaque clé est le chemin de template correspondant.
 */
export const TEMPLATE_PATHS = {
    HOME: '/templates/user/home.html',
    REGISTER: '/templates/auth/register.html',
    LOGIN: '/templates/auth/login.html',
    GAME_LOCAL: '/templates/game/local.html',
    GAME_LOCAL_ID: '/templates/game/localID.html',
    GAME_MULTI: '/templates/game/multiplayer.html',
    GAME_TOURNAMENT_LOCAL_MENU: '/templates/game/tournament/tournament_local_menu.html',
    GAME_TOURNAMENT_LOCAL_OVERVIEW: '/templates/game/tournament/tournament_local_overview.html',
    GAME_TOURNAMENT: '/templates/game/tournament.html',
    GAME_TOURNAMENT_LIST: '/templates/game/tournament/tournament_list.html',
    GAME_TOURNAMENT_LOBBY: '/templates/game/tournament/tournament_lobby.html',
    GAME_TOURNAMENT_OVERVIEW: '/templates/game/tournament/tournament_overview.html',
    BOIDS: '/templates/game/boids.html',
    RULES: '/templates/user/rules.html',
    USERS: '/templates/user/users.html',
    PROFILE: '/templates/user/profile.html',
    DASHBOARD: '/templates/user/dashboard.html',
    SETTINGS: '/templates/user/settings.html',
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
			[COMPONENT_NAMES.NAVBAR]: getComponentConfig(COMPONENT_NAMES.NAVBAR),
			[COMPONENT_NAMES.TRANSLATER]: getComponentConfig(COMPONENT_NAMES.TRANSLATER)
		},
		isPublic: false,
		enableParticles: true
	},
	{
		path: ROUTE_PATHS.REGISTER,
		name: PAGE_NAMES.REGISTER,
		pageConstructor: RegisterPage,
		templatePath: TEMPLATE_PATHS.REGISTER,
		components: {
			[COMPONENT_NAMES.HOMEBAR]: getComponentConfig(COMPONENT_NAMES.HOMEBAR),
			[COMPONENT_NAMES.TRANSLATER]: getComponentConfig(COMPONENT_NAMES.TRANSLATER)
		},
		isPublic: true,
		enableParticles: true
	},
	{
		path: ROUTE_PATHS.LOGIN,
		name: PAGE_NAMES.LOGIN,
		pageConstructor: LoginPage,
		templatePath: TEMPLATE_PATHS.LOGIN,
		components: {
			[COMPONENT_NAMES.HOMEBAR]: getComponentConfig(COMPONENT_NAMES.HOMEBAR),
			[COMPONENT_NAMES.TRANSLATER]: getComponentConfig(COMPONENT_NAMES.TRANSLATER),
			[COMPONENT_NAMES.TWOFA_MODAL]: getComponentConfig(COMPONENT_NAMES.TWOFA_MODAL)
		},
		isPublic: true,
		enableParticles: true
	},
    {
        path: ROUTE_PATHS.GAME_LOCAL,
        name: PAGE_NAMES.GAME_LOCAL,
        pageConstructor: GameMenuLocal,
        templatePath: TEMPLATE_PATHS.GAME_LOCAL,
        components: {
            [COMPONENT_NAMES.NAVBAR]: getComponentConfig(COMPONENT_NAMES.NAVBAR),
			[COMPONENT_NAMES.TRANSLATER]: getComponentConfig(COMPONENT_NAMES.TRANSLATER)
        },
        isPublic: false,
        enableParticles: true
    },
    {
        path: ROUTE_PATHS.GAME_LOCAL_ID,
        name: PAGE_NAMES.GAME_LOCAL_ID,
        pageConstructor: GameMenuLocalID,
        templatePath: TEMPLATE_PATHS.GAME_LOCAL_ID,
        components: {
            [COMPONENT_NAMES.NAVBAR]: getComponentConfig(COMPONENT_NAMES.NAVBAR),
			[COMPONENT_NAMES.TRANSLATER]: getComponentConfig(COMPONENT_NAMES.TRANSLATER)
        },
        isPublic: false,
        enableParticles: true
    },
	{
		path: ROUTE_PATHS.GAME_MULTI,
		name: PAGE_NAMES.GAME_MULTI,
		pageConstructor: GameMenuMulti,
		templatePath: TEMPLATE_PATHS.GAME_MULTI,
		components: {
			[COMPONENT_NAMES.NAVBAR]: getComponentConfig(COMPONENT_NAMES.NAVBAR),
			[COMPONENT_NAMES.TRANSLATER]: getComponentConfig(COMPONENT_NAMES.TRANSLATER)
		},
		isPublic: false,
		enableParticles: true
	},
	{
		path: ROUTE_PATHS.GAME_TOURNAMENT_LOCAL_MENU,
		name: PAGE_NAMES.GAME_TOURNAMENT_LOCAL_MENU,
		pageConstructor: GameMenuTournamentLocal,
		templatePath: TEMPLATE_PATHS.GAME_TOURNAMENT_LOCAL_MENU,
		components: {
			[COMPONENT_NAMES.NAVBAR]: getComponentConfig(COMPONENT_NAMES.NAVBAR),
			[COMPONENT_NAMES.TRANSLATER]: getComponentConfig(COMPONENT_NAMES.TRANSLATER)
		},
		isPublic: false,
		enableParticles: true
	},
    {
        path: ROUTE_PATHS.GAME_TOURNAMENT_LOCAL_OVERVIEW,
        name: PAGE_NAMES.GAME_TOURNAMENT_OVERVIEW,
        pageConstructor: GameTournamentLocalOverview,
        templatePath: TEMPLATE_PATHS.GAME_TOURNAMENT_OVERVIEW,
        components: {
            [COMPONENT_NAMES.NAVBAR]: getComponentConfig(COMPONENT_NAMES.NAVBAR),
			[COMPONENT_NAMES.TRANSLATER]: getComponentConfig(COMPONENT_NAMES.TRANSLATER)
        },
        isPublic: false,
        enableParticles: true
    },
	{
		path: ROUTE_PATHS.GAME_TOURNAMENT,
		name: PAGE_NAMES.GAME_TOURNAMENT,
		pageConstructor: GameMenuTournament,
		templatePath: TEMPLATE_PATHS.GAME_TOURNAMENT,
		components: {
			[COMPONENT_NAMES.NAVBAR]: getComponentConfig(COMPONENT_NAMES.NAVBAR),
			[COMPONENT_NAMES.TRANSLATER]: getComponentConfig(COMPONENT_NAMES.TRANSLATER)
		},
		isPublic: false,
		enableParticles: true
	},
	{
		path: ROUTE_PATHS.GAME_TOURNAMENT_LOBBY,
		name: PAGE_NAMES.GAME_TOURNAMENT_LOBBY,
		pageConstructor: GameTournamentLobby,
		templatePath: TEMPLATE_PATHS.GAME_TOURNAMENT_LOBBY,
		components: {
			[COMPONENT_NAMES.NAVBAR]: getComponentConfig(COMPONENT_NAMES.NAVBAR),
			[COMPONENT_NAMES.TRANSLATER]: getComponentConfig(COMPONENT_NAMES.TRANSLATER)
		},
		isPublic: false,
		enableParticles: true
	},
	{
		path: ROUTE_PATHS.GAME_TOURNAMENT_LIST,
		name: PAGE_NAMES.GAME_TOURNAMENT_LIST,
		pageConstructor: GameTournamentList,
		templatePath: TEMPLATE_PATHS.GAME_TOURNAMENT_LIST,
		components: {
			[COMPONENT_NAMES.NAVBAR]: getComponentConfig(COMPONENT_NAMES.NAVBAR),
			[COMPONENT_NAMES.TRANSLATER]: getComponentConfig(COMPONENT_NAMES.TRANSLATER)
		},
		isPublic: false,
		enableParticles: true
	},
	{
		path: ROUTE_PATHS.GAME_TOURNAMENT_OVERVIEW,
		name: PAGE_NAMES.GAME_TOURNAMENT_OVERVIEW,
		pageConstructor: GameTournamentOverview,
		templatePath: TEMPLATE_PATHS.GAME_TOURNAMENT_OVERVIEW,
		components: {
			[COMPONENT_NAMES.NAVBAR]: getComponentConfig(COMPONENT_NAMES.NAVBAR),
			[COMPONENT_NAMES.TRANSLATER]: getComponentConfig(COMPONENT_NAMES.TRANSLATER)
		},
		isPublic: false,
		enableParticles: true
	},
	{
		path: ROUTE_PATHS.BOIDS,
		name: PAGE_NAMES.BOIDS,
		pageConstructor: BoidsPage,
		templatePath: TEMPLATE_PATHS.BOIDS,
		components: {
			[COMPONENT_NAMES.NAVBAR]: getComponentConfig(COMPONENT_NAMES.NAVBAR),
			[COMPONENT_NAMES.TRANSLATER]: getComponentConfig(COMPONENT_NAMES.TRANSLATER)
		},
		isPublic: false,
		enableParticles: true
	},
	{
		path: ROUTE_PATHS.RULES,
		name: PAGE_NAMES.RULES,
		pageConstructor: RulesPage,
		templatePath: TEMPLATE_PATHS.RULES,
		components: {
			[COMPONENT_NAMES.NAVBAR]: getComponentConfig(COMPONENT_NAMES.NAVBAR),
			[COMPONENT_NAMES.TRANSLATER]: getComponentConfig(COMPONENT_NAMES.TRANSLATER)
		},
		isPublic: false,
		enableParticles: true
	},
	{
		path: ROUTE_PATHS.USERS,
		name: PAGE_NAMES.USERS,
		pageConstructor: UsersPage,
		templatePath: TEMPLATE_PATHS.USERS,
		components: {
			[COMPONENT_NAMES.NAVBAR]: getComponentConfig(COMPONENT_NAMES.NAVBAR),
			[COMPONENT_NAMES.TRANSLATER]: getComponentConfig(COMPONENT_NAMES.TRANSLATER),
			[COMPONENT_NAMES.SEARCH_BAR]: getComponentConfig(COMPONENT_NAMES.SEARCH_BAR),
			[COMPONENT_NAMES.USER_ROW]: getComponentConfig(COMPONENT_NAMES.USER_ROW),
			[COMPONENT_NAMES.PAGINATION]: getComponentConfig(COMPONENT_NAMES.PAGINATION)
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
			[COMPONENT_NAMES.NAVBAR]: getComponentConfig(COMPONENT_NAMES.NAVBAR),
			[COMPONENT_NAMES.TRANSLATER]: getComponentConfig(COMPONENT_NAMES.TRANSLATER)
		},
		isPublic: false,
		enableParticles: true
	},
	{
		path: ROUTE_PATHS.DASHBOARD,
		name: PAGE_NAMES.DASHBOARD,
		pageConstructor: DashboardPage,
		templatePath: TEMPLATE_PATHS.DASHBOARD,
		components: {
			[COMPONENT_NAMES.NAVBAR]: getComponentConfig(COMPONENT_NAMES.NAVBAR),
			[COMPONENT_NAMES.TRANSLATER]: getComponentConfig(COMPONENT_NAMES.TRANSLATER)
		},
		isPublic: false,
		enableParticles: true
	},
	{
		path: ROUTE_PATHS.SETTINGS,
		name: PAGE_NAMES.SETTINGS,
		pageConstructor: SettingsPage,
		templatePath: TEMPLATE_PATHS.SETTINGS,
		components: {
			[COMPONENT_NAMES.NAVBAR]: getComponentConfig(COMPONENT_NAMES.NAVBAR),
			[COMPONENT_NAMES.TRANSLATER]: getComponentConfig(COMPONENT_NAMES.TRANSLATER),
			[COMPONENT_NAMES.TWOFA_MODAL]: getComponentConfig(COMPONENT_NAMES.TWOFA_MODAL)
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