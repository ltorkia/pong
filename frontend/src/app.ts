import './styles/main.css';
import { AppManager } from './managers/AppManager';

/**
 * Point d'entrée principal de l'app.
 */
document.addEventListener('DOMContentLoaded', async (): Promise<void> => {
	const appManager: AppManager = new AppManager();
	await appManager.start();
});