/**
 * Types pour l'intgration de Google One Tap
 * https://developers.google.com/identity/one-tap/web
 */
declare namespace google {
	/**
	 * Namespace pour l'intgration de Google One Tap (via popup ou bouton)
	 */
	namespace accounts.id {
		function initialize(config: {
			client_id: string;
			callback: (response: CredentialResponse) => void;
			use_fedcm_for_prompt?: boolean;
		}): void;

		function renderButton(parent: HTMLElement, options: any): void;

		interface CredentialResponse {
			credential: string;
			select_by: string;
		}
	}
}

declare const google: typeof google;
