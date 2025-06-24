export class NavigationHandler {
	/**
	 * Ajoute une nouvelle entrée dans l'historique du navigateur
	 */
	public pushState(path: string): void {
		window.history.pushState({}, '', path);
	}

	/**
	 * Remplace l'entrée courante dans l'historique du navigateur
	 * sans créer de nouvelle entrée
	 */
	public replaceState(path: string): void {
		window.history.replaceState({}, '', path);
	}
}