import { User } from '../models/User';
import { secureFetch } from '../utils/app.utils';
import { AuthResponse, UpdateResponse } from '../types/api.types';

export class UserApi {

	// GETTER CURRENT ONLINE USER
	public async getMe(): Promise<User | null> {
		const res = await secureFetch('/api/me', { method: 'GET' });
		if (!res.ok) return null;
		return res.json();
	}

	// SESSION USER VALIDATION
	public async validateSession(id: number): Promise<{ valid: boolean }> {
		const res = await secureFetch(`/api/validate-session/${id}`, { method: 'GET' });
		if (!res.ok) return { valid: false };
		return res.json();
	}

	// POST REQUESTS - AUTHENTICATION
	public async registerUser(data: Record<string, string>): Promise<AuthResponse> {
		const res = await fetch('/api/auth/register', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(data),
			credentials: 'include',
		});
		const result: AuthResponse = await res.json();
		if (!res.ok || result.errorMessage) {
			return { errorMessage: result.errorMessage || result.message || 'Erreur inconnue' };
		}
		return result;
	}
	public async loginUser(data: Record<string, string>): Promise<AuthResponse> {
		const res = await fetch('/api/auth/login', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(data),
			credentials: 'include',
		});
		const result: AuthResponse = await res.json();
		if (!res.ok || result.errorMessage) {
			return { errorMessage: result.errorMessage || result.message || 'Erreur inconnue' };
		}
		return result;
	}
	public async logoutUser(): Promise<AuthResponse> {
		const res = await fetch('/api/auth/logout', {
			method: 'POST',
			credentials: 'include'
		});
		const result = await res.json();
		if (!res.ok || result.errorMessage) {
			return { errorMessage: result.errorMessage || result.message || 'Erreur inconnue' };
		}
		return result;
	}

	// GETTERS DB
	public async getUserById(id: number): Promise<User> {
		const res = await secureFetch(`/api/users/${id}`, { method: 'GET' });
		if (!res.ok) throw new Error('Erreur de l’API');
		const data: User = await res.json();
		return User.fromJson(data);
	}

	public async getUsers(): Promise<User[]> {
		const res = await secureFetch('/api/users', { method: 'GET' });
		if (!res.ok) throw new Error('Erreur de l’API');
		const data: User[] = await res.json();
		return data.map(User.fromJson);
	}

	public async getUserFriends(id: number | string): Promise<User[]> {
		const res = await secureFetch(`/api/users/${id}/friends`, { method: 'GET' });
		if (!res.ok) throw new Error('Erreur de l’API');
		const data: User[] = await res.json();
		return data.map(User.fromJson);
	}

	// UPDATE DB
	public async updateUser(id: number, data: Partial<User>): Promise<UpdateResponse> {
		const res = await secureFetch(`/api/users/${id}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(data),
		});
		const result: UpdateResponse = await res.json();
		if (!res.ok || result.errorMessage) {
			return { errorMessage: result.errorMessage || result.message || 'Erreur lors de la mise à jour' };
		}
		return result;
	}

}

// EXPORT SINGLETON
export const userApi = new UserApi();