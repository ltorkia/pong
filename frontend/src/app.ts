import './styles/main.css';

import { appService } from './services/core/core.service';

/**
 * Point d'entrée principal de l'app.
 * Fonction fléchée asynchrone, syntaxe ES6, qui permet d'utiliser await au niveau racine.
 */
(async () => {
	await appService.start();
})();