import { AuthApi } from './auth.api';
import { DataApi } from './data.api';
import { NotifApi } from './notif.api';

// ===========================================
// USER API - SINGLETONS
// ===========================================
/**
 * Instances uniques des classes AuthApi, DataApi
 * et NotifApi qui fournissent des méthodes pour interagir avec l'API
 * de l'utilisateur, y compris l'authentification, la gestion des utilisateurs, les notifications
 * et les requêtes basées sur des critères de recherche.
 */

/**
 * Instance unique de la classe AuthApi qui fournit des méthodes pour
 * authentifier l'utilisateur, comme la connexion, l'inscription, la validation
 * de la session, etc.
 */
const authApi = new AuthApi();

/**
 * Instance unique de la classe DataApi qui fournit des méthodes pour
 * interagir avec l'API de l'utilisateur, comme la récupération des utilisateurs,
 * l'ajout de nouveaux utilisateurs, la suppression des utilisateurs, etc.
 */
const dataApi = new DataApi();

/**
 * Instance unique de la classe NotifApi qui fournit des méthodes pour
 * gérer et récupérer les notifications utilisateur.
 */
const notifApi = new NotifApi();

/**
 * Exporte les instances uniques des classes AuthApi et DataApi.
 * 
 * Les instances sont exportées pour être utilisées dans les parties de l'application
 * qui ont besoin d'interagir avec l'API utilisateur.
 */
export { authApi, dataApi, notifApi };
