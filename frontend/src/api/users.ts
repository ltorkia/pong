export async function getUsers() {
	const res = await fetch('/api/users');
	if (!res.ok) throw new Error('Erreur de l’API');
	return res.json();
}

export async function getUserFriends(id: number | string) {
	const res = await fetch(`/api/users${id}/friends`);
	if (!res.ok) throw new Error('Erreur de l’API');
	return res.json();
}

