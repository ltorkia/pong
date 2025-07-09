import { AuthService } from './auth.service';
import { GoogleService } from './google.service';
import { SessionService } from './session.service';

// ===========================================
// USER INDEX SERVICE - SINGLETONS
// ===========================================
/**
 * Instances uniques des classes AuthService, GoogleService
 * et SessionService qui fournissent des méthodes pour gérer l'authentification,
 * la session utilisateur et les CRUD.
 */

export const authService = new AuthService();
export const googleService = new GoogleService();
export const sessionService = new SessionService();
