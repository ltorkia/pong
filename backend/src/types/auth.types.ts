export interface GoogleCallbackQuery {
	code?: string;
	error?: string;
}

export interface GoogleTokenResponse {
	access_token?: string;
	error?: string;
	error_description?: string;
}

export interface GoogleUserInfo {
	id: string;
	email: string;
	name: string;
	picture: string;
}