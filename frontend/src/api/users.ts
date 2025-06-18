export async function getUserLog(): Promise<any | null> {
	const res = await fetch('/api/me', {
		method: 'GET',
		credentials: 'include'
	});
	if (!res.ok) return null;
	return res.json();
}

export async function logoutUser(): Promise<any> {
	const res = await fetch('/api/auth/logout', {
		method: 'POST',
		credentials: 'include'
	});
	if (!res.ok) throw new Error('Erreur lors du logout');
	return res.json();
}

export async function getUserById(id: number | string): Promise<any> {
	const res = await fetch(`/api/users/${id}`);
	if (!res.ok) throw new Error('Erreur de l’API');
	return res.json();
}

export async function getUsers(): Promise<any> {
	const res = await fetch('/api/users');
	if (!res.ok) throw new Error('Erreur de l’API');
	return res.json();
}

export async function getUserFriends(id: number | string): Promise<any> {
	const res = await fetch(`/api/users/${id}/friends`);
	if (!res.ok) throw new Error('Erreur de l’API');
	return res.json();
}

