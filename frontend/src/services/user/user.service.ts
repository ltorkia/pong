import { AuthService } from './auth.service';
import { GoogleService } from './google.service';
import { StorageService } from './storage.service';
import { CurrentService } from './current.service';
import { SessionService } from './session.service';
import { DataService } from './data.service';

// ===========================================
// USER SERVICE - SINGLETONS
// ===========================================
/**
 * Instances uniques des classes AuthService, GoogleService, StorageService, CurrentService,
 * SessionService, et DataService qui fournissent des méthodes pour gérer l'authentification,
 * la session utilisateur et les CRUD.
 */

export const authService = new AuthService();
export const googleService = new GoogleService();
export const storageService = new StorageService();
export const currentService = new CurrentService();
export const sessionService = new SessionService();
export const dataService = new DataService();
