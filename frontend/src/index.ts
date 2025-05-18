import './styles/main.css';
import { App } from './app';

// Initialize the application when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
	const appElement = document.getElementById('app');

	if (appElement) {
		const app = new App(appElement);
		app.initialize();
	} else {
		console.error('App root element not found');
	}
});