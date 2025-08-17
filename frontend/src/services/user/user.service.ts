import { AuthService } from './auth.service';
import { GoogleService } from './google.service';
import { StorageService } from './storage.service';
import { CurrentService } from './current.service';
import { SessionService } from './session.service';
import { DataService } from './data.service';
import { FriendService } from './friend.service';
import { WebSocketService } from './websocket.service';
import { NotifService } from './notif.service';

// ===========================================
// USER SERVICE - SINGLETONS
// ===========================================
/**
 * Instances uniques des classes des services de l'application
 * pour gérer l'authentification, la session utilisateur, websockets,
 * requêtes API, CRUD etc.
 */

export const authService = new AuthService();
export const googleService = new GoogleService();
export const storageService = new StorageService();
export const currentService = new CurrentService();
export const sessionService = new SessionService();
export const dataService = new DataService();
export const friendService = new FriendService();
export const webSocketService = new WebSocketService();
export const notifService = new NotifService();