import './styles/main.css';
import { AppManager } from './managers/AppManager';

/**
 * Point d'entrée principal de l'app.
 */
const appManager = new AppManager();
appManager.start();