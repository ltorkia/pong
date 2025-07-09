import { RoutingService } from './routing.service';
import { PageService } from './page.service';
import { ParticlesService } from './particles.service';
import { ImageService } from './image.service';

// ===========================================
// CORE INDEX SERVICE - SINGLETONS
// ===========================================
/**
 * Gèrent les logiques métier principales de l'application.
 */

/**
 * Service de routage global pour l'application.
 * 
 * Cette instance unique de RoutingService gère 
 * l'enregistrement et la gestion des routes.
 */
export const routingService = new RoutingService();

/**
 * Instance unique du service de gestion des pages.
 *
 * Le service de gestion des pages est responsable de:
 * - gérer le cycle de vie des pages (nettoyage, transition, rendu)
 * - appliquer les effets visuels (animations de page, transitions navbar)
 * - activer ou désactiver dynamiquement les particules
 * - garder une référence à la page actuellement affichée (currentPage)
 */
export const pageService = new PageService();

/**
 * Instance unique du service de gestion des particules.
 * 
 * Ce service est responsable de:
 * - charger les particules en utilisant la librairie tsParticles
 * - activer ou désactiver l'affichage des particules
 * 
 *  La configuration des particules est stockée dans le fichier theme.config.ts.
 */
export const particlesService = new ParticlesService();


/**
 * Instance unique du service de gestion des images.
 * 
 * Ce service est responsable de:
 * - valider les fichiers image
 * - convertir les fichiers en URL de prévisualisation
 * - uploader et supprimer des avatars
 * - récupérer l'URL de l'avatar actuel
 */
export const imageService = new ImageService();
