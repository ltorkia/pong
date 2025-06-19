import { User } from '../models/User';

export async function getUserLog(): Promise<any | null> {
	const res = await fetch('/api/me', {
		method: 'GET',
		credentials: 'include'
	});
	if (!res.ok) return null;
	return res.json();
}

export async function registerUser(data: Record<string, string>): Promise<any> {
	const res = await fetch('/api/auth/register', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data),
	});
	const result = await res.json();

	if (!res.ok || result.errorMessage) {
		return { errorMessage: result.errorMessage || result.message || 'Erreur inconnue' };
	}
	return result;
}

export async function loginUser(data: Record<string, string>): Promise<any> {
	const res = await fetch('/api/auth/login', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data),
		credentials: 'include'
	});
	const result = await res.json();
	if (!res.ok || result.errorMessage) {
		return { errorMessage: result.errorMessage || result.message || 'Erreur inconnue' };
	}
	return result;
}

export async function logoutUser(): Promise<any> {
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

export async function getUserById(id: number): Promise<User> {
	const res = await fetch(`/api/users/${id}`);
	const data = await res.json();
	return User.fromJson(data);
}

export async function getUsers(): Promise<User[]> {
	const res = await fetch('/api/users');
	if (!res.ok) throw new Error('Erreur de l’API');
	const data: any[] = await res.json();
	return data.map(User.fromJson);
}

export async function getUserFriends(id: number | string): Promise<any> {
	const res = await fetch(`/api/users/${id}/friends`);
	if (!res.ok) throw new Error('Erreur de l’API');
	return res.json();
}

export async function updateUser(id: number, data: any): Promise<any> {
	const res = await fetch(`/api/users/${id}`, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data)
	});
	if (!res.ok) throw new Error('Erreur lors du logout');
	return res.json();
}

