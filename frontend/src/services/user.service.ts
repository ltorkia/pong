import { router } from '../router/router';
import { showAlert } from '../utils/dom.utils';
import { User } from '../models/user.model';
import { userStore } from '../stores/user.store';
import { userAuthApi } from '../api/user/user.api';
import { AuthResponse, BasicResponse } from '../types/api.types';
import { uiStore } from '../stores/ui.store';
import { getHTMLElementById, getHTMLScriptElement } from '../utils/dom.utils';
import { COOKIES_CONST } from '../shared/config/constants.config'; // en rouge car dossier local 'shared' != dossier du conteneur
import { DEFAULT_ROUTE, AUTH_FALLBACK_ROUTE } from '../config/routes.config';
import { REGISTERED_MSG } from '../config/messages.config';

// ===========================================
// USER SERVICE
// ===========================================
/**
 * Service centralisé pour la gestion des utilisateurs.
 * 
 * Ce service permet de gérer l'authentification des utilisateurs,
 * de stocker et de récupérer l'utilisateur courant, de gérer les opérations
 * CRUD (Create Read Update Delete) sur les utilisateurs.
 * Il est utilisé pour stocker l'utilisateur dans le store, 
 * et pour les requêtes API liées aux utilisateurs.
 */
export class UserService {

	// ===========================================
	// GESTION DE SESSION ET AUTHENTIFICATION
	// ===========================================

	/**
	 * Charge l'utilisateur si un cookie d'authentification est présent,
	 * sinon, on lance l'application sans utilisateur.
	 *
	 * @returns {(Promise<User | null>)} L'utilisateur chargé, ou null si pas de cookie.
	 */
	public async loadUser(): Promise<User | null> {
		// Vérification rapide avec le cookie compagnon
		if (this.hasAuthCookie()) {
			console.log(`[${this.constructor.name}] Cookie auth_status présent, chargement utilisateur...`);
			// Seulement dans ce cas on charge l'utilisateur
			return await this.loadOrRestoreUser();
		}
		// Si pas de cookie:
		console.log(`[${this.constructor.name}] Pas de cookie auth_status, démarrage sans utilisateur`);
		// Pas besoin d'appeler loadOrRestoreUser(), on sait déjà qu'il n'y a pas d'utilisateur
		// Le router gérera les redirections si nécessaire
		return null;
	}

	/**
	 * Vérifie si le cookie d'authentification est présent
	 * dans le navigateur en vérifiant la présence de la clé
	 * `auth-status` avec la valeur `active` dans le document.cookie.
	 * 
	 * @returns {boolean} true si le cookie est présent, false sinon.
	 */
	public hasAuthCookie(): boolean {
		return document.cookie.includes(`${COOKIES_CONST.AUTH.STATUS_KEY}=${COOKIES_CONST.AUTH.STATUS_VALUE}`);
	}

	/**
	 * Charge ou restaure l'utilisateur en fonction de la présence d'un cookie d'authentification.
	 * 
	 * - Si pas de cookie, efface l'utilisateur actuel du store et renvoie null.
	 * - Si cookie et utilisateur en store, valide la session avec le serveur.
	 * - Si cookie mais pas d'utilisateur en store, essaie de restaurer l'utilisateur depuis le localStorage,
	 *   puis fait fallback sur l'API si nécessaire.
	 * 
	 * @returns {Promise<User | null>} L'utilisateur validé ou restauré, ou null si pas d'authentification possible.
	 */
	public async loadOrRestoreUser(): Promise<User | null> {
		const hasCookie = this.hasAuthCookie();
		const storedUser = userStore.getCurrentUser();

		// Pas de cookie = pas connecté
		if (!hasCookie) {
			if (storedUser) {
				console.log(`[${this.constructor.name}] Cookie supprimé, nettoyage store`);
				userStore.clearCurrentUser();
			}
			return null;
		}

		// Cookie présent, vérifier la validité du user
		if (storedUser) {
			// Utilisateur en store + cookie présent,
			// on vérifie la validité de la session user cote back
			console.log(`[${this.constructor.name}] Utilisateur en store, validation serveur en cours...`);
			return await this.validateAndReturn(storedUser);
		}

		// Cookie présent mais pas d'utilisateur en store → restaurer depuis localStorage et fallback API
		return await this.restoreUser();
	}

