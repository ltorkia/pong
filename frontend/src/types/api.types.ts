import { User } from '../models/user.model';

export type AuthResponse = {
	success?: boolean;
	errorMessage?: string;
	message?: string;
	user?: User;
};

export type UpdateResponse = AuthResponse;