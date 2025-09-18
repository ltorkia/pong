import { router } from '../../router/router';
import { showAlert } from '../../utils/dom.utils';
import { authApi } from '../../api/user/user.api';
import { getHTMLElementById, getHTMLScriptElement } from '../../utils/dom.utils';
import { DEFAULT_ROUTE } from '../../config/routes.config';

// ===========================================
// GOOGLE SERVICE
// ===========================================
/**
 * Service centralisé pour Google sign-in.
 */
export class GoogleService {

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
			callback: (response) => this.googleConnectUser(response)
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
			const result = await authApi.googleConnectUser(id_token);
			if (result.errorMessage) {
				console.error(`[${this.constructor.name}] Erreur Google Auth :`, result.errorMessage);
				showAlert(result.errorMessage);
				return;
			}
			await router.redirect(DEFAULT_ROUTE);

		} catch (err) {
			console.error(`[${this.constructor.name}] Erreur réseau ou serveur`, err);
			showAlert('Erreur réseau');
		}
	}
}
