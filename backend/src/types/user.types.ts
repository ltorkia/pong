import { RegisterMethod } from '../shared/types/user.types';	// en rouge car dossier local 'shared' != dossier conteneur

export interface GoogleUserInfo {
	email: string;
	given_name?: string;
	picture?: string;
	name?: string;
}

export interface UserPassword {
	id: number;
	username: string;
	email: string;
	password: string;
	register_from: RegisterMethod;
}

export interface User2FA {
	id: number;
	username: string;
	email: string;
	code_2FA: string;
	code_2FA_expire_at: number;
	register_from: RegisterMethod;
}