import { BasePage } from './BaseView';
import { UserController } from '../controllers/UserController';

export class LoginPage extends BasePage {

	constructor(container: HTMLElement) {
		super(container, '/templates/login.html');
	}

	protected attachListeners(): void {
		const form: HTMLElement | null = document.getElementById('login-form');
		if (!(form instanceof HTMLFormElement)) {
			console.error('Formulaire non trouvé ou invalide');
			return;
		}

		form.addEventListener('submit', async (event) => {
			event.preventDefault();
			const formData = new FormData(form);
			const data = Object.fromEntries(formData.entries()) as Record<string, string>;
			await this.userController.loginController(data);
		});
	}
}
