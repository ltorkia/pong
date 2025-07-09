import { router } from '../../router/router';
import { showAlert } from '../../utils/dom.utils';
import { userAuthApi } from '../../api/user/user-index.api';
import { AuthResponse, BasicResponse } from '../../types/api.types';
import { uiStore } from '../../stores/ui.store';
import { DEFAULT_ROUTE, AUTH_FALLBACK_ROUTE } from '../../config/routes.config';
import { REGISTERED_MSG } from '../../config/messages.config';

// ===========================================
// AUTHENTICATION SERVICE
// ===========================================
/**
 * Service centralisé pour la gestion d'authentification  des utilisateurs.
 * Register /Login / Logout
 */
export class AuthService {

	/**
	 * Inscription d'un utilisateur
	 * 
	 * Fait une requête API pour inscrire un utilisateur.
	 * Si la requête réussit, redirige vers la page d'accueil.
	 * Sinon affiche le contenu de 'errorMessage' ou 'Erreur réseau'.
	 * 
	 * @param {FormData} formData Les données utilisateur extraites du formulaire.
	 * @returns {Promise<void>} Promesse qui se résout lorsque l'opération est terminée.
	 * @throws {Error} Si la requête échoue.
	 */
	public async registerUser(formData: FormData): Promise<void> {
		try {
			const result: AuthResponse = await userAuthApi.registerUser(formData);
			if (result.errorMessage) {
				console.error(`[${this.constructor.name}] Erreur d\'inscription :`, result);
				showAlert(result.errorMessage);
				return;
			}
			console.log(`[${this.constructor.name}] Utilisateur inscrit :`, result);
			alert(REGISTERED_MSG);
			await router.redirect(AUTH_FALLBACK_ROUTE);

		} catch (err) {
			console.error(`[${this.constructor.name}] Erreur réseau ou serveur`, err);
			showAlert('Erreur réseau');
		}
	}

	/**
	 * Procède à la première étape de l'authentification.
	 * 
	 * Effectue une requête API pour connecter un utilisateur avec ses
	 * informations d'identification. Il s'agit de la première étape qui 
	 * consiste à vérifier que son email existe et que son mot de passe est correct.
	 * 
	 * @param {Record<string, string>} userData Informations de l'utilisateur à connecter.
	 * @returns {Promise<AuthResponse>} Promesse qui se résout avec les informations de
	 * l'utilisateur qui tente de se connecter ou un objet d'erreur.
	 * @throws {Error} Si la requête échoue ou en cas d'erreur réseau.
	 */
	public async loginUser(userData: Record<string, string>): Promise<AuthResponse> {
		try {
			const result: AuthResponse = await userAuthApi.loginUser(userData);

			if (result.errorMessage) {
				console.error(`[${this.constructor.name}] Erreur d'authentification :`, result);
				showAlert(result.errorMessage);
				return { errorMessage: result.errorMessage };
			}

			// Pas de redirection ici: c’est LoginPage gère le popup
			console.log(`[${this.constructor.name}] Authentification réussie (étape 1), 2FA requis`);
			return result;

		} catch (err) {
			console.error(`[${this.constructor.name}] Erreur réseau ou serveur`, err);
			showAlert('Erreur réseau');
			return { errorMessage: 'Erreur réseau' };
		}
	}

	/**
	 * Envoie un code de vérification pour l'authentification à deux facteurs (2FA).
	 * 
	 * Si la vérification 2FA échoue, renvoie un objet contenant un message d'erreur.
	 * Si la vérification réussit, renvoie un objet avec un message de confirmation.
	 * 
	 * @param {Record<string, string>} userData Informations de l'utilisateur à connecter.
	 * @returns {Promise<AuthResponse>} Promesse qui se résout avec un objet contenant
	 * un message d'erreur ou un message de confirmation.
	 */
	public async send2FA(userData: Record<string, string>): Promise<AuthResponse> {
		const res2FA: AuthResponse = await userAuthApi.send2FA(userData);
		if (res2FA.errorMessage) {
			return { errorMessage: res2FA.errorMessage || res2FA.message || 'Erreur inconnue' } as AuthResponse;
		}
		return res2FA as AuthResponse;
	}
	
	/**
	 * Connecte un utilisateur après avoir vérifié son code 2FA.
	 * 
	 * Effectue une requête API pour connecter un utilisateur avec son code 2FA.
	 * Si la connexion réussit, stocke l'utilisateur dans le store et le localStorage,
	 * active l'animation d'entrée de la barre de navigation
	 * et redirige vers la page d'accueil.
	 * 
	 * @param {Record<string, string>} userData Informations de l'utilisateur à connecter.
	 * @returns {Promise<AuthResponse>} Promesse qui se résout avec l'utilisateur
	 *   authentifié ou un objet d'erreur.
	 * @throws {Error} Si la requête échoue ou en cas d'erreur réseau.
	 */
	public async twofaConnectUser(userData: Record<string, string>): Promise<AuthResponse> {
		try {
			const result: AuthResponse = await userAuthApi.twofaConnectUser(userData);
			if (result.errorMessage) {
				console.error(`[${this.constructor.name}] Erreur d'authentification :`, result);
				return { errorMessage: result.errorMessage };
			}
			console.log(`[${this.constructor.name}] Utilisateur connecté :`, result);

			// Redirection home
			uiStore.animateNavbarOut = true;
			await router.redirect(DEFAULT_ROUTE);

			return result;
		} catch (err) {
			console.error(`[${this.constructor.name}] Erreur réseau ou serveur`, err);
			showAlert('Erreur réseau');
			return { errorMessage: 'Erreur réseau' };
		}
	}

	/**
	 * Déconnecte un utilisateur.
	 * 
	 * Effectue une requête API pour déconnecter l'utilisateur. 
	 * Si la déconnexion réussit, vide le store et le localStorage,
	 * active l'animation de sortie de la barre de navigation
	 * et redirige vers la page de login.
	 * 
	 * @returns {Promise<void>} Promesse qui se résout lorsque l'opération est terminée.
	 * @throws {Error} Si la requête échoue ou en cas d'erreur réseau.
	 */
	public async logoutUser(): Promise<void> {
		try {
			const result: BasicResponse = await userAuthApi.logoutUser();
			if (result.errorMessage) {
				console.error(`[${this.constructor.name}] Erreur lors du logout :`, result);
				showAlert(result.errorMessage);
				return;
			}
			uiStore.animateNavbarOut = true;
			console.log(`[${this.constructor.name}] Utilisateur déconnecté :`, result);
			
			// Redirection SPA vers login
			console.log(`[${this.constructor.name}] Déconnexion réussie. Redirection /login`);
			await router.redirect(AUTH_FALLBACK_ROUTE);

		} catch (err) {
			console.error(`[${this.constructor.name}] Erreur réseau ou serveur`, err);
			showAlert('Erreur réseau');
		}
	}
}
