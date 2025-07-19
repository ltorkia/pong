import { AnimationService } from './animation.service';
import { ParticlesService } from './particles.service';

// ===========================================
// UI SERVICES - SINGLETONS
// ===========================================

/**
 * Instance unique du service de gestion des animations.
 * 
 * Ce service est responsable de:
 * - activer ou désactiver les animations
 * - gérer les animations des composants de l'application
 */
export const animationService = new AnimationService();

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