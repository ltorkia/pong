// définit ce que Google envoie dans l'URL quand il redirige vers le callback
export interface GoogleCallbackQuery {
	code?: string;
	error?: string;
}

// définit la réponse de Google quand on échange le code contre un token
export interface GoogleTokenResponse {
	access_token?: string;
	error?: string;
	error_description?: string;
}

// définit les données utilisateur qu'on récupère avec l'access_token
export interface GoogleUserInfo {
	id: string;
	email: string;
	name: string;
	picture: string;
}