	/**
	 * Restaure l'utilisateur à partir de localStorage, puis de l'API si nécessaire.
	 * 
	 * - Tente d'abord de récupérer l'utilisateur stocké localement.
	 * - Si un utilisateur est trouvé, il est validé côté serveur.
	 * - Si aucun utilisateur n'est trouvé localement, une requête API est effectuée.
	 * - L'utilisateur est conecté et validé, on active l'animation d'entrée de la barre de navigation.
	 *
	 * @private
	 * @returns {Promise<User | null>} L'utilisateur restauré ou null si la restaurtion a échoué.
	 */
	private async restoreUser(): Promise<User | null> {

		// Essayer localStorage d'abord
		const user = userStore.restoreFromStorage();
		if (user) {
			console.log(`[${this.constructor.name}] Utilisateur localStorage trouvé, validation serveur en cours...`);
			uiStore.animateNavbarOut = true;
			return await this.validateAndReturn(user);
		}

		// Fallback API (met à jour le store + storage)
		try {
			const apiUser = await userAuthApi.getMe();
			if (apiUser) {
				const user = userStore.getCurrentUser();
				uiStore.animateNavbarOut = true;
				console.log(`[${this.constructor.name}] Utilisateur chargé via API`);
				return user;
			}
		} catch (err) {
			console.warn(`[${this.constructor.name}] Impossible de charger depuis API:`, err);
		}

		return null;
	}

	/**
	 * Valide la session user côté serveur, et renvoie l'utilisateur validé ou null si la session a expiré.
	 * 
	 * - Si la validation échoue, l'utilisateur est supprimé du store.
	 * - Si une erreur survient, l'utilisateur est quand même renvoyé 'null'.
	 *
	 * @private
	 * @param {User} user Utilisateur à valider
	 * @returns {(Promise<User | null>)} L'utilisateur validé ou null si la session a expiré
	 */
	private async validateAndReturn(user: User): Promise<User | null> {
		
		try {
			// Verifier que cette session est encore valide via requete serveur
			const isValid = await this.validateUserSession(user.id);
			
			if (isValid) {
				console.log(`[${this.constructor.name}] Session validée côté serveur`);
				return user;
			} else {
				// Si la validation échoue, c'est que l'utilisateur
				// n'est plus authentifié côté serveur.
				console.log(`[${this.constructor.name}] Session expirée côté serveur → nettoyage`);
				userStore.clearCurrentUser();
				return null;
			}
		} catch (err) {
			console.warn(`[${this.constructor.name}] Erreur validation serveur:`, err);
			return user;
		}
	}
	
	/**
	 * Vérifie la validité de la session utilisateur via une requête API.
	 * 
	 * Envoie une requête au serveur pour valider la session de l'utilisateur
	 * avec l'identifiant spécifié. Si la session est valide, retourne true.
	 * En cas d'erreur ou si la session n'est pas valide, retourne false.
	 *
	 * @param {number} userId - ID de l'utilisateur dont la session doit être validée.
	 * @returns {Promise<boolean>} true si la session est valide, false sinon.
	 */
	private async validateUserSession(userId: number): Promise<boolean> {
		try {
			const response = await userAuthApi.validateSession(userId);
			return response.valid;
		} catch {
			return false;
		}
	}

	// ===========================================
	// OPÉRATIONS D'AUTHENTIFICATION (LOGIN/REGISTER/LOGOUT)
	// ===========================================

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
	 * Initialise le bouton Google Sign-In.
	 * 
	 * Charge le script Google s'il n'existe pas,
	 * crée le bouton Google Sign-In et l'attache au
	 * document HTML. Une fois le script chargé, le bouton est mis en place.
	 * 
	 * @returns {Promise<void>} Une promesse qui se résout lorsque le bouton
	 * est initialisé.
	 */
	public async initGoogleSignIn(): Promise<void> {

		// Charger le script Google
		const script = document.createElement('script');
		script.src = 'https://accounts.google.com/gsi/client';

		// Attacher le callback pour initialiser le bouton Google une fois le script chargé
		script.onload = () => {
			this.setupGoogleButton();
		};
		document.head.appendChild(script);
	}

