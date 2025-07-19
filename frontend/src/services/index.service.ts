import { appService, routingService, pageService } from './core/core.service';
import { animationService, particlesService } from './ui/ui.service';
import { authService, googleService, storageService, sessionService, currentService, dataService } from './user/user.service';

// ===========================================
// INDEX SERVICES - SINGLETONS
// ===========================================
/**
 * Gèrent les logiques métier / ui de l'application.
 */

export { appService, routingService, pageService };
export { animationService, particlesService };
export { authService, googleService, storageService, sessionService, currentService, dataService };
