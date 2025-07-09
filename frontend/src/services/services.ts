import { UserService } from './user.service';
import { RoutingService } from './routing.service';
import { PageService } from './page.service';
import { ParticlesService } from './particles.service';
import { ImageService } from './image.service';

// ===========================================
// SERVICES - SINGLETONS
// ===========================================
/**
 * Gèrent les logiques métier de l'application.
 */

/**
 * Instance unique du service d'authentification.
 * 
 * Permet de gérer l'authentification des utilisateurs en stockant
 * l'utilisateur courant dans le store et en gérant les requêtes API
 * liées à l'authentification.
 */
const userService = new UserService();

/**
 * Service de routage global pour l'application.
 * 
 * Cette instance unique de RoutingService gère 
 * l'enregistrement et la gestion des routes.
 */
const routingService = new RoutingService();

/**
 * Instance unique du service de gestion des pages.
 *
 * Le service de gestion des pages est responsable de:
 * - gérer le cycle de vie des pages (nettoyage, transition, rendu)
 * - appliquer les effets visuels (animations de page, transitions navbar)
 * - activer ou désactiver dynamiquement les particules
 * - garder une référence à la page actuellement affichée (currentPage)
 */
const pageService = new PageService();

/**
 * Instance unique du service de gestion des particules.
 * 
 * Ce service est responsable de:
 * - charger les particules en utilisant la librairie tsParticles
 * - activer ou désactiver l'affichage des particules
 * 
 *  La configuration des particules est stockée dans le fichier theme.config.ts.
 */
const particlesService = new ParticlesService();


/**
 * Instance unique du service de gestion des images.
 * 
 * Ce service est responsable de:
 * - valider les fichiers image
 * - convertir les fichiers en URL de prévisualisation
 * - uploader et supprimer des avatars
 * - récupérer l'URL de l'avatar actuel
 */
const imageService = new ImageService();

const services = {
	userService,
	routingService,
	pageService,
	particlesService,
	imageService
};

/**
 * Export des services principaux de l'application.
 * 
 * - userService: Gère l'authentification et les utilisateurs.
 * - routingService: Gère le routage et la navigation.
 * - pageService: Gère le cycle de vie et le rendu des pages.
 * - particlesService: Gère les effets de particules d'arrière-plan.
 * - imageService: Gère les images et les avatars.
 */
export { userService, routingService, pageService, particlesService, imageService };