	/**
	 * Initialise le bouton Google Sign-In.
	 * 
	 * Crée un bouton Google invisible, l'attache au document HTML et configure
	 * le callback pour traiter la réponse de l'API Google.
	 * 
	 * Ensuite, attache notre bouton personnalisé au clic du bouton Google.
	 * 
	 * NB: `google.` fait référence à l'objet global google injecté dans la page 
	 * par le script Google Identity Services.
	 * 
	 * @returns {void}
	 */
	private setupGoogleButton(): void {
		const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
		if (!clientId) {
			console.error('Google Client ID not found');
			return;
		}

		// Créer un bouton Google invisible
		const hiddenContainer = document.createElement('div');
		hiddenContainer.id = 'google-signin-container';
		hiddenContainer.style.display = 'none';
		document.body.appendChild(hiddenContainer);
		google.accounts.id.initialize({
			client_id: clientId,
			callback: this.googleConnectUser.bind(this)
		});

		google.accounts.id.renderButton(hiddenContainer, {});
		
		// Attacher notre bouton personnalisé au clic du bouton Google
		const customButton = document.getElementById('custom-google-btn');
		if (customButton) {
			customButton.addEventListener('click', () => {
				const googleButton = hiddenContainer.querySelector('[role="button"]') as HTMLElement;
				if (googleButton) {
					googleButton.click();
				}
			});
		}
	}

	/**
	 * Nettoie les ressources Google Sign-In.
	 * 
	 * Supprime le script Google, le conteneur du bouton,
	 * le lien CSS + styles ajoutés automatiquement par Google,
	 * et le meta origin-trial ajouté dans le <head>.
	 * 
	 * @returns {void}
	 */
	public cleanupGoogleSignIn(): void {
		// Supprimer le conteneur du bouton Google
		const container = getHTMLElementById('google-signin-container');
		container.remove();
		console.log(`[${this.constructor.name}] Conteneur Google Sign-In supprimé`);

		// Supprimer le script Google
		const script = getHTMLScriptElement('https://accounts.google.com/gsi/client');
		script.remove();
		console.log(`[${this.constructor.name}] Script Google Sign-In supprimé`);

		// Supprimer le lien CSS + styles ajoutés automatiquement par Google
		const googleLink = getHTMLElementById('googleidentityservice');
		googleLink.remove();
		console.log(`[${this.constructor.name}] Lien CSS Google Identity Service supprimé`);
		const googleButtonStyles = getHTMLElementById('googleidentityservice_button_styles');
		googleButtonStyles.remove();
		console.log(`[${this.constructor.name}] Style CSS Google Button supprimé`);

		// Supprimer le meta origin-trial ajouté automatiquement par Google dans le <head>
		const originTrialMeta = document.querySelector('meta[http-equiv="origin-trial"]');
		if (originTrialMeta) {
			originTrialMeta.remove();
			console.log(`[${this.constructor.name}] Meta origin-trial Google supprimé`);
		}
	}

	/**
	 * Callback pour la réponse de l'API Google Identity Services.
	 * 
	 * - Extrait l'ID token de la réponse.
	 * - Envoie une requête POST à la route API `/auth/google` pour connecter
	 *   un utilisateur via Google avec l'ID token.
	 * - Stocke l'utilisateur en mémoire vive avec email et en local storage
	 *   sans email si la connexion réussit.
	 * - Active l'animation de sortie de la barre de navigation.
	 * - Redirige vers la page d'accueil.
	 * 
	 * @param {google.accounts.id.CredentialResponse} response - La réponse de l'API Google.
	 * @returns {Promise<void>} Promesse qui se résout lorsque l'opération est terminée.
	 */
	public async googleConnectUser(response: google.accounts.id.CredentialResponse): Promise<void> {
		const id_token = response.credential;
		try {
			const result = await userAuthApi.googleConnectUser(id_token);
			if (result.errorMessage) {
				console.error(`[${this.constructor.name}] Erreur Google Auth :`, result.errorMessage);
				showAlert(result.errorMessage);
				return;
			}
			uiStore.animateNavbarOut = true;
			await router.redirect(DEFAULT_ROUTE);

		} catch (err) {
			console.error(`[${this.constructor.name}] Erreur réseau ou serveur`, err);
			showAlert('Erreur réseau');
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
