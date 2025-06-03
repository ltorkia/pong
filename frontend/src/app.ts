import './styles/main.css';
import { AppManager } from './managers/AppManager';

/**
 * Point d'entrée principal de l'app.
 */
document.addEventListener('DOMContentLoaded', async () => {
	const appManager = new AppManager();
	await appManager.start();
});