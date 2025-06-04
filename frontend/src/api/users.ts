export async function getUsers() {
	const res = await fetch('/api/users');
	if (!res.ok) throw new Error('Erreur de l’API');
	return res.json();
}
