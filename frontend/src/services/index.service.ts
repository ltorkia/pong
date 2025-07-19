import { appService, routingService, pageService, particlesService } from './core/core.service';
import { userAuthService, userGoogleService, userSessionService, userCurrentService, userDataService } from './user/user-index.service';
// import { gameServices } from './game/game-index.service';

// ===========================================
// SERVICES - SINGLETONS
// ===========================================
/**
 * Gèrent les logiques métier de l'application.
 */

export { appService, routingService, pageService, particlesService };
export { userAuthService, userGoogleService, userSessionService, userCurrentService, userDataService };
