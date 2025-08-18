import { RegisterMethod, TwoFaMethod, UserSortField, SortOrder } from '../shared/types/user.types';	// en rouge car dossier local 'shared' != dossier conteneur

export interface JwtPayload {
	id: number;
}
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
	avatar: string
}

export interface UserForChangeData {
	id: number;
	username: string;
	email: string;
	password: string;
	registerFrom: RegisterMethod;
	active2Fa: TwoFaMethod;
}

export interface User2FA {
	id: number;
	username: string;
	email: string;
	code2FaEmail?: string;
	code2FaQrcode?: string;
	code2FaExpireAt?: number;
	active2Fa: TwoFaMethod;
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

export class UserWS {
    id: number;
    WS: WebSocket;

    constructor(id: number, WS: WebSocket) {
        this.id = id;
        this.WS = WS;
    }
}