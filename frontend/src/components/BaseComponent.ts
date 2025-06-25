export abstract class BaseComponent {
	protected container: HTMLElement;
	protected componentPath: string;

	constructor(container: HTMLElement, componentPath: string) {
		this.container = container;
		this.componentPath = componentPath;
	}

	protected abstract render(): Promise<void>;
	protected abstract mount(): Promise<void>;

	async cleanup(): Promise<void> {
		if (this.container) {
			this.container.innerHTML = '';
		}
	}

	protected async loadComponent(): Promise<string> {
		const response = await fetch(this.componentPath);
		return await response.text();
	}
}