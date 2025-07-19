import { UserAuthApi } from './user-auth.api';
import { UserCrudApi } from './user-crud.api';

// ===========================================
// USER API - SINGLETONS
// ===========================================
/**
 * Instances uniques des classes UserAuthApi, UserCrudApi
 * et UserQueryApi qui fournissent des méthodes pour interagir avec l'API
 * de l'utilisateur, y compris l'authentification, la gestion des utilisateurs
 * et les requêtes basées sur des critères de recherche.
 */

/**
 * Instance unique de la classe UserAuthApi qui fournit des méthodes pour
 * authentifier l'utilisateur, comme la connexion, l'inscription, la validation
 * de la session, etc.
 */
const userAuthApi = new UserAuthApi();

/**
 * Instance unique de la classe CrudApi qui fournit des méthodes pour
 * interagir avec l'API de l'utilisateur, comme la récupération des utilisateurs,
 * l'ajout de nouveaux utilisateurs, la suppression des utilisateurs, etc.
 */
const userCrudApi = new UserCrudApi();

/**
 * Exporte les instances uniques des classes UserAuthApi, UserCrudApi et UserQueryApi.
 * 
 * Les instances sont exportées pour être utilisées dans les parties de l'application
 * qui ont besoin d'interagir avec l'API utilisateur.
 */
export { userAuthApi, userCrudApi };
