import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
	constructor(container: HTMLElement) {
		// super() appelle le constructeur du parent BasePage
		// avec le container et le chemin du template HTML pour la page login
		super(container, '/templates/login.html');
	}

	protected attachListeners(): void {
		const loginForm = document.getElementById('login-form');
		if (loginForm) {
			loginForm.addEventListener('submit', (e) => {
				e.preventDefault();
				// Logique de connexion dans une méthode de LoginController dans le dossier controller
			});
		}
	}
}