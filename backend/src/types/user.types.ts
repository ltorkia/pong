export interface UserPassword {
	id: number;
	username: string;
	email: string;
	password: string;
	register_from: 'local' | 'google';
}

export interface User2FA {
	id: number;
	username: string;
	email: string;
	code_2FA: string;
	code_2FA_expire_at: number;
	register_from: 'local' | 'google';
}

export interface Code2FA {
	code: string;
	end_time: number;
	email: string;
}