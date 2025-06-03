import { BasePage } from './BasePage';

export class RegisterPage extends BasePage {
	constructor(container: HTMLElement) {
		// super() appelle le constructeur du parent BasePage
		// avec le container et le chemin du template HTML pour la page login
		super(container, '/templates/register.html');
	}

	protected attachListeners(): void {
		const registerForm = document.getElementById('register-form');
		if (registerForm) {
			registerForm.addEventListener('submit', (e) => {
				e.preventDefault();
				// Logique d'inscription dans une méthode de RegisterController dans le dossier controller
			});
		}
	}
}