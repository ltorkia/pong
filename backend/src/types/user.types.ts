import { RegisterMethod } from '../shared/types/user.types';	// en rouge car dossier local 'shared' != dossier conteneur

export interface GoogleUserInfo {
	email: string;
	givenName?: string;
	picture?: string;
	name?: string;
}

export interface UserPassword {
	id: number;
	username: string;
	email: string;
	password: string;
	registerFrom: RegisterMethod;
}

export interface UserForChangeData {
	id: number;
	username: string;
	email: string;
	password: string;
	registerFrom: RegisterMethod;
	secretQuestionNumber: number;
	secretQuestionAnswer: string;
}

export interface User2FA {
	id: number;
	username: string;
	email: string;
	code2Fa: string;
	code2FaExpireAt: number;
	registerFrom: RegisterMethod;
}

export type AvatarResult =
	| { success: true }
	| { success: false; errorMessage: string; statusCode?: number };

export type FastifyFileSizeError = {
		code: string;
		message: string;
		name: string;
		statusCode?: number;
	};