// Fonction utilitaire qui crée une pause asynchrone avant de passer à la suite du code
export function wait(ms: number): Promise<void> {
	// On retourne une nouvelle promesse qui se résout automatiquement après ms millisecondes
	return new Promise(resolve => setTimeout(resolve, ms));
}