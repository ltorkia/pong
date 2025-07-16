import './styles/main.css';
import { AppService } from './services/core/app.service';

/**
 * Point d'entrée principal de l'app.
 * Fonction fléchée asynchrone, syntaxe ES6, qui permet d'utiliser await au niveau racine.
 */
(async () => {
	const appService = new AppService();
	await appService.start();
})();