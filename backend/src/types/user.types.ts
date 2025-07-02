export interface UserPassword {
	id: number;
	username: string;
	email: string;
	password: string;
	register_from: 'local' | 'google';
}