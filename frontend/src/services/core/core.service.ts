import { AppService } from './app.service';
import { RoutingService } from './routing.service';
import { PageService } from './page.service';
import type { Locale } from './translation/translate.service';
import { TranslateService } from './translation/translate.service';

// ===========================================
// CORE SERVICES - SINGLETONS
// ===========================================
/**
 * Gèrent les logiques métier principales de l'application.
 */

/**
 * Instance unique du service principal de l'application.
 * 
 * Ce service est responsable de:
 * - lancer l'application
 * - gérer le cycle de vie principal de l'application
 * - initialiser les services et les composants
 */
export const appService = new AppService();

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
 * Service de gestion de la traduction.
 * 
 * Cette instance unique de TranslateService gère 
 * la traduction des textes en fonction de la langue choisie.
 * Locales disponibles: en, fr, ja
 */
export const translateService = new TranslateService();
export { Locale };
