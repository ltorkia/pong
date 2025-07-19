import { UserAuthService } from './user-auth.service';
import { UserGoogleService } from './user-google.service';
import { UserSessionService } from './user-session.service';
import { UserCurrentService } from './user-current.service';
import { UserDataService } from './user-data.service';

// ===========================================
// USER INDEX SERVICE - SINGLETONS
// ===========================================
/**
 * Instances uniques des classes UserAuthService, UserGoogleService,
 * UserSessionService, et UserDataService qui fournissent des méthodes pour gérer l'authentification,
 * la session utilisateur et les CRUD.
 */

export const userAuthService = new UserAuthService();
export const userGoogleService = new UserGoogleService();
export const userSessionService = new UserSessionService();
export const userCurrentService = new UserCurrentService();
export const userDataService = new UserDataService();
