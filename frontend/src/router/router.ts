import { routeGuard } from './route-guard';
import { RouteHandler } from '../types/routes.types';
import { normalizePath, matchRoute } from './router.helper';
import { DEFAULT_ROUTE } from '../config/routes.config';
import { TournamentService } from 'src/api/game/game.api';

// ===========================================
// ROUTER
// ===========================================
/**
 * La classe Router est le coeur du système de routage.
 * Elle enregistre les routes, gère les événements de navigation
 * et redirige vers les bonnes pages.
 * 
 * Reponsabilités:
 * - enregistrement et gestion des routes de l'app
 * - interception des événements de navigation (clics, popstate)
 * - coordination entre les différents composants (RouteGuard, utils, etc.)
 * - exécution des handlers de routes
 * - navigation et les redirections
 */
export class Router {
    private routes: Map<string, RouteHandler> = new Map();
    private isNavigating = false;

    /**
     * Constructeur: initialise les écouteurs d'événements importants
     * 
     * - Surveille les events popstate (boutons précédent/suivant du navigateur)
     *   et déclenche handleLocation() pour render la page correspondante.
     * 
     * - Intercepte les clics sur les liens avec l'attribut data-link + enfants dans le html.
     *   e.preventDefault() empêche le rechargement complet de la page
     *   puis on appelle navigate(href) pour gérer la navigation en mode SPA
     *   en ajoutant le nouveau lien dans l'historique du navigateur
     *   et en redirigeant vers la bonne page.
     */
    constructor() {
        window.addEventListener('popstate', () => this.handleLocation());
        document.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            if (target.matches('[data-link], [data-link] *')) {
                e.preventDefault();
                const link = target.closest('[data-link]') as HTMLElement;
                const href = link.getAttribute('href');
                if (href) {
                    this.navigate(href);
                }
            }
        });
    }

    /**
     * Gère la route courante au démarrage de l'app.
     * Identique à handleLocation() mais sans attendre que la route soit chargée.
     * Utile si on recharge la page ou arrive directement sur une URL précise.
     * 
     * @returns {Promise<void>} Une promesse qui se résout lorsque la route a été gérée.
     */
    public async handleLocationPublic(): Promise<void> {
        await this.handleLocation();
    }

    /**
     * Enregistre une nouvelle route dans la map des routes.
     * 
     * Elle normalise le chemin via normalizePath() pour s'assurer que
     * toutes les routes n'ont pas de / à la fin.
     * 
     * Les routes sont enregistrées avec le chemin normalisé et le handler
     * qui sera exécuté pour render la page correspondante.
     * 
     * @param {string} path Chemin de la route à enregistrer.
     * @param {RouteHandler} handler Fonction handler qui sera exécutée pour render la page.
     */
    public register(path: string, handler: RouteHandler): void {
        const normalizedPath = normalizePath(path);
        this.routes.set(normalizedPath, handler);
    }

    /**
     * Méthode principale pour demander une navigation vers une route donnée.
     * 
     * - Ignore la demande si une navigation est déjà en cours (isNavigating).
     * - Normalise le chemin donné.
     * - Si on est déjà sur ce chemin, ne fait rien.
     * - Utilise matchRoute() pour trouver une route enregistrée qui correspond
     *   au chemin donné, y compris avec paramètres dynamiques.
     * - Si une route correspond :
     *   - Ajoute l'URL à l'historique avec history.pushState().
     *   - Appelle handleLocation() pour exécuter le handler correspondant.
     * - Sinon, redirige vers la page d'accueil '/' en actualisant l'historique avec replaceState(),
     *   puis appelle `handleLocation()` pour afficher la page d'accueil.
     * - Remet isNavigating à false pour autoriser d'autres navigations.
     * 
     * Peut être déclenchée par :
     * - Un clic sur un lien intercepté.
     * - Une redirection suite à une erreur.
     * 
     * @param {string} path Chemin de la route demandée.
     * @returns {Promise<void>} Une promesse qui se résout lorsque la navigation a été gérée.
     */
    public async navigate(path: string): Promise<void> {
        if (this.isNavigating) return;

        const normalizedPath = normalizePath(path);
        if (window.location.pathname === normalizedPath) {
            return;
        }

        this.isNavigating = true;

        // Recherche d'une route qui correspond au chemin (supporte les routes dynamiques)
        const matchedRoute = matchRoute(normalizedPath, this.routes);
        if (matchedRoute) {
            // On pousse l'URL dans l'historique
            window.history.pushState({}, '', normalizedPath);
            await this.handleLocation();
        } else {
            console.warn(`[${this.constructor.name}] Route ${normalizedPath} n'existe pas, redirection vers /`);
            window.history.pushState({}, '', DEFAULT_ROUTE);
            await this.handleLocation();
        }

        this.isNavigating = false;
    }

    /**
     * Méthode privée qui gère la lecture de l'URL courante,
     * recherche la route correspondante (dynamique ou statique),
     * et exécute son handler avec les paramètres extraits.
     * 
     * - Récupère l'URL actuelle.
     * - Normalise le path (enleve le potentiel \ de fin).
     * - Si la normalisation modifie l'URL, met à jour la barre d'adresse avec replaceState().
     * - Utilise matchRoute() pour trouver la route correspondante et ses params.
     * - Si une route est trouvée, on verifie d'abord que l'utilisateur est authentifie pour la redirection.
     * - Ensuite on exécute son handler en lui passant les params.
     * - Sinon, remplace l'URL par '/' et rappelle handleLocation() pour afficher la page d'accueil.
     * 
     * Appelée lors :
     * - D'un événement popstate (navigation navigateur).
     * - Après un navigate().
     * - Au démarrage de l'application.
     * 
     * @private
     */
    private async handleLocation(): Promise<void> {
        let path = window.location.pathname;
        const normalizedPath = normalizePath(path);
        if (normalizedPath !== path) {
            window.history.replaceState({}, '', normalizedPath);
            path = normalizedPath;
        }
        console.log(`[${this.constructor.name}] Tentative de navigation vers: ${path}`);

        // Recherche la route qui matche (statique ou dynamique)
        const matchedRoute = matchRoute(path, this.routes);

        if (matchedRoute) {
            const routeHandler = this.routes.get(matchedRoute.route);

            if (routeHandler) {
                const redirected = await routeGuard.checkAuthRedirect(matchedRoute.route);
                if (redirected) {
                    return;
                }

                // Redirection directement vers overview du tournoi si deja en cours
                const tid = sessionStorage.getItem("tournamentID");
                if (matchedRoute.route === "/game/tournament_local" && tid) {
                    const newPath = `/game/tournament_local/${tid}`;

                    if (window.location.pathname !== newPath) {
                        window.history.pushState({}, '', newPath);
                        return await this.handleLocation();
                    }
                }

                console.log(`[${this.constructor.name}] Route trouvée pour ${path} (correspond à ${matchedRoute.route}), exécution...`);
                try {
                    // Passe les params au handler s'il attend des arguments
                    await routeHandler(matchedRoute.params);
                    console.log(`[${this.constructor.name}] Route ${path} exécutée`);
                } catch (error) {
                    console.error(`[${this.constructor.name}] Erreur lors de l'exécution de la route ${path}:`, error);

                    if (path !== DEFAULT_ROUTE) {
                        console.log(`[${this.constructor.name}] Redirection vers l\'accueil après erreur`);
                        await this.navigate(DEFAULT_ROUTE);
                    }
                }
            } else {
                console.warn(`[${this.constructor.name}] Handler introuvable pour la route ${matchedRoute.route}`);
            }
        } else {
            console.warn(`[${this.constructor.name}] Aucune route trouvée pour: ${path}`);
            console.log(`[${this.constructor.name}] Redirection automatique vers l\'accueil`);
            await this.redirect(DEFAULT_ROUTE);
        }
    }

    /**
     * Redirige vers une route sans ajouter d'entrée dans l'historique du navigateur.
     * 
     * Utilisé notamment pour les redirections forcées (auth, erreurs, etc.),
     * pour éviter les doublons lors du retour arrière (précédent / suivant).
     * 
     * @param {string} path Chemin de la route vers laquelle rediriger.
     * @returns {Promise<void>} Une promesse qui se résout lorsque la redirection a été gérée.
     */
    public async redirect(path: string): Promise<void> {
        window.history.replaceState({}, '', path);
        await this.handleLocation();
    }

    /**
     * Récupère la liste des routes enregistrées dans le router.
     * 
     * @returns {Map<string, RouteHandler>} Une map contenant les chemins de route
     * et leurs handlers correspondants.
     */

    public getRoutes(): Map<string, RouteHandler> {
        return this.routes;
    }
}

/**
 * Instance principale / singleton du router
 * 
 * Cette instance est utilisée pour gérer toutes les opérations de routage
 * au sein de l'application, incluant l'enregistrement des routes, la gestion
 * des événements de navigation, et la redirection des utilisateurs vers les
 * bonnes pages selon la logique définie dans la classe Router.
 */
export const router = new Router();
