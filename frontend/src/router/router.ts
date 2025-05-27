type RouteHandler = () => void;

export class Router {
	private routes: Map<string, RouteHandler> = new Map();

	constructor() {
		window.addEventListener('popstate', () => this.handleLocation());
		document.addEventListener('click', (e) => {
			const target = e.target as HTMLElement;
			if (target.matches('[data-link], [data-link] *')) {
				e.preventDefault();
				const link = target.closest('[data-link]') as HTMLElement;
				const href = link.getAttribute('href');
				if (href) {
					this.navigate(href);
				}
			}
		});
	}

	public register(path: string, handler: RouteHandler) {
		this.routes.set(path, handler);
	}

	public navigate(path: string) {
		window.history.pushState({}, '', path);
		this.handleLocation();
	}

	private handleLocation() {
		const path = window.location.pathname;
		const routeHandler = this.routes.get(path);
		if (routeHandler) {
			routeHandler();
		} else {
			console.warn(`No handler for ${path}`);
		}
	}
}

export const router = new Router();
