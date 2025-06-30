import { User } from '../models/user.model';
import { SafeUserModel, UserModel, PublicUser } from '../../../shared/types/user.types';
import { userStore } from '../stores/user.store';
import { BasicResponse, AuthResponse } from '../types/api.types';
import { secureFetch } from '../utils/app.utils';

export class UserApi {

	// GETTER CURRENT ONLINE USER
	public async getMe(): Promise<User | null> {
		const res: Response = await secureFetch('/api/me', { method: 'GET' });
		if (!res.ok) {
			return null;
		}

		// Données complètes avec email
		const data: UserModel = await res.json();
		
		// Stockage sécurisé via le store
		userStore.setCurrentUserFromServer(data);

		// Instance avec email en mémoire
		return userStore.getCurrentUser() as User;
	}

	// SESSION USER VALIDATION
	public async validateSession(id: number): Promise<{ valid: boolean }> {
		const res: Response = await secureFetch(`/api/validate-session/${id}`, { method: 'GET' });
		if (!res.ok) {
			return { valid: false };
		}
		return res.json() as Promise<{ valid: boolean }>;
	}

	// POST REQUESTS - AUTHENTICATION
	public async registerUser(data: Record<string, string>): Promise<AuthResponse> {
		const res: Response = await fetch('/api/auth/register', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(data),
			credentials: 'include',
		});
		const result: AuthResponse = await res.json();
		if (!res.ok || result.errorMessage || !result.user) {
			return { errorMessage: result.errorMessage || result.message || 'Erreur avec la récupération de l\'utilisateur' } as AuthResponse;
		}
		userStore.setCurrentUserFromServer(result.user);
		return result as AuthResponse;
	}

	public async loginUser(data: Record<string, string>): Promise<AuthResponse> {
		const res: Response = await fetch('/api/auth/login', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(data),
			credentials: 'include',
		});
		const result: AuthResponse = await res.json();
		if (!res.ok || result.errorMessage || !result.user) {
			return { errorMessage: result.errorMessage || result.message || 'Erreur avec la récupération de l\'utilisateur' } as AuthResponse;
		}
		userStore.setCurrentUserFromServer(result.user);
		return result as AuthResponse;
	}

	public async logoutUser(): Promise<BasicResponse> {
		const res: Response = await fetch('/api/auth/logout', {
			method: 'POST',
			credentials: 'include'
		});
		const result: BasicResponse = await res.json();
		if (!res.ok || result.errorMessage) {
			return { errorMessage: result.errorMessage || result.message || 'Erreur inconnue' } as BasicResponse;
		}
		userStore.clearCurrentUser();
		return result as BasicResponse;
	}

	// GETTERS DB
	public async getUserById(id: number): Promise<User> {
		const res: Response = await secureFetch(`/api/users/${id}`, { method: 'GET' });
		if (!res.ok) {
			throw new Error('Erreur de l’API');
		}
		const data: SafeUserModel = await res.json();
		return User.fromSafeJSON(data) as User;
	}

	public async getUsers(): Promise<User[]> {
		const res: Response = await secureFetch('/api/users', { method: 'GET' });
		if (!res.ok) {
			throw new Error('Erreur de l’API');
		}
		const data: PublicUser[] = await res.json();
		return User.fromPublicJSONArray(data) as User[];
	}

	public async getUserFriends(id: number): Promise<User[]> {
		const res: Response = await secureFetch(`/api/users/${id}/friends`, { method: 'GET' });
		if (!res.ok) {
			throw new Error('Erreur de l’API');
		}
		const data: PublicUser[] = await res.json();
		return User.fromPublicJSONArray(data) as User[];
	}

	// Nouvelle méthode pour récupérer les utilisateurs actifs uniquement
	public async getActiveUsers(): Promise<User[]> {
		const users: User[] = await this.getUsers();
		return User.getActiveUsers(users) as User[];
	}

	// Nouvelle méthode pour récupérer les utilisateurs en ligne
	public async getOnlineUsers(): Promise<User[]> {
		const users: User[] = await this.getUsers();
		return User.getOnlineUsers(users) as User[];
	}

	// Nouvelle méthode pour rechercher des utilisateurs par nom
	public async searchUsersByUsername(searchTerm: string): Promise<User[]> {
		const users: User[] = await this.getUsers();
		return User.searchByUsername(users, searchTerm) as User[];
	}

	// Nouvelle méthode pour obtenir le classement des joueurs
	public async getUserRanking(sortBy: 'winRate' | 'gamesPlayed' | 'timePlayed' = 'winRate'): Promise<User[]> {
		const users: User[] = await this.getActiveUsers();
		switch (sortBy) {
			case 'winRate':
				return User.sortByWinRate(users);
			case 'gamesPlayed':
				return User.sortByGamesPlayed(users);
			case 'timePlayed':
				return User.sortByTimePlayed(users);
			default:
				return users as User[];
		}
	}

	// UPDATE DB
	public async updateUser(id: number, data: Partial<User>): Promise<BasicResponse> {
		const res: Response = await secureFetch(`/api/users/${id}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(data),
		});
		const result: BasicResponse = await res.json();
		if (!res.ok || result.errorMessage) {
			return { errorMessage: result.errorMessage || result.message || 'Erreur lors de la mise à jour' };
		}
		return result as BasicResponse;
	}

}

// EXPORT SINGLETON
export const userApi = new UserApi();