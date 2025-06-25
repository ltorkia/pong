export abstract class BaseComponent {
	protected container: HTMLElement;
	protected componentPath: string;

	constructor(container: HTMLElement, componentPath: string) {
		this.container = container;
		this.componentPath = componentPath;
	}

	protected abstract render(): Promise<void>;
	protected abstract mount(): Promise<void>;

	protected async cleanup(): Promise<void> {
		if (this.container) {
			this.container.innerHTML = '';
		}
	}

	protected async loadComponent(): Promise<string> {
		try {
			const response = await fetch(this.componentPath);
			if (!response.ok) {
				throw new Error(`Erreur lors du chargement du component: ${response.statusText}`);
			}
			return await response.text();
		} catch (error) {
			console.error(`Erreur lors du chargement de ${this.componentPath}:`, error);
			return this.getErrorMessage();
		}
	}

	/**
	 * Méthode vide par défaut à surcharger dans les sous-classes
	 * pour attacher les eventListeners() spécifiques de chaque component.
	 */
	protected attachListeners(): void {}

	// Error message à afficher dans le catch de la méthode render()
	protected getErrorMessage(): string {
		return '<div id="alert">Erreur de chargement du component.</div>';
	}
}