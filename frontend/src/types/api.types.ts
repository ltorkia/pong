import { User } from '../models/User.model';

export type AuthResponse = {
	success?: boolean;
	errorMessage?: string;
	message?: string;
	user?: User;
};

export type UpdateResponse = AuthResponse